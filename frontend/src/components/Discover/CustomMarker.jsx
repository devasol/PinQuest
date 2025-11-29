import React, { useRef, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getMarkerByCategory } from './CustomMapMarkers';
import OptimizedImage from "../OptimizedImage";
import RatingsAndComments from "../RatingsAndComments.jsx";

// Helper function to get the correct image URL
const getServerBaseUrl = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
  // Remove the /api/v1 part to get the base server URL
  return API_BASE_URL.replace("/api/v1", "");
};

const getImageUrl = (imageObj) => {
  if (!imageObj) return "";
  const serverBaseUrl = getServerBaseUrl();
  if (typeof imageObj === "string") {
    return imageObj.startsWith("http")
      ? imageObj
      : `${serverBaseUrl}${imageObj}`;
  }
  if (imageObj.url) {
    return imageObj.url.startsWith("http")
      ? imageObj.url
      : `${serverBaseUrl}${imageObj.url}`;
  }
  return "";
};

// Format date function
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// CustomMarker component
const CustomMarker = ({ 
  location, 
  onClick, 
  isSelected = false, 
  onAddToRef = null,
  onRemoveFromRef = null,
  activePopup = null,
  onPopupOpen = null,
  onPopupClose = null,
  mapRef = null,
  showRouting = false,
  setShowRouting = null,
  setRoutingStart = null,
  setRoutingEnd = null,
  travelMode = "driving",
  setTravelMode = null,
  getDirections = null,
  savedLocations = [],
  saveLocation = null,
  removeSavedLocation = null,
  isSavingLocation = false,
  addRecentLocation = null,
  user = null,
  isAuthenticated = false,
  icon = null
}) => {
  // Ref to store marker instance
  const markerRef = useRef(null);

  // Effect to add marker ref to parent component
  useEffect(() => {
    if (markerRef.current) {
      if (onAddToRef) {
        onAddToRef(location.id, markerRef.current);
      }
    }
    return () => {
      if (onRemoveFromRef) {
        onRemoveFromRef(location.id);
      }
    };
  }, [location.id, onAddToRef, onRemoveFromRef]);

  // Handle popup opening
  const handlePopupOpen = () => {
    if (onPopupOpen) {
      onPopupOpen(location.id);
    }
    if (addRecentLocation) {
      addRecentLocation(location);
    }
  };

  // Handle popup closing
  const handlePopupClose = () => {
    if (onPopupClose) {
      onPopupClose(location.id);
    }
  };

  // Ensure we always have a valid icon - if not provided, create default pin
  const markerIcon = icon || getMarkerByCategory(location.category || "general", location.averageRating);

  return (
    <Marker
      position={location.position}
      icon={markerIcon}
      eventHandlers={{
        click: (e) => {
          e.target.openPopup(); // This ensures the popup opens when marker is clicked
          if (onClick) {
            onClick(location.id);
          }
        },
      }}
      ref={markerRef}
    >
      <Popup
        className="custom-popup"
        onOpen={handlePopupOpen}
        onClose={handlePopupClose}
      >
        <div
          className="p-6 w-[90vw] max-w-[760px] relative bg-white rounded-xl shadow-xl border border-gray-100"
          style={{
            fontFamily:
              "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
          }}
          onMouseDown={(e) => {
            // If user clicks on the background area (not a button), allow map to be draggable
            if (e.target === e.currentTarget) {
              // Allow the map to continue handling drag events
              e.stopPropagation();
            }
          }}
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: image / carousel */}
            <div className="w-full lg:w-1/2 flex-shrink-0">
              {location.images && location.images.length > 0 ? (
                <div className="rounded-lg overflow-hidden shadow-sm">
                  <div className="w-full h-48 rounded-lg mb-4 overflow-hidden">
                    <OptimizedImage
                      src={getImageUrl(location.images[0])}
                      alt={location.title}
                      className="w-full h-full object-cover rounded-lg"
                      priority={activePopup === location.id}
                    />
                  </div>
                </div>
              ) : (location.image &&
                  typeof location.image === "string") ||
                (location.image && location.image.url) ? (
                <div className="rounded-lg overflow-hidden shadow-sm">
                  <div className="w-full h-48 rounded-lg mb-4 overflow-hidden">
                    <OptimizedImage
                      src={getImageUrl(location.image)}
                      alt={location.title}
                      priority={activePopup === location.id}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 rounded-lg bg-gray-50" />
              )}
            </div>

            {/* Right: details */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-2xl text-gray-900">
                    {location.title}
                  </h3>
                  <p className="text-gray-600 mt-1 text-sm">
                    {location.description}
                  </p>
                </div>
                <div className="hidden lg:block">
                  <button
                    className="p-2 rounded-full bg-white border border-gray-100 shadow-sm text-gray-600 hover:shadow-md transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mapRef && mapRef.current) mapRef.current.closePopup();
                      if (showRouting) {
                        setShowRouting(false);
                        setRoutingStart(null);
                        setRoutingEnd(null);
                      }
                    }}
                    title={showRouting ? "Close Direction" : "Close"}
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <div className="font-medium text-gray-800">
                    Posted by
                  </div>
                  <div className="mt-1">
                    {location.postedBy || 
                      (location.postedBy && typeof location.postedBy === 'object' ? 
                        location.postedBy.name || location.postedBy.displayName || 'Unknown' : 
                        location.postedBy) || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800">
                    Category
                  </div>
                  <div className="mt-1 capitalize">
                    {location.category || 'general'}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800">
                    Date
                  </div>
                  <div className="mt-1">
                    {formatDate(location.datePosted || new Date().toISOString())}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800">
                    Ratings
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-indigo-600 font-semibold">
                      {location.averageRating !== undefined && 
                      location.totalRatings !== undefined &&
                      location.totalRatings > 0
                        ? Number(location.averageRating).toFixed(1)
                        : "—"}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({location.totalRatings || 0})
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {isAuthenticated ? (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setTravelMode) setTravelMode("driving");
                        if (getDirections) getDirections(location.position);
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4"
                        />
                      </svg>
                      Get Directions
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-green-600 hover:bg-green-50 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setTravelMode) setTravelMode("walking");
                        if (getDirections) getDirections(location.position);
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Walking
                    </button>
                    <button
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 transition-colors duration-200 ${
                        savedLocations.some((s) => s.id === location.id)
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const isAlreadySaved = savedLocations.some(
                          (s) => s.id === location.id
                        );
                        if (!isAlreadySaved) {
                          if (saveLocation) saveLocation(location);
                        } else {
                          if (removeSavedLocation) removeSavedLocation(location.id);
                        }
                      }}
                      disabled={isSavingLocation}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                      {savedLocations.some((s) => s.id === location.id) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button className="w-full text-sm py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                    View Details
                  </button>
                )}
              </div>

              {/* Ratings & Comments section inside the popup */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-yellow-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Ratings & Comments
                </h4>
                <RatingsAndComments
                  postId={location.id}
                  isAuthenticated={isAuthenticated}
                  user={user}
                />
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default CustomMarker;