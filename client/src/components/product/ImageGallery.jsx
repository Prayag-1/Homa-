import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { optimizeImage } from '../../utils/cloudinaryUrl';

const ImageGallery = ({ images = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

  return (
    <div className="flex gap-3">
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
                src={optimizeImage(img.url, 200)}
                alt={`Thumbnail ${idx}`}
                loading="lazy"
                decoding="async"
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
              className="absolute right-4 top-4 rounded-full p-2 text-white transition-colors hover:bg-white/10"
              onClick={() => setIsLightboxOpen(false)}
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
