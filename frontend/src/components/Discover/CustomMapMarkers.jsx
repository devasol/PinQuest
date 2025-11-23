import L from "leaflet";

// Function to create a classic pin SVG marker and return a divIcon
const createPinMarker = (options = {}) => {
  const {
    color = "#4F46E5",
    size = 40,
    opacity = 1,
  } = options;

  const width = size;
  const height = size;
  
  // Classic pin shape SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <radialGradient id="pinGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="${lightenColor(color, 20)}" stop-opacity="${opacity}" />
          <stop offset="100%" stop-color="${darkenColor(color, 15)}" stop-opacity="${opacity}" />
        </radialGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3" />
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <!-- Pin body (circle) -->
        <circle cx="${width / 2}" cy="${size * 0.35}" r="${size * 0.3}" fill="url(#pinGradient)" stroke="white" stroke-width="1.5" />
        <!-- Pin stem -->
        <path d="M${width / 2} ${size * 0.65} L${width / 2} ${size * 0.95}" 
              stroke="${darkenColor(color, 20)}" stroke-width="2" stroke-linecap="round" />
        <!-- Pin bottom point -->
        <path d="M${width / 2 - size * 0.1} ${size * 0.95} L${width / 2} ${size * 1.0} L${width / 2 + size * 0.1} ${size * 0.95}" 
              fill="${darkenColor(color, 20)}" />
      </g>
    </svg>
  `;

  const iconSize = [width, height];
  const iconAnchor = [Math.round(width / 2), height]; // Anchor at bottom point of pin
  const popupAnchor = [0, -Math.round(height * 0.7)]; // Position popup near the top

  return L.divIcon({
    className: "custom-map-marker",
    html: svg,
    iconSize,
    iconAnchor,
    popupAnchor,
  });
};

// Helper function to darken a color
const darkenColor = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor((R * (100 - percent)) / 100);
  G = Math.floor((G * (100 - percent)) / 100);
  B = Math.floor((B * (100 - percent)) / 100);

  return `#${R.toString(16).padStart(2, "0")}${G.toString(16).padStart(
    2,
    "0"
  )}${B.toString(16).padStart(2, "0")}`;
};

// Helper function to lighten a color
const lightenColor = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.min(255, Math.floor(R + ((255 - R) * percent) / 100));
  G = Math.min(255, Math.floor(G + ((255 - G) * percent) / 100));
  B = Math.min(255, Math.floor(B + ((255 - B) * percent) / 100));

  return `#${R.toString(16).padStart(2, "0")}${G.toString(16).padStart(
    2,
    "0"
  )}${B.toString(16).padStart(2, "0")}`;
};

// Predefined color schemes for different categories
const categoryColors = {
  nature: "#10B981", // Emerald green
  culture: "#F59E0B", // Amber
  shopping: "#8B5CF6", // Violet
  food: "#EF4444", // Red
  event: "#EC4899", // Pink
  general: "#4F46E5", // Indigo
  poi: "#14B8A6", // Teal
  user: "#F97316", // Orange
};

// Function to get a marker based on category and optional average rating
// If an average rating is provided, color the pin according to the rating
// (green for good ratings, amber/orange for mid, red for low). Falls back
// to a category-based color when rating is not available.
const getMarkerByCategory = (category = "general", averageRating = null) => {
  // If a numeric averageRating is provided use it to pick a color
  if (typeof averageRating === "number" && !isNaN(averageRating)) {
    let color = "#EF4444"; // red default
    if (averageRating >= 4.0) color = "#10B981"; // green
    else if (averageRating >= 3.0) color = "#F59E0B"; // amber
    else if (averageRating >= 2.0) color = "#F97316"; // orange

    return createPinMarker({ color });
  }

  // No rating available — fall back to category color using pin marker
  const color = categoryColors[category] || "#4F46E5";
  return createPinMarker({ color });
};

// (Removed unused helper to reduce lint noise)

// Specialized function for user location marker
// Create a red circular marker for user's current location
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
    restaurant: "#DC2626", // Red
    cafe: "#D97706", // Amber
    hotel: "#7C3AED", // Purple
    shop: "#BE185D", // Pink
    park: "#059669", // Green
    museum: "#0891B2", // Cyan
    bank: "#374151", // Gray
    hospital: "#EF4444", // Red
    pharmacy: "#8B5CF6", // Violet
    school: "#F59E0B", // Amber
    university: "#F59E0B", // Amber
    library: "#64748B", // Slate
    church: "#6B7280", // Gray
    fuel: "#6366F1", // Indigo
    post_office: "#A855F7", // Purple
    police: "#3B82F6", // Blue
    fire_station: "#F97316", // Orange
    theatre: "#EC4899", // Pink
    cinema: "#6366F1", // Indigo
    bar: "#7E22CE", // Purple
    pub: "#7E22CE", // Purple
    fast_food: "#DC2626", // Red
    supermarket: "#059669", // Green
    marketplace: "#F59E0B", // Amber
    attraction: "#EC4899", // Pink
    tourism: "#EC4899", // Pink
    monument: "#6B7280", // Gray
    gallery: "#EC4899", // Pink
    stadium: "#059669", // Green
    zoo: "#059669", // Green
    parking: "#64748B", // Slate
    toilets: "#0891B2", // Cyan
    information: "#3B82F6", // Blue
    viewpoint: "#EC4899", // Pink
  };

  const color = typeColors[poiType] || "#4F46E5"; // Default to indigo

  // Use default Leaflet marker for POIs (regular pin)
  return new L.Icon.Default();
};

export {
  createPinMarker,
  getMarkerByCategory,
  createUserLocationMarker,
  createPOIMarker,
  categoryColors,
};
