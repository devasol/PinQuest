import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Function to create custom markers based on category
const createCustomMarker = (category = 'general', averageRating = 0) => {
  // Determine color based on rating
  let fillColor = '#3b82f6'; // Default blue for general category

  if (averageRating >= 4) {
    fillColor = '#10b981'; // Green for high rating
  } else if (averageRating >= 3) {
    fillColor = '#f59e0b'; // Amber for medium rating
  } else if (averageRating >= 2) {
    fillColor = '#f97316'; // Orange for lower rating
  } else {
    fillColor = '#ef4444'; // Red for lowest rating
  }

  // Category-specific colors
  const categoryColors = {
    nature: '#10b981',     // green
    culture: '#8b5cf6',    // violet
    shopping: '#ec4899',   // pink
    food: '#f59e0b',       // amber
    event: '#3b82f6',      // blue
    general: '#6b7280',    // gray
  };

  // Use category color if available, otherwise use rating-based color
  fillColor = categoryColors[category] || fillColor;

  // Create SVG string for custom marker
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="42">
      <path fill="${fillColor}" stroke="white" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      <circle fill="white" cx="12" cy="9" r="2"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
    className: 'custom-marker'
  });
};

// Simple marker component that wraps react-leaflet Marker
const CustomMarker = ({ post, onClick }) => {
  const markerIcon = createCustomMarker(post.category, post.averageRating);

  return (
    <Marker 
      position={post.position} 
      icon={markerIcon}
      eventHandlers={{
        click: () => onClick && onClick(post)
      }}
    >
      <Popup>
        <div className="popup-content">
          <h3 className="font-bold text-lg">{post.title}</h3>
          <p className="text-sm text-gray-600 mb-1">By {post.postedBy}</p>
          <p className="text-sm mb-2">{post.description}</p>
          <p className="text-xs text-gray-500">
            Category: {post.category} | 
            Rating: {post.averageRating.toFixed(1)} ({post.totalRatings})
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export default CustomMarker;