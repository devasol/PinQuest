import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

// Component to display a static pin that stays in screen position
const StaticPinOverlay = ({ position, isVisible }) => {
  const map = useMap();
  const pinRef = useRef(null);

  useEffect(() => {
    if (!position || !isVisible || !map || !pinRef.current) return;

    // Function to update pin position based on map and coordinates
    const updatePinPosition = () => {
      if (!position || !pinRef.current) return;
      
      // Convert lat/lng to container point (screen coordinates)
      const point = map.latLngToContainerPoint([position[0], position[1]]);
      
      // Update the pin's position
      pinRef.current.style.left = `${point.x}px`;
      pinRef.current.style.top = `${point.y}px`;
      pinRef.current.style.display = 'block';
    };

    // Update position when map moves or zooms
    map.on('move', updatePinPosition);
    map.on('zoom', updatePinPosition);
    map.on('moveend', updatePinPosition); // Ensure updates after animations
    map.on('zoomend', updatePinPosition); // Ensure updates after zoom animations
    
    // Initial positioning
    updatePinPosition();

    // Cleanup event listeners
    return () => {
      map.off('move', updatePinPosition);
      map.off('zoom', updatePinPosition);
      map.off('moveend', updatePinPosition);
      map.off('zoomend', updatePinPosition);
    };
  }, [position, isVisible, map]);

  if (!isVisible || !position) {
    // Even when not visible, we need the element to exist to maintain refs
    return (
      <div
        ref={pinRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: -1, // Hide when not visible
          pointerEvents: 'none', // Allow interactions to pass through to map
          display: 'none', // Actually hide it
        }}
      />
    );
  }

  return (
    <div
      ref={pinRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 10000, // High z-index to ensure visibility
        pointerEvents: 'none', // Allow interactions to pass through to map
        transform: 'translate(-50%, -100%)', // Center the pin horizontally and position at top
      }}
      className="static-pin-wrapper"
    >
      <div 
        className="static-pin-marker"
        style={{
          fontSize: '32px',
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
        }}
      >
        {/* Using a more prominent pin icon */}
        <svg
          width="32"
          height="41"
          viewBox="0 0 32 41"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 0C7.16344 0 0 7.16371 0 16.0003C0 28.8 16 41 16 41C16 41 32 28.8 32 16.0003C32 7.16371 24.8366 0 16 0ZM16 22C12.6863 22 10 19.3137 10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16C22 19.3137 19.3137 22 16 22Z"
            fill="#FF6B6B"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          <circle cx="16" cy="16" r="4" fill="white" />
        </svg>
      </div>
    </div>
  );
};

export default StaticPinOverlay;