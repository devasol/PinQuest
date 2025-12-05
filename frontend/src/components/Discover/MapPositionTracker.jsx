import { useEffect, useRef } from 'react';
import { useMapEvents } from 'react-leaflet';

const MapPositionTracker = ({ 
  selectedPost, 
  selectedPostPosition, 
  setSelectedPostPosition,
  showCreatePostModal,
  createPostPosition,
  setCreatePostPosition
}) => {
  // Store original coordinates of the positions
  const postLatlngRef = useRef(null);
  const createLatlngRef = useRef(null);

  useMapEvents({
    move: () => {
      // When the map moves, we need to update the screen positions of our windows
      const map = useMapEvents().contextValue;
      
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
      
      // Update the create post window position if it's open and we have coordinates
      if (showCreatePostModal && createPostPosition && setCreatePostPosition) {
        // For the create post, we need to track the original map position where it was created
        // This would require us to store the original latlng when showing the create modal
        // For now, we'll handle this in the main component
      }
    },
    
    zoom: () => {
      // When zoom changes, recompute positions
      const map = useMapEvents().contextValue;
      
      // Update the selected post window position if it exists
      if (selectedPost && selectedPost.position && setSelectedPostPosition) {
        try {
          const newPoint = map.latLngToContainerPoint(selectedPost.position);
          setSelectedPostPosition({
            x: newPoint.x,
            y: newPoint.y
          });
        } catch (error) {
          console.warn('Could not update post window position on zoom:', error);
        }
      }
    }
  });

  return null;
};

export default MapPositionTracker;