import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  isValidHttpUrl,
  normalizeGoogleSheetsCsvUrl,
  REQUIRED_CSV_COLUMNS,
} from '../config/sheets';

interface CsvSourceModalProps {
  isOpen: boolean;
  currentUrl: string;
  onSave: (newUrl: string) => void;
  onClose: () => void;
}

export function CsvSourceModal({ isOpen, currentUrl, onSave, onClose }: CsvSourceModalProps) {
  const [draftUrl, setDraftUrl] = useState(currentUrl);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraftUrl(currentUrl);
      setValidationError(null);
    }
  }, [isOpen, currentUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draftUrl.trim();
    if (!trimmed) {
      setValidationError('Please paste your published Google Sheets CSV URL.');
      return;
    }
    if (!isValidHttpUrl(trimmed)) {
      setValidationError('Please enter a valid URL starting with https:// or http://.');
      return;
    }
    onSave(normalizeGoogleSheetsCsvUrl(trimmed));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-source-modal-title"
    >
      <div
        className="fixed inset-0 bg-neutral-950/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between gap-4">
          <h2 id="csv-source-modal-title" className="text-lg font-bold text-neutral-900">
            Google Sheets CSV Source
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label
              htmlFor="csv-url-input"
              className="block text-sm font-semibold text-neutral-900 mb-2"
            >
              Published Google Sheets CSV URL
            </label>
            <input
              id="csv-url-input"
              type="url"
              value={draftUrl}
              onChange={(e) => {
                setDraftUrl(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#D62828] focus:ring-2 focus:ring-[#D62828]/15"
              autoFocus
            />
            {validationError && (
              <p className="mt-2 text-xs font-medium text-[#D62828]">{validationError}</p>
            )}
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2 text-xs text-neutral-600">
            <p className="font-semibold text-neutral-800">How to get your CSV link:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your YUM Bakery bookings spreadsheet in Google Sheets.</li>
              <li>
                Go to <span className="font-medium text-neutral-800">File → Share → Publish to web</span>.
              </li>
              <li>
                Select your bookings sheet and choose{' '}
                <span className="font-medium text-neutral-800">Comma-separated values (.csv)</span>.
              </li>
              <li>Copy the generated link and paste it above.</li>
            </ol>
            <p className="pt-1 text-neutral-500">
              Expected columns: {REQUIRED_CSV_COLUMNS.join(', ')}.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[42px] px-5 py-2 text-sm font-semibold text-white bg-[#D62828] rounded-lg hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D62828] focus-visible:ring-offset-2 transition-colors cursor-pointer"
            >
              Save &amp; Load Bookings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
