import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapComponent = ({
  center,
  zoom,
  locations,
  selectedLocation,
  onMarkerClick,
  children,
}) => {
  const mapRef = useRef();

  // Update map view when center or zoom changes
  useEffect(() => {
    if (mapRef.current && center) {
      const map = mapRef.current;
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom]);

  return (
    <MapContainer
      ref={mapRef}
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      className="rounded-xl"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.coordinates.lat, location.coordinates.lng]}
          eventHandlers={{
            click: () => onMarkerClick(location),
          }}
        >
          <Popup>
            <div className="popup-content">
              <h3>{location.name}</h3>
              <p>{location.description}</p>
              {location.rating && (
                <div className="popup-rating">
                  ★ {location.rating}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      {children}
    </MapContainer>
  );
};

export default MapComponent;