const mongoose = require("mongoose");
require("dotenv").config();

// Import Post model
const Post = require("./models/posts");

// Function to connect and update images
async function updatePostImages() {
  try {
    // Connect to database directly with the connection string
    const db = process.env.MONGODB_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/pin_quest";
    
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("Connected to database, updating post images...");
    
    console.log("Connected to database, updating post images...");
    
    // Define new image URLs for each well-known place
    const placeImages = {
      "Eiffel Tower, Paris, France": {
        url: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Statue of Liberty, New York, USA": {
        url: "https://images.unsplash.com/photo-1589652726544-d739cd6f2e10?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Great Wall of China, Beijing, China": {
        url: "https://images.unsplash.com/photo-1574163416568-55c9b3746c02?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Machu Picchu, Cusco, Peru": {
        url: "https://images.unsplash.com/photo-1526392060635-9d6019884377?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Grand Canyon, Arizona, USA": {
        url: "https://images.unsplash.com/photo-1508974491678-7e45b4d6c021?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Taj Mahal, Agra, India": {
        url: "https://images.unsplash.com/photo-1537167815047-8a09d6ab6e4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Santorini, Greece": {
        url: "https://images.unsplash.com/photo-1561881889-4f84e5f74da3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Sydney Opera House, Sydney, Australia": {
        url: "https://images.unsplash.com/photo-1578755234433-5b7d82429a06?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Pyramids of Giza, Egypt": {
        url: "https://images.unsplash.com/photo-1564044843401-47a867c6e46a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Christ the Redeemer, Rio de Janeiro, Brazil": {
        url: "https://images.unsplash.com/photo-1577239107294-8e3bbd1c0b8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Niagara Falls, Canada/USA": {
        url: "https://images.unsplash.com/photo-1561258142-0951b63a1b9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Mount Fuji, Japan": {
        url: "https://images.unsplash.com/photo-1588282843091-337b3f21974c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Stonehenge, England": {
        url: "https://images.unsplash.com/photo-1550794848-604392e5394d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Great Barrier Reef, Australia": {
        url: "https://images.unsplash.com/photo-1615849071176-5e141d0a8b5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Petra, Jordan": {
        url: "https://images.unsplash.com/photo-1564728441248-7a5b6f9b788f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Victoria Falls, Zambia/Zimbabwe": {
        url: "https://images.unsplash.com/photo-1570514942321-22070e1a0e3c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Angkor Wat, Cambodia": {
        url: "https://images.unsplash.com/photo-1580137084105-7c63ce0783c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Banff National Park, Canada": {
        url: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Amazon Rainforest, Brazil": {
        url: "https://images.unsplash.com/photo-1447439479564-5e0e44e3d7c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Colosseum, Rome, Italy": {
        url: "https://images.unsplash.com/photo-1552878372-6e486e42d64b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Chichen Itza, Mexico": {
        url: "https://images.unsplash.com/photo-1580137084105-7c63ce0783c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Himalayas, Nepal/Tibet": {
        url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Yellowstone National Park, USA": {
        url: "https://images.unsplash.com/photo-1516975822502-a4d0e8e0e6d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Dubai, United Arab Emirates": {
        url: "https://images.unsplash.com/photo-1566647387313-9fda80526fb1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Antarctica": {
        url: "https://images.unsplash.com/photo-1566647387313-9fda80526fb1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Northern Lights, Iceland": {
        url: "https://images.unsplash.com/photo-1509043759401-136742328bb3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Galápagos Islands, Ecuador": {
        url: "https://images.unsplash.com/photo-1566647387313-9fda80526fb1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Serengeti National Park, Tanzania": {
        url: "https://images.unsplash.com/photo-1472446372807-72b7a269a0d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Bora Bora, French Polynesia": {
        url: "https://images.unsplash.com/photo-1526178613646-08aa1d472b7d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Cappadocia, Turkey": {
        url: "https://images.unsplash.com/photo-1570217481306-8e4d1c64a8e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Bali, Indonesia": {
        url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Loire Valley, France": {
        url: "https://images.unsplash.com/photo-1510784722852-036a2240e28d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Iguazu Falls, Argentina/Brazil": {
        url: "https://images.unsplash.com/photo-1578799171174-8c3eeb746e4f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Reykjavik, Iceland": {
        url: "https://images.unsplash.com/photo-1509316785289-025f5b8b4a22?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Cinque Terre, Italy": {
        url: "https://images.unsplash.com/photo-1516483687518-5a1b8a7f5c1e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Sahara Desert, Morocco": {
        url: "https://images.unsplash.com/photo-1509316785289-025f5b8b4a22?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Kyoto, Japan": {
        url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Fiji Islands": {
        url: "https://images.unsplash.com/photo-1525611022169-12b6e1c7e708?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Prague, Czech Republic": {
        url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Madagascar": {
        url: "https://images.unsplash.com/photo-1595689155968-4c7070e56e2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Budapest, Hungary": {
        url: "https://images.unsplash.com/photo-1514036783244-2a0d59d229d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Ladakh, India": {
        url: "https://images.unsplash.com/photo-1576569742961-7e080e0d3e6b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Seychelles": {
        url: "https://images.unsplash.com/photo-1573495987391-46ef52b9e5e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Patagonia, Argentina/Chile": {
        url: "https://images.unsplash.com/photo-1546499970-4ce5853a4f30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Swiss Alps, Switzerland": {
        url: "https://images.unsplash.com/photo-1507652932313-4888d7da1c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Zanzibar, Tanzania": {
        url: "https://images.unsplash.com/photo-1566647387313-9fda80526fb1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "New Zealand": {
        url: "https://images.unsplash.com/photo-1508624742183-3c7f53b66f14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Morocco": {
        url: "https://images.unsplash.com/photo-1507501223702-6c0fa66b2c93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Sri Lanka": {
        url: "https://images.unsplash.com/photo-1561580955-37b5ad93e7a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Bhutan": {
        url: "https://images.unsplash.com/photo-1575550959106-5a7defe2f08a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Maldives": {
        url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        publicId: null
      },
      "Jordan": {
        url: "https://images.unsplash.com/photo-1566647387313-9fda80526fb1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
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
          url: `https://images.unsplash.com/photo-1530521954074-e64f6810b32d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80`,
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
    
    console.log("All posts have been updated with new images!");
    process.exit(0); // Exit the process after completion
    
  } catch (error) {
    console.error("Error updating post images:", error);
    process.exit(1);
  }
}

// Run the update function
updatePostImages();