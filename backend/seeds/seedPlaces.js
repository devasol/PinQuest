const mongoose = require('mongoose');
const Post = require('../models/posts');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL || process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Well-known places data
const wellKnownPlaces = [
  {
    title: "Eiffel Tower",
    description: "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France. It is named after the engineer Gustave Eiffel, whose company designed and built the tower. Constructed from 1887-1889 as the entrance to the 1889 World's Fair, it has become both a global cultural icon of France and one of the most recognizable structures in the world.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg",
      publicId: "eiffel_tower"
    },
    location: {
      type: "Point",
      coordinates: [2.2945, 48.8584], // [longitude, latitude]
      latitude: 48.8584,
      longitude: 2.2945
    },
    category: "landmark"
  },
  {
    title: "Statue of Liberty",
    description: "The Statue of Liberty is a colossal neoclassical sculpture on Liberty Island in New York Harbor, within New York City. The copper statue, a gift from the people of France to the people of the United States, was designed by French sculptor Frédéric Auguste Bartholdi and built by Gustave Eiffel. Dedicated on October 28, 1886, the statue holds a torch in its right hand and a tabula ansata in its left, inscribed with the date of the American Declaration of Independence.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Statue_of_Liberty%2C_NYC%2C_USA.jpg",
      publicId: "statue_of_liberty"
    },
    location: {
      type: "Point",
      coordinates: [-74.0445, 40.6892],
      latitude: 40.6892,
      longitude: -74.0445
    },
    category: "landmark"
  },
  {
    title: "Great Wall of China",
    description: "The Great Wall of China is a series of fortifications that were built across the historical northern borders of ancient Chinese states and Imperial China as protection against various nomadic groups. The wall stretches from Dandong in the east to Lop Lake in the west, along an arc that roughly delineates the southern edge of Inner Mongolia. The most well-known sections were built by the Ming dynasty (1368–1644).",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/5/53/The_Great_Wall_of_China_at_Jinshanling.jpg",
      publicId: "great_wall_china"
    },
    location: {
      type: "Point",
      coordinates: [117.2058, 40.4319],
      latitude: 40.4319,
      longitude: 117.2058
    },
    category: "landmark"
  },
  {
    title: "Machu Picchu",
    description: "Machu Picchu is a 15th-century Inca citadel located in the Andes Mountains of Peru, about 80 kilometers northwest of Cusco. It is situated on a mountain ridge at 2,430 meters (7,970 ft) above sea level. Often mistakenly referred to as the 'Lost City of the Incas', it is the most familiar icon of Inca civilization. The Incas built the estate around 1450 but abandoned it a century later, at the time of the Spanish conquest.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/6/63/Machu_Picchu%2C_Peru.jpg",
      publicId: "machu_picchu"
    },
    location: {
      type: "Point",
      coordinates: [-72.5450, -13.1631],
      latitude: -13.1631,
      longitude: -72.5450
    },
    category: "landmark"
  },
  {
    title: "Great Pyramid of Giza",
    description: "The Great Pyramid of Giza is the oldest and largest of the pyramids in the Giza pyramid complex in Egypt. It is the oldest of the Seven Wonders of the Ancient World and the only one to remain substantially intact. Built during a 20-year period during the Fourth Dynasty of the Old Kingdom of Ancient Egypt, it was constructed as a tomb for the Fourth Dynasty pharaoh Khufu.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Giza_Sphinx.jpg",
      publicId: "great_pyramid_giza"
    },
    location: {
      type: "Point",
      coordinates: [31.1344, 29.9792],
      latitude: 29.9792,
      longitude: 31.1344
    },
    category: "landmark"
  },
  {
    title: "Sydney Opera House",
    description: "The Sydney Opera House is a multi-venue performing arts centre in Sydney, Australia. Located on the foreshore of Sydney Harbour, it is widely regarded as one of the world's most famous and distinctive buildings and a masterpiece of 20th-century architecture. Designed by Danish architect Jørn Utzon and completed in 1973, the building's distinctive sail-like shells have become an internationally recognized image of Australia.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/8/84/Sydney_Opera_House_Sails.jpg",
      publicId: "sydney_opera_house"
    },
    location: {
      type: "Point",
      coordinates: [151.2170, -33.8569],
      latitude: -33.8569,
      longitude: 151.2170
    },
    category: "landmark"
  },
  {
    title: "Taj Mahal",
    description: "The Taj Mahal is an ivory-white marble mausoleum on the right bank of the river Yamuna in Agra, India. It was commissioned in 1632 by the Mughal emperor Shah Jahan to house the tomb of his favorite wife, Mumtaz Mahal. The Taj Mahal was designated as a UNESCO World Heritage Site in 1983 for being 'the jewel of Muslim art in India and one of the universally admired masterpieces of the world's heritage.'",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/6/67/Taj_Mahal_in_India_-_Kristopher_G.jpg",
      publicId: "taj_mahal"
    },
    location: {
      type: "Point",
      coordinates: [78.0421, 27.1750],
      latitude: 27.1750,
      longitude: 78.0421
    },
    category: "landmark"
  },
  {
    title: "Colosseum",
    description: "The Colosseum is an oval amphitheatre in the centre of the city of Rome, Italy. Built of travertine, tuff, and brick-faced concrete, it is the largest amphitheatre ever built. The Colosseum is situated just east of the Roman Forum. Construction began under the emperor Vespasian in AD 72 and was completed in AD 80 under his successor and heir, Titus.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/5/53/Colosseo_2020.jpg",
      publicId: "colosseum"
    },
    location: {
      type: "Point",
      coordinates: [12.4918, 41.8902],
      latitude: 41.8902,
      longitude: 12.4918
    },
    category: "landmark"
  },
  {
    title: "Mount Fuji",
    description: "Mount Fuji is the highest mountain in Japan at 3,776.24 meters (12,389 ft). It is an active stratovolcano that last erupted in 1707–1708. The mountain is located about 100 kilometers (60 mi) southwest of Tokyo. Mount Fuji is one of Japan's 'Three Holy Mountains' and is a popular hiking destination, with approximately 200,000 to 300,000 people climbing it each year.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/9/98/Mt._Fuji_from_Tsuru_River_by_the_Flickr_user_Mstfdj.jpg",
      publicId: "mount_fuji"
    },
    location: {
      type: "Point",
      coordinates: [138.7266, 35.3606],
      latitude: 35.3606,
      longitude: 138.7266
    },
    category: "natural"
  },
  {
    title: "Times Square",
    description: "Times Square is a major commercial intersection, tourist destination, entertainment center, and neighborhood in the Midtown Manhattan section of New York City. The square is formed by the intersection of Broadway with Seventh Avenue and stretches from West 42nd to West 47th Streets. Known as The Crossroads of the World, Times Square is one of the world's busiest pedestrian areas and is widely known for its bright lights, billboards, and entertainment options.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/5/53/Times_Square%2C_May_2015.jpg",
      publicId: "times_square"
    },
    location: {
      type: "Point",
      coordinates: [-73.9857, 40.7580],
      latitude: 40.7580,
      longitude: -73.9857
    },
    category: "urban"
  },
  {
    title: "Niagara Falls",
    description: "Niagara Falls is a group of three waterfalls at the southern end of Niagara Gorge, on the border between the province of Ontario in Canada and the state of New York in the United States. The largest of the three is Horseshoe Falls, which straddles the international border. The falls are renowned both for their beauty and as a valuable source of hydroelectric power.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/1/14/Niagara_Falls_with_landscape_%283604133433%29.jpg",
      publicId: "niagara_falls"
    },
    location: {
      type: "Point",
      coordinates: [-79.0744, 43.0896],
      latitude: 43.0896,
      longitude: -79.0744
    },
    category: "natural"
  },
  {
    title: "Grand Canyon",
    description: "The Grand Canyon is a steep-sided canyon carved by the Colorado River in Arizona, United States. The canyon is 277 miles long, up to 18 miles wide and attains a depth of over a mile. President Theodore Roosevelt was a major proponent of preservation of the Grand Canyon area, and visited it on numerous occasions. The Grand Canyon is universally recognized as one of the natural wonders of the world.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Hance_Rapids%2C_Grand_Canyon_%288180005114%29.jpg",
      publicId: "grand_canyon"
    },
    location: {
      type: "Point",
      coordinates: [-112.1150, 36.0544],
      latitude: 36.0544,
      longitude: -112.1150
    },
    category: "natural"
  },
  {
    title: "Stonehenge",
    description: "Stonehenge is a prehistoric monument located in Wiltshire, England. It was constructed between 3000 and 2000 BC. One of the most famous sites in the world, Stonehenge is composed of an outer ring of vertical sarsen standing stones, each around 13 feet high, seven feet wide, and weighing around 25 tons, topped by connecting horizontal lintel stones.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/5/55/Stonehenge.jpg",
      publicId: "stonehenge"
    },
    location: {
      type: "Point",
      coordinates: [-1.8262, 51.1789],
      latitude: 51.1789,
      longitude: -1.8262
    },
    category: "landmark"
  },
  {
    title: "Santorini",
    description: "Santorini is a volcanic island in the Cyclades in the Aegean Sea, with a 360° view of the caldera. The island's major settlements include Fira, Oia, Imerovigli and Pyrgos. The island is the remnant of a volcanic explosion that destroyed an ancient Minoan civilization thousands of years ago. This catastrophic event inspired many Greek myths and may have been the source of the legend of Atlantis.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/8/87/Santorini_from_space.jpg",
      publicId: "santorini"
    },
    location: {
      type: "Point",
      coordinates: [25.4615, 36.3932],
      latitude: 36.3932,
      longitude: 25.4615
    },
    category: "natural"
  },
  {
    title: "Bora Bora",
    description: "Bora Bora is a volcanic island in the Leeward group of the Society Islands of French Polynesia, an overseas collectivity of France. The island, located about 230 kilometres (140 mi) northwest of Pape'ete, is surrounded by a lagoon and a barrier reef. In the center of the island are the remnants of an extinct volcano that forms two peaks called Mount Pahia and Mount Otemanu.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Bora_Bora_%2829081501228%29.jpg",
      publicId: "bora_bora"
    },
    location: {
      type: "Point",
      coordinates: [-151.7462, -16.4445],
      latitude: -16.4445,
      longitude: -151.7462
    },
    category: "natural"
  },
  {
    title: "Venice Canals",
    description: "Venice is built on a group of 118 small islands separated by canals in a shallow lagoon. The canals serve as roads, and every form of transport is on water or on foot. The city extends from the island of the same name in the shallow Venetian Lagoon, an enclosed bay lying between the mouths of the Po and the Piave rivers. The lagoon is connected to the Adriatic Sea.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Canal_Grande_during_Masquerade_%283991833857%29.jpg",
      publicId: "venice_canals"
    },
    location: {
      type: "Point",
      coordinates: [12.3381, 45.4381],
      latitude: 45.4381,
      longitude: 12.3381
    },
    category: "urban"
  },
  {
    title: "Pisa Tower",
    description: "The Leaning Tower of Pisa is the campanile, or freestanding bell tower, of Pisa Cathedral. It is known for its nearly four-degree tilt to the south, a result of an unstable foundation. The tower is made of white marble and has eight stories, including the chamber for the bells at the top. Construction of the tower began in 1173 and took place in three stages over the course of 177 years.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/4/45/Leaning_Tower_of_Pisa2.jpg",
      publicId: "pisa_tower"
    },
    location: {
      type: "Point",
      coordinates: [10.3966, 43.7230],
      latitude: 43.7230,
      longitude: 10.3966
    },
    category: "landmark"
  },
  {
    title: "London Bridge",
    description: "London Bridge is a road and railway bridge crossing the River Thames in Central London, connecting the City of London and Southwark. It has been the only crossing of the Thames in central London since Tower Bridge was opened 330 meters upstream in 1894. The current crossing, opened in 1973, is a box girder bridge made of concrete and steel.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/5/59/London_Bridge_2015-09-02.jpg",
      publicId: "london_bridge"
    },
    location: {
      type: "Point",
      coordinates: [-0.0862, 51.5080],
      latitude: 51.5080,
      longitude: -0.0862
    },
    category: "landmark"
  },
  {
    title: "Christ the Redeemer",
    description: "Christ the Redeemer is an Art Deco statue of Jesus Christ in Rio de Janeiro, Brazil. A symbol of Christianity, the statue has also become a cultural icon of both Rio de Janeiro and Brazil. Created by French sculptor Paul Landowski and built by Brazilian engineer Heitor da Silva Costa, it was designed by French-Polish sculptor Gheorghe Leonida. The face was created by Romanian sculptor Peter Carl Fabergé.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Christ_the_Redeemer_-_View_from_bairro_%28cropped%29.jpg",
      publicId: "christ_redeemer"
    },
    location: {
      type: "Point",
      coordinates: [-43.2105, -22.9519],
      latitude: -22.9519,
      longitude: -43.2105
    },
    category: "landmark"
  },
  {
    title: "Sahara Desert",
    description: "The Sahara is a desert on the African continent. With an area of 9,200,000 square kilometres (3,600,000 sq mi), it is the largest hot desert in the world and the third largest desert overall, smaller only than the deserts of Antarctica and the Arctic. The name 'Sahara' is derived from a dialectal Arabic word for 'desert'.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Sahara_Alg%C3%A9rie_19639.jpg",
      publicId: "sahara_desert"
    },
    location: {
      type: "Point",
      coordinates: [-1.0000, 25.0000],
      latitude: 25.0000,
      longitude: -1.0000
    },
    category: "natural"
  },
  {
    title: "Amazon Rainforest",
    description: "The Amazon rainforest, also known in English as Amazonia or the Amazon Jungle, is a moist broadleaf tropical rainforest in the Amazon biome of South America. This biome covers most of the Amazon basin of South America. The rainforest represents over half of the planet's remaining rainforests, and comprises the largest and most biodiverse tract of tropical rainforest in the world.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Aerial_view_of_the_heart_of_the_Amazonia.jpg",
      publicId: "amazon_rainforest"
    },
    location: {
      type: "Point",
      coordinates: [-60.0000, -3.0000],
      latitude: -3.0000,
      longitude: -60.0000
    },
    category: "natural"
  },
  {
    title: "Antarctica",
    description: "Antarctica is Earth's southernmost continent, containing the geographic South Pole. It is situated in the Antarctic region of the Southern Hemisphere, almost entirely south of the Antarctic Circle and bounded by the Southern Ocean. Antarctica is the fifth-largest continent in area after Asia, Africa, North America, and South America.",
    image: {
      url: "https://upload.wikimedia.org/wikipedia/commons/9/96/Antarctica_orthographic_projection.jpg",
      publicId: "antarctica"
    },
    location: {
      type: "Point",
      coordinates: [0.0000, -90.0000],
      latitude: -90.0000,
      longitude: 0.0000
    },
    category: "natural"
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing posts if needed (optional)
    // await Post.deleteMany({});

    // Insert well-known places
    for (const place of wellKnownPlaces) {
      const existingPlace = await Post.findOne({ title: place.title });
      if (!existingPlace) {
        const newPost = new Post({
          title: place.title,
          description: place.description,
          image: place.image,
          location: place.location,
          category: place.category,
          status: 'published',
          postedBy: null // These are well-known places not posted by specific users
        });
        
        await newPost.save();
        console.log(`Added: ${place.title}`);
      } else {
        console.log(`Skipped (already exists): ${place.title}`);
      }
    }
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();