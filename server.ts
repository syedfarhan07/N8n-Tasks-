import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

function isPrivateOrLocalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === 'ip6-localhost' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }

  const ipVersion = net.isIP(lower);
  if (ipVersion === 4) {
    const parts = lower.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
  }

  if (ipVersion === 6) {
    if (lower === '::1' || lower === '::' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }
  }

  return false;
}

function normalizeGoogleSheetsUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());

    if (parsed.hostname === 'docs.google.com' && parsed.pathname.includes('/spreadsheets/')) {
      // Handle published web link: /spreadsheets/d/e/<ID>/pubhtml or /pub
      if (parsed.pathname.includes('/spreadsheets/d/e/')) {
        if (parsed.pathname.endsWith('/pubhtml')) {
          parsed.pathname = parsed.pathname.replace(/\/pubhtml$/, '/pub');
        }
        if (parsed.pathname.endsWith('/pub')) {
          parsed.searchParams.set('output', 'csv');
        }
        return parsed.toString();
      }

      // Handle regular sheet link: /spreadsheets/d/<ID>/edit...
      const match = /^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/.exec(parsed.pathname);
      if (match) {
        const sheetId = match[1];
        const gidFromQuery = parsed.searchParams.get('gid');
        const gidFromHash = /gid=(\d+)/.exec(parsed.hash)?.[1];
        const gid = gidFromQuery || gidFromHash;

        const exportUrl = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/export`);
        exportUrl.searchParams.set('format', 'csv');
        if (gid) {
          exportUrl.searchParams.set('gid', gid);
        }
        return exportUrl.toString();
      }
    }

    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

async function startServer() {
  const app = express();

  app.get('/api/csv', async (req: Request, res: Response) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';

    if (!rawUrl) {
      res.status(400).json({ error: 'Missing required "url" query parameter.' });
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      res.status(400).json({ error: 'Invalid CSV URL provided.' });
      return;
    }

    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      res.status(400).json({ error: 'Only http:// and https:// URLs are supported.' });
      return;
    }

    if (isPrivateOrLocalHostname(parsedUrl.hostname)) {
      res.status(400).json({ error: 'Private or local network URLs are not permitted.' });
      return;
    }

    const targetUrl = normalizeGoogleSheetsUrl(parsedUrl.toString());

    try {
      const upstream = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'text/csv, text/plain, */*',
          'User-Agent': 'YUM-Bakery-Dashboard/1.0',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!upstream.ok) {
        res.status(upstream.status).json({
          error: `Google Sheets returned HTTP ${upstream.status}. Make sure the sheet is published to the web as CSV or shared publicly.`,
        });
        return;
      }

      const bodyText = await upstream.text();
      const headSample = bodyText.trimStart().slice(0, 400).toLowerCase();

      if (
        headSample.startsWith('<!doctype html') ||
        headSample.startsWith('<html') ||
        headSample.includes('accounts.google.com')
      ) {
        res.status(422).json({
          error:
            'This Google Sheets link returned a webpage/login screen instead of CSV data. In Google Sheets, go to File → Share → Publish to web, choose Comma-separated values (.csv), and paste that link.',
        });
        return;
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).send(bodyText);
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'TimeoutError'
          ? 'Timed out while waiting for Google Sheets to respond.'
          : 'Could not reach the Google Sheets CSV URL from the server. Please verify the link.';
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`YUM Bakery Dashboard server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
