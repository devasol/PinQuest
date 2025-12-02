const mongoose = require("mongoose");
require("dotenv").config();

// Import Post model
const Post = require("./models/posts");

// Function to connect and update images with reliable URLs
async function updatePostImagesReliable() {
  try {
    // Connect to database directly with the connection string
    const db = process.env.MONGODB_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/pin_quest";
    
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("Connected to database, updating post images with reliable URLs...");
    
    // Define new image URLs from a more reliable source
    const placeImages = {
      "Eiffel Tower, Paris, France": {
        url: "https://images.pexels.com/photos/3747465/pexels-photo-3747465.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Statue of Liberty, New York, USA": {
        url: "https://images.pexels.com/photos/1643440/pexels-photo-1643440.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Great Wall of China, Beijing, China": {
        url: "https://images.pexels.com/photos/3689805/pexels-photo-3689805.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Machu Picchu, Cusco, Peru": {
        url: "https://images.pexels.com/photos/4178650/pexels-photo-4178650.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Grand Canyon, Arizona, USA": {
        url: "https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Taj Mahal, Agra, India": {
        url: "https://images.pexels.com/photos/351265/pexels-photo-351265.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Santorini, Greece": {
        url: "https://images.pexels.com/photos/1034582/pexels-photo-1034582.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Sydney Opera House, Sydney, Australia": {
        url: "https://images.pexels.com/photos/1285538/pexels-photo-1285538.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Pyramids of Giza, Egypt": {
        url: "https://images.pexels.com/photos/3689804/pexels-photo-3689804.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Christ the Redeemer, Rio de Janeiro, Brazil": {
        url: "https://images.pexels.com/photos/258385/pexels-photo-258385.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Niagara Falls, Canada/USA": {
        url: "https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Mount Fuji, Japan": {
        url: "https://images.pexels.com/photos/358029/pexels-photo-358029.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Stonehenge, England": {
        url: "https://images.pexels.com/photos/1444465/pexels-photo-1444465.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Great Barrier Reef, Australia": {
        url: "https://images.pexels.com/photos/1624517/pexels-photo-1624517.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Petra, Jordan": {
        url: "https://images.pexels.com/photos/3689803/pexels-photo-3689803.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Victoria Falls, Zambia/Zimbabwe": {
        url: "https://images.pexels.com/photos/1624492/pexels-photo-1624492.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Angkor Wat, Cambodia": {
        url: "https://images.pexels.com/photos/3689806/pexels-photo-3689806.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Banff National Park, Canada": {
        url: "https://images.pexels.com/photos/358030/pexels-photo-358030.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Amazon Rainforest, Brazil": {
        url: "https://images.pexels.com/photos/1624494/pexels-photo-1624494.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Colosseum, Rome, Italy": {
        url: "https://images.pexels.com/photos/1444466/pexels-photo-1444466.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Chichen Itza, Mexico": {
        url: "https://images.pexels.com/photos/1444467/pexels-photo-1444467.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Himalayas, Nepal/Tibet": {
        url: "https://images.pexels.com/photos/1624498/pexels-photo-1624498.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Yellowstone National Park, USA": {
        url: "https://images.pexels.com/photos/1624500/pexels-photo-1624500.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Dubai, United Arab Emirates": {
        url: "https://images.pexels.com/photos/1128473/pexels-photo-1128473.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Antarctica": {
        url: "https://images.pexels.com/photos/1624502/pexels-photo-1624502.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Northern Lights, Iceland": {
        url: "https://images.pexels.com/photos/1624504/pexels-photo-1624504.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Galápagos Islands, Ecuador": {
        url: "https://images.pexels.com/photos/1624506/pexels-photo-1624506.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Serengeti National Park, Tanzania": {
        url: "https://images.pexels.com/photos/1624508/pexels-photo-1624508.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Bora Bora, French Polynesia": {
        url: "https://images.pexels.com/photos/1624510/pexels-photo-1624510.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Cappadocia, Turkey": {
        url: "https://images.pexels.com/photos/1034583/pexels-photo-1034583.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Bali, Indonesia": {
        url: "https://images.pexels.com/photos/1624512/pexels-photo-1624512.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Loire Valley, France": {
        url: "https://images.pexels.com/photos/1624514/pexels-photo-1624514.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Iguazu Falls, Argentina/Brazil": {
        url: "https://images.pexels.com/photos/1624516/pexels-photo-1624516.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Reykjavik, Iceland": {
        url: "https://images.pexels.com/photos/1034584/pexels-photo-1034584.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Cinque Terre, Italy": {
        url: "https://images.pexels.com/photos/1444469/pexels-photo-1444469.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Sahara Desert, Morocco": {
        url: "https://images.pexels.com/photos/1624518/pexels-photo-1624518.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Kyoto, Japan": {
        url: "https://images.pexels.com/photos/1034585/pexels-photo-1034585.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Fiji Islands": {
        url: "https://images.pexels.com/photos/1624520/pexels-photo-1624520.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Prague, Czech Republic": {
        url: "https://images.pexels.com/photos/1444470/pexels-photo-1444470.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Madagascar": {
        url: "https://images.pexels.com/photos/1624522/pexels-photo-1624522.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Budapest, Hungary": {
        url: "https://images.pexels.com/photos/1444471/pexels-photo-1444471.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Ladakh, India": {
        url: "https://images.pexels.com/photos/1624524/pexels-photo-1624524.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Seychelles": {
        url: "https://images.pexels.com/photos/1624526/pexels-photo-1624526.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Patagonia, Argentina/Chile": {
        url: "https://images.pexels.com/photos/1624528/pexels-photo-1624528.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Swiss Alps, Switzerland": {
        url: "https://images.pexels.com/photos/1624530/pexels-photo-1624530.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Zanzibar, Tanzania": {
        url: "https://images.pexels.com/photos/1624532/pexels-photo-1624532.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "New Zealand": {
        url: "https://images.pexels.com/photos/1624534/pexels-photo-1624534.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Morocco": {
        url: "https://images.pexels.com/photos/1624536/pexels-photo-1624536.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Sri Lanka": {
        url: "https://images.pexels.com/photos/1624538/pexels-photo-1624538.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Bhutan": {
        url: "https://images.pexels.com/photos/1624540/pexels-photo-1624540.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Maldives": {
        url: "https://images.pexels.com/photos/1624542/pexels-photo-1624542.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      },
      "Jordan": {
        url: "https://images.pexels.com/photos/1624544/pexels-photo-1624544.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        publicId: null
      }
    };

    // Find all posts and update their images
    const posts = await Post.find({});
    
    if (posts.length === 0) {
      console.log("No posts found in the database.");
      return;
    }
    
    console.log(`Found ${posts.length} posts to update...`);
    
    for (const post of posts) {
      const placeName = post.title;
      const newImage = placeImages[placeName];
      
      if (newImage) {
        // Update the post with the new image
        await Post.findByIdAndUpdate(
          post._id,
          {
            $set: {
              image: newImage,
              images: [newImage]
            }
          }
        );
        
        console.log(`Updated image for post: ${placeName}`);
      } else {
        // If we don't have a specific image for this post, use a general landmark placeholder
        const genericImage = {
          url: `https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`,
          publicId: null
        };
        
        await Post.findByIdAndUpdate(
          post._id,
          {
            $set: {
              image: genericImage,
              images: [genericImage]
            }
          }
        );
        
        console.log(`Updated image with generic placeholder for post: ${placeName}`);
      }
    }
    
    console.log("All posts have been updated with new reliable images!");
    mongoose.connection.close();
    
  } catch (error) {
    console.error("Error updating post images:", error);
    mongoose.connection.close();
  }
}

// Run the update function
updatePostImagesReliable();