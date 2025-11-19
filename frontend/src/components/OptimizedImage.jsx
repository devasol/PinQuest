import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Helper function to optimize image URLs (e.g., for CDN)
const optimizeImageUrl = (src, width = null, height = null) => {
  if (!src) return src;
  
  // If it's already an optimized image service URL, return as is
  if (src.includes('via.placeholder.com') || src.includes('unsplash.com')) {
    return src;
  }

  // For basic optimization, we'll add width/height params if available
  // This is a simplified version - in a production app, you'd want to use an actual image optimization service
  const url = new URL(src, window.location.origin);
  
  // Add basic optimization parameters if not already present
  if (width) url.searchParams.set('w', width);
  if (height) url.searchParams.set('h', height);
  
  return url.toString();
};

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
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
    
    if (priority || loading === 'eager') {
      setImgSrc(optimizedSrc);
      setIsInView(true);
    } else if (src) {
      // For lazy loading, we set the src when the image comes into view
      setIsInView(false);
      setImgSrc(null);
    }
  }, [src, optimizedSrc, priority, loading]);

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
        if (entry.isIntersecting) {
          setIsInView(true);
          setImgSrc(optimizedSrc); // Load the image when it comes into view
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
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
  const showPlaceholder = !imgSrc && !hasError && src; // When image hasn't loaded yet but src exists
  const showFallback = hasError;

  return (
    <div 
      ref={imgRef}
      className={`relative ${className}`} 
      style={{ position: 'relative' }}
    >
      {/* Always show a container with appropriate background */}
      <div className="w-full h-full relative">
        {/* Show loading spinner when initially loading and image hasn't been set yet */}
        {showPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
            <LoadingSpinner size="sm" className="!absolute" />
          </div>
        )}
        
        {/* Show the actual image when loaded */}
        {shouldShowImage && (
          <img
            src={imgSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            loading={priority ? 'eager' : loading}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        )}
        
        {/* Show fallback image when there's an error */}
        {showFallback && (
          <img
            src={fallbackSrc}
            alt="Image not available"
            className="w-full h-full object-cover"
            {...props}
          />
        )}
      </div>
    </div>
  );
};

export default OptimizedImage;