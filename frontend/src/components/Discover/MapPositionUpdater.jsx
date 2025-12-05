import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const MapPositionUpdater = ({ 
  selectedPost, 
  selectedPostPosition, 
  setSelectedPostPosition,
  showCreatePostModal,
  createPostPosition,
  setCreatePostPosition,
  selectedMapPosition
}) => {
  const map = useMap();
  const lastMapCenter = useRef(map.getCenter());
  const lastMapZoom = useRef(map.getZoom());
  const timeoutRef = useRef(null);
  
  const updatePositions = () => {
    // Clear any existing timeout to debounce the calls
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Use setTimeout to debounce the position updates
    timeoutRef.current = setTimeout(() => {
      // Update the selected post window position if it exists and we have coordinates
      if (selectedPost && selectedPost.position && setSelectedPostPosition) {
        try {
          const newPoint = map.latLngToContainerPoint(selectedPost.position);
          setSelectedPostPosition({
            x: newPoint.x,
            y: newPoint.y
          });
        } catch (error) {
          console.warn('Could not update post window position:', error);
        }
      }
      
      // For the create post window, update its position based on selectedMapPosition
      if (showCreatePostModal && selectedMapPosition && setCreatePostPosition) {
        try {
          const lat = selectedMapPosition?.lat || selectedMapPosition?.latitude;
          const lng = selectedMapPosition?.lng || selectedMapPosition?.longitude;
          
          if (lat !== undefined && lng !== undefined) {
            const position = [lat, lng];
            const newPoint = map.latLngToContainerPoint(position);
            setCreatePostPosition({
              x: newPoint.x,
              y: newPoint.y
            });
          }
        } catch (error) {
          console.warn('Could not update create post window position:', error);
        }
      }
    }, 50); // 50ms debounce to reduce excessive updates
  };

  useEffect(() => {
    // Update positions immediately when this component mounts
    updatePositions();

    // Listen to map move events
    map.on('move', updatePositions);
    map.on('zoom', updatePositions);

    // Cleanup event listeners and timeout
    return () => {
      map.off('move', updatePositions);
      map.off('zoom', updatePositions);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    map, 
    selectedPost, 
    selectedPostPosition, 
    setSelectedPostPosition, 
    showCreatePostModal, 
    createPostPosition, 
    setCreatePostPosition,
    selectedMapPosition
  ]);

  return null;
};

export default MapPositionUpdater;