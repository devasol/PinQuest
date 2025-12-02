import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Heart, Star } from 'lucide-react';

// Function to create custom markers based on category
const createCustomMarker = (category = 'general', averageRating = 0, isSaved = false, isLiked = false) => {
  // Determine color based on like status first, then fallback to rating or category
  let fillColor = '#3b82f6'; // Default blue for general category

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
      event: '#3b82f6',      // blue
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

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="56">
      <path fill="${fillColor}" stroke="white" stroke-width="3" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      <circle fill="white" cx="12" cy="9" r="3"/>
      ${additionalIcons}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    iconSize: [40, 56],
    iconAnchor: [20, 56],
    popupAnchor: [0, -56],
    className: 'custom-marker pulse'
  });
};

// Simple marker component that wraps react-leaflet Marker
const CustomMarker = ({ post, isLiked, onSave, isSaved, onGetDirections, onClick }) => {
  const markerIcon = createCustomMarker(post.category, post.averageRating, isSaved, isLiked);
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

  return (
    <Marker 
      position={post.position} 
      icon={markerIcon}
      ref={markerRef}
    >
    </Marker>
  );
};

export default CustomMarker;