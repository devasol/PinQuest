import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Custom routing component that shows proper road routes using Leaflet Routing Machine without description panel
const MapRouting = ({ origin, destination, clearRoute }) => {
  const map = useMap();
  const routeControlRef = useRef(null);

  useEffect(() => {
    // Clean up any existing route if clearRoute is true
    if (clearRoute) {
      if (routeControlRef.current) {
        try {
          map.removeControl(routeControlRef.current);
          routeControlRef.current = null;
        } catch (e) {
          console.warn('Error removing route control:', e);
        }
      }
      return;
    }

    // If coordinates are invalid, return early
    if (!origin || !destination || !map) {
      return;
    }

    // Function to create routing control with proper road routes but no panel
    const createRoutingControl = () => {
      try {
        // Remove any existing routing control first
        if (routeControlRef.current) {
          map.removeControl(routeControlRef.current);
        }

        // Create the routing control with Leaflet Routing Machine
        // Use L.Routing.control but only show the route line, not the directions panel
        const routeControl = L.Routing.control({
          waypoints: [
            L.latLng(origin[0], origin[1]),    // origin
            L.latLng(destination[0], destination[1]) // destination
          ],
          routeWhileDragging: false,
          show: false, // Hide the directions panel
          showAlternatives: false, // Only show the main route, no alternatives panel
          collapsible: true, // Allow collapsing if needed
          lineOptions: {
            styles: [
              { color: '#2563eb', opacity: 0.15, weight: 9 },
              { color: '#2563eb', opacity: 0.8, weight: 6 }
            ]
          },
          createMarker: function(i, wp, n) {
            // Don't create intermediate markers
            if (i === 0 || i === n - 1) {
              return L.marker(wp.latLng, {
                draggable: false,
                icon: L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })
              }).bindPopup(i === 0 ? 'Start' : 'Destination');
            }
            return null; // Don't show intermediate markers
          },
          formatter: new L.Routing.Formatter(),
          summaryTemplate: '<div class="routing-summary"><strong>{name}</strong> ({distance})</div>'
        }).addTo(map);

        routeControlRef.current = routeControl;

        // Fit the map to show the full route
        setTimeout(() => {
          if (routeControl && routeControl._container) {
            const bounds = L.latLngBounds([
              L.latLng(origin[0], origin[1]),
              L.latLng(destination[0], destination[1])
            ]);
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }, 500); // Delay to allow route to be calculated and rendered
      } catch (error) {
        console.error('Error creating routing control:', error);
        
        // Fallback: draw a straight line if routing fails
        try {
          const straightLine = L.polyline([origin, destination], {
            color: '#2563eb',
            weight: 6,
            opacity: 0.8
          }).addTo(map);

          // Fit the map to show both points
          const bounds = L.latLngBounds([origin, destination]);
          map.fitBounds(bounds, { padding: [50, 50] });

          // Store for cleanup
          routeControlRef.current = {
            removeFrom: function(map) {
              if (map.hasLayer(straightLine)) {
                map.removeLayer(straightLine);
              }
            }
          };
        } catch (fallbackError) {
          console.error('Error in fallback straight line:', fallbackError);
        }
      }
    };

    createRoutingControl();

    // Cleanup function
    return () => {
      if (routeControlRef.current) {
        try {
          if (map && map.removeControl) {
            map.removeControl(routeControlRef.current);
          }
          routeControlRef.current = null;
        } catch (e) {
          console.warn('Error during route cleanup:', e);
        }
      }
    };
  }, [origin, destination, map, clearRoute]);

  return null;
};

export default MapRouting;