// This script creates sample posts with well-known places around the world
// It would be run on the backend to create the posts

// Sample well-known places data
const wellKnownPlaces = [
  {
    title: "Eiffel Tower",
    description: "The iconic iron lattice tower located on the Champ de Mars in Paris, France. Built in 1889, it stands 330 meters tall and is one of the most recognizable structures in the world.",
    location: {
      latitude: 48.8584,
      longitude: 2.2945
    },
    category: "culture"
  },
  {
    title: "Statue of Liberty",
    description: "Located on Liberty Island in New York Harbor, this colossal neoclassical sculpture was designed by French sculptor Frédéric Auguste Bartholdi and built by Gustave Eiffel. Gifted to the United States in 1886, it symbolizes freedom and democracy.",
    location: {
      latitude: 40.6892,
      longitude: -74.0445
    },
    category: "culture"
  },
  {
    title: "Great Wall of China",
    description: "An ancient series of fortifications built across northern China, stretching over 13,000 miles. Construction began as early as the 7th century BC, with significant additions made during the Ming Dynasty.",
    location: {
      latitude: 40.4319,
      longitude: 116.5704
    },
    category: "culture"
  },
  {
    title: "Machu Picchu",
    description: "An ancient Incan citadel located in the Andes Mountains of Peru, built in the 15th century. This archaeological wonder is often called the 'Lost City of the Incas' and is one of the most famous archaeological sites in the world.",
    location: {
      latitude: -13.1631,
      longitude: -72.5450
    },
    category: "culture"
  },
  {
    title: "Grand Canyon",
    description: "A steep-sided canyon carved by the Colorado River in Arizona, United States. The canyon is 277 river miles long, up to 18 miles wide, and over a mile deep, making it one of the most spectacular natural landmarks.",
    location: {
      latitude: 36.1069,
      longitude: -112.1129
    },
    category: "nature"
  }
];

// Function to create posts with placeholder images
async function createWellKnownPlacePosts() {
  // This would typically be run in a Node.js script after connecting to the database
  const Post = require('./backend/models/posts');
  
  for (const place of wellKnownPlaces) {
    try {
      // Create a new post with placeholder image URLs
      const post = new Post({
        title: place.title,
        description: place.description,
        // Using placeholder images from a reliable service
        image: {
          url: `https://source.unsplash.com/800x600/?landmark,${place.title.replace(/\s+/g, '')}`,
          publicId: null
        },
        images: [
          {
            url: `https://source.unsplash.com/800x600/?landmark,${place.title.replace(/\s+/g, '')}`,
            publicId: null
          }
        ],
        postedBy: null, // This would be set to an actual user ID
        category: place.category,
        location: {
          type: "Point",
          coordinates: [place.location.longitude, place.location.latitude] // GeoJSON format
        },
        status: 'published'
      });

      await post.save();
      console.log(`Created post for: ${place.title}`);
    } catch (error) {
      console.error(`Error creating post for ${place.title}:`, error);
    }
  }
}

// Alternative: If you want to test with existing images that are already in the system
// or if you want to manually create a post through the API using curl or a similar tool:

/*
# Example curl command to create a post with title, description, and location
curl -X POST http://localhost:5000/api/v1/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Eiffel Tower",
    "description": "The iconic iron lattice tower located on the Champ de Mars in Paris, France. Built in 1889, it stands 330 meters tall and is one of the most recognizable structures in the world.",
    "category": "culture",
    "location": {
      "latitude": 48.8584,
      "longitude": 2.2945
    }
  }'
*/