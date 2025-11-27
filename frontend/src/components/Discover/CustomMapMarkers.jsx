import L from "leaflet";
import "./CustomMapMarkers.css";

// Function to create a classic pin marker using an SVG string
const createPinMarker = (options = {}) => {
  const {
    className = "",
    size = 40,
  } = options;

  const iconSize = [size, size];
  const iconAnchor = [size / 2, size];
  const popupAnchor = [0, -size];

  // Create SVG as a data URL to ensure it's always available
  // The fill will be controlled by CSS classes
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>`;
  
  const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;

  return L.icon({
    iconUrl: svgDataUrl,
    iconSize,
    iconAnchor,
    popupAnchor,
    className: `custom-map-marker ${className}`,
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
const getMarkerByCategory = (category = "general", averageRating = null) => {
  if (typeof averageRating === "number" && !isNaN(averageRating)) {
    let colorClass = "marker-red"; // default
    const roundedRating = Number(averageRating.toFixed(1));
    if (roundedRating >= 4.0) colorClass = "marker-green";
    else if (roundedRating >= 3.0) colorClass = "marker-amber";
    else if (roundedRating >= 2.0) colorClass = "marker-orange";

    return createPinMarker({ className: colorClass });
  }

  const className = categoryColors[category] || "marker-indigo";
  return createPinMarker({ className });
};

// Creates a colored marker for custom purposes
const createColoredMarker = (color = "indigo", size = 40) => {
  return createPinMarker({ className: `marker-${color}`, size });
};

// Specialized function for user location marker
const createUserLocationMarker = () => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <defs>
        <radialGradient id="redGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stop-color="#F87171" />
          <stop offset="100%" stop-color="#DC2626" />
        </radialGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3" />
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <!-- Outer ring -->
        <circle cx="16" cy="16" r="15" fill="white" stroke="#DC2626" stroke-width="2"/>
        <!-- Inner red circle -->
        <circle cx="16" cy="16" r="12" fill="url(#redGradient)" />
        <!-- Center dot -->
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

// Function to create a marker specifically for POIs
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