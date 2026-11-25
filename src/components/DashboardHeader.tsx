import { Link2, RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  currentDateLabel: string;
  lastUpdated: Date | null;
  isLoading: boolean;
  hasCsvUrl: boolean;
  onRefresh: () => void;
  onOpenCsvSettings: () => void;
}

function formatLastUpdated(date: Date | null): string {
  if (!date) return 'Not synced yet';
  return `Last updated ${date.toLocaleTimeString('en-PK', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })}`;
}

export function DashboardHeader({
  currentDateLabel,
  lastUpdated,
  isLoading,
  hasCsvUrl,
  onRefresh,
  onOpenCsvSettings,
}: DashboardHeaderProps) {
  return (
    <header className="bg-[#D62828] border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Brand & Title */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-xs"
              aria-hidden="true"
            >
              <span className="font-display font-extrabold text-[#D62828] text-sm tracking-tight">
                YUM
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                  YUM Bakery Dashboard
                </h1>
              </div>
              <p className="text-sm text-white/85 truncate">
                Booking &amp; Order Management · Nowshera, Pakistan
              </p>
            </div>
          </div>

          {/* Date, Sync Timestamp & Actions */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4">
            <div className="flex flex-col sm:items-end text-xs sm:text-sm text-white/90">
              <span className="font-medium text-white">{currentDateLabel}</span>
              <span className="text-xs text-white/80 tabular-nums">
                {formatLastUpdated(lastUpdated)}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onOpenCsvSettings}
                className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3.5 py-2 text-sm font-medium text-white bg-white/15 border border-white/25 rounded-lg hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#D62828] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Configure Google Sheets Published CSV URL"
              >
                <Link2 className="w-4 h-4 text-white" aria-hidden="true" />
                <span>{hasCsvUrl ? 'Sheet Source' : 'Connect Sheet'}</span>
              </button>

              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading || !hasCsvUrl}
                className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 text-sm font-semibold text-[#D62828] bg-white rounded-lg hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#D62828] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{isLoading ? 'Refreshing' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
