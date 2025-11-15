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

    // Create routing control with alternative routes
    const newRoutingControl = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      routeWhileDragging: false,
      showAlternatives: true,
      lineOptions: {
        styles: [
          {color: 'black', opacity: 0.15, weight: 12},
          {color: 'white', opacity: 0.8, weight: 10},
          {color: '#22c55e', opacity: 1, weight: 8} // Green for main route
        ]
      },
      altLineOptions: {
        styles: [
          { color: 'black', opacity: 0.15, weight: 12 },
          { color: 'white', opacity: 0.8, weight: 10 },
          { color: '#ef4444', opacity: 1, weight: 8 } // Red for alternative routes
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

    // After routes are calculated, identify shortest and longest
    newRoutingControl.on('routesfound', function(e) {
      const routes = e.routes;
      if (routes && routes.length > 1) {
        // Find shortest and longest routes by distance
        let shortestIndex = 0;
        let longestIndex = 0;
        let shortestDistance = routes[0].summary.totalDistance;
        let longestDistance = routes[0].summary.totalDistance;

        for (let i = 1; i < routes.length; i++) {
          if (routes[i].summary.totalDistance < shortestDistance) {
            shortestDistance = routes[i].summary.totalDistance;
            shortestIndex = i;
          }
          if (routes[i].summary.totalDistance > longestDistance) {
            longestDistance = routes[i].summary.totalDistance;
            longestIndex = i;
          }
        }

        // Apply colors: green for shortest, red for longest, default for others
        const container = document.querySelector('.leaflet-routing-container');
        if (container) {
          const routePanels = container.querySelectorAll('.leaflet-routing-alt');
          
          routePanels.forEach((panel, index) => {
            // Shortest route gets green line
            if (index === shortestIndex) {
              const lines = panel.querySelectorAll('.leaflet-routing-alt-line, .leaflet-routing-line');
              lines.forEach(line => {
                line.style.stroke = '#22c55e'; // Green
                line.style.strokeWidth = '8';
              });
            }
            // Longest route gets red line
            else if (index === longestIndex) {
              const lines = panel.querySelectorAll('.leaflet-routing-alt-line, .leaflet-routing-line');
              lines.forEach(line => {
                line.style.stroke = '#ef4444'; // Red
                line.style.strokeWidth = '8';
              });
            }
          });
        }
      }
      // If only one route, make it green
      else if (routes.length === 1) {
        const container = document.querySelector('.leaflet-routing-container');
        if (container) {
          const lines = container.querySelectorAll('.leaflet-routing-line');
          lines.forEach(line => {
            line.style.stroke = '#22c55e'; // Green
            line.style.strokeWidth = '8';
          });
        }
      }
    });

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