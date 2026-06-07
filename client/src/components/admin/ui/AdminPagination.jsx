import { ChevronLeft, ChevronRight } from 'lucide-react';

const getPages = (page, totalPages) => {
  const total = Math.max(totalPages || 1, 1);
  const start = Math.max(Math.min(page - 2, total - 4), 1);
  const end = Math.min(start + 4, total);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export default function AdminPagination({ page, totalPages, onPageChange }) {
  const safeTotal = Math.max(totalPages || 1, 1);
  const pages = getPages(page, safeTotal);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-t-0 px-4 py-3" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-card)' }}>
      <div className="text-sm" style={{ color: 'var(--admin-muted)' }}>
        Page {page} of {safeTotal}
      </div>
      <div className="flex items-center gap-1">
        <button
          className="admin-button admin-icon-button"
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            className={`admin-button admin-icon-button ${pageNumber === page ? 'admin-button-primary' : ''}`}
            type="button"
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button
          className="admin-button admin-icon-button"
          type="button"
          disabled={page >= safeTotal}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
