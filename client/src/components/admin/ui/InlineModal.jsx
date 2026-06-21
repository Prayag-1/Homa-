import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function InlineModal({
  isOpen,
  onClose,
  title,
  children,
  width = '480px',
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="admin-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="admin-modal"
            style={{
              maxWidth: `min(${width}, calc(100vw - 24px))`,
              maxHeight: 'calc(100vh - 48px)',
              overflow: 'hidden',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b p-5" style={{ borderColor: 'var(--admin-border)' }}>
              <h2 className="text-lg font-bold">{title}</h2>
              <button className="admin-button admin-icon-button" type="button" onClick={onClose} title="Close">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[calc(100vh-168px)] overflow-y-auto overflow-x-hidden p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
