import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Heart, Star } from 'lucide-react';

// Function to create custom markers based on category
const createCustomMarker = (category = 'general', averageRating = 0, isSaved = false, isLiked = false) => {
  // Determine color based on like status first, then fallback to rating or category
  let fillColor = '#14b8a6'; // Default teal for amazing vibe

  if (isLiked) {
    fillColor = '#ef4444'; // Red for liked posts
  } else {
    // If not liked, use rating-based or category-based color
    if (averageRating >= 4) {
      fillColor = '#10b981'; // Green for high rating
    } else if (averageRating >= 3) {
      fillColor = '#f59e0b'; // Amber for medium rating
    } else if (averageRating >= 2) {
      fillColor = '#f97316'; // Orange for lower rating
    } else {
      fillColor = '#ef4444'; // Red for lowest rating
    }

    // Category-specific colors (only if not liked)
    const categoryColors = {
      nature: '#10b981',     // green
      culture: '#8b5cf6',    // violet
      shopping: '#ec4899',   // pink
      food: '#f59e0b',       // amber
      event: '#14b8a6',      // teal
      general: '#6b7280',    // gray
    };

    // Use category color if available and not liked, otherwise use rating-based color
    if (!isLiked) {
      fillColor = categoryColors[category] || fillColor;
    }
  }

  // Create SVG string for custom marker (with saved and liked state indicators if needed)
  let additionalIcons = '';
  
  // Add saved indicator
  if (isSaved) {
    additionalIcons += `
      <g transform="translate(20, 5) scale(0.4)">
        <path fill="yellow" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </g>`;
  }
  
  // Add liked indicator (heart outline if not filled)
  if (isLiked && !isSaved) {
    additionalIcons += `
      <g transform="translate(20, 5) scale(0.4)">
        <path fill="red" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </g>`;
  } else if (isLiked && isSaved) {
    // If both liked and saved, position the liked indicator differently
    additionalIcons += `
      <g transform="translate(5, 5) scale(0.4)">
        <path fill="red" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </g>`;
  }

  // Define colors for gradient based on fillColor
  const colors = {
    start: fillColor,
    end: fillColor, // Default to solid color
  };

  // Example: if fillColor is green, make gradient from light green to dark green
  if (fillColor === '#10b981') { // Green
    colors.start = '#34d399';
    colors.end = '#059669';
  } else if (fillColor === '#8b5cf6') { // Violet
    colors.start = '#a78bfa';
    colors.end = '#7c3aed';
  } else if (fillColor === '#ec4899') { // Pink
    colors.start = '#f472b6';
    colors.end = '#db2777';
  } else if (fillColor === '#f59e0b') { // Amber
    colors.start = '#fbbf24';
    colors.end = '#d97706';
  } else if (fillColor === '#14b8a6') { // Teal
    colors.start = '#2dd4bf';
    colors.end = '#0d9488';
  } else if (fillColor === '#ef4444') { // Red
    colors.start = '#f87171';
    colors.end = '#dc2626';
  } else if (fillColor === '#6b7280') { // Gray
    colors.start = '#9ca3af';
    colors.end = '#4b5563';
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="56" style="display: block; overflow: visible;">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dx="0" dy="1" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="pinGradient-${category}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.end};stop-opacity:1" />
        </linearGradient>
      </defs>
      <g filter="url(#shadow)">
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 6 7 15 7 15s7-9 7-15c0-3.87-3.13-7-7-7z"
          fill="url(#pinGradient-${category})"
          stroke="white"
          stroke-width="1.5"
        />
        <circle fill="white" cx="12" cy="9" r="3" />
        ${isSaved ? '<circle cx="12" cy="9" r="4.5" fill="none" stroke="#facc15" stroke-width="1.5" />' : ''}
        ${isLiked ? '<circle cx="12" cy="9" r="6" fill="none" stroke="#ef4444" stroke-width="1" stroke-dasharray="1,1" />' : ''}
      </g>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    iconSize: [40, 56],
    iconAnchor: [20, 56],
    popupAnchor: [0, -56],
    className: 'custom-marker'
  });
};

// Simple marker component that wraps react-leaflet Marker
const CustomMarker = React.memo(({ post, isLiked, onSave, isSaved, onGetDirections, onClick }) => {
  const markerIcon = React.useMemo(() => createCustomMarker(post.category, post.averageRating, isSaved, isLiked), [post.category, post.averageRating, isSaved, isLiked]);
  const markerRef = React.useRef(null);

  React.useEffect(() => {
    const marker = markerRef.current;
    if (marker && onClick) {
      const handleClick = () => {
        onClick(post);
      };
      
      marker.on('click', handleClick);
      marker.on('mouseover', () => {
        marker.getElement().classList.add('pulse');
      });
      marker.on('mouseout', () => {
        marker.getElement().classList.remove('pulse');
      });
      
      return () => {
        marker.off('click', handleClick);
        marker.off('mouseover');
        marker.off('mouseout');
      };
    }
  }, [onClick, post]);

  // Skip rendering if position is not defined
  if (!post.position || !Array.isArray(post.position) || post.position.length < 2) {
    return null;
  }

  return (
    <Marker 
      position={post.position} 
      icon={markerIcon}
      ref={markerRef}
    >
    </Marker>
  );
});

export default CustomMarker;