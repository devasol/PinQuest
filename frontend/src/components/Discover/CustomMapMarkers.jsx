import L from "leaflet";
import "./CustomMapMarkers.css";

// Function to create a classic pin marker using an SVG string
const createPinMarker = (options = {}) => {
  const { className = "", size = 40 } = options;

  const iconSize = [size, size];
  const iconAnchor = [size / 2, size];
  const popupAnchor = [0, -size];

  // SVG string with inline fill based on class
  // Define colors based on className
  // Use indigo as fallback.
  const colorMap = {
    'marker-green': '#10b981',
    'marker-amber': '#f59e0b',
    'marker-violet': '#8b5cf6',
    'marker-red': '#ef4444',
    'marker-pink': '#ec4899',
    'marker-indigo': '#4f46e5',
    'marker-teal': '#14b8a6',
    'marker-orange': '#f97316',
    'marker-purple': '#7e22ce',
    'marker-cyan': '#0891b2',
    'marker-gray': '#6b7280',
    'marker-slate': '#64748b',
    'marker-blue': '#3b82f6',
  };
  // Always use a mapped color, never black.
  const resolvedClass = colorMap[className] ? className : 'marker-indigo';
  const fillColor = colorMap[resolvedClass];
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="display:block; pointer-events:none;">
    <path fill="${fillColor}" stroke="white" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    <circle fill="white" cx="12" cy="9" r="2.5"/>
  </svg>`;
  return L.divIcon({
    className: `custom-map-marker ${resolvedClass}`,
    html: svgString,
    iconSize,
    iconAnchor,
    popupAnchor,
    zIndexOffset: 1000
  });
};

// Predefined color schemes for different categories
const categoryColors = {
  nature: "marker-green",
  culture: "marker-amber",
  shopping: "marker-violet",
  food: "marker-red",
  event: "marker-pink",
  general: "marker-indigo",
  poi: "marker-teal",
  user: "marker-orange",
};

// Function to get a marker based on category and optional average rating
// ALWAYS returns a valid custom pin marker - never null/undefined
const getMarkerByCategory = (category = "general", averageRating = null) => {
  // Normalize category to string and lowercase
  const normalizedCategory = String(category || "general").toLowerCase().trim();
  
  // If we have a valid rating, use rating-based color
  if (typeof averageRating === "number" && !isNaN(averageRating) && averageRating > 0) {
    let colorClass = "marker-red";
    const roundedRating = Number(averageRating.toFixed(1));

    if (roundedRating >= 4.0) colorClass = "marker-green";
    else if (roundedRating >= 3.0) colorClass = "marker-amber";
    else if (roundedRating >= 2.0) colorClass = "marker-orange";

    return createPinMarker({ className: colorClass });
  }

  // Use category-based color, default to indigo if category not found
  const className = categoryColors[normalizedCategory] || "marker-indigo";
  return createPinMarker({ className });
};

// Creates a colored marker for custom purposes
const createColoredMarker = (color = "indigo", size = 40) => {
  return createPinMarker({ className: `marker-${color}`, size });
};

// User Location Marker
const createUserLocationMarker = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <defs>
        <radialGradient id="redGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#F87171" />
          <stop offset="100%" stop-color="#DC2626" />
        </radialGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3" />
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="16" cy="16" r="15" fill="white" stroke="#DC2626" stroke-width="2"/>
        <circle cx="16" cy="16" r="12" fill="url(#redGradient)" />
        <circle cx="16" cy="16" r="4" fill="white" />
      </g>
    </svg>
  `;

  return L.divIcon({
    className: "custom-user-location-marker",
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// POI Marker
const createPOIMarker = (poiType) => {
  const typeColors = {
    restaurant: "marker-red",
    cafe: "marker-amber",
    hotel: "marker-purple",
    shop: "marker-pink",
    park: "marker-green",
    museum: "marker-cyan",
    bank: "marker-gray",
    hospital: "marker-red",
    pharmacy: "marker-violet",
    school: "marker-amber",
    university: "marker-amber",
    library: "marker-slate",
    church: "marker-gray",
    fuel: "marker-indigo",
    post_office: "marker-purple",
    police: "marker-blue",
    fire_station: "marker-orange",
    theatre: "marker-pink",
    cinema: "marker-indigo",
    bar: "marker-purple",
    pub: "marker-purple",
    fast_food: "marker-red",
    supermarket: "marker-green",
    marketplace: "marker-amber",
    attraction: "marker-pink",
    tourism: "marker-pink",
    monument: "marker-gray",
    gallery: "marker-pink",
    stadium: "marker-green",
    zoo: "marker-green",
    parking: "marker-slate",
    toilets: "marker-cyan",
    information: "marker-blue",
    viewpoint: "marker-pink",
  };

  const className = typeColors[poiType] || "marker-indigo";
  return createPinMarker({ className, size: 32 });
};

export {
  createPinMarker,
  getMarkerByCategory,
  createColoredMarker,
  createUserLocationMarker,
  createPOIMarker,
  categoryColors,
};
