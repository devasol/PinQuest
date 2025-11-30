import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Heart, Star } from 'lucide-react';

// Function to create custom markers based on category
const createCustomMarker = (category = 'general', averageRating = 0, isSaved = false) => {
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

  // Create SVG string for custom marker (with saved state indicator if needed)
  const savedIndicator = isSaved ? 
    `<g transform="translate(20, 5) scale(0.4)">
      <path fill="red" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </g>` : '';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="42">
      <path fill="${fillColor}" stroke="white" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      <circle fill="white" cx="12" cy="9" r="2"/>
      ${savedIndicator}
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
const CustomMarker = ({ post, onClick, onSave, isSaved }) => {
  const [isHovered, setIsHovered] = useState(false);
  const markerIcon = createCustomMarker(post.category, post.averageRating, isSaved);

  return (
    <Marker 
      position={post.position} 
      icon={markerIcon}
      eventHandlers={{
        click: () => onClick && onClick(post),
        mouseover: () => setIsHovered(true),
        mouseout: () => setIsHovered(false)
      }}
    >
      <Popup>
        <div className="popup-content max-w-xs">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{post.title}</h3>
              <p className="text-sm text-gray-600 mb-1">By {post.postedBy}</p>
            </div>
            {onSave && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent popup from closing
                  onSave(post);
                }}
                className={`ml-2 ${isSaved ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
          <p className="text-sm mb-2 text-gray-700">{post.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(post.averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-1 text-sm text-gray-600">
                {post.averageRating.toFixed(1)} ({post.totalRatings})
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Category: <span className="font-medium">{post.category}</span>
          </p>
          {onSave && !isSaved && (
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Prevent popup from closing
                onSave(post);
              }}
              className="mt-2 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-1.5 px-3 rounded text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Save Location
            </button>
          )}
          {onSave && isSaved && (
            <div className="mt-2 w-full bg-green-100 text-green-800 py-1.5 px-3 rounded text-sm font-medium flex items-center justify-center">
              <Heart className="w-4 h-4 mr-1 fill-current" /> Saved
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default CustomMarker;