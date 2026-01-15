import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Helper function to optimize image URLs (e.g., for CDN)
const optimizeImageUrl = (src, width = null, height = null) => {
  if (!src) return src;
  
  // Ensure src is a string before calling includes
  const srcString = typeof src === 'string' ? src : String(src);
  
  // If it's already an optimized image service URL, return as is
  if (srcString.includes('via.placeholder.com') || srcString.includes('unsplash.com')) {
    return srcString;
  }

  // For basic optimization, we'll add width/height params if available
  // This is a simplified version - in a production app, you'd want to use an actual image optimization service
  try {
    const url = new URL(srcString, window.location.origin);
    
    // Add basic optimization parameters if not already present
    if (width) url.searchParams.set('w', width);
    if (height) url.searchParams.set('h', height);
    
    return url.toString();
  } catch (e) {
    // If URL parsing fails, return the original src
    return srcString;
  }
};

const OptimizedImage = ({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  fallbackSrc = 'https://via.placeholder.com/400x300/cccccc/666666?text=Image+Not+Loaded',
  loading = 'lazy',
  width,
  height,
  quality = 80,
  priority = false,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);

  // Reset states when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    if (priority) setIsInView(true);
  }, [src, priority]);

  // Setup intersection observer for lazy loading if not priority
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.01, rootMargin: '100px' }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = useCallback((e) => {
    setIsLoading(false);
    if (onLoad) onLoad(e);
  }, [onLoad]);

  const handleError = useCallback((e) => {
    console.error(`OptimizedImage failed to load: ${src}`);
    setHasError(true);
    setIsLoading(false);
    if (onError) onError(e);
  }, [onError, src]);

  // If no src is provided, show error state immediately
  if (!src && !isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 text-center ${wrapperClassName}`}>
         <p className="text-white/50 text-xs font-medium uppercase tracking-wider">No Image</p>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden flex items-center justify-center ${wrapperClassName}`}
      style={{ minWidth: '100%', minHeight: '100%' }}
    >
      {/* Loading Shimmer */}
      {isLoading && !hasError && isInView && (
        <div className="absolute inset-0 bg-gray-900/10 animate-pulse flex items-center justify-center z-0">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {/* Actual Image */}
      {isInView && !hasError && src && (
        <img
          src={src}
          alt={alt || 'Post image'}
          crossOrigin="anonymous"
          className={`transition-opacity duration-300 z-10 ${className} ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading={priority ? 'eager' : loading}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* Error State */}
      {(hasError || (!src && !isLoading)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/20 backdrop-blur-sm p-4 text-center z-20">
           <svg className="w-10 h-10 text-white/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
           <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Image Unavailable</p>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;