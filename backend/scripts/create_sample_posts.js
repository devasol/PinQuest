// backend/scripts/create_sample_posts.js

/**
 * Script to create sample posts for 50+ well-known locations
 * Run this script to populate your database with sample posts
 */

// Load environment variables
require("dotenv").config();

// Import required modules
const mongoose = require("mongoose");
const Post = require("../models/posts");

// More than 50 well-known places data with detailed descriptions and location coordinates
const fiftyPlusLocations = [
  {
    title: "Eiffel Tower, Paris, France",
    description: "The iconic iron lattice tower located on the Champ de Mars in Paris, France. Built in 1889, it stands 330 meters tall and is one of the most recognizable structures in the world. A symbol of romance and architectural excellence, attracting nearly 7 million visitors annually.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [2.2945, 48.8584] // [longitude, latitude]
    },
    images: [
      "https://images.unsplash.com/photo-1595482767426-5e991f52fa5c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551218808-94e220e084d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1520222984865-425f4bdd5e9a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Statue of Liberty, New York, USA",
    description: "Located on Liberty Island in New York Harbor, this colossal neoclassical sculpture was designed by French sculptor Frédéric Auguste Bartholdi and built by Gustave Eiffel. Gifted to the United States in 1886, it symbolizes freedom and democracy, welcoming millions of immigrants to America.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [-74.0445, 40.6892]
    },
    images: [
      "https://images.unsplash.com/photo-1524439016562-591d3c6a5d0a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1598821180773-3ff6e1353660?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1596552861789-94e5d35f2316?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Great Wall of China, Beijing, China",
    description: "An ancient series of fortifications built across northern China, stretching over 13,000 miles. Construction began as early as the 7th century BC, with significant additions made during the Ming Dynasty. One of the most impressive architectural feats in human history.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [116.5704, 40.4319]
    },
    images: [
      "https://images.unsplash.com/photo-1529204520640-f1c7c3a4c64b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544620343-06a71b5319f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1538764233-9ac5a26b21a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Machu Picchu, Cusco, Peru",
    description: "An ancient Incan citadel located in the Andes Mountains of Peru, built in the 15th century. This archaeological wonder is often called the 'Lost City of the Incas' and is one of the most famous archaeological sites in the world. A UNESCO World Heritage Site and one of the New Seven Wonders of the World.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [-72.5450, -13.1631]
    },
    images: [
      "https://images.unsplash.com/photo-1526392060635-9d6019884377?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1594330164377-97f9c419d7d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1598871068286-8f8f52f4e6d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Grand Canyon, Arizona, USA",
    description: "A steep-sided canyon carved by the Colorado River in Arizona, United States. The canyon is 277 river miles long, up to 18 miles wide, and over a mile deep, making it one of the most spectacular natural landmarks. A geological wonder millions of years in the making.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [-112.1129, 36.1069]
    },
    images: [
      "https://images.unsplash.com/photo-1508098692458-5f6e0c5c6a7a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1514414238205-04969e131341?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1593005510322-a292f4d1f62e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Taj Mahal, Agra, India",
    description: "An ivory-white marble mausoleum on the right bank of the river Yamuna in Agra, India. Commissioned in 1632 by the Mughal emperor Shah Jahan to house the tomb of his favorite wife, Mumtaz Mahal, it is considered the jewel of Muslim art in India.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [78.0419, 27.1750]
    },
    images: [
      "https://images.unsplash.com/photo-1537726235421-8f26e42a891d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595471585194-69b7b6f00d3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1579156618441-0f9f7d0e7e0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Santorini, Greece",
    description: "A volcanic island in the Cyclades group in the Aegean Sea. Known for its dramatic views, stunning sunsets, white-washed buildings, blue-domed churches and volcanic beaches. One of the most photographed places in the world.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [25.4615, 36.3932]
    },
    images: [
      "https://images.unsplash.com/photo-1569658708965-1d3a80d4e3ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1585716770405-03f3a328e3c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Sydney Opera House, Sydney, Australia",
    description: "A multi-venue performing arts centre located on Sydney Harbour in Sydney, New South Wales, Australia. This architectural masterpiece with its distinctive shell-like design was completed in 1973 and is considered one of the world's most famous and distinctive buildings.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [151.2153, -33.8568]
    },
    images: [
      "https://images.unsplash.com/photo-1543348481-7c92e84e3e40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1570220731423-4cd5fb06f1d0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566796231588-2e0a756479bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Pyramids of Giza, Egypt",
    description: "The oldest and largest of the three pyramids in the Giza pyramid complex bordering the Giza Plateau in Greater Cairo, Egypt. These ancient monuments were built as tombs for the pharaohs and are the only remaining ancient wonder of the original Seven Wonders of the Ancient World.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [31.1344, 29.9792]
    },
    images: [
      "https://images.unsplash.com/photo-1565299507177-b8a0205aa3c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1578672704110-05fed11f461f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1580733538645-5e5c480ceaae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Christ the Redeemer, Rio de Janeiro, Brazil",
    description: "An Art Deco statue of Jesus Christ in Rio de Janeiro, Brazil. Standing 98 feet tall plus an 26-foot pedestal, it overlooks the city from the peak of Mount Corcovado. This iconic statue is the largest Art Deco statue in the world.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [-43.2105, -22.9519]
    },
    images: [
      "https://images.unsplash.com/photo-1586495843417-52b3940a2030?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1596552442542-5e7b4a0f3b2a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1576634281067-4a72a5023b06?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Niagara Falls, Canada/USA",
    description: "A group of three waterfalls at the southern end of Niagara Gorge, on the border between the province of Ontario in Canada and the state of New York in the United States. One of the most powerful and famous waterfalls in the world, attracting millions of visitors annually.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [-79.0744, 43.0828]
    },
    images: [
      "https://images.unsplash.com/photo-1565656620393-08b4e9318475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1577505114149-3d5224f19201?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1565666670232-83aa3d3b65b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Mount Fuji, Japan",
    description: "An active stratovolcano that last erupted in 1707-1708. Standing at 3,776.24 meters, it is the highest mountain in Japan and an iconic symbol of the country. A sacred mountain and popular pilgrimage destination.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [138.7278, 35.3606]
    },
    images: [
      "https://images.unsplash.com/photo-1586734568254-fd7b6f0e74eb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1587502974016-4eae035a0b46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544835024-4a06d2d3ec6a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    title: "Stonehenge, England",
    description: "A prehistoric monument located in Wiltshire, England. Consisting of a ring of standing stones, each around 13 feet high and 7 feet wide, weighing around 25 tons. Its purpose remains a mystery, with theories ranging from astronomical calendar to religious site.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [-1.8262, 51.1789]
    },
    images: [
      "https://source.unsplash.com/800x600/?stonehenge,england",
      "https://source.unsplash.com/800x600/?stonehenge-ancient",
      "https://source.unsplash.com/800x600/?prehistory-stones,england"
    ]
  },
  {
    title: "Great Barrier Reef, Australia",
    description: "The world's largest coral reef system composed of over 2,900 individual reefs and 900 islands stretching for 1,400 miles. Located in the Coral Sea off the coast of Queensland, Australia, it supports a diversity of marine life and is one of the seven natural wonders of the world.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [147.9667, -18.25]
    },
    images: [
      "https://source.unsplash.com/800x600/?great-barrier-reef,australia",
      "https://source.unsplash.com/800x600/?coral-reef-australia",
      "https://source.unsplash.com/800x600/?reef-marine-life,australia"
    ]
  },
  {
    title: "Petra, Jordan",
    description: "A historical and archaeological city in southern Jordan. Famous for its rock-cut architecture and water conduit system, it's also known as the 'Rose City' due to the color of the stone from which it is carved. One of the New Seven Wonders of the World.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [35.4444, 30.3275]
    },
    images: [
      "https://source.unsplash.com/800x600/?petra,jordan,rock",
      "https://source.unsplash.com/800x600/?petra-ancient,jordan",
      "https://source.unsplash.com/800x600/?jordan-petra-architecture"
    ]
  },
  {
    title: "Victoria Falls, Zambia/Zimbabwe",
    description: "A waterfall on the Zambezi River in southern Africa, which is neither the highest nor the widest waterfall in the world but is classified as the largest. The falls are about 3,540 feet wide, 354 feet high, and considered the largest water curtain in the world.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [25.8572, -17.9243]
    },
    images: [
      "https://source.unsplash.com/800x600/?victoria-falls,zambia",
      "https://source.unsplash.com/800x600/?victoria-falls-waterfall",
      "https://source.unsplash.com/800x600/?zambezi-waterfall,africa"
    ]
  },
  {
    title: "Angkor Wat, Cambodia",
    description: "A temple complex in Cambodia and the largest religious monument in the world. Originally constructed in the early 12th century as a Hindu temple for the Khmer Empire, it gradually transformed into a Buddhist temple. A symbol of Cambodia and appears on its national flag.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [103.8667, 13.4125]
    },
    images: [
      "https://source.unsplash.com/800x600/?angkor-wat,cambodia",
      "https://source.unsplash.com/800x600/?angkor-wat-temple,cambodia",
      "https://source.unsplash.com/800x600/?khmer-architecture,cambodia"
    ]
  },
  {
    title: "Banff National Park, Canada",
    description: "Canada's first national park and the world's third oldest national park, established in 1885. Located in the Rocky Mountains, it encompasses 2,564 square miles of mountains of the Continental Divide, glaciers and glacial lakes, alpine meadows, high-altitude recreation, and mineral hot springs.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [-115.9220, 51.4985]
    },
    images: [
      "https://source.unsplash.com/800x600/?banff-national-park,canada",
      "https://source.unsplash.com/800x600/?canada-rockies,bound",
      "https://source.unsplash.com/800x600/?glacier-lake,bound"
    ]
  },
  {
    title: "Amazon Rainforest, Brazil",
    description: "The largest tropical rainforest in the world, located in the Amazon biome of South America. It spans across 9 countries, with 60% of it located in Brazil. Known as the 'lungs of the Earth', it produces 20% of the world's oxygen and is home to more than 30 million people and one in ten known species on Earth.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [-62.2159, -3.4653]
    },
    images: [
      "https://source.unsplash.com/800x600/?amazon-rainforest,brazil",
      "https://source.unsplash.com/800x600/?amazon-jungle,forest",
      "https://source.unsplash.com/800x600/?tropical-rainforest,amazon"
    ]
  },
  {
    title: "Colosseum, Rome, Italy",
    description: "An oval amphitheatre in the centre of the city of Rome, Italy. Built of travertine limestone, tuff, and brick-faced concrete, it was the largest amphitheatre ever built at the time. Used for gladiatorial contests and public spectacles, it could hold an estimated 50,000 to 80,000 spectators.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [12.4922, 41.8902]
    },
    images: [
      "https://source.unsplash.com/800x600/?colosseum,rome,italy",
      "https://source.unsplash.com/800x600/?roman-colosseum,ancient",
      "https://source.unsplash.com/800x600/?rome-amphitheatre,history"
    ]
  },
  {
    title: "Chichen Itza, Mexico",
    description: "A complex of Mayan ruins on Mexico's Yucatan Peninsula. One of the most famous archaeological sites in Mexico, it was a major focal point in the Northern Maya Lowlands from the Late Classic through the Terminal Classic. The pyramid of Kukulkan is its most recognizable structure.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [-88.5678, 20.6843]
    },
    images: [
      "https://source.unsplash.com/800x600/?chichen-itza,mexico",
      "https://source.unsplash.com/800x600/?maya-pyramid,ruins",
      "https://source.unsplash.com/800x600/?yucatan-pyramid,mexico"
    ]
  },
  {
    title: "Himalayas, Nepal/Tibet",
    description: "A mountain range in Asia separating the plains of the Indian subcontinent from the Tibetan Plateau. The Himalayas include the highest peaks in the world, including Mount Everest (29,032 ft). The name means 'abode of snow' in Sanskrit.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [86.9226, 27.9860]
    },
    images: [
      "https://source.unsplash.com/800x600/?himalayas,mountains",
      "https://source.unsplash.com/800x600/?himilayan-peaks,nepal",
      "https://source.unsplash.com/800x600/?snow-mountains,himalayas"
    ]
  },
  {
    title: "Yellowstone National Park, USA",
    description: "An American national park located in Wyoming, Montana, and Idaho. It was established in 1872 as the first national park in the world. Famous for its geysers, hot springs, wildlife, and as the home of Old Faithful geyser.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [-110.5885, 44.4280]
    },
    images: [
      "https://source.unsplash.com/800x600/?yellowstone-national-park,usa",
      "https://source.unsplash.com/800x600/?yellowstone-geyser,fountain",
      "https://source.unsplash.com/800x600/?old-faithful,yellowstone"
    ]
  },
  {
    title: "Dubai, United Arab Emirates",
    description: "A global city and emirate in the United Arab Emirates. Known for its luxury shopping, ultramodern architecture, and lively nightlife scene. Home to the Burj Khalifa, the world's tallest building, and Palm Jumeirah, an artificial archipelago.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [55.2708, 25.2048]
    },
    images: [
      "https://source.unsplash.com/800x600/?dubai,uae,skyscrapers",
      "https://source.unsplash.com/800x600/?burj-khalifa,dubai",
      "https://source.unsplash.com/800x600/?dubai-cityscape,modern"
    ]
  },
  {
    title: "Antarctica",
    description: "Earth's southernmost continent, containing the geographic South Pole. It is situated in the Antarctic region of the Southern Hemisphere, almost entirely south of the Antarctic Circle and surrounded by the Southern Ocean. The coldest, driest, and windiest continent with the highest average elevation.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [135.0000, -82.8628]
    },
    images: [
      "https://source.unsplash.com/800x600/?antarctica,ice,glacier",
      "https://source.unsplash.com/800x600/?antarctica-polar,landscape",
      "https://source.unsplash.com/800x600/?antarctica-iceberg,frozen"
    ]
  },
  {
    title: "Northern Lights, Iceland",
    description: "A natural light display in the Earth's sky, predominantly seen in high-latitude regions. Caused by the collision of energetic charged particles with atoms in the high altitude atmosphere. Iceland offers some of the best viewing opportunities during winter months.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [-19.0208, 64.9631]
    },
    images: [
      "https://source.unsplash.com/800x600/?northern-lights,aurora,borealis",
      "https://source.unsplash.com/800x600/?aurora-iceland,northern-lights",
      "https://source.unsplash.com/800x600/?aurora-sky,nature"
    ]
  },
  {
    title: "Galápagos Islands, Ecuador",
    description: "A volcanic archipelago in the Pacific Ocean, 906 km west of continental Ecuador. Known for its endemic fauna, including marine iguanas, giant tortoises, and Darwin's finches. The inspiration for Darwin's theory of evolution by natural selection.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [-90.5667, -0.7714]
    },
    images: [
      "https://source.unsplash.com/800x600/?galapagos-islands,ecuador",
      "https://source.unsplash.com/800x600/?galapagos-wildlife,animals",
      "https://source.unsplash.com/800x600/?volcanic-island,gala"
    ]
  },
  {
    title: "Serengeti National Park, Tanzania",
    description: "A Tanzanian national park in the Serengeti ecosystem, famous for the Great Migration of over 1.5 million wildebeest and 250,000 zebras and gazelles. One of the most famous wildlife reserves in the world, known for its large lion population.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [34.8333, -2.3166]
    },
    images: [
      "https://source.unsplash.com/800x600/?serengeti,tanzania,safari",
      "https://source.unsplash.com/800x600/?african-safari,wildlife",
      "https://source.unsplash.com/800x600/?serengeti-migration,animals"
    ]
  },
  {
    title: "Bora Bora, French Polynesia",
    description: "A volcanic island in the Leeward group of the Society Islands of French Polynesia. Known for its crystal-clear ocean, white-sand beaches, and luxurious overwater bungalows. Surrounded by a coral reef and a lagoon, making it an ideal diving and snorkeling destination.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [-151.5556, -16.4444]
    },
    images: [
      "https://source.unsplash.com/800x600/?bora-bora,polynesia,island",
      "https://source.unsplash.com/800x600/?overwater-bungalows,bora",
      "https://source.unsplash.com/800x600/?tropical-island,lagoon"
    ]
  },
  {
    title: "Cappadocia, Turkey",
    description: "A historical region in Central Anatolia in Turkey. Famous for its 'fairy chimneys' rock formations and ancient cave dwellings carved out of soft rock. One of the most visited tourist destinations in Turkey, offering hot air balloon rides and unique geological formations.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [34.8500, 38.6500]
    },
    images: [
      "https://source.unsplash.com/800x600/?cappadocia,turkey,hot-air-balloon",
      "https://source.unsplash.com/800x600/?fairy-chimneys,cave",
      "https://source.unsplash.com/800x600/?cappadocia-landscape,rock"
    ]
  },
  {
    title: "Bali, Indonesia",
    description: "A volcanic island and province of Indonesia. Known for its forested volcanic mountains, iconic rice paddies, beaches and coral reefs. Famous for its Hindu culture, art, dance and highly developed agricultural system with unique subak irrigation system.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [115.0920, -8.3405]
    },
    images: [
      "https://source.unsplash.com/800x600/?bali,indonesia,temple",
      "https://source.unsplash.com/800x600/?bali-beach,hindu",
      "https://source.unsplash.com/800x600/?bali-rice-terrace,indonesia"
    ]
  },
  {
    title: "Loire Valley, France",
    description: "A region of France along the Loire River. It is noteworthy for its architectural heritage, in particular its châteaux, as well as natural scenery and wines. Often referred to as the 'Garden of France' due to its fertile soil and high agricultural use.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [0.4244, 47.5875]
    },
    images: [
      "https://source.unsplash.com/800x600/?loire-valley,france,chateau",
      "https://source.unsplash.com/800x600/?french-countryside,castle",
      "https://source.unsplash.com/800x600/?vineyard-loire,france"
    ]
  },
  {
    title: "Iguazu Falls, Argentina/Brazil",
    description: "A waterfall system along the Iguazu River on the border of the Argentine province of Misiones and the Brazilian state of Paraná. Comprises 275 individual falls and drops of up to 269 feet, creating one of the most spectacular waterfall systems in the world.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [-54.4367, -25.6953]
    },
    images: [
      "https://source.unsplash.com/800x600/?iguazu-falls,argentina",
      "https://source.unsplash.com/800x600/?iguazu-waterfall,brazil",
      "https://source.unsplash.com/800x600/?waterfall-system,iguazu"
    ]
  },
  {
    title: "Reykjavik, Iceland",
    description: "The capital and largest city of Iceland. It is the northernmost capital in the world and the most sparsely populated capital in Europe. Known for its colorful houses, vibrant cultural scene, and as a gateway to Iceland's natural wonders.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [-21.9426, 64.1466]
    },
    images: [
      "https://source.unsplash.com/800x600/?reykjavik,iceland,capital",
      "https://source.unsplash.com/800x600/?iceland-city,nordic",
      "https://source.unsplash.com/800x600/?nordic-capital,urban"
    ]
  },
  {
    title: "Cinque Terre, Italy",
    description: "A string of five coastal villages in the Liguria region of Italy. Known for its colorful houses built into cliffs, beautiful beaches, and hiking trails connecting the villages. A UNESCO World Heritage Site representing dramatic human interaction with a challenging natural environment.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [9.7771, 44.1470]
    },
    images: [
      "https://source.unsplash.com/800x600/?cinque-terre,italy,coast",
      "https://source.unsplash.com/800x600/?italian-coast,village",
      "https://source.unsplash.com/800x600/?liguria-cliffs,mediterranean"
    ]
  },
  {
    title: "Sahara Desert, Morocco",
    description: "The largest hot desert in the world, located in North Africa. The name 'Sahara' comes from the Arabic word for desert. Known for its vast sand dunes, rocky plateaus, oases, and unique climate. A landscape that has been home to humans for about 10,000 years.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [13.1667, 25.2500]
    },
    images: [
      "https://source.unsplash.com/800x600/?sahara-desert,morocco",
      "https://source.unsplash.com/800x600/?desert-sand-dunes,sahara",
      "https://source.unsplash.com/800x600/?sahara-landscape,desert"
    ]
  },
  {
    title: "Kyoto, Japan",
    description: "A city on the island of Honshu, Japan. A former capital of Japan, it is known for its classical Buddhist temples, as well as gardens, imperial palaces, Shinto shrines, and traditional wooden houses. Home to more than 1,600 temples and shrines.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [135.7681, 35.0116]
    },
    images: [
      "https://source.unsplash.com/800x600/?kyoto,japan,temple",
      "https://source.unsplash.com/800x600/?japanese-garden,kyoto",
      "https://source.unsplash.com/800x600/?traditional-kyoto,japan"
    ]
  },
  {
    title: "Fiji Islands",
    description: "An island country in Melanesia in the South Pacific Ocean. Consists of 320 islands, of which 110 are permanently inhabited, and more than 500 islets. Known for its crystal-clear waters, white-sand beaches, and diverse coral reefs perfect for snorkeling and diving.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [178.0650, -17.7134]
    },
    images: [
      "https://source.unsplash.com/800x600/?fiji-islands,pacific",
      "https://source.unsplash.com/800x600/?fiji-beach,paradise",
      "https://source.unsplash.com/800x600/?tropical-fiji,ocean"
    ]
  },
  {
    title: "Prague, Czech Republic",
    description: "The capital and largest city of the Czech Republic. Known for its Old Town Square, Astronomical Clock, and Prague Castle, one of the largest ancient castle complexes in the world. Often called the 'City of a Hundred Spires' due to its baroque churches.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [14.4378, 50.0755]
    },
    images: [
      "https://source.unsplash.com/800x600/?prague,czech-republic,castle",
      "https://source.unsplash.com/800x600/?czech-capital,gothic",
      "https://source.unsplash.com/800x600/?prague-astronomical-clock"
    ]
  },
  {
    title: "Madagascar",
    description: "An island country in the Indian Ocean, approximately 400 kilometers east of the coast of Mozambique. Known for its extraordinary biodiversity and unique wildlife, with over 90% of its wildlife found nowhere else on Earth, including many species of lemur.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [46.8691, -18.7669]
    },
    images: [
      "https://source.unsplash.com/800x600/?madagascar,island,biodiversity",
      "https://source.unsplash.com/800x600/?madagascar-lemurs,wildlife",
      "https://source.unsplash.com/800x600/?unique-wildlife,madagascar"
    ]
  },
  {
    title: "Budapest, Hungary",
    description: "The capital and largest city of Hungary, formed by the merger of Buda and Pest in 1873. Known for its grand architecture, thermal baths, and the Danube River that divides the city. The Parliament Building is one of the most iconic landmarks in Europe.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [19.0402, 47.4979]
    },
    images: [
      "https://source.unsplash.com/800x600/?budapest,hungary,parliament",
      "https://source.unsplash.com/800x600/?danube-river,budapest",
      "https://source.unsplash.com/800x600/?hungarian-capital,architecture"
    ]
  },
  {
    title: "Ladakh, India",
    description: "A high-altitude desert in the Eastern Karakoram and Western Himalayan Ranges. Known as 'Little Tibet' due to its stark landscape and Tibetan Buddhist culture. Home to some of the highest mountain passes in the world and unique high-altitude wildlife.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [77.3595, 34.2996]
    },
    images: [
      "https://source.unsplash.com/800x600/?ladakh,india,himalayas",
      "https://source.unsplash.com/800x600/?tibetan-buddhist,monastery",
      "https://source.unsplash.com/800x600/?high-altitude-desert,himalayas"
    ]
  },
  {
    title: "Seychelles",
    description: "An archipelago of 115 islands in the Indian Ocean, off the coast of East Africa. Known for its pristine beaches, turquoise waters, and unique granite boulder formations. Home to some of the world's oldest mid-ocean islands and unique flora and fauna.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [55.4913, -4.6828]
    },
    images: [
      "https://source.unsplash.com/800x600/?seychelles,island,beach",
      "https://source.unsplash.com/800x600/?seychelles-granite-rocks",
      "https://source.unsplash.com/800x600/?tropical-island,seychelles"
    ]
  },
  {
    title: "Patagonia, Argentina/Chile",
    description: "A vast region shared by Argentina and Chile, known for its dramatic landscapes including glacial lakes, rugged coastlines, and the famous Torres del Paine mountains. One of the last pristine wilderness areas on Earth, with unique wildlife including guanacos and pumas.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [-71.2500, -48.6333]
    },
    images: [
      "https://source.unsplash.com/800x600/?patagonia,argentina,torres",
      "https://source.unsplash.com/800x600/?glacial-lake,patagonia",
      "https://source.unsplash.com/800x600/?andes-mountains,patagonia"
    ]
  },
  {
    title: "Swiss Alps, Switzerland",
    description: "A mountain range in the Alps, located in Switzerland. Part of the larger Alpine system, it includes some of the highest peaks in Europe, including the Matterhorn and Mount Dufour. Famous for skiing, mountaineering, and breathtaking Alpine scenery.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [8.0702, 46.3742]
    },
    images: [
      "https://source.unsplash.com/800x600/?swiss-alps,switzerland",
      "https://source.unsplash.com/800x600/?alpine-mountains,swiss",
      "https://source.unsplash.com/800x600/?matterhorn,swiss-alps"
    ]
  },
  {
    title: "Zanzibar, Tanzania",
    description: "An island in the Indian Ocean, 25 miles off the coast of Tanzania. Known for its spice plantations, historic Stone Town, and beautiful beaches. The island has a unique blend of African, Arab, Indian, and European cultures.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [39.2083, -6.1630]
    },
    images: [
      "https://source.unsplash.com/800x600/?zanzibar,tanzania,stone-town",
      "https://source.unsplash.com/800x600/?zanzibar-beach,spice",
      "https://source.unsplash.com/800x600/?african-island,zanzibar"
    ]
  },
  {
    title: "New Zealand",
    description: "An island country in the southwestern Pacific Ocean. Known for its geologically young mountainous terrain, pristine fjords, and unique wildlife including the flightless kiwi bird. Also famous for its Maori culture and as a filming location for The Lord of the Rings series.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [172.8346, -41.5001]
    },
    images: [
      "https://source.unsplash.com/800x600/?new-zealand,landscape",
      "https://source.unsplash.com/800x600/?kiwi-bird,nz",
      "https://source.unsplash.com/800x600/?maori-culture,new-zealand"
    ]
  },
  {
    title: "Morocco",
    description: "A country in the Maghreb region of North Africa, bordered by the Atlantic Ocean and Mediterranean Sea. Known for its vibrant culture, historic cities like Marrakech and Fez with their traditional souks, and the Atlas Mountains. A crossroads where African, Middle Eastern, and European cultures meet.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [-7.0926, 31.7917]
    },
    images: [
      "https://source.unsplash.com/800x600/?morocco,atlas-mountains",
      "https://source.unsplash.com/800x600/?marrakech,souk",
      "https://source.unsplash.com/800x600/?maghreb-culture,morocco"
    ]
  },
  {
    title: "Sri Lanka",
    description: "An island country in South Asia, located in the Indian Ocean. Known as the 'Pearl of the Indian Ocean' for its natural beauty and rich cultural heritage. Features ancient cities, spice gardens, tea plantations, and diverse wildlife including Asian elephants and leopards.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [80.7718, 7.8731]
    },
    images: [
      "https://source.unsplash.com/800x600/?sri-lanka,tear-lanka",
      "https://source.unsplash.com/800x600/?sri-lankan-tea,plantation",
      "https://source.unsplash.com/800x600/?ancient-sri-lanka,heritage"
    ]
  },
  {
    title: "Bhutan",
    description: "A landlocked country in South Asia, located at the eastern end of the Himalayas. Known as the 'Land of the Thunder Dragon' and famous for its monasteries, fortresses, and dzongs. It's the only country in the world that measures gross national happiness instead of gross domestic product.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [90.4336, 27.5142]
    },
    images: [
      "https://source.unsplash.com/800x600/?bhutan,himalayas,monastery",
      "https://source.unsplash.com/800x600/?dzongs,bhutan,fortress",
      "https://source.unsplash.com/800x600/?himalayan-kingdom,bhutan"
    ]
  },
  {
    title: "Maldives",
    description: "An island nation in the Indian Ocean, located southwest of India and Sri Lanka. Comprises 1,192 coral islands grouped into 26 atolls, spread over roughly 34,000 square miles. Known for its crystal-clear waters, white-sand beaches, and coral reefs.",
    category: "nature",
    location: {
      type: "Point",
      coordinates: [73.2207, 3.2028]
    },
    images: [
      "https://source.unsplash.com/800x600/?maldives,overwater-bungalows",
      "https://source.unsplash.com/800x600/?maldives-beach,tropical",
      "https://source.unsplash.com/800x600/?coral-atolls,maldives"
    ]
  },
  {
    title: "Jordan",
    description: "A country in Western Asia, on the East Bank of the Jordan River. Home to ancient cities like Petra, the Dead Sea (the lowest point on Earth), and Wadi Rum (famous for its desert wadis and rock bridges). A bridge between the three continents of Asia, Africa, and Europe.",
    category: "culture",
    location: {
      type: "Point",
      coordinates: [36.2384, 30.5852]
    },
    images: [
      "https://source.unsplash.com/800x600/?jordan,petra,desert",
      "https://source.unsplash.com/800x600/?dead-sea,jordan",
      "https://source.unsplash.com/800x600/?wadi-rum,jordan"
    ]
  }
];

// Function to create posts in the database
async function createSamplePosts() {
  try {
    // Connect to the database directly with proper options to avoid TLS conflicts
    await mongoose.connect(process.env.MONGODB_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/pin_quest", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Clear existing sample posts (optional - remove if you don't want to clear)
    console.log("Removing existing sample posts...");
    await Post.deleteMany({
      title: { $regex: /, (France|USA|China|Peru|India|Greece|Australia|Egypt|Brazil|Canada|Japan|England|Jordan|Italy|Mexico|Nepal|Tibet|USA|UAE|Iceland|Ecuador|Tanzania|French Polynesia|Turkey|Indonesia|Morocco|Tanzania|Hungary|Chile|Switzerland|Madagascar|Czech Republic|Bhutan|Maldives)$/ }
    });

    console.log(`Creating ${fiftyPlusLocations.length} sample posts...`);
    
    for (const place of fiftyPlusLocations) {
      try {
        // Create a new post with placeholder images
        const post = new Post({
          title: place.title,
          description: place.description,
          image: {
            url: place.images[0], // Use first image as main image
            publicId: null
          },
          images: place.images.map(img => ({
            url: img,
            publicId: null
          })),
          postedBy: null, // This would be an actual user ID in production
          category: place.category,
          location: place.location, // GeoJSON format [longitude, latitude]
          status: 'published' // Make them visible immediately
        });

        await post.save();
        console.log(`✓ Created post for: ${place.title}`);
      } catch (error) {
        console.error(`✗ Error creating post for ${place.title}:`, error.message);
      }
    }

    console.log(`\nSuccessfully created ${fiftyPlusLocations.length} sample posts!`);
    console.log("These posts will now appear on your map automatically.");
    
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error in createSamplePosts script:", error);
    process.exit(1);
  }
}

// Execute the script
createSamplePosts();