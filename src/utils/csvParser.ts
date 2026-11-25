import { REQUIRED_CSV_COLUMNS } from '../config/sheets';
import type { Booking, CanonicalBookingStatus, ParsedBookingsResult } from '../types/booking';

const OPTIONAL_DATE_HEADERS = [
  'Booking Date',
  'Delivery Date',
  'Order Date',
  'Date',
];

/**
 * RFC 4180 compliant CSV parser supporting:
 * - Quoted fields containing commas, newlines (\r\n, \n, \r), and spaces
 * - Escaped double-quotes ("") inside quoted fields
 * - UTF-8 BOM stripping
 * - Empty cells and trailing delimiters
 */
export function parseCsvMatrix(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '');
  if (!cleanText.trim()) {
    return [];
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\r') {
      if (nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else if (char === '\n') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Flush final field/row if not ending cleanly on newline
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Filter out completely empty rows
  return rows.filter((row) => row.some((cell) => cell.trim() !== ''));
}

function normalizeHeaderName(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^[-–—•*:\s]+/, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function findHeaderIndex(headers: string[], expectedName: string): number {
  const exactIndex = headers.findIndex((h) => h === expectedName);
  if (exactIndex !== -1) return exactIndex;

  const trimmedIndex = headers.findIndex((h) => h.trim() === expectedName);
  if (trimmedIndex !== -1) return trimmedIndex;

  const normalizedExpected = normalizeHeaderName(expectedName);
  return headers.findIndex((h) => normalizeHeaderName(h) === normalizedExpected);
}

/**
 * Parse a date string from an optional spreadsheet date column.
 * Returns null if missing or invalid.
 */
export function parseSheetDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Handle ISO YYYY-MM-DD cleanly in local time so timezone offsets don't shift days
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
    return null;
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY common in Pakistan
  const dmyMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
  if (dmyMatch) {
    const first = Number(dmyMatch[1]);
    const second = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    // Assume DD/MM/YYYY when first > 12 or standard local convention
    const day = first;
    const month = second - 1;
    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function parseBookingsCsv(csvText: string): ParsedBookingsResult {
  const trimmedSample = csvText.trimStart().slice(0, 300).toLowerCase();
  if (
    trimmedSample.startsWith('<!doctype html') ||
    trimmedSample.startsWith('<html') ||
    trimmedSample.includes('<title>google sheets')
  ) {
    throw new Error(
      'The provided link returned an HTML webpage instead of CSV data. Please ensure the Google Sheet is published to the web in CSV format (File → Share → Publish to web → CSV).'
    );
  }

  const matrix = parseCsvMatrix(csvText);
  if (matrix.length === 0) {
    return {
      bookings: [],
      hasDateColumn: false,
      dateColumnName: null,
      headers: [],
    };
  }

  const headers = matrix[0].map((h) => h.replace(/^\uFEFF/, ''));

  const columnIndices: Record<(typeof REQUIRED_CSV_COLUMNS)[number], number> = {
    'Customer Name': findHeaderIndex(headers, 'Customer Name'),
    'Order Items': findHeaderIndex(headers, 'Order Items'),
    'Quantities': findHeaderIndex(headers, 'Quantities'),
    'Individual Prices': findHeaderIndex(headers, 'Individual Prices'),
    'Product Subtotal': findHeaderIndex(headers, 'Product Subtotal'),
    'Grand Total': findHeaderIndex(headers, 'Grand Total'),
    'Area': findHeaderIndex(headers, 'Area'),
    'Complete Address': findHeaderIndex(headers, 'Complete Address'),
    'Phone Number': findHeaderIndex(headers, 'Phone Number'),
    'Status': findHeaderIndex(headers, 'Status'),
    'Payment Method': findHeaderIndex(headers, 'Payment Method'),
  };

  const missingHeaders = REQUIRED_CSV_COLUMNS.filter((col) => columnIndices[col] === -1);
  if (missingHeaders.length === REQUIRED_CSV_COLUMNS.length) {
    throw new Error(
      `CSV headers do not match expected columns. Required columns: ${REQUIRED_CSV_COLUMNS.join(', ')}.`
    );
  }

  // Only enable date capabilities if an actual date header exists in the CSV
  let dateColumnName: string | null = null;
  let dateColumnIndex = -1;
  for (const candidate of OPTIONAL_DATE_HEADERS) {
    const idx = findHeaderIndex(headers, candidate);
    if (idx !== -1) {
      dateColumnName = headers[idx].trim();
      dateColumnIndex = idx;
      break;
    }
  }

  const getCell = (row: string[], index: number): string => {
    if (index < 0 || index >= row.length) return '';
    return row[index]?.trim() ?? '';
  };

  const bookings: Booking[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i];
    const customerName = getCell(row, columnIndices['Customer Name']);
    const orderItems = getCell(row, columnIndices['Order Items']);
    const quantities = getCell(row, columnIndices['Quantities']);
    const individualPrices = getCell(row, columnIndices['Individual Prices']);
    const productSubtotal = getCell(row, columnIndices['Product Subtotal']);
    const grandTotal = getCell(row, columnIndices['Grand Total']);
    const area = getCell(row, columnIndices['Area']);
    const completeAddress = getCell(row, columnIndices['Complete Address']);
    const phoneNumber = getCell(row, columnIndices['Phone Number']);
    const status = getCell(row, columnIndices['Status']);
    const paymentMethod = getCell(row, columnIndices['Payment Method']);
    const rawBookingDate = dateColumnIndex !== -1 ? getCell(row, dateColumnIndex) : '';
    const bookingDate = rawBookingDate ? parseSheetDate(rawBookingDate) : null;

    // Skip rows where all mapped booking fields are empty
    const hasAnyValue = [
      customerName,
      orderItems,
      quantities,
      individualPrices,
      productSubtotal,
      grandTotal,
      area,
      completeAddress,
      phoneNumber,
      status,
      paymentMethod,
    ].some((v) => v !== '');

    if (!hasAnyValue) {
      continue;
    }

    const id = `${i}::${customerName.toLowerCase()}::${phoneNumber}`;

    bookings.push({
      id,
      rowNumber: i,
      customerName,
      orderItems,
      quantities,
      individualPrices,
      productSubtotal,
      grandTotal,
      area,
      completeAddress,
      phoneNumber,
      status,
      paymentMethod,
      bookingDate,
      rawBookingDate,
    });
  }

  return {
    bookings,
    hasDateColumn: dateColumnIndex !== -1,
    dateColumnName,
    headers: headers.map((h) => h.trim()),
  };
}

/**
 * Format numeric price string into PKR currency (e.g. "PKR 2,500").
 * Handles pre-formatted strings like "Rs. 2,500" or "PKR 2500" gracefully.
 */
export function formatPKR(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return '—';

  const normalized = trimmed.replace(/^(pkr|rs\.?)\s*/i, '').replace(/,/g, '').trim();
  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    const amount = Number(normalized);
    if (Number.isFinite(amount)) {
      const formatted = new Intl.NumberFormat('en-PK', {
        maximumFractionDigits: 2,
      }).format(amount);
      return `PKR ${formatted}`;
    }
  }

  // If the cell contains multiple comma/newline-separated numbers, format each in PKR
  const parts = trimmed.split(/\s*[\n,]\s*/).filter(Boolean);
  if (parts.length > 1) {
    const formattedParts = parts.map((part) => {
      const cleanPart = part.replace(/^(pkr|rs\.?)\s*/i, '').replace(/,/g, '').trim();
      if (/^-?\d+(\.\d+)?$/.test(cleanPart)) {
        const num = Number(cleanPart);
        if (Number.isFinite(num)) {
          return `PKR ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 }).format(num)}`;
        }
      }
      return part;
    });
    return formattedParts.join(', ');
  }

  return trimmed;
}

export function normalizeStatus(rawStatus: string): CanonicalBookingStatus | string {
  const cleaned = rawStatus.trim();
  if (!cleaned) return 'Unspecified';

  const lower = cleaned.toLowerCase();
  if (lower === 'confirmed') return 'Confirmed';
  if (lower === 'pending') return 'Pending';
  if (lower === 'preparing') return 'Preparing';
  if (lower === 'out for delivery') return 'Out for Delivery';
  if (lower === 'delivered') return 'Delivered';
  if (lower === 'cancelled' || lower === 'canceled') return 'Cancelled';

  return cleaned;
}

export function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isWithinNext7Days(target: Date, referenceDate: Date): boolean {
  const start = getStartOfDay(referenceDate).getTime();
  const targetStart = getStartOfDay(target).getTime();
  const sevenDaysLater = start + 7 * 24 * 60 * 60 * 1000;
  return targetStart >= start && targetStart < sevenDaysLater;
}
