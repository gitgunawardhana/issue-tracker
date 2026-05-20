import { useEffect, useRef, useState } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  placeholder: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelect({
  placeholder,
  options,
  selected,
  onChange,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = () => onChange([]);

  const displayLabel = (() => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const opt = options.find((o) => o.value === selected[0]);
      return opt?.label ?? placeholder;
    }
    return `${placeholder} (${selected.length})`;
  })();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full px-3 py-2 border rounded-lg bg-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm flex items-center justify-between gap-2 ${
          selected.length > 0
            ? 'border-blue-300 text-gray-900 font-medium'
            : 'border-gray-200 text-gray-700'
        }`}
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-md z-30 max-h-64 overflow-y-auto">
          {selected.length > 0 && (
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">{selected.length} selected</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Clear all
              </button>
            </div>
          )}
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleValue(option.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}>
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
