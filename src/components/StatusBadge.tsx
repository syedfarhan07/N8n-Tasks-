import { normalizeStatus } from '../utils/csvParser';

interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  Confirmed: 'bg-green-50 text-green-700 border-green-200',
  Pending: 'bg-orange-50 text-orange-700 border-orange-200',
  Preparing: 'bg-blue-50 text-blue-700 border-blue-200',
  'Out for Delivery': 'bg-purple-50 text-purple-700 border-purple-200',
  Delivered: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = normalizeStatus(status);
  const styleClass =
    STATUS_STYLES[normalized] ?? 'bg-neutral-100 text-neutral-700 border-neutral-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap shrink-0 ${styleClass}`}
    >
      {normalized}
    </span>
  );
}
