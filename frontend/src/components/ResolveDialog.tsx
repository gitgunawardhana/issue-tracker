import { useEffect, useState } from 'react';

interface ResolveDialogProps {
  isOpen: boolean;
  issueTitle: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

export default function ResolveDialog({
  isOpen,
  issueTitle,
  onConfirm,
  onCancel,
}: ResolveDialogProps) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) setNote('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Mark as Resolved
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Mark "{issueTitle}" as Resolved? You can add an optional note explaining
              how it was resolved.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="resolveNote"
            className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide"
          >
            Resolution note (optional)
          </label>
          <textarea
            id="resolveNote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Fixed by updating dependency to v2.1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 resize-none"
          />
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note.trim())}
            className="px-4 py-2 text-sm font-medium text-white rounded-full bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
}
