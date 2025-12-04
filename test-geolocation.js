const geolocationService = require('./backend/services/geolocationService');

async function testSearch() {
  try {
    console.log('Testing search for "Germany"...');
    const results = await geolocationService.searchLocations('Germany');
    console.log('Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testSearch();