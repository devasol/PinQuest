import { Marker } from 'react-leaflet';
import L from 'leaflet';

// Create colored markers using SVG data URLs
const createColoredMarker = (category, isSelected = false) => {
  // Define colors based on category
  const categoryColors = {
    nature: 'green',      
    culture: 'purple',     
    shopping: 'orange',    
    food: 'red',           
    event: 'blue',         
    general: 'darkgray',   
  };

  const color = categoryColors[category] || categoryColors.general;
  
  // Create an SVG data URL for a colored marker
  const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 41">
    <path fill="${color}" stroke="white" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 14 7 14s7-8.75 7-14c0-3.87-3.13-7-7-7z"/>
    <circle fill="white" cx="12" cy="9" r="3"/>
  </svg>`;

  const icon = L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgData)}`,
    iconSize: [24, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
    className: 'colored-marker'
  });

  return icon;
};

const CustomMarker = ({ position, location, onClick, isSelected }) => {
  // Create the marker icon based on category
  const icon = createColoredMarker(location.category, isSelected);

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => onClick(location),
      }}
    />
  );
};

export default CustomMarker;