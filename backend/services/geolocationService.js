const axios = require('axios');

// Service to integrate with external geolocation APIs for enhanced global search
class GeolocationService {
  constructor() {
    // Use OpenStreetMap Nominatim as the primary geocoding service
    // It's free and has good global coverage
    this.nominatimUrl = 'https://nominatim.openstreetmap.org';
  }

  // Search for locations globally using OpenStreetMap
  async searchLocations(query) {
    try {
      // Make sure query is valid
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return [];
      }
      
      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params: {
          q: query.trim(),
          format: 'json',
          limit: 10,
          addressdetails: 1,
          extratags: 1,
          namedetails: 1
        },
        headers: {
          'User-Agent': 'PinQuest/1.0 (contact your app developers for issues)'
        },
        timeout: 5000 // 5 second timeout
      });

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      // Process and format the results
      return response.data.map(location => {
        // Validate required fields exist before processing
        if (!location.lat || !location.lon) {
          return null; // Skip invalid locations
        }
        
        return {
          name: location.display_name || location.namedetails?.name || location.name || query,
          address: location.address,
          type: location.type,
          category: location.category,
          coordinates: {
            latitude: parseFloat(location.lat),
            longitude: parseFloat(location.lon)
          },
          bbox: location.boundingbox ? [
            parseFloat(location.boundingbox[0]), // south
            parseFloat(location.boundingbox[2]), // north
            parseFloat(location.boundingbox[1]), // west
            parseFloat(location.boundingbox[3])  // east
          ] : null,
          relevance: parseFloat(location.importance) || 0
        };
      }).filter(location => location !== null); // Remove any null entries
      
    } catch (error) {
      console.error('Geolocation search error:', error.message);
      // Return empty array on error to not break the search functionality
      return [];
    }
  }

  // Reverse geocode coordinates to location details
  async reverseGeocode(lat, lon) {
    try {
      const response = await axios.get(`${this.nominatimUrl}/reverse`, {
        params: {
          lat: lat,
          lon: lon,
          format: 'json',
          addressdetails: 1,
          extratags: 1,
          namedetails: 1
        },
        headers: {
          'User-Agent': 'PinQuest/1.0 (contact your app developers for issues)'
        }
      });

      return {
        name: response.data.display_name,
        address: response.data.address,
        type: response.data.type,
        category: response.data.category,
        coordinates: {
          latitude: parseFloat(response.data.lat),
          longitude: parseFloat(response.data.lon)
        }
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error.message);
      return null;
    }
  }

  // Get location details by coordinates for validation
  async getLocationByCoordinates(lat, lon) {
    return await this.reverseGeocode(lat, lon);
  }
}

module.exports = new GeolocationService();