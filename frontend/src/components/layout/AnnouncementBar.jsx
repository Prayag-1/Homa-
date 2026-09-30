import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePublicSettings } from "../../hooks/useSiteSettings";

export default function AnnouncementBar() {
  const { data: settings } = usePublicSettings();
  const announcement = settings?.announcementBar;
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    if (!announcement?.isActive || !isHomePage) {
      setDismissed(false);
      return;
    }

    setDismissed(false);
  }, [announcement?.isActive, isHomePage, location.key]);

  useEffect(() => {
    if (!announcement?.isActive || dismissed || !isHomePage) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDismissed(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [announcement?.isActive, dismissed, isHomePage]);

  const visible = announcement?.isActive && isHomePage && !dismissed;

  const dismiss = () => {
    setDismissed(true);
  };

  const imageUrl = announcement?.image?.url || "";
  const hasImage = Boolean(imageUrl);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md sm:px-6 lg:px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onMouseDown={dismiss}
        >
          <motion.div
            className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/15 bg-[#FFF8F4] shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
            initial={{ scale: 0.94, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 14, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-white transition hover:bg-black/25"
              onClick={dismiss}
              aria-label="Dismiss announcement"
            >
              <X size={18} />
            </button>

            <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="relative min-h-[280px] bg-[#171A25]">
                {hasImage ? (
                  <img
                    src={imageUrl}
                    alt={announcement?.text || "Announcement"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[280px] items-center justify-center bg-[linear-gradient(135deg,#111827,#3f1b1b)] px-8 text-center text-white">
                    <div className="max-w-md space-y-3">
                      <div className="mx-auto w-fit rounded-full border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]">
                        Homa update
                      </div>
                      <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                        New announcement
                      </h2>
                      <p className="text-sm leading-6 text-white/80">
                        Add a banner image from admin to turn this popup into a
                        stronger promo.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="flex flex-col justify-center gap-5 p-6 sm:p-8 lg:p-10"
                style={{
                  background: announcement?.bgColor || "#C8432B",
                  color: announcement?.textColor || "#FFFFFF",
                }}
              >
                <div className="inline-flex w-fit rounded-full border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/90">
                  HOMA
                </div>
                <div className="space-y-4">
                  <h2 className="max-w-md text-3xl font-bold leading-tight sm:text-4xl">
                    {announcement?.text || "Announcement preview"}
                  </h2>
                  <p className="max-w-md text-sm leading-6 text-white/90">
                    This popup is shown on every home-page visit unless you
                    close it for the current visit.
                  </p>
                </div>

                {announcement?.link ? (
                  <a
                    href={announcement.link}
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold transition hover:opacity-90"
                    style={{ color: announcement?.bgColor || "#C8432B" }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    View offer
                    <ArrowRight size={16} />
                  </a>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
