import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Search,
  Filter,
  Star,
  Heart,
  Navigation,
  Layers,
  Compass,
  Plus,
  Minus,
  Locate,
  Share2,
  Bookmark,
  X,
  List,
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Header from "../../components/Landing/Header/Header";
import CustomMarker from "../../components/MapComponent/CustomMarker";
import EnhancedMarkerCluster from "../../components/MapComponent/EnhancedMarkerCluster";
import "./MapsPage.css";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.006 });
  const [zoomLevel, setZoomLevel] = useState(13);
  const [mapStyle, setMapStyle] = useState("default");
  const [showListOnMobile, setShowListOnMobile] = useState(false);
  const mapRef = useRef(null);
  const locationCardRef = useRef(null);

  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);
  const [hasFallbackData, setHasFallbackData] = useState(false);

  const categories = [
    { id: "all", name: "All", icon: MapPin },
    { id: "nature", name: "Nature", icon: MapPin },
    { id: "culture", name: "Culture", icon: MapPin },
    { id: "shopping", name: "Shopping", icon: MapPin },
    { id: "food", name: "Food & Drinks", icon: MapPin },
    { id: "event", name: "Events", icon: MapPin },
    { id: "general", name: "General", icon: MapPin }
  ];

  // Fallback data to show when API fails
  const fallbackLocations = [
    {
      id: "fallback-1",
      name: "Central Park",
      category: "nature",
      rating: 4.8,
      description: "Beautiful green space in the heart of the city",
      coordinates: { lat: 40.7812, lng: -73.9665 },
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      distance: "0.5 km",
      price: "$$",
      tags: ["park", "green space", "family-friendly"]
    },
    {
      id: "fallback-2",
      name: "Downtown Mall",
      category: "shopping",
      rating: 4.5,
      description: "Premium shopping destination with various stores",
      coordinates: { lat: 40.7589, lng: -73.9851 },
      image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      distance: "1.2 km",
      price: "$$$",
      tags: ["shopping", "mall", "retail"]
    },
    {
      id: "fallback-3",
      name: "City Museum",
      category: "culture",
      rating: 4.7,
      description: "Historical artifacts and contemporary art",
      coordinates: { lat: 40.7614, lng: -73.9776 },
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      distance: "0.8 km",
      price: "$$",
      tags: ["museum", "art", "culture", "education"]
    },
    {
      id: "fallback-4",
      name: "Sunset Beach",
      category: "nature",
      rating: 4.9,
      description: "Perfect spot for sunset viewing",
      coordinates: { lat: 40.7505, lng: -73.9934 },
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      distance: "2.1 km",
      price: "$",
      tags: ["beach", "sunset", "scenic"]
    },
    {
      id: "fallback-5",
      name: "Gourmet Restaurant",
      category: "food",
      rating: 4.6,
      description: "Fine dining with local specialties",
      coordinates: { lat: 40.7505, lng: -73.9857 },
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      distance: "1.5 km",
      price: "$$$$",
      tags: ["restaurant", "fine dining", "gourmet"]
    },
    {
      id: "fallback-6",
      name: "Jazz Club",
      category: "event",
      rating: 4.4,
      description: "Live jazz performances every evening",
      coordinates: { lat: 40.7614, lng: -73.9934 },
      image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      distance: "0.9 km",
      price: "$$",
      tags: ["music", "jazz", "nightlife", "entertainment"]
    }
  ];

  // Fetch locations from the database
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        setError(null); // Reset error state
        
        const queryParams = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'all') {
          queryParams.append('category', selectedCategory);
        }
        if (searchQuery) {
          queryParams.append('search', searchQuery);
        }
        // Add user location for distance calculation if available
        if (userLocation?.lat && userLocation?.lng) {
          queryParams.append('userLat', userLocation.lat);
          queryParams.append('userLng', userLocation.lng);
        }
        
        // Construct the API URL - if VITE_API_BASE_URL includes /api/v1, we need to build the path accordingly
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        // If the base URL already includes /api/v1, we append directly to it
        const apiUrl = baseUrl.includes('/api/v1') ? 
          `${baseUrl}/maps/locations?${queryParams}` : 
          `${baseUrl}/api/v1/maps/locations?${queryParams}`;
          
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (response.ok && result.success) {
          setLocations(result.data.locations);
          setHasFallbackData(false); // Indicate we're using real data
        } else {
          // If API fails, use fallback data
          console.warn('API failed, using fallback data:', result?.message || response.statusText);
          setLocations(fallbackLocations);
          setHasFallbackData(true);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
        // If there's a network error or other exception, use fallback data
        console.warn('Network error, using fallback data');
        setLocations(fallbackLocations);
        setHasFallbackData(true);
      } finally {
        setIsLoading(false);
        setMapLoaded(true);
      }
    };

    // Debounce the API call to avoid too many requests
    const timeoutId = setTimeout(fetchLocations, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedCategory, searchQuery, userLocation]);

  // Get user location effect
  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userPos);
          setMapCenter(userPos); // Center map on user location
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserLocation({ lat: 40.7128, lng: -74.006 }); // Default to NYC
        }
      );
    } else {
      setUserLocation({ lat: 40.7128, lng: -74.006 }); // Default to NYC
    }
  }, []);

  useEffect(() => {
    // Add scroll to selected location card
    if (selectedLocation && locationCardRef.current) {
      locationCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedLocation]);

  const filteredLocations = locations.filter((location) => {
    const matchesCategory =
      selectedCategory === "all" || location.category === selectedCategory;
    const matchesSearch =
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (location.tags && location.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    // Only show highly rated posts (3.5 and above) to ensure more posts are visible
    const isHighlyRated = location.rating >= 3.5;
    return matchesCategory && matchesSearch && isHighlyRated;
  });

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
    setMapCenter(location.coordinates);
    setZoomLevel(15); // Zoom in when clicking a marker
    
    // Update map view if the map is available
    if (mapRef.current) {
      mapRef.current.setView([location.coordinates.lat, location.coordinates.lng], 15);
    }
    // On mobile, if the list is open, you might want to close it to show the map
    if (window.innerWidth < 768) {
      setShowListOnMobile(false);
    }
  };

  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 13);
      setMapCenter(userLocation);
      setZoomLevel(13);
      setSelectedLocation(null);
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      const newZoom = Math.min(mapRef.current.getZoom() + 1, 18);
      mapRef.current.setZoom(newZoom);
      setZoomLevel(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const newZoom = Math.max(mapRef.current.getZoom() - 1, 10);
      mapRef.current.setZoom(newZoom);
      setZoomLevel(newZoom);
    }
  };

  const toggleFavorite = (locationId) => {
    // In a real app, this would update the backend
    console.log(`Toggled favorite for location ${locationId}`);
  };

  const shareLocation = (location) => {
    if (navigator.share) {
      navigator.share({
        title: location.name,
        text: `${location.name} - ${location.description}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `${location.name} - ${location.description}`
      );
      alert("Location link copied to clipboard!");
    }
  };

  const toggleListOnMobile = () => {
    setShowListOnMobile(prevState => !prevState);
  };

  return (
    <>
      <Header />
      <div className="maps-page">
        <div className="maps-header">
          <div className="header-content">
            <h1 className="maps-title">Explore the World</h1>
            <p className="maps-subtitle">Discover amazing places around you</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search for places, cities, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters-container">
            <div className="category-filters">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    className={`category-filter ${
                      selectedCategory === category.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <IconComponent size={16} />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <div className="mobile-toggle-container">
          <button className="mobile-toggle-btn" onClick={toggleListOnMobile}>
            {showListOnMobile ? <><X size={18} /> Close</> : <><List size={18} /> View List</>}
          </button>
        </div>

        {/* Map and List Section */}
        <div className="map-section">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading map...</p>
            </div>
          ) : (
            <>
              {/* Location List - now it can be conditionally displayed on mobile */}
              <div 
                className={`location-list-container ${showListOnMobile ? 'is-visible-mobile' : ''}`}
              >
                <div className="location-list">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((location) => (
                      <div
                        ref={
                          location.id === selectedLocation?.id
                            ? locationCardRef
                            : null
                        }
                        className={`location-card ${mapLoaded ? "loaded" : ""} ${
                          selectedLocation?.id === location.id ? "selected" : ""
                        }`}
                        key={location.id}
                        onClick={() => handleMarkerClick(location)}
                      >
                        <div className="location-image">
                          <img src={location.image || 'https://placehold.co/400x300?text=No+Image'} alt={location.name} />
                          <div className="location-badge">
                            <span className="category-label">
                              {location.category}
                            </span>
                          </div>
                          <div className="location-price">{location.price || '$$'}</div>
                        </div>
                        <div className="location-info">
                          <div className="location-header">
                            <h3>{location.name}</h3>
                            <div className="location-actions">
                              <button
                                className="favorite-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(location.id);
                                }}
                                title="Add to favorites"
                              >
                                <Heart size={18} />
                              </button>
                              <button
                                className="share-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  shareLocation(location);
                                }}
                                title="Share location"
                              >
                                <Share2 size={18} />
                              </button>
                            </div>
                          </div>
                          <p className="location-description">
                            {location.description}
                          </p>

                          <div className="location-tags">
                            {(location.tags || []).slice(0, 3).map((tag) => (
                              <span key={tag} className="tag">
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="location-meta">
                            <div className="rating">
                              <Star
                                className="star-icon"
                                size={16}
                                fill="currentColor"
                              />
                              <span className="rating-value">
                                {location.rating}
                              </span>
                            </div>
                            <div className="distance">
                              <Navigation size={16} />
                              <span>{location.distance || '1.5 km'}</span>
                            </div>
                          </div>
                          <div className="location-actions-bottom">
                            <button className="directions-btn" onClick={(e) => e.stopPropagation()}>
                              <Navigation size={16} />
                              <span>Get Directions</span>
                            </button>
                            <button className="save-btn" onClick={(e) => e.stopPropagation()}>
                              <Bookmark size={16} />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">
                      <MapPin size={48} className="no-results-icon" />
                      <h3>No locations found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Map container */}
              <div className="map-container">
                {hasFallbackData && (
                  <div className="fallback-notice">
                    <p>Displaying sample data. Connect to the internet to see real locations.</p>
                  </div>
                )}
                <MapContainer
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={zoomLevel}
                  style={{ height: "100%", width: "100%" }}
                  className="rounded-xl"
                  whenCreated={(map) => {
                    mapRef.current = map;
                  }}
                  zoomControl={false} // We are using custom controls
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <EnhancedMarkerCluster>
                    {filteredLocations
                      .filter(location => 
                        location.coordinates && 
                        typeof location.coordinates.lat === 'number' && 
                        typeof location.coordinates.lng === 'number' &&
                        !isNaN(location.coordinates.lat) &&
                        !isNaN(location.coordinates.lng)
                      )
                      .map((location) => (
                        <CustomMarker
                          key={location.id}
                          position={[location.coordinates.lat, location.coordinates.lng]}
                          location={location}
                          onClick={handleMarkerClick}
                          isSelected={selectedLocation?.id === location.id}
                        />
                      ))}
                  </EnhancedMarkerCluster>
                </MapContainer>

                {/* Map controls */}
                <div className="map-controls">
                  <button
                    className="map-control-btn"
                    onClick={handleZoomIn}
                    title="Zoom in"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    className="map-control-btn"
                    onClick={handleZoomOut}
                    title="Zoom out"
                  >
                    <Minus size={18} />
                  </button>
                  <button
                    className="map-control-btn"
                    onClick={() =>
                      setMapStyle((prev) =>
                        prev === "default" ? "satellite" : "default"
                      )
                    }
                    title="Toggle map style"
                  >
                    <Layers size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MapsPage;
