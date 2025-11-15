import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet-routing-machine';

const RoutingMachine = ({ start, end, isVisible, travelMode = 'driving' }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!start || !end || !isVisible || !map) {
      // If routing is not visible or start/end not set, remove existing control
      if (map && routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      return;
    }

    // Remove existing control if present
    if (map && routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Define routing profile based on travel mode
    let routerOptions = {};
    if (travelMode === 'walking') {
      routerOptions = {
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'foot',
          suppressDemoServerWarning: true
        })
      };
    } else { // driving (default)
      routerOptions = {
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving',
          suppressDemoServerWarning: true
        })
      };
    }

    // Create routing control showing only the main route (shortest/fastest)
    const newRoutingControl = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      routeWhileDragging: false,
      showAlternatives: false,  // Only show the main route, which is typically the shortest/fastest
      lineOptions: {
        styles: [
          {color: 'black', opacity: 0.15, weight: 12},
          {color: 'white', opacity: 0.8, weight: 10},
          {color: '#22c55e', opacity: 1, weight: 8} // Green for main route
        ]
      },
      createMarker: function(i, wp, n) {
        // Don't create markers to keep the map clean
        return null;
      },
      ...routerOptions
    }).addTo(map);

    // Store reference to the control
    routingControlRef.current = newRoutingControl;

    // Clean up the routing control when component unmounts or props change
    return () => {
      if (map && newRoutingControl) {
        map.removeControl(newRoutingControl);
        routingControlRef.current = null;
      }
    };
  }, [start, end, isVisible, travelMode, map]);

  return null;
};

export default RoutingMachine;