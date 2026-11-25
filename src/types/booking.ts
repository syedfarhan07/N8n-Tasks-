export type CanonicalBookingStatus =
  | 'Confirmed'
  | 'Pending'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type DateFilter = 'All' | 'Today' | 'Upcoming' | 'Past';

export interface Booking {
  /** Stable identifier derived from row content & index */
  id: string;
  /** 1-based data row index from the CSV */
  rowNumber: number;
  customerName: string;
  orderItems: string;
  quantities: string;
  individualPrices: string;
  productSubtotal: string;
  grandTotal: string;
  area: string;
  completeAddress: string;
  phoneNumber: string;
  status: string;
  paymentMethod: string;
  /** Optional parsed booking/delivery date if a date column exists in the CSV */
  bookingDate: Date | null;
  rawBookingDate: string;
}

export interface ParsedBookingsResult {
  bookings: Booking[];
  hasDateColumn: boolean;
  dateColumnName: string | null;
  headers: string[];
}
