import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BookingDetailsPanel } from './components/BookingDetailsPanel';
import { BookingsTable } from './components/BookingsTable';
import { CsvSourceModal } from './components/CsvSourceModal';
import { DashboardHeader } from './components/DashboardHeader';
import { FilterToolbar } from './components/FilterToolbar';
import { SummaryCards } from './components/SummaryCards';
import { getInitialCsvUrl, saveCsvUrl } from './config/sheets';
import { useBookings } from './hooks/useBookings';
import type { Booking, DateFilter } from './types/booking';
import { getStartOfDay, isSameDay, isWithinNext7Days } from './utils/csvParser';

export default function App() {
  const [csvUrl, setCsvUrl] = useState<string>(() => getInitialCsvUrl());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<DateFilter>('All');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const {
    bookings,
    hasDateColumn,
    isInitialLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
  } = useBookings(csvUrl);

  // Reset date filter back to 'All' if the connected sheet lacks a date column
  useEffect(() => {
    if (!hasDateColumn && activeFilter !== 'All') {
      setActiveFilter('All');
    }
  }, [hasDateColumn, activeFilter]);

  const currentDateLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-PK', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  // Compute summary metrics from real CSV bookings
  const { todayCount, next7DaysCount } = useMemo(() => {
    if (!hasDateColumn) {
      return { todayCount: null, next7DaysCount: null };
    }
    const now = new Date();
    let today = 0;
    let next7 = 0;
    for (const booking of bookings) {
      if (!booking.bookingDate) continue;
      if (isSameDay(booking.bookingDate, now)) {
        today++;
      }
      if (isWithinNext7Days(booking.bookingDate, now)) {
        next7++;
      }
    }
    return { todayCount: today, next7DaysCount: next7 };
  }, [bookings, hasDateColumn]);

  // Instant case-insensitive search + optional date filtering
  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const digitsQuery = query.replace(/\D/g, '');
    const todayStart = getStartOfDay(new Date()).getTime();

    return bookings.filter((booking) => {
      if (hasDateColumn && activeFilter !== 'All') {
        if (!booking.bookingDate) return false;
        const bookingStart = getStartOfDay(booking.bookingDate).getTime();
        if (activeFilter === 'Today' && bookingStart !== todayStart) return false;
        if (activeFilter === 'Upcoming' && bookingStart <= todayStart) return false;
        if (activeFilter === 'Past' && bookingStart >= todayStart) return false;
      }

      if (!query) return true;

      const nameMatch = booking.customerName.toLowerCase().includes(query);
      const rawPhoneMatch = booking.phoneNumber.toLowerCase().includes(query);
      const digitsPhoneMatch =
        digitsQuery.length > 0 && booking.phoneNumber.replace(/\D/g, '').includes(digitsQuery);

      return nameMatch || rawPhoneMatch || digitsPhoneMatch;
    });
  }, [bookings, searchQuery, activeFilter, hasDateColumn]);

  // Preserve open booking across 30s auto-refresh cycles without resetting unnecessarily
  const selectedBooking: Booking | null = useMemo(() => {
    if (!selectedBookingId) return null;
    return bookings.find((b) => b.id === selectedBookingId) ?? null;
  }, [bookings, selectedBookingId]);

  const handleSaveCsvUrl = (newUrl: string) => {
    saveCsvUrl(newUrl);
    setCsvUrl(newUrl);
    setSelectedBookingId(null);
  };

  const hasCsvUrl = csvUrl.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#D62828] text-white flex flex-col">
      <DashboardHeader
        currentDateLabel={currentDateLabel}
        lastUpdated={lastUpdated}
        isLoading={isInitialLoading || isRefreshing}
        hasCsvUrl={hasCsvUrl}
        onRefresh={() => {
          void refresh();
        }}
        onOpenCsvSettings={() => setIsCsvModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Background refresh error banner when cached bookings are still displayed */}
        {error && bookings.length > 0 && (
          <div
            role="alert"
            className="p-4 bg-white border border-white/30 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#D62828] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold text-neutral-900">Unable to refresh latest bookings</p>
                <p className="text-neutral-600 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void refresh();
              }}
              className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#D62828] rounded-lg hover:bg-[#B91C1C] transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <SummaryCards
          totalBookings={bookings.length}
          todayBookings={todayCount}
          next7DaysBookings={next7DaysCount}
          hasDateColumn={hasDateColumn}
          isInitialLoading={isInitialLoading}
          hasCsvUrl={hasCsvUrl}
        />

        <FilterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          hasDateColumn={hasDateColumn}
          totalCount={bookings.length}
          filteredCount={filteredBookings.length}
        />

        <BookingsTable
          bookings={filteredBookings}
          totalBookingsCount={bookings.length}
          selectedBookingId={selectedBooking?.id ?? null}
          hasCsvUrl={hasCsvUrl}
          isInitialLoading={isInitialLoading}
          error={error}
          searchQuery={searchQuery}
          onSelectBooking={(booking) => setSelectedBookingId(booking.id)}
          onClearSearch={() => setSearchQuery('')}
          onRefresh={() => {
            void refresh();
          }}
          onOpenCsvSettings={() => setIsCsvModalOpen(true)}
        />
      </main>

      <BookingDetailsPanel
        booking={selectedBooking}
        onClose={() => setSelectedBookingId(null)}
      />

      <CsvSourceModal
        isOpen={isCsvModalOpen}
        currentUrl={csvUrl}
        onSave={handleSaveCsvUrl}
        onClose={() => setIsCsvModalOpen(false)}
      />
    </div>
  );
}
