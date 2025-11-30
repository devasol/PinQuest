import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import CustomMarker from './CustomMarker';
import Header from '../Landing/Header/Header';

// API base URL - adjust based on your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const MapView = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef();
  const fetchIntervalRef = useRef(null);

  // Fetch posts from the backend API
  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        // Transform the API data to match the format expected by the frontend
        // Handle both location formats: coordinates array and latitude/longitude fields
        const transformedPosts = result.data
          .filter(post => {
            // Check if the post has valid location data in either format
            if (post.location) {
              // Check GeoJSON format: [longitude, latitude]
              if (post.location.coordinates && Array.isArray(post.location.coordinates) 
                  && post.location.coordinates.length === 2 
                  && typeof post.location.coordinates[0] === 'number' 
                  && typeof post.location.coordinates[1] === 'number') {
                return true;
              }
              // Check separate latitude/longitude format
              if (typeof post.location.latitude === 'number' && 
                  typeof post.location.longitude === 'number' &&
                  !isNaN(post.location.latitude) &&
                  !isNaN(post.location.longitude)) {
                return true;
              }
            }
            return false;
          })
          .map(post => {
            let position;
            // Handle GeoJSON format [longitude, latitude]
            if (post.location.coordinates && Array.isArray(post.location.coordinates) 
                && post.location.coordinates.length === 2) {
              // Convert to [latitude, longitude] for Leaflet
              position = [post.location.coordinates[1], post.location.coordinates[0]];
            } 
            // Handle separate latitude/longitude format
            else if (typeof post.location.latitude === 'number' && 
                     typeof post.location.longitude === 'number') {
              position = [post.location.latitude, post.location.longitude];
            }
            
            return {
              id: post._id,
              title: post.title || "Untitled",
              description: post.description || "No description provided",
              image: post.image,
              images: post.images || [],
              averageRating: post.averageRating || 0,
              totalRatings: post.totalRatings || 0,
              postedBy: post.postedBy?.name || post.postedBy || "Unknown",
              category: post.category || "general",
              datePosted: post.datePosted || new Date().toISOString(),
              position: position, // [lat, lng] format for Leaflet
            };
          });
        
        setPosts(transformedPosts);
      } else {
        console.error("Error: Invalid API response format", result);
        setError("Failed to load posts from server");
        setPosts([]);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts: " + err.message);
      setPosts([]);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      await fetchPosts();
      setLoading(false);
    };
    
    initialFetch();

    // Set up periodic refresh every 30 seconds
    fetchIntervalRef.current = setInterval(fetchPosts, 30000);
    
    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [fetchPosts]);

  // Get user location for initial centering
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Update map center if we have a reference to it
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 13);
          }
        },
        (error) => {
          console.log("Geolocation error:", error.message);
          // Default to world view if geolocation fails
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000, // 10 minutes
        }
      );
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header isDiscoverPage={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-xl font-medium text-white">Loading map data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header isDiscoverPage={true} />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 max-w-md">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Map</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header isDiscoverPage={true} />
      <div className="relative w-full h-[calc(100vh-4rem)]">
        <MapContainer
          center={[20, 0]} // Default to world view
          zoom={2}
          minZoom={2}
          maxZoom={18}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Render custom markers for each post */}
          {posts.map((post) => (
            <CustomMarker 
              key={post.id} 
              post={post}
              onClick={(post) => {
                // Handle click on marker
                console.log('Marker clicked for post:', post.title);
              }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;