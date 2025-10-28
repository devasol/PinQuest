import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({ className = "" }) => {
  // Sample locations for demonstration
  const locations = [
    {
      id: 1,
      name: "Eiffel Tower",
      position: [48.8584, 2.2945],
      description: "Iconic landmark in Paris, France"
    },
    {
      id: 2,
      name: "Statue of Liberty",
      position: [40.6892, -74.0445],
      description: "Symbol of freedom in New York, USA"
    },
    {
      id: 3,
      name: "Great Wall of China",
      position: [40.4319, 116.5704],
      description: "Ancient series of walls and fortifications"
    },
    {
      id: 4,
      name: "Machu Picchu",
      position: [-13.1631, -72.5450],
      description: "15th-century Inca citadel in Peru"
    },
    {
      id: 5,
      name: "Pyramids of Giza",
      position: [29.9792, 31.1344],
      description: "Ancient pyramid complex in Egypt"
    },
    {
      id: 6,
      name: "Taj Mahal",
      position: [27.1750, 78.0419],
      description: "Ivory-white marble mausoleum in India"
    }
  ];

  return (
    <MapContainer 
      center={[20, 0]} 
      zoom={2} 
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      className={className}
      zoomControl={false}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map(location => (
        <Marker key={location.id} position={location.position}>
          <Popup>
            <div>
              <div className="font-semibold text-gray-800">{location.name}</div>
              <p className="text-gray-600">{location.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;