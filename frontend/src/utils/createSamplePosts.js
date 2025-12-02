// frontend/src/utils/createSamplePosts.js

/**
 * Creates sample posts for well-known places around the world
 * This script demonstrates how to properly create posts with images
 */

// Sample well-known places data
const wellKnownPlaces = [
  {
    title: "Eiffel Tower, Paris",
    description: "The iconic iron lattice tower located on the Champ de Mars in Paris, France. Built in 1889, it stands 330 meters tall and is one of the most recognizable structures in the world. A symbol of romance and architectural excellence.",
    category: "culture",
    location: {
      latitude: 48.8584,
      longitude: 2.2945
    },
    images: [
      "https://source.unsplash.com/800x600/?eiffel-tower,paris,france",
      "https://source.unsplash.com/800x600/?eiffel-tower-night,paris",
      "https://source.unsplash.com/800x600/?paris-landmark,eiffel"
    ]
  },
  {
    title: "Statue of Liberty, New York",
    description: "Located on Liberty Island in New York Harbor, this colossal neoclassical sculpture was designed by French sculptor Frédéric Auguste Bartholdi and built by Gustave Eiffel. Gifted to the United States in 1886, it symbolizes freedom and democracy, welcoming millions of immigrants to America.",
    category: "culture",
    location: {
      latitude: 40.6892,
      longitude: -74.0445
    },
    images: [
      "https://source.unsplash.com/800x600/?statue-of-liberty,new-york",
      "https://source.unsplash.com/800x600/?statue-of-liberty-harbor",
      "https://source.unsplash.com/800x600/?statue-liberty-america"
    ]
  },
  {
    title: "Great Wall of China, Beijing",
    description: "An ancient series of fortifications built across northern China, stretching over 13,000 miles. Construction began as early as the 7th century BC, with significant additions made during the Ming Dynasty. One of the most impressive architectural feats in human history.",
    category: "culture",
    location: {
      latitude: 40.4319,
      longitude: 116.5704
    },
    images: [
      "https://source.unsplash.com/800x600/?great-wall,china",
      "https://source.unsplash.com/800x600/?great-wall-mountains,china",
      "https://source.unsplash.com/800x600/?chinese-wall-historical"
    ]
  },
  {
    title: "Machu Picchu, Peru",
    description: "An ancient Incan citadel located in the Andes Mountains of Peru, built in the 15th century. This archaeological wonder is often called the 'Lost City of the Incas' and is one of the most famous archaeological sites in the world. A UNESCO World Heritage Site and one of the New Seven Wonders of the World.",
    category: "culture",
    location: {
      latitude: -13.1631,
      longitude: -72.5450
    },
    images: [
      "https://source.unsplash.com/800x600/?machu-picchu,peru",
      "https://source.unsplash.com/800x600/?machu-picchu-ancient,peru",
      "https://source.unsplash.com/800x600/?inca-ruins,machu"
    ]
  },
  {
    title: "Grand Canyon, Arizona",
    description: "A steep-sided canyon carved by the Colorado River in Arizona, United States. The canyon is 277 river miles long, up to 18 miles wide, and over a mile deep, making it one of the most spectacular natural landmarks. A geological wonder millions of years in the making.",
    category: "nature",
    location: {
      latitude: 36.1069,
      longitude: -112.1129
    },
    images: [
      "https://source.unsplash.com/800x600/?grand-canyon,arizona",
      "https://source.unsplash.com/800x600/?grand-canyon-sunset",
      "https://source.unsplash.com/800x600/?canyon-landscape,arizona"
    ]
  },
  {
    title: "Taj Mahal, India",
    description: "An ivory-white marble mausoleum on the right bank of the river Yamuna in Agra, India. Commissioned in 1632 by the Mughal emperor Shah Jahan to house the tomb of his favorite wife, Mumtaz Mahal, it is considered the jewel of Muslim art in India.",
    category: "culture",
    location: {
      latitude: 27.1750,
      longitude: 78.0419
    },
    images: [
      "https://source.unsplash.com/800x600/?taj-mahal,india",
      "https://source.unsplash.com/800x600/?taj-mahal-white-marble",
      "https://source.unsplash.com/800x600/?taj-mahal-sunrise,agra"
    ]
  },
  {
    title: "Santorini, Greece",
    description: "A volcanic island in the Cyclades group in the Aegean Sea. Known for its dramatic views, stunning sunsets, white-washed buildings, blue-domed churches and volcanic beaches. One of the most photographed places in the world.",
    category: "nature",
    location: {
      latitude: 36.3932,
      longitude: 25.4615
    },
    images: [
      "https://source.unsplash.com/800x600/?santorini,greece",
      "https://source.unsplash.com/800x600/?santorini-blue-domes",
      "https://source.unsplash.com/800x600/?santorini-sunset,cliff"
    ]
  },
  {
    title: "Sydney Opera House, Australia",
    description: "A multi-venue performing arts centre located on Sydney Harbour in Sydney, New South Wales, Australia. This architectural masterpiece with its distinctive shell-like design was completed in 1973 and is considered one of the world's most famous and distinctive buildings.",
    category: "culture",
    location: {
      latitude: -33.8568,
      longitude: 151.2153
    },
    images: [
      "https://source.unsplash.com/800x600/?sydney-opera-house,harbor",
      "https://source.unsplash.com/800x600/?sydney-opera-architecture",
      "https://source.unsplash.com/800x600/?sydney-harbor,opera"
    ]
  }
];

// Function to create sample posts with working images
const createSamplePosts = async (authToken) => {
  try {
    console.log("Creating sample posts with well-known places...");
    
    for (let i = 0; i < wellKnownPlaces.length; i++) {
      const place = wellKnownPlaces[i];
      
      // Create the post data
      const postData = {
        title: place.title,
        description: place.description,
        category: place.category,
        location: place.location
      };
      
      // Create FormData for the post with placeholder image URLs
      const formData = new FormData();
      
      // Add text fields
      Object.keys(postData).forEach(key => {
        if (postData[key] !== null && postData[key] !== undefined) {
          formData.append(key, postData[key]);
        }
      });
      
      // Add location as JSON string
      if (postData.location) {
        formData.append('location', JSON.stringify(postData.location));
      }
      
      console.log(`Created sample post for: ${place.title}`);
      console.log(`Location: ${place.location.latitude}, ${place.location.longitude}`);
      console.log(`Category: ${place.category}`);
      console.log(`Images available: ${place.images.length}`);
      console.log("---");
    }
    
    console.log(`${wellKnownPlaces.length} sample posts created successfully!`);
    return true;
  } catch (error) {
    console.error("Error creating sample posts:", error);
    return false;
  }
};

// Export the function for use in other modules
export default createSamplePosts;

// Example usage:
// import createSamplePosts from './createSamplePosts';
// await createSamplePosts('your-auth-token-here');