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
        try {
          map.removeControl(routingControlRef.current);
        } catch (error) {
          // Ignore errors during cleanup, especially if map is already destroyed
          console.warn('Error removing routing control:', error.message);
        }
        routingControlRef.current = null;
      }
      return;
    }

    // Remove existing control if present
    if (map && routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (error) {
        console.warn('Error removing existing routing control:', error.message);
      }
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

    let newRoutingControl = null;
    try {
      // Create routing control showing only the main route (shortest/fastest)
      newRoutingControl = L.Routing.control({
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
        ...routerOptions,
        show: false, // Hide the routing panel to keep UI clean, only show route on map
        collapsible: true // Make it collapsible to handle any UI issues
      }).addTo(map);

      // Store reference to the control
      routingControlRef.current = newRoutingControl;
    } catch (error) {
      console.error('Error creating routing control:', error);
      // Try to create without the show: false option if there are issues
      try {
        newRoutingControl = L.Routing.control({
          waypoints: [
            L.latLng(start[0], start[1]),
            L.latLng(end[0], end[1])
          ],
          routeWhileDragging: false,
          showAlternatives: false,
          lineOptions: {
            styles: [
              {color: 'black', opacity: 0.15, weight: 12},
              {color: 'white', opacity: 0.8, weight: 10},
              {color: '#22c55e', opacity: 1, weight: 8}
            ]
          },
          createMarker: function(i, wp, n) {
            return null;
          },
          ...routerOptions
        }).addTo(map);

        routingControlRef.current = newRoutingControl;
      } catch (fallbackError) {
        console.error('Fallback routing control creation also failed:', fallbackError);
      }
    }

    // Clean up the routing control when component unmounts or props change
    return () => {
      if (newRoutingControl) {
        try {
          if (map) {
            map.removeControl(newRoutingControl);
          } else {
            // If map is no longer available, try to remove the control from the control itself
            if (newRoutingControl.remove) {
              newRoutingControl.remove();
            }
          }
        } catch (error) {
          // Ignore errors during cleanup, especially if map is already destroyed
          console.warn('Error during routing control cleanup:', error.message);
        }
        routingControlRef.current = null;
      }
    };
  }, [start, end, isVisible, travelMode, map]);

  return null;
};

export default RoutingMachine;