import { AlertCircle, ChevronRight, FileSpreadsheet, RefreshCw, SearchX } from 'lucide-react';
import type { Booking } from '../types/booking';
import { formatPKR } from '../utils/csvParser';
import { StatusBadge } from './StatusBadge';

interface BookingsTableProps {
  bookings: Booking[];
  totalBookingsCount: number;
  selectedBookingId: string | null;
  hasCsvUrl: boolean;
  isInitialLoading: boolean;
  error: string | null;
  searchQuery: string;
  onSelectBooking: (booking: Booking) => void;
  onClearSearch: () => void;
  onRefresh: () => void;
  onOpenCsvSettings: () => void;
}

export function BookingsTable({
  bookings,
  totalBookingsCount,
  selectedBookingId,
  hasCsvUrl,
  isInitialLoading,
  error,
  searchQuery,
  onSelectBooking,
  onClearSearch,
  onRefresh,
  onOpenCsvSettings,
}: BookingsTableProps) {
  // 1. No Google Sheets CSV URL configured yet
  if (!hasCsvUrl) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-8 sm:p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="w-12 h-12 rounded-xl bg-[#D62828]/10 text-[#D62828] flex items-center justify-center mx-auto">
          <FileSpreadsheet className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-900">
          Connect Your Published Google Sheet
        </h2>
        <p className="mt-2 text-sm text-neutral-600 max-w-md mx-auto">
          Paste your published Google Sheets CSV URL to display live customer bookings and orders
          for YUM Bakery, Nowshera.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onOpenCsvSettings}
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#D62828] rounded-lg hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] focus-visible:ring-offset-2 transition-colors cursor-pointer"
          >
            Paste Google Sheets CSV URL
          </button>
        </div>
      </div>
    );
  }

  // 2. Initial loading skeleton
  if (isInitialLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading bookings"
        className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      >
        <div className="divide-y divide-neutral-100">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-neutral-100 rounded animate-pulse" />
                <div className="h-3 w-64 bg-neutral-100 rounded animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-neutral-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Fatal initial fetch error with no cached rows
  if (error && totalBookingsCount === 0) {
    return (
      <div
        role="alert"
        className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      >
        <div className="w-12 h-12 rounded-xl bg-red-50 text-[#D62828] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-900">
          Unable to Load Booking Data
        </h2>
        <p className="mt-2 text-sm text-neutral-600 max-w-lg mx-auto">{error}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 text-sm font-semibold text-white bg-[#D62828] rounded-lg hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] focus-visible:ring-offset-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Try Again</span>
          </button>
          <button
            type="button"
            onClick={onOpenCsvSettings}
            className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] focus-visible:ring-offset-2 transition-colors cursor-pointer"
          >
            Update CSV URL
          </button>
        </div>
      </div>
    );
  }

  // 4. Empty CSV (0 rows in spreadsheet)
  if (totalBookingsCount === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-8 sm:p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto">
          <FileSpreadsheet className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-900">No Bookings Found</h2>
        <p className="mt-2 text-sm text-neutral-600 max-w-md mx-auto">
          The connected Google Sheet currently has no booking rows. New orders added to the sheet
          will appear here automatically.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 text-sm font-semibold text-white bg-[#D62828] rounded-lg hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] focus-visible:ring-offset-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Check Again</span>
          </button>
        </div>
      </div>
    );
  }

  // 5. No matching search/filter results
  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-8 sm:p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto">
          <SearchX className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-neutral-900">
          No Matching Bookings Found
        </h2>
        <p className="mt-2 text-sm text-neutral-600 max-w-md mx-auto">
          {searchQuery
            ? `No customer name or phone number matched "${searchQuery}".`
            : 'No bookings match the currently selected filter.'}
        </p>
        {searchQuery && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onClearSearch}
              className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 text-sm font-semibold text-white bg-[#D62828] rounded-lg hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] focus-visible:ring-offset-2 transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-semibold text-neutral-600">
              <th scope="col" className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                Customer
              </th>
              <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                Order Items
              </th>
              <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                Quantity
              </th>
              <th scope="col" className="py-3.5 px-3 whitespace-nowrap text-right">
                Grand Total
              </th>
              <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                Area
              </th>
              <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                Phone
              </th>
              <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                Status
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-5 whitespace-nowrap">
                Payment
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {bookings.map((booking) => {
              const isSelected = booking.id === selectedBookingId;
              return (
                <tr
                  key={booking.id}
                  tabIndex={0}
                  onClick={() => onSelectBooking(booking)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectBooking(booking);
                    }
                  }}
                  aria-selected={isSelected}
                  className={`cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D62828] ${
                    isSelected
                      ? 'bg-[#D62828]/[0.06] hover:bg-[#D62828]/[0.09]'
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  <td className="py-3.5 pl-5 pr-3 font-medium text-neutral-900 whitespace-nowrap">
                    {booking.customerName || '—'}
                  </td>
                  <td className="py-3.5 px-3 text-neutral-700 max-w-[240px]">
                    <div className="truncate" title={booking.orderItems}>
                      {booking.orderItems || '—'}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-neutral-700 tabular-nums whitespace-nowrap">
                    {booking.quantities || '—'}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-neutral-900 tabular-nums text-right whitespace-nowrap font-mono text-[13px]">
                    {formatPKR(booking.grandTotal)}
                  </td>
                  <td className="py-3.5 px-3 text-neutral-600 max-w-[160px]">
                    <div className="truncate" title={booking.area}>
                      {booking.area || '—'}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-neutral-700 tabular-nums whitespace-nowrap font-mono text-[13px]">
                    {booking.phoneNumber || '—'}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="py-3.5 pl-3 pr-5 text-neutral-600 whitespace-nowrap">
                    <div className="flex items-center justify-between gap-2">
                      <span>{booking.paymentMethod || '—'}</span>
                      <ChevronRight
                        className="w-4 h-4 text-neutral-300 shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-neutral-100">
        {bookings.map((booking) => {
          const isSelected = booking.id === selectedBookingId;
          return (
            <button
              key={booking.id}
              type="button"
              onClick={() => onSelectBooking(booking)}
              className={`w-full text-left p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D62828] cursor-pointer ${
                isSelected ? 'bg-[#D62828]/[0.05]' : 'hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">
                    {booking.customerName || 'Unnamed Customer'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 tabular-nums font-mono">
                    {booking.phoneNumber || 'No phone'}
                    {booking.area ? ` · ${booking.area}` : ''}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              <div className="mt-3 text-sm text-neutral-700 line-clamp-2">
                {booking.orderItems || '—'}
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between gap-3 text-xs">
                <div className="text-neutral-500 flex items-center gap-2 min-w-0">
                  <span className="tabular-nums">Qty: {booking.quantities || '—'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{booking.paymentMethod || '—'}</span>
                </div>
                <span className="font-semibold text-neutral-900 tabular-nums font-mono shrink-0">
                  {formatPKR(booking.grandTotal)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
