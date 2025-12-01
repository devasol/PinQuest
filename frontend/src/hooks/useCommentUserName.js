import { useState, useEffect, useCallback } from 'react';
import { userApi } from '../services/api'; // Assuming userApi exists and has getUserById

const useCommentUserName = (userId, authToken) => {
  const [userName, setUserName] = useState('Anonymous');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserName = useCallback(async (id) => {
    if (!id || typeof id !== 'string') {
      setUserName('Anonymous');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await userApi.getUserById(id, authToken);
      if (response.success && response.data && response.data.name) {
        setUserName(response.data.name);
      } else {
        // Handle case where user doesn't exist or response is not successful
        setUserName('Anonymous');
      }
    } catch (err) {
      console.error("Error fetching user name for comment:", err);
      // Specifically handle 404 errors (user not found) to set a default name
      setUserName('Deleted User');
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]); // Dependency on authToken

  useEffect(() => {
    if (userId && typeof userId === 'string') {
      fetchUserName(userId);
    } else if (userId && typeof userId === 'object' && userId.name) {
        setUserName(userId.name);
    } else {
        setUserName('Anonymous');
    }
  }, [userId, fetchUserName]);

  return { userName, isLoading, error };
};

export default useCommentUserName;
