import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Compass, WifiOff, Map, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  fallbackSrc = '',
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

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    if (priority) setIsInView(true);
  }, [src, priority]);

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
    setHasError(true);
    setIsLoading(false);
    if (onError) onError(e);
  }, [onError]);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden flex items-center justify-center bg-slate-950 ${wrapperClassName}`}
      style={{ minWidth: '100%', minHeight: '100%' }}
    >
      {/* Loading Shimmer */}
      {isLoading && !hasError && isInView && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-0">
           <div className="relative">
              <div className="w-12 h-12 rounded-2xl border-2 border-teal-500/20 animate-spin border-t-teal-500" />
              <Compass className="absolute inset-0 m-auto text-teal-500 opacity-20" size={20} />
           </div>
        </div>
      )}

      {/* Actual Image */}
      {isInView && !hasError && src && (
        <img
          src={src}
          alt={alt || 'Post image'}
          crossOrigin="anonymous"
          className={`transition-opacity duration-500 z-10 ${className} ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading={priority ? 'eager' : loading}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* AMAZING ERROR STATE: Visual Signal Lost */}
      {(hasError || (!src && !isLoading)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-8 text-center z-20">
           {/* Decorative Background Glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none" />
           
           <div className="relative mb-6">
              <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full animate-pulse" />
              <div className="relative w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-2xl">
                 <WifiOff className="text-rose-500" size={32} strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-4 border-slate-900 flex items-center justify-center">
                 <AlertCircle size={10} className="text-white fill-rose-500" strokeWidth={4} />
              </div>
           </div>

           <div className="space-y-1 relative z-10">
              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] font-jakarta leading-tight">
                 Visual Signal Lost
              </h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-outfit max-w-[140px] mx-auto leading-relaxed">
                 Coordinate data intact. Virtual imagery unavailable.
              </p>
           </div>

           {/* Stylized Corner Accents */}
           <div className="absolute top-6 left-6 w-2 h-2 border-t-2 border-l-2 border-slate-800" />
           <div className="absolute bottom-6 right-6 w-2 h-2 border-b-2 border-r-2 border-slate-800" />
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;