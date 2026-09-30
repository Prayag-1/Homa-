import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const range = (start, end) =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, index) => start + index);

const DOTS = 'dots';

function getPaginationItems(currentPage, totalPages, siblingCount) {
  const safeTotalPages = Math.max(totalPages, 1);
  const safeSiblingCount = Math.max(siblingCount, 0);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages);
  const totalPageNumbers = safeSiblingCount * 2 + 5;

  if (totalPageNumbers >= safeTotalPages) {
    return range(1, safeTotalPages);
  }

  const leftSiblingIndex = Math.max(safeCurrentPage - safeSiblingCount, 1);
  const rightSiblingIndex = Math.min(safeCurrentPage + safeSiblingCount, safeTotalPages);
  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < safeTotalPages - 1;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + safeSiblingCount * 2;
    return [...range(1, leftItemCount), DOTS, safeTotalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + safeSiblingCount * 2;
    return [1, DOTS, ...range(safeTotalPages - rightItemCount + 1, safeTotalPages)];
  }

  return [1, DOTS, ...range(leftSiblingIndex, rightSiblingIndex), DOTS, safeTotalPages];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  className = '',
  buttonClassName = '',
  activeButtonClassName = '',
  ellipsisClassName = '',
}) {
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const safeCurrentPage = Math.min(Math.max(currentPage || 1, 1), safeTotalPages);
  const items = getPaginationItems(safeCurrentPage, safeTotalPages, siblingCount);

  const buttonBase =
    'inline-flex h-10 min-w-10 items-center justify-center border border-black bg-transparent px-3 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40';
  const activeButton = `border-brand-red bg-brand-red text-white hover:bg-brand-red hover:text-white ${activeButtonClassName}`;

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), safeTotalPages);
    if (nextPage !== safeCurrentPage) {
      onPageChange(nextPage);
    }
  };

  return (
    <nav className={`flex flex-wrap items-center gap-2 ${className}`} aria-label="Pagination">
      <button
        type="button"
        className={`${buttonBase} ${buttonClassName}`}
        onClick={() => goToPage(safeCurrentPage - 1)}
        disabled={safeCurrentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {showFirstLast && (
        <button
          type="button"
          className={`${buttonBase} ${buttonClassName}`}
          onClick={() => goToPage(1)}
          disabled={safeCurrentPage <= 1}
          aria-label="First page"
        >
          <ChevronsLeft size={16} aria-hidden="true" />
        </button>
      )}

      {items.map((item, index) => {
        if (item === DOTS) {
          return (
            <span key={`dots-${index}`} className={`inline-flex h-10 min-w-10 items-center justify-center px-1 text-sm text-black/60 ${ellipsisClassName}`}>
              ...
            </span>
          );
        }

        const isActive = item === safeCurrentPage;

        return (
          <button
            key={item}
            type="button"
            className={`${buttonBase} ${buttonClassName} ${isActive ? activeButton : ''}`}
            onClick={() => goToPage(item)}
            aria-label={`Go to page ${item}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {item}
          </button>
        );
      })}

      {showFirstLast && (
        <button
          type="button"
          className={`${buttonBase} ${buttonClassName}`}
          onClick={() => goToPage(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Last page"
        >
          <ChevronsRight size={16} aria-hidden="true" />
        </button>
      )}

      <button
        type="button"
        className={`${buttonBase} ${buttonClassName}`}
        onClick={() => goToPage(safeCurrentPage + 1)}
        disabled={safeCurrentPage >= safeTotalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
