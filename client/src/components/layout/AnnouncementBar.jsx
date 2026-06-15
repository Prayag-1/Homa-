import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePublicSettings } from '../../hooks/useSiteSettings';

const storageKey = 'homa_announcement_dismissed';

export default function AnnouncementBar() {
  const { data: settings } = usePublicSettings();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(storageKey) === 'true');
  const announcement = settings?.announcementBar;
  const visible = announcement?.isActive && announcement?.text && !dismissed;

  useEffect(() => {
    if (!announcement?.isActive) {
      sessionStorage.removeItem(storageKey);
      setDismissed(false);
    }
  }, [announcement?.isActive]);

  const dismiss = (event) => {
    event.preventDefault();
    event.stopPropagation();
    sessionStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  const content = (
    <div className="relative mx-auto max-w-7xl px-10 text-center font-body text-xs font-semibold uppercase tracking-[0.1em]">
      <span className="mr-2" aria-hidden="true">{'\uD83C\uDF38'}</span>
      <span>{announcement?.text}</span>
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white transition hover:opacity-70"
        onClick={dismiss}
        aria-label="Dismiss announcement"
      >
        <X size={15} />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -36, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-[60] w-full py-2"
          style={{
            background: announcement.bgColor || '#292828',
            color: announcement.textColor || '#FFFFFF',
          }}
        >
          {announcement.link ? (
            <a href={announcement.link} className="block">
              {content}
            </a>
          ) : content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
