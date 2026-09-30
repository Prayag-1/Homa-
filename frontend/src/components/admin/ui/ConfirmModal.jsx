import { useEffect } from 'react';
import Spinner from '../../ui/Spinner';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  isLoading = false,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onMouseDown={onClose}>
      <div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="border-b p-5" style={{ borderColor: 'var(--admin-border)' }}>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <div className="p-5">
          <p className="text-sm leading-6" style={{ color: 'var(--admin-muted)' }}>
            {message}
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t p-4" style={{ borderColor: 'var(--admin-border)' }}>
          <button className="admin-button" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className={`admin-button ${danger ? 'admin-button-danger' : 'admin-button-primary'}`}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Spinner size="sm" color="currentColor" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
