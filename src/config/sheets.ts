/**
 * YUM Bakery — Google Sheets Published CSV Configuration
 *
 * Paste your published Google Sheets CSV link below, or set VITE_GOOGLE_SHEETS_CSV_URL
 * in your environment, or configure it directly inside the dashboard UI.
 *
 * Example Google Sheets Published CSV URL format:
 * https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv
 */
export const DEFAULT_GOOGLE_SHEETS_CSV_URL =
  (import.meta.env?.VITE_GOOGLE_SHEETS_CSV_URL as string | undefined)?.trim() || '';

export const CSV_URL_STORAGE_KEY = 'yum_bakery_published_csv_url';

export const AUTO_REFRESH_INTERVAL_MS = 30_000;

export const REQUIRED_CSV_COLUMNS = [
  'Customer Name',
  'Order Items',
  'Quantities',
  'Individual Prices',
  'Product Subtotal',
  'Grand Total',
  'Area',
  'Complete Address',
  'Phone Number',
  'Status',
  'Payment Method',
] as const;

export function normalizeGoogleSheetsCsvUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname === 'docs.google.com' && parsed.pathname.includes('/spreadsheets/')) {
      if (parsed.pathname.includes('/spreadsheets/d/e/')) {
        if (parsed.pathname.endsWith('/pubhtml')) {
          parsed.pathname = parsed.pathname.replace(/\/pubhtml$/, '/pub');
        }
        if (parsed.pathname.endsWith('/pub')) {
          parsed.searchParams.set('output', 'csv');
        }
        return parsed.toString();
      }

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
    return trimmed;
  }
}

export function getInitialCsvUrl(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('csv')?.trim();
    if (urlParam && isValidHttpUrl(urlParam)) {
      return normalizeGoogleSheetsCsvUrl(urlParam);
    }

    try {
      const stored = window.localStorage.getItem(CSV_URL_STORAGE_KEY)?.trim();
      if (stored && isValidHttpUrl(stored)) {
        return normalizeGoogleSheetsCsvUrl(stored);
      }
    } catch {
      // Ignore storage access errors
    }
  }

  return normalizeGoogleSheetsCsvUrl(DEFAULT_GOOGLE_SHEETS_CSV_URL);
}

export function saveCsvUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = normalizeGoogleSheetsCsvUrl(url);
    if (normalized) {
      window.localStorage.setItem(CSV_URL_STORAGE_KEY, normalized);
    } else {
      window.localStorage.removeItem(CSV_URL_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
