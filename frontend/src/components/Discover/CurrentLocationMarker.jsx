import React, { useState, useEffect } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Create a custom icon for the user's current location
const createUserLocationIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
          <div class="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <div class="absolute inset-0 w-8 h-8 bg-blue-400 rounded-full opacity-30 animate-ping"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    className: 'current-location-marker'
  });
};

const CurrentLocationMarker = ({ position, onClick }) => {
  const [markerIcon, setMarkerIcon] = useState(null);
  const map = useMap();

  useEffect(() => {
    if (position) {
      setMarkerIcon(createUserLocationIcon());
    }
  }, [position]);

  if (!position || !markerIcon) {
    return null;
  }

  return (
    <Marker 
      position={position} 
      icon={markerIcon}
      eventHandlers={{
        click: () => {
          if (onClick) onClick(position);
        }
      }}
    >
    </Marker>
  );
};

export default CurrentLocationMarker;