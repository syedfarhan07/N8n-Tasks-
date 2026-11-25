import { MapPin, Phone, User, X } from 'lucide-react';
import { useEffect } from 'react';
import type { Booking } from '../types/booking';
import { formatPKR } from '../utils/csvParser';
import { StatusBadge } from './StatusBadge';

interface BookingDetailsPanelProps {
  booking: Booking | null;
  onClose: () => void;
}

function buildTelHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}

interface ParsedItemLine {
  item: string;
  quantity: string;
  price: string;
}

function splitMultiValues(raw: string): string[] {
  if (!raw.trim()) return [];
  if (raw.includes('\n')) {
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (raw.includes(';')) {
    return raw
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseItemBreakdown(booking: Booking): ParsedItemLine[] | null {
  const items = splitMultiValues(booking.orderItems);
  const quantities = splitMultiValues(booking.quantities);
  const prices = splitMultiValues(booking.individualPrices);

  if (items.length <= 1 && quantities.length <= 1 && prices.length <= 1) {
    return null;
  }

  const maxLen = Math.max(items.length, quantities.length, prices.length);
  if (items.length !== maxLen || (quantities.length > 1 && quantities.length !== maxLen)) {
    return null;
  }

  return items.map((item, idx) => ({
    item,
    quantity: quantities[idx] ?? (quantities.length === 1 ? quantities[0] : '—'),
    price: prices[idx] ? formatPKR(prices[idx]) : '—',
  }));
}

export function BookingDetailsPanel({ booking, onClose }: BookingDetailsPanelProps) {
  useEffect(() => {
    if (!booking) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [booking, onClose]);

  if (!booking) return null;

  const telHref = buildTelHref(booking.phoneNumber);
  const itemBreakdown = parseItemBreakdown(booking);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-details-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/35 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel (full-screen on mobile, right drawer on md+) */}
      <aside className="relative z-10 w-full md:max-w-lg bg-white h-full flex flex-col border-l border-neutral-200 shadow-2xl overflow-hidden">
        {/* Panel Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-neutral-200 flex items-center justify-between gap-4 bg-white shrink-0">
          <div className="min-w-0">
            <h2
              id="booking-details-title"
              className="text-lg font-bold text-neutral-900 truncate"
            >
              Booking Details
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
              Sheet Row #{booking.rowNumber}
              {booking.rawBookingDate ? ` · ${booking.rawBookingDate}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking details"
            className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-8">
          {/* Customer Information */}
          <section aria-labelledby="customer-info-heading">
            <h3
              id="customer-info-heading"
              className="text-xs font-semibold tracking-wider text-neutral-500 uppercase pb-3 border-b border-neutral-200"
            >
              Customer Information
            </h3>

            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-neutral-500 flex items-center gap-2 shrink-0">
                  <User className="w-4 h-4 text-neutral-400" aria-hidden="true" />
                  <span>Customer Name</span>
                </dt>
                <dd className="font-semibold text-neutral-900 text-right">
                  {booking.customerName || '—'}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-neutral-500 flex items-center gap-2 shrink-0">
                  <Phone className="w-4 h-4 text-neutral-400" aria-hidden="true" />
                  <span>Phone Number</span>
                </dt>
                <dd className="text-right">
                  {telHref ? (
                    <a
                      href={telHref}
                      className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#D62828] hover:text-[#B91C1C] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] rounded"
                    >
                      <span>{booking.phoneNumber}</span>
                    </a>
                  ) : (
                    <span className="text-neutral-900">—</span>
                  )}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-neutral-500 flex items-center gap-2 shrink-0">
                  <MapPin className="w-4 h-4 text-neutral-400" aria-hidden="true" />
                  <span>Area</span>
                </dt>
                <dd className="font-medium text-neutral-900 text-right">
                  {booking.area || '—'}
                </dd>
              </div>

              <div className="pt-1">
                <dt className="text-neutral-500 mb-1.5">Complete Address</dt>
                <dd className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 leading-relaxed whitespace-pre-line">
                  {booking.completeAddress || '—'}
                </dd>
              </div>
            </dl>
          </section>

          {/* Order Information */}
          <section aria-labelledby="order-info-heading">
            <h3
              id="order-info-heading"
              className="text-xs font-semibold tracking-wider text-neutral-500 uppercase pb-3 border-b border-neutral-200"
            >
              Order Information
            </h3>

            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500">Order Status</dt>
                <dd>
                  <StatusBadge status={booking.status} />
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500">Payment Method</dt>
                <dd className="font-medium text-neutral-900">
                  {booking.paymentMethod || '—'}
                </dd>
              </div>

              {itemBreakdown ? (
                <div className="pt-1">
                  <dt className="text-neutral-500 mb-2">Items Breakdown</dt>
                  <dd className="border border-neutral-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                        <tr>
                          <th className="py-2 px-3 font-semibold">Order Items</th>
                          <th className="py-2 px-3 font-semibold text-right">Qty</th>
                          <th className="py-2 px-3 font-semibold text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {itemBreakdown.map((line, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 text-neutral-900 font-medium">
                              {line.item}
                            </td>
                            <td className="py-2.5 px-3 text-neutral-700 text-right tabular-nums">
                              {line.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-neutral-700 text-right tabular-nums font-mono">
                              {line.price}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </dd>
                </div>
              ) : (
                <>
                  <div>
                    <dt className="text-neutral-500 mb-1.5">Order Items</dt>
                    <dd className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium whitespace-pre-line">
                      {booking.orderItems || '—'}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-neutral-500">Quantities</dt>
                    <dd className="font-medium text-neutral-900 text-right tabular-nums">
                      {booking.quantities || '—'}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-neutral-500">Individual Prices</dt>
                    <dd className="font-medium text-neutral-900 text-right tabular-nums font-mono">
                      {formatPKR(booking.individualPrices)}
                    </dd>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-neutral-500">Product Subtotal</dt>
                  <dd className="font-medium text-neutral-900 tabular-nums font-mono">
                    {formatPKR(booking.productSubtotal)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2 border-t border-neutral-100">
                  <dt className="text-base font-bold text-neutral-900">Grand Total</dt>
                  <dd className="text-lg font-bold text-[#D62828] tabular-nums font-mono">
                    {formatPKR(booking.grandTotal)}
                  </dd>
                </div>
              </div>
            </dl>
          </section>
        </div>

        {/* Panel Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3 shrink-0">
          {telHref ? (
            <a
              href={telHref}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-sm font-semibold text-white bg-[#D62828] rounded-lg hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] focus-visible:ring-offset-2 transition-colors whitespace-nowrap"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span>Call Customer</span>
            </a>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] focus-visible:ring-offset-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
