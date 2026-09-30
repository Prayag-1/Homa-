import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapHeight = 'half',
}) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const heightClass = snapHeight === 'full' ? '92vh' : '70vh';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(41,40,40,0.5)',
              zIndex: 100,
            }}
          />
          <motion.div
            initial={{ y: shouldReduceMotion ? 0 : '100%' }}
            animate={{ y: 0 }}
            exit={{ y: shouldReduceMotion ? 0 : '100%' }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: heightClass,
              background: 'white',
              borderRadius: '20px 20px 0 0',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'env(safe-area-inset-bottom, 0)',
            }}
          >
            <div
              onPointerDown={(event) => {
                const startY = event.clientY;
                const cleanup = () => {
                  window.removeEventListener('pointermove', onMove);
                  window.removeEventListener('pointerup', cleanup);
                };
                const onMove = (moveEvent) => {
                  if (moveEvent.clientY - startY > 100) {
                    onClose();
                    cleanup();
                  }
                };

                window.addEventListener('pointermove', onMove, { passive: true });
                window.addEventListener('pointerup', cleanup, { passive: true });
              }}
              style={{
                width: 40,
                height: 4,
                background: '#E0D8D8',
                borderRadius: 2,
                margin: '12px auto 0',
                cursor: 'grab',
                padding: '8px 24px',
                touchAction: 'none',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #F0E8E8',
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>{title}</h3>
              <button type="button" onClick={onClose} className="touch-target" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
