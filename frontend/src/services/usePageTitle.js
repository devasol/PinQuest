import { useEffect } from 'react';

// Custom hook to manage document title
const usePageTitle = (title) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} - PinQuest` : 'PinQuest - Discover and Share Locations';
    
    // Cleanup function to restore previous title when component unmounts
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};

export default usePageTitle;