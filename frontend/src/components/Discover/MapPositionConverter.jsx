import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

// This component provides a way to convert lat/lng to pixel coordinates and back
const MapPositionConverter = ({ position, children }) => {
  const map = useMap();
  const [pixelPosition, setPixelPosition] = useState(null);

  useEffect(() => {
    if (map && position) {
      try {
        // Convert lat/lng to pixel coordinates relative to the map container
        const latLng = [position[0], position[1]]; // [lat, lng]
        const point = map.latLngToContainerPoint(latLng);
        setPixelPosition({ x: point.x, y: point.y });
      } catch (error) {
        console.error('Error converting position:', error);
      }
    }
  }, [map, position]);

  return children({ pixelPosition, map });
};

export default MapPositionConverter;