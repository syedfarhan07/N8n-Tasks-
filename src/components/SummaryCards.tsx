interface SummaryCardsProps {
  totalBookings: number;
  todayBookings: number | null;
  next7DaysBookings: number | null;
  hasDateColumn: boolean;
  isInitialLoading: boolean;
  hasCsvUrl: boolean;
}

export function SummaryCards({
  totalBookings,
  todayBookings,
  next7DaysBookings,
  hasDateColumn,
  isInitialLoading,
  hasCsvUrl,
}: SummaryCardsProps) {
  return (
    <section aria-label="Booking summary" className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: TOTAL BOOKINGS */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wider text-neutral-500">
            TOTAL BOOKINGS
          </span>
          <span className="w-2 h-2 rounded-full bg-[#D62828]" aria-hidden="true" />
        </div>

        <div className="mt-3">
          {isInitialLoading ? (
            <div className="h-9 w-20 bg-neutral-100 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-neutral-900 tabular-nums font-display">
              {hasCsvUrl ? totalBookings.toLocaleString('en-PK') : '0'}
            </p>
          )}
        </div>

        <p className="mt-2 text-xs text-neutral-500">
          {hasCsvUrl
            ? 'Total orders recorded in Google Sheets'
            : 'Connect your published CSV to load bookings'}
        </p>
      </div>

      {/* Card 2: TODAY */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wider text-neutral-500">TODAY</span>
        </div>

        <div className="mt-3">
          {isInitialLoading ? (
            <div className="h-9 w-28 bg-neutral-100 rounded animate-pulse" />
          ) : hasDateColumn && todayBookings !== null ? (
            <p className="text-3xl font-bold text-neutral-900 tabular-nums font-display">
              {todayBookings.toLocaleString('en-PK')}
            </p>
          ) : (
            <p className="text-lg font-semibold text-neutral-800 leading-9">
              Date column required
            </p>
          )}
        </div>

        <p className="mt-2 text-xs text-neutral-500">
          {hasDateColumn
            ? 'Bookings scheduled for today'
            : 'Add a Booking Date or Delivery Date column to track today’s schedule'}
        </p>
      </div>

      {/* Card 3: NEXT 7 DAYS */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wider text-neutral-500">
            NEXT 7 DAYS
          </span>
        </div>

        <div className="mt-3">
          {isInitialLoading ? (
            <div className="h-9 w-28 bg-neutral-100 rounded animate-pulse" />
          ) : hasDateColumn && next7DaysBookings !== null ? (
            <p className="text-3xl font-bold text-neutral-900 tabular-nums font-display">
              {next7DaysBookings.toLocaleString('en-PK')}
            </p>
          ) : (
            <p className="text-lg font-semibold text-neutral-800 leading-9">
              Date column required
            </p>
          )}
        </div>

        <p className="mt-2 text-xs text-neutral-500">
          {hasDateColumn
            ? 'Bookings scheduled within the next 7 days'
            : 'Add a Booking Date or Delivery Date column to view upcoming demand'}
        </p>
      </div>
    </section>
  );
}
