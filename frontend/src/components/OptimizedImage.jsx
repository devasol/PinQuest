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
  const [imgSrc, setImgSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);

  // Optimize the image URL
  const optimizedSrc = optimizeImageUrl(src, width, height);

  useEffect(() => {
    // Reset states when src changes
    setIsLoading(true);
    setHasError(false);

    if (priority || loading === 'eager' || !src) {
      // For eager loading or when no src is provided, set the image immediately
      if (src) {
        setImgSrc(optimizedSrc);
        setIsInView(true);
      }
    } else if (src) {
      // For lazy loading, we set the src when the image comes into view
      setIsInView(false);
      setImgSrc(null);
    }
  }, [src, optimizedSrc, priority, loading]);

  // Debug logging to help troubleshoot image loading issues
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('OptimizedImage debug:', { src, optimizedSrc, imgSrc });
    }
  }, [src, optimizedSrc, imgSrc]);

  const handleLoad = useCallback((e) => {
    setIsLoading(false);
    if (onLoad) onLoad(e);
  }, [onLoad]);

  const handleError = useCallback((e) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) onError(e);
  }, [onError]);

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager' || !src) {
      return; // Already handled in the main effect
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setIsInView(true);
          setImgSrc(optimizedSrc); // Load the image when it comes into view
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [optimizedSrc, priority, loading, src]);

  // Determine what to show
  const shouldShowImage = imgSrc && !hasError;
  const showPlaceholder = (!imgSrc && !hasError && src) || (priority && isLoading && !hasError); // When image hasn't loaded yet but src exists
  const showFallback = hasError;

  return (
    <div
      ref={imgRef}
      className={`relative ${wrapperClassName || className}`}
      style={{ position: 'relative' }}
    >
      {/* Always show a container with appropriate background */}
      <div className="w-full h-full relative">
        {/* Show loading placeholder with gradient animation */}
        {showPlaceholder && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 animate-pulse">
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center">
                <LoadingSpinner size="sm" className="!absolute" />
              </div>
            </div>
          </div>
        )}

        {/* Show the actual image when loaded */}
        {shouldShowImage && (
          <img
            src={imgSrc}
            alt={alt || 'Post image'}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            loading={priority ? 'eager' : loading}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        )}

        {/* Show fallback message and icon when there's an error */}
        {showFallback && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white/60 font-medium text-sm">Image Unavailable</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedImage;