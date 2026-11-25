import { useCallback, useEffect, useRef, useState } from 'react';
import { AUTO_REFRESH_INTERVAL_MS, isValidHttpUrl } from '../config/sheets';
import type { Booking } from '../types/booking';
import { parseBookingsCsv } from '../utils/csvParser';

export interface UseBookingsResult {
  bookings: Booking[];
  hasDateColumn: boolean;
  dateColumnName: string | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function useBookings(csvUrl: string): UseBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hasDateColumn, setHasDateColumn] = useState(false);
  const [dateColumnName, setDateColumnName] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const inFlightRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeUrlRef = useRef(csvUrl);

  activeUrlRef.current = csvUrl;

  const fetchBookings = useCallback(async (urlToFetch: string) => {
    const trimmedUrl = urlToFetch.trim();
    if (!trimmedUrl) {
      setBookings([]);
      setHasDateColumn(false);
      setDateColumnName(null);
      setError(null);
      setIsInitialLoading(false);
      setIsRefreshing(false);
      hasLoadedOnceRef.current = false;
      return;
    }

    if (!isValidHttpUrl(trimmedUrl)) {
      setError('Invalid Google Sheets CSV URL. Please enter a valid http:// or https:// URL.');
      setIsInitialLoading(false);
      setIsRefreshing(false);
      return;
    }

    // Prevent overlapping refresh requests
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!hasLoadedOnceRef.current) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const normalizedUrl = trimmedUrl;
      const proxyEndpoint = `/api/csv?url=${encodeURIComponent(normalizedUrl)}`;

      let response = await fetch(proxyEndpoint, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      // Fallback to direct fetch only if the proxy route does not exist (e.g. static hosting)
      if (response.status === 404) {
        response = await fetch(normalizedUrl, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        let serverErrorMessage = '';
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const payload = (await response.json()) as { error?: string };
            if (payload?.error) {
              serverErrorMessage = payload.error;
            }
          } catch {
            // Ignore malformed JSON error payload
          }
        }
        throw new Error(
          serverErrorMessage ||
            `Failed to load Google Sheets CSV (HTTP ${response.status} ${response.statusText || 'Error'}).`
        );
      }

      const csvText = await response.text();
      const parsed = parseBookingsCsv(csvText);

      // Ensure URL did not change mid-flight
      if (activeUrlRef.current.trim() !== trimmedUrl) {
        return;
      }

      setBookings(parsed.bookings);
      setHasDateColumn(parsed.hasDateColumn);
      setDateColumnName(parsed.dateColumnName);
      setError(null);
      setLastUpdated(new Date());
      hasLoadedOnceRef.current = true;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      const message =
        err instanceof TypeError
          ? 'Network error while fetching the Google Sheets CSV. Verify your internet connection and that the sheet is published to the web.'
          : err instanceof Error
            ? err.message
            : 'Unable to load booking data from the published CSV URL.';

      setError(message);
    } finally {
      inFlightRef.current = false;
      abortControllerRef.current = null;
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch & 30-second auto-refresh interval when csvUrl changes
  useEffect(() => {
    hasLoadedOnceRef.current = false;
    inFlightRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const trimmed = csvUrl.trim();
    if (!trimmed) {
      setBookings([]);
      setHasDateColumn(false);
      setDateColumnName(null);
      setError(null);
      setLastUpdated(null);
      setIsInitialLoading(false);
      setIsRefreshing(false);
      return;
    }

    void fetchBookings(trimmed);

    const intervalId = window.setInterval(() => {
      void fetchBookings(trimmed);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      inFlightRef.current = false;
    };
  }, [csvUrl, fetchBookings]);

  const refresh = useCallback(async () => {
    await fetchBookings(activeUrlRef.current);
  }, [fetchBookings]);

  return {
    bookings,
    hasDateColumn,
    dateColumnName,
    isInitialLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
  };
}
