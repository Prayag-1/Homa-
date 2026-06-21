import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { optimizeImage } from '../../utils/cloudinaryUrl';

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 42 : -42,
    opacity: 0,
    scale: 0.985,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -42 : 42,
    opacity: 0,
    scale: 0.985,
  }),
};

function EmptyHeroArt() {
  return (
    <div className="relative h-[420px] w-full max-w-md">
      <div className="absolute left-8 top-8 h-72 w-44 rounded-t-[5rem] rounded-b-[2rem] bg-white shadow-[0_28px_80px_rgba(41,40,40,0.25)]" />
      <div className="absolute left-16 top-24 h-40 w-28 rounded-2xl bg-homa-blush" />
      <div className="absolute right-8 top-20 h-80 w-48 rounded-t-[6rem] rounded-b-[2rem] bg-white/95 shadow-[0_28px_80px_rgba(41,40,40,0.22)]" />
      <div className="absolute right-20 top-36 h-32 w-24 rounded-2xl bg-homa-red-light" />
      <div className="absolute bottom-8 left-1/2 h-28 w-60 -translate-x-1/2 rounded-[50%] bg-homa-red-dark/30 blur-xl" />
    </div>
  );
}

export default function HeroCarousel({ banners = [] }) {
  const slides = useMemo(
    () => (Array.isArray(banners) ? banners.filter((banner) => banner?.imageUrl) : []),
    [banners],
  );
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  if (slides.length === 0) {
    return <EmptyHeroArt />;
  }

  const activeSlide = slides[index];

  const goToSlide = (nextIndex) => {
    if (nextIndex === index) return;
    setDirection(nextIndex > index ? 1 : -1);
    setIndex(nextIndex);
  };

  const goPrev = () => {
    setDirection(-1);
    setIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setDirection(1);
    setIndex((current) => (current + 1) % slides.length);
  };

  return (
    <div className="relative flex justify-center lg:justify-end">
      <div className="relative h-[430px] w-full max-w-[640px] overflow-hidden rounded-[2.25rem] border border-white/10 bg-black/10 shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.18),transparent_36%)]" />

        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={activeSlide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <img
              src={optimizeImage(activeSlide.imageUrl, 1200)}
              alt={activeSlide.title || 'Hero banner'}
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(0,0,0,0.08)_60%,rgba(0,0,0,0.34)_100%)]" />
            {(activeSlide.title || activeSlide.link) && (
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3 text-white">
                <div className="max-w-[72%]">
                  {activeSlide.title ? (
                    <div className="inline-flex rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm">
                      {activeSlide.title}
                    </div>
                  ) : null}
                </div>
                <div className="rounded-full bg-black/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm">
                  {String(index + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous banner"
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/20 p-3 text-white backdrop-blur-sm transition hover:bg-black/35"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next banner"
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/20 p-3 text-white backdrop-blur-sm transition hover:bg-black/35"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-2 backdrop-blur-sm">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id || slideIndex}
                type="button"
                className={`h-2.5 rounded-full transition-all ${
                  slideIndex === index ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'
                }`}
                onClick={() => goToSlide(slideIndex)}
                aria-label={`Go to slide ${slideIndex + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
