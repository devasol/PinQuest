import React, { useState, useEffect } from 'react';
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

  // State for recent locations
  const [recentLocations, setRecentLocations] = useState([]);

  // Function to add a location to recents
  const addRecentLocation = (location) => {
    // Check if location is already in recents
    const existingIndex = recentLocations.findIndex(
      (recent) => recent.id === location.id
    );
    let updatedRecents = [...recentLocations];

    if (existingIndex !== -1) {
      // If already exists, move to the top
      const [existingLocation] = updatedRecents.splice(existingIndex, 1);
      updatedRecents = [existingLocation, ...updatedRecents];
    } else {
      // If new, add to the top
      const newRecentLocation = {
        ...location,
        viewedAt: new Date().toISOString(),
      };
      updatedRecents = [newRecentLocation, ...updatedRecents];
    }

    // Limit to 10 recent items
    updatedRecents = updatedRecents.slice(0, 10);

    setRecentLocations(updatedRecents);

    // Save to localStorage
    try {
      localStorage.setItem("recentLocations", JSON.stringify(updatedRecents));
    } catch (e) {
      console.error("Failed to save recentLocations to localStorage:", e);
    }
  };

  // Load recent locations from localStorage when component mounts
  useEffect(() => {
    const recents = localStorage.getItem("recentLocations");
    if (recents) {
      try {
        setRecentLocations(JSON.parse(recents));
      } catch (e) {
        console.error("Error parsing recent locations:", e);
      }
    }
  }, []);

  return (
    <div className="relative">
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
            <Popup
              onOpen={() => {
                addRecentLocation(location);
              }}
            >
              <div>
                <div className="font-semibold text-gray-800">{location.name}</div>
                <p className="text-gray-600">{location.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Recent Locations Panel */}
      {recentLocations.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 max-h-96 overflow-y-auto z-[1000] w-64">
          <h3 className="font-bold text-gray-800 mb-2">Recent Locations</h3>
          <div className="space-y-2">
            {recentLocations.map((location, index) => (
              <div key={`${location.id}-${index}`} className="text-sm p-2 bg-gray-100 rounded-lg">
                <div className="font-medium text-gray-800 truncate">{location.name}</div>
                <div className="text-gray-600 text-xs">{location.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;