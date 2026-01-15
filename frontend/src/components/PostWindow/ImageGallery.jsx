import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import OptimizedImage from '../OptimizedImage';
import { getImageUrl } from '../../utils/imageUtils';

const ImageGallery = ({ images, currentIndex: initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Filter valid images and normalize them to object format
  const validImages = images?.filter(img =>
    img && (typeof img === 'string' || (typeof img === 'object' && (img.url || img.path || img.filename || img.publicId)))
  ).map(img => {
    if (typeof img === 'string') {
      return { url: img };
    } else if (typeof img === 'object') {
      // Prioritize url, then path, then filename, then publicId
      if (img.url) return { url: img.url, publicId: img.publicId };
      if (img.path) return { url: img.path, publicId: img.publicId };
      if (img.filename) return { url: `/uploads/${img.filename}`, publicId: img.filename };
      if (img.publicId) return { url: `/uploads/${img.publicId}`, publicId: img.publicId };
    }
    return img;
  }) || [];

  const currentImage = validImages[currentIndex];

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeoutId;
    
    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (validImages.length > 1) {
          setShowControls(false);
        }
      }, 3000);
    };

    resetTimeout();

    const handleMouseMove = () => resetTimeout();
    const handleTouchMove = () => resetTimeout();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [validImages.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? validImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === validImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'Escape') {
      if (isFullscreen) {
        setIsFullscreen(false);
      } else {
        onClose();
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, isFullscreen, onClose]);

  if (validImages.length === 0) {
    return (
      <div className="w-full h-64 sm:h-80 md:h-96 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px]">
      {/* Main image display */}
      <div className="relative w-full h-full overflow-hidden bg-gray-100 rounded-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <OptimizedImage
              src={getImageUrl(currentImage)}
              alt={`Post image ${currentIndex + 1}`}
              className="w-full h-full object-contain"
              wrapperClassName="w-full h-full"
              priority={true}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {validImages.length > 1 && (
          <>
            <motion.button
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10 transition-all ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={goToPrevious}
              aria-label="Previous image"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            
            <motion.button
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10 transition-all ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={goToNext}
              aria-label="Next image"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </>
        )}

        {/* Close button */}
        <button
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10 transition-all"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image counter */}
        {validImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            {currentIndex + 1} / {validImages.length}
          </div>
        )}

        {/* Thumbnail strip */}
        {validImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {validImages.map((img, index) => (
              <button
                key={index}
                className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-white ring-2 ring-blue-500 scale-105' 
                    : 'border-gray-300 hover:border-white'
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to image ${index + 1}`}
              >
                <OptimizedImage
                  src={getImageUrl(img)}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;