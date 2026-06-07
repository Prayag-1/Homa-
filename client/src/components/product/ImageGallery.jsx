import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ImageGallery = ({ images = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const mainImage = images[selectedIndex]?.url;

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
        className="bg-gray-200"
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
          className="relative w-full bg-gray-100 cursor-zoom-in hover:bg-gray-50 transition-colors"
          style={{ aspectRatio: '1/1' }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedIndex}
              src={mainImage}
              alt="Product"
              className="w-full h-full object-cover"
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
        <div className="flex flex-col gap-2 w-20">
          {images.slice(0, 4).map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleThumbnailClick(idx)}
              className={`relative overflow-hidden transition-opacity duration-200 ${
                selectedIndex === idx ? 'opacity-100' : 'opacity-50 hover:opacity-75'
              }`}
              style={{ aspectRatio: '1/1' }}
            >
              <img
                src={img.url}
                alt={`Thumbnail ${idx}`}
                className="w-full h-full object-cover"
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
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onKeyDown={handleKeyDown}
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 transition-colors"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X size={24} />
            </button>

            <img
              src={mainImage}
              alt="Fullscreen"
              className="max-w-4xl max-h-screen object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGallery;
