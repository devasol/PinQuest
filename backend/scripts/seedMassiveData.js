const mongoose = require('mongoose');
const Post = require('../models/posts');

require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL || process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://dlms:devasol123@ac-hpfowr3-shard-00-00.xla3ike.mongodb.net:27017,ac-hpfowr3-shard-00-01.xla3ike.mongodb.net:27017,ac-hpfowr3-shard-00-02.xla3ike.mongodb.net:27017/pin_quest?replicaSet=atlas-f0h39e-shard-0&ssl=true&authSource=admin");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const ethiopianLocations = [
  { city: "Addis Ababa", lat: 9.03, lng: 38.74 },
  { city: "Lalibela", lat: 12.03, lng: 39.04 },
  { city: "Gondar", lat: 12.60, lng: 37.46 },
  { city: "Bahir Dar", lat: 11.59, lng: 37.39 },
  { city: "Hawassa", lat: 7.05, lng: 38.47 },
  { city: "Mekelle", lat: 13.49, lng: 39.47 },
  { city: "Dire Dawa", lat: 9.60, lng: 41.86 },
  { city: "Harar", lat: 9.31, lng: 42.13 },
  { city: "Axum", lat: 14.13, lng: 38.72 },
  { city: "Jimma", lat: 7.66, lng: 36.83 },
  { city: "Bishoftu", lat: 8.75, lng: 38.98 },
  { city: "Arba Minch", lat: 6.03, lng: 37.55 },
  { city: "Dessie", lat: 11.13, lng: 39.63 },
  { city: "Adama", lat: 8.54, lng: 39.27 },
  { city: "Gambela", lat: 8.25, lng: 34.58 },
  { city: "Jijiga", lat: 9.35, lng: 42.80 },
  { city: "Semera", lat: 13.73, lng: 41.20 },
  { city: "Asosa", lat: 10.06, lng: 34.53 },
  { city: "Bale Mountains", lat: 6.78, lng: 39.73 },
  { city: "Simien Mountains", lat: 13.19, lng: 38.04 },
  { city: "Danakil Depression", lat: 14.24, lng: 40.30 },
  { city: "Awash National Park", lat: 8.89, lng: 40.01 },
  { city: "Omo Valley", lat: 5.11, lng: 36.31 }
];

const worldLocations = [
  { city: "Paris", lat: 48.85, lng: 2.35 },
  { city: "New York", lat: 40.71, lng: -74.00 },
  { city: "Tokyo", lat: 35.67, lng: 139.65 },
  { city: "London", lat: 51.50, lng: -0.12 },
  { city: "Rome", lat: 41.90, lng: 12.49 },
  { city: "Sydney", lat: -33.86, lng: 151.20 },
  { city: "Rio de Janeiro", lat: -22.90, lng: -43.17 },
  { city: "Cape Town", lat: -33.92, lng: 18.42 },
  { city: "Dubai", lat: 25.20, lng: 55.27 },
  { city: "Singapore", lat: 1.35, lng: 103.81 },
  { city: "Istanbul", lat: 41.00, lng: 28.97 },
  { city: "Barcelona", lat: 41.38, lng: 2.16 },
  { city: "Moscow", lat: 55.75, lng: 37.61 },
  { city: "Los Angeles", lat: 34.05, lng: -118.24 },
  { city: "Beijing", lat: 39.90, lng: 116.40 },
  { city: "Cairo", lat: 30.04, lng: 31.23 },
  { city: "Seoul", lat: 37.56, lng: 126.97 },
  { city: "Bangkok", lat: 13.75, lng: 100.50 },
  { city: "Amsterdam", lat: 52.36, lng: 4.90 },
  { city: "Mexico City", lat: 19.43, lng: -99.13 },
  { city: "Toronto", lat: 43.65, lng: -79.38 },
  { city: "Berlin", lat: 52.52, lng: 13.40 }
];

// High quality, beautiful, working static Unsplash images mapped by conceptual type
const staticImages = {
  nature: [
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80"
  ],
  urban: [
    "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=800&q=80"
  ],
  landmark: [
    "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1548625361-ec853f938f32?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80"
  ],
  food: [
    "https://images.unsplash.com/photo-1414235077428-33898dd18d52?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80"
  ],
  culture: [
    "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1518998053401-0b5c1439ea19?auto=format&fit=crop&w=800&q=80"
  ]
};

const getRandomImage = (type) => {
  const images = staticImages[type] || staticImages['urban'];
  return images[Math.floor(Math.random() * images.length)];
};

const placeTypes = [
  { name: "Grand Museum", category: "culture", type: "landmark", desc: "A fascinating museum showcasing incredible historical artifacts, cultural exhibits, and masterpieces. Perfect for an educational afternoon." },
  { name: "Central Park", category: "nature", type: "nature", desc: "A sprawling, lush green park right in the heart of the city. Ideal for picnics, relaxing walks, and enjoying nature away from the urban noise." },
  { name: "Historic Market", category: "shopping", type: "culture", desc: "A vibrant, bustling marketplace offering local crafts, fresh produce, and unique souvenirs. The atmosphere here is truly unforgettable." },
  { name: "Skyline Viewpoint", category: "landmark", type: "urban", desc: "The ultimate viewpoint offering breathtaking panoramic views of the entire city. Especially stunning during sunset." },
  { name: "Royal Palace", category: "landmark", type: "landmark", desc: "An opulent and majestic palace with stunning architecture, beautiful gardens, and centuries of rich history." },
  { name: "Traditional Restaurant", category: "food", type: "food", desc: "Experience authentic local cuisine in this beautifully decorated traditional restaurant. The flavors here are simply unmatched." },
  { name: "City Square", category: "event", type: "urban", desc: "The bustling heartbeat of the city, surrounded by historic buildings and often hosting lively street performances." },
  { name: "Botanical Gardens", category: "nature", type: "nature", desc: "Wander through exotic plant species, vibrant flowers, and tranquil ponds in this beautifully maintained garden." },
  { name: "Ancient Ruins", category: "culture", type: "landmark", desc: "Step back in time as you explore these well-preserved ancient ruins, filled with mystery and architectural wonder." },
  { name: "Modern Art Gallery", category: "culture", type: "urban", desc: "A sleek and contemporary gallery featuring thought-provoking installations and stunning works from modern artists." }
];

// Wide scatter so 200 posts don't overlay into 1 clump. 0.2 spread means ~14 mile variations.
const generateOffset = () => (Math.random() - 0.5) * 0.2; 

const getRandomRating = () => (Math.floor(Math.random() * 20) + 30) / 10; 
const getRandomTotalRatings = () => Math.floor(Math.random() * 500) + 10;

const generatePosts = (baseLocations, count, isEthiopia) => {
  let posts = [];
  let locationIndex = 0;
  for (let i = 0; i < count; i++) {
    const loc = baseLocations[locationIndex % baseLocations.length];
    const placeType = placeTypes[i % placeTypes.length];
    
    const adjectives = ["Beautiful", "Historic", "Majestic", "Famous", "Secret", "Stunning", "Incredible", "Hidden", "Grand", "Royal"];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const title = `${adj} ${loc.city} ${placeType.name}`;

    const lat = loc.lat + generateOffset();
    const lng = loc.lng + generateOffset();

    const imageUrl1 = getRandomImage(placeType.type);
    let imageUrl2 = getRandomImage(placeType.type);
    if (imageUrl1 === imageUrl2) {
      imageUrl2 = getRandomImage('urban'); // mix it up if duplicate
    }

    posts.push({
      title: title,
      description: placeType.desc + (isEthiopia ? " Experience the amazing beauty and rich culture of Ethiopia at this iconic spot." : " A spectacular world-class destination that shouldn't be missed."),
      image: {
        url: imageUrl1,
        publicId: `gen_${i}_1`
      },
      images: [
        { url: imageUrl1, publicId: `gen_${i}_1` },
        { url: imageUrl2, publicId: `gen_${i}_2` }
      ],
      location: {
        type: "Point",
        coordinates: [lng, lat],
        latitude: lat,
        longitude: lng
      },
      category: placeType.category,
      status: 'published',
      averageRating: getRandomRating(),
      totalRatings: getRandomTotalRatings()
    });

    locationIndex++;
  }
  return posts;
};

const runSeeding = async () => {
  await connectDB();

  console.log("Clearing existing posts...");
  await Post.deleteMany({});
  
  // Actually generate 250 Ethiopian posts and 250 Global posts to ensure OVER 200
  console.log("Generating 250 Ethiopian posts...");
  const ethiopianPosts = generatePosts(ethiopianLocations, 250, true);
  
  console.log("Generating 250 World posts...");
  const worldPosts = generatePosts(worldLocations, 250, false);

  const allPosts = [...ethiopianPosts, ...worldPosts];

  console.log(`Saving ${allPosts.length} posts to the database...`);
  
  const batchSize = 50;
  for (let i = 0; i < allPosts.length; i += batchSize) {
    const batch = allPosts.slice(i, i + batchSize);
    await Post.insertMany(batch);
    console.log(`Inserted ${i + batch.length} / ${allPosts.length} posts...`);
  }

  console.log("Seeding complete with working images & better spread! 🚀");
  process.exit(0);
};

runSeeding();
