import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getResponsiveImageProps, optimizeImage } from '../../utils/cloudinaryUrl';
import { useIsMobile } from '../../hooks/useMediaQuery';

const ImageGallery = ({ images = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const isMobile = useIsMobile();

  const mainImage = optimizeImage(images[selectedIndex]?.url, 1000);

  const handleThumbnailClick = (index) => {
    setSelectedIndex(index);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsLightboxOpen(false);
    }
  };

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div
        className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        style={{ aspectRatio: '1/1' }}
      />
    );
  }

  if (isMobile) {
    return (
      <div className="-mx-5">
        <div
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-width-none"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          onScroll={(event) => {
            const width = event.currentTarget.clientWidth;
            if (width > 0) {
              setSelectedIndex(Math.round(event.currentTarget.scrollLeft / width));
            }
          }}
        >
          {images.map((image, index) => (
            <button
              key={image.url || index}
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="w-full flex-none snap-start bg-white"
              style={{ aspectRatio: '1/1' }}
            >
              <img
                {...getResponsiveImageProps(image.url, `Product image ${index + 1}`, '100vw')}
                loading={index === 0 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {images.map((image, index) => (
              <span
                key={image.url || index}
                className="h-2 w-2 rounded-full transition-colors"
                style={{ backgroundColor: selectedIndex === index ? '#D10000' : '#E0D8D8' }}
              />
            ))}
          </div>
        )}

        <AnimatePresence>
          {isLightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-homa-black/95"
              onKeyDown={handleKeyDown}
              onClick={() => setIsLightboxOpen(false)}
            >
              <button
                type="button"
                className="touch-target absolute right-4 top-4 rounded-full text-white transition-colors hover:bg-white/10"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Close fullscreen image"
              >
                <X size={24} />
              </button>
              <img
                src={mainImage}
                alt="Fullscreen"
                loading="eager"
                decoding="async"
                className="max-h-screen max-w-full object-contain"
                onClick={(event) => event.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex w-full gap-3 md:w-1/2">
      {/* Main Image */}
      <div className="flex-1">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="relative w-full cursor-zoom-in overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-colors hover:bg-homa-blush"
          style={{ aspectRatio: '1/1' }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedIndex}
              src={mainImage}
              alt="Product"
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
        </button>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex w-20 flex-col gap-2">
          {images.slice(0, 4).map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleThumbnailClick(idx)}
              className={`relative overflow-hidden rounded-lg border transition-opacity duration-200 ${
                selectedIndex === idx ? 'border-2 border-homa-red opacity-100' : 'border-transparent opacity-55 hover:opacity-80'
              }`}
              style={{ aspectRatio: '1/1' }}
            >
              <img
                {...getResponsiveImageProps(img.url, `Thumbnail ${idx}`, '80px')}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-homa-black/95"
            onKeyDown={handleKeyDown}
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              type="button"
              className="touch-target absolute right-4 top-4 rounded-full text-white transition-colors hover:bg-white/10"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close fullscreen image"
            >
              <X size={24} />
            </button>

            <img
              src={mainImage}
              alt="Fullscreen"
              loading="eager"
              decoding="async"
              className="max-h-screen max-w-4xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGallery;
