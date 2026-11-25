import { CalendarOff, Search, X } from 'lucide-react';
import type { DateFilter } from '../types/booking';

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
  hasDateColumn: boolean;
  totalCount: number;
  filteredCount: number;
}

const FILTERS: DateFilter[] = ['All', 'Today', 'Upcoming', 'Past'];

export function FilterToolbar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  hasDateColumn,
  totalCount,
  filteredCount,
}: FilterToolbarProps) {
  return (
    <section aria-label="Search and filter bookings" className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search
            className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by customer name or phone number..."
            aria-label="Search by customer name or phone number"
            className="w-full min-h-[44px] pl-10 pr-10 py-2 bg-white border border-white/30 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/30 transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          <div
            role="group"
            aria-label="Filter bookings by date"
            className="inline-flex items-center gap-1 p-1 bg-white/15 border border-white/25 rounded-lg shrink-0"
          >
            {FILTERS.map((filter) => {
              const isDateDependent = filter !== 'All';
              const isDisabled = isDateDependent && !hasDateColumn;
              const isActive = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onFilterChange(filter)}
                  title={
                    isDisabled
                      ? 'Booking date column is required in the Google Sheet to use this filter'
                      : `Show ${filter.toLowerCase()} bookings`
                  }
                  className={`min-h-[36px] px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    isActive
                      ? 'bg-white text-[#D62828] font-semibold shadow-xs'
                      : isDisabled
                        ? 'text-white/45 cursor-not-allowed'
                        : 'text-white hover:bg-white/15 cursor-pointer'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {totalCount > 0 && (
            <span className="text-xs text-white/90 whitespace-nowrap shrink-0 tabular-nums">
              {filteredCount} of {totalCount} shown
            </span>
          )}
        </div>
      </div>

      {/* Clear explanation when date-dependent filters are disabled */}
      {!hasDateColumn && (
        <div className="flex items-center gap-2 text-xs text-white/85">
          <CalendarOff className="w-3.5 h-3.5 text-white/80 shrink-0" aria-hidden="true" />
          <span>
            Today, Upcoming, and Past filters are disabled because a booking date column is
            required in the Google Sheet.
          </span>
        </div>
      )}
    </section>
  );
}
