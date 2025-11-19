import L from "leaflet";

// Function to create a clean, modern SVG pin marker and return a divIcon
const createModernMarker = (options = {}) => {
  const {
    color = "#4F46E5",
    size = 36,
    borderColor = "#FFFFFF",
    borderWidth = 2,
    opacity = 1,
  } = options;

  // Simple modern pin SVG: circular head with subtle gradient and a tapered tail
  const headRadius = Math.floor(size * 0.42);
  const width = Math.floor(size * 0.7);
  const height = size;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${lightenColor(color, 8)}" stop-opacity="${opacity}" />
          <stop offset="100%" stop-color="${darkenColor(color, 12)}" stop-opacity="${opacity}" />
        </linearGradient>
        <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.22" />
        </filter>
      </defs>
      <g filter="url(#s)">
        <!-- tail -->
        <path d="M ${width/2 - width*0.12} ${headRadius + 6} C ${width/2 - width*0.16} ${height - 8}, ${width/2 + width*0.16} ${height - 8}, ${width/2 + width*0.12} ${headRadius + 6} L ${width/2} ${height - 2} Z" fill="url(#g)" />
        <!-- head -->
        <circle cx="${width/2}" cy="${headRadius}" r="${headRadius}" fill="url(#g)" stroke="${borderColor}" stroke-width="${borderWidth}" />
        <!-- inner glossy highlight -->
        <ellipse cx="${width/2 - headRadius*0.25}" cy="${headRadius - headRadius*0.25}" rx="${headRadius*0.4}" ry="${headRadius*0.25}" fill="rgba(255,255,255,0.55)" />
      </g>
    </svg>
  `;

  const iconSize = [width, height];
  const iconAnchor = [Math.round(width / 2), height];

  return L.divIcon({
    className: "custom-map-marker",
    html: svg,
    iconSize,
    iconAnchor,
    popupAnchor: [0, -Math.round(height * 0.85)],
  });
};

// Helper function to darken a color
const darkenColor = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor(R * (100 - percent) / 100);
  G = Math.floor(G * (100 - percent) / 100);
  B = Math.floor(B * (100 - percent) / 100);

  return `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`;
};

// Helper function to lighten a color
const lightenColor = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.min(255, Math.floor(R + (255 - R) * percent / 100));
  G = Math.min(255, Math.floor(G + (255 - G) * percent / 100));
  B = Math.min(255, Math.floor(B + (255 - B) * percent / 100));

  return `#${R.toString(16).padStart(2, '0')}${G.toString(16).padStart(2, '0')}${B.toString(16).padStart(2, '0')}`;
};

// Predefined color schemes for different categories
const categoryColors = {
  nature: "#10B981",     // Emerald green
  culture: "#F59E0B",    // Amber
  shopping: "#8B5CF6",   // Violet
  food: "#EF4444",       // Red
  event: "#EC4899",      // Pink
  general: "#4F46E5",    // Indigo
  poi: "#14B8A6",        // Teal
  user: "#F97316",       // Orange
};

// Function to get a marker based on category
// Return Leaflet's default icon (regular pin) to keep the standard
// marker appearance as requested.
const getMarkerByCategory = (category = 'general') => {
  return new L.Icon.Default();
};

// (Removed unused helper to reduce lint noise)

// Specialized function for user location marker
// Use the default Leaflet marker so user location uses the regular pin
const createUserLocationMarker = () => {
  return new L.Icon.Default();
};

// Function to create a marker specifically for POIs
const createPOIMarker = (poiType) => {
  const typeColors = {
    restaurant: "#DC2626",  // Red
    cafe: "#D97706",       // Amber
    hotel: "#7C3AED",      // Purple
    shop: "#BE185D",       // Pink
    park: "#059669",       // Green
    museum: "#0891B2",     // Cyan
    bank: "#374151",       // Gray
    hospital: "#EF4444",   // Red
    pharmacy: "#8B5CF6",   // Violet
    school: "#F59E0B",     // Amber
    university: "#F59E0B", // Amber
    library: "#64748B",    // Slate
    church: "#6B7280",     // Gray
    fuel: "#6366F1",       // Indigo
    post_office: "#A855F7",// Purple
    police: "#3B82F6",     // Blue
    fire_station: "#F97316",// Orange
    theatre: "#EC4899",    // Pink
    cinema: "#6366F1",     // Indigo
    bar: "#7E22CE",        // Purple
    pub: "#7E22CE",        // Purple
    fast_food: "#DC2626",  // Red
    supermarket: "#059669",// Green
    marketplace: "#F59E0B",// Amber
    attraction: "#EC4899", // Pink
    tourism: "#EC4899",    // Pink
    monument: "#6B7280",   // Gray
    gallery: "#EC4899",    // Pink
    stadium: "#059669",    // Green
    zoo: "#059669",        // Green
    parking: "#64748B",    // Slate
    toilets: "#0891B2",    // Cyan
    information: "#3B82F6",// Blue
    viewpoint: "#EC4899",  // Pink
  };

  const color = typeColors[poiType] || "#4F46E5";  // Default to indigo

  // Use default Leaflet marker for POIs (regular pin)
  return new L.Icon.Default();
};

export {
  createModernMarker,
  getMarkerByCategory,
  createUserLocationMarker,
  createPOIMarker,
  categoryColors,
};