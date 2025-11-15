import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet-routing-machine';

const RoutingMachine = ({ start, end, isVisible, travelMode = 'driving' }) => {
  const map = useMap();

  useEffect(() => {
    if (!start || !end || !isVisible || !map) return;

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

    // Create routing control
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      routeWhileDragging: true,
      showAlternatives: true,
      lineOptions: {
        styles: [
          {color: 'black', opacity: 0.15, weight: 12},
          {color: 'white', opacity: 0.8, weight: 10},
          {color: '#007cba', opacity: 1, weight: 8} // Bold blue line
        ]
      },
      altLineOptions: {
        styles: [
          { color: 'black', opacity: 0.15, weight: 12 },
          { color: 'white', opacity: 0.8, weight: 10 },
          { color: '#007cba', opacity: 1, weight: 8 } // Bold blue line
        ]
      },
      ...routerOptions
    }).addTo(map);

    // Clean up the routing control when component unmounts or props change
    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [start, end, isVisible, travelMode, map]);

  return null;
};

export default RoutingMachine;