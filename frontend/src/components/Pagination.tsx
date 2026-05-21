interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function buildPageList(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

const ChevronLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(currentPage, totalPages);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const baseBtn =
    'inline-flex items-center justify-center min-w-8 h-8 px-2.5 rounded-full text-sm transition-colors';
  const idleBtn = 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800';
  const activeBtn = 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium';
  const disabledBtn = 'text-gray-300 dark:text-gray-700 cursor-not-allowed';

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      <button
        type="button"
        onClick={() => canPrev && onPageChange(currentPage - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
        className={`${baseBtn} ${canPrev ? idleBtn : disabledBtn}`}
      >
        <ChevronLeft />
      </button>

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span
            key={`e-${idx}`}
            className="inline-flex items-center justify-center min-w-8 h-8 px-1 text-sm text-gray-400 dark:text-gray-500"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`${baseBtn} ${p === currentPage ? activeBtn : idleBtn}`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => canNext && onPageChange(currentPage + 1)}
        disabled={!canNext}
        aria-label="Next page"
        className={`${baseBtn} ${canNext ? idleBtn : disabledBtn}`}
      >
        <ChevronRight />
      </button>
    </div>
  );
}
