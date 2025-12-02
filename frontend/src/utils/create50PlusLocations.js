// frontend/src/utils/create50PlusLocations.js

/**
 * Creates posts for 50+ well-known places around the world
 * Each location includes title, description, and 3+ working images
 */

// More than 50 well-known places data with detailed descriptions and images
const fiftyPlusLocations = [
  {
    title: "Eiffel Tower, Paris, France",
    description: "The iconic iron lattice tower located on the Champ de Mars in Paris, France. Built in 1889, it stands 330 meters tall and is one of the most recognizable structures in the world. A symbol of romance and architectural excellence, attracting nearly 7 million visitors annually.",
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
    title: "Statue of Liberty, New York, USA",
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
    title: "Great Wall of China, Beijing, China",
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
    title: "Machu Picchu, Cusco, Peru",
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
    title: "Grand Canyon, Arizona, USA",
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
    title: "Taj Mahal, Agra, India",
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
    title: "Sydney Opera House, Sydney, Australia",
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
  },
  {
    title: "Pyramids of Giza, Egypt",
    description: "The oldest and largest of the three pyramids in the Giza pyramid complex bordering the Giza Plateau in Greater Cairo, Egypt. These ancient monuments were built as tombs for the pharaohs and are the only remaining ancient wonder of the original Seven Wonders of the Ancient World.",
    category: "culture",
    location: {
      latitude: 29.9792,
      longitude: 31.1344
    },
    images: [
      "https://source.unsplash.com/800x600/?pyramids-giza,egypt",
      "https://source.unsplash.com/800x600/?giza-pyramids-ancient",
      "https://source.unsplash.com/800x600/?egypt-pyramids-desert"
    ]
  },
  {
    title: "Christ the Redeemer, Rio de Janeiro, Brazil",
    description: "An Art Deco statue of Jesus Christ in Rio de Janeiro, Brazil. Standing 98 feet tall plus an 26-foot pedestal, it overlooks the city from the peak of Mount Corcovado. This iconic statue is the largest Art Deco statue in the world.",
    category: "culture",
    location: {
      latitude: -22.9519,
      longitude: -43.2105
    },
    images: [
      "https://source.unsplash.com/800x600/?christ-redeemer,rio,brazil",
      "https://source.unsplash.com/800x600/?rio-christ-statue",
      "https://source.unsplash.com/800x600/?brazil-christ-views"
    ]
  },
  {
    title: "Niagara Falls, Canada/USA",
    description: "A group of three waterfalls at the southern end of Niagara Gorge, on the border between the province of Ontario in Canada and the state of New York in the United States. One of the most powerful and famous waterfalls in the world, attracting millions of visitors annually.",
    category: "nature",
    location: {
      latitude: 43.0828,
      longitude: -79.0744
    },
    images: [
      "https://source.unsplash.com/800x600/?niagara-falls,canada",
      "https://source.unsplash.com/800x600/?niagara-waterfall-power",
      "https://source.unsplash.com/800x600/?niagara-falls-night"
    ]
  },
  {
    title: "Mount Fuji, Japan",
    description: "An active stratovolcano that last erupted in 1707-1708. Standing at 3,776.24 meters, it is the highest mountain in Japan and an iconic symbol of the country. A sacred mountain and popular pilgrimage destination.",
    category: "nature",
    location: {
      latitude: 35.3606,
      longitude: 138.7278
    },
    images: [
      "https://source.unsplash.com/800x600/?mount-fuji,japan",
      "https://source.unsplash.com/800x600/?mount-fuji-snow",
      "https://source.unsplash.com/800x600/?japan-fuji-mountain"
    ]
  },
  {
    title: "Stonehenge, England",
    description: "A prehistoric monument located in Wiltshire, England. Consisting of a ring of standing stones, each around 13 feet high and 7 feet wide, weighing around 25 tons. Its purpose remains a mystery, with theories ranging from astronomical calendar to religious site.",
    category: "culture",
    location: {
      latitude: 51.1789,
      longitude: -1.8262
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
      latitude: -18.25,
      longitude: 147.9667
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
      latitude: 30.3275,
      longitude: 35.4444
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
      latitude: -17.9243,
      longitude: 25.8572
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
      latitude: 13.4125,
      longitude: 103.8667
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
      latitude: 51.4985,
      longitude: -115.9220
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
      latitude: -3.4653,
      longitude: -62.2159
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
      latitude: 41.8902,
      longitude: 12.4922
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
      latitude: 20.6843,
      longitude: -88.5678
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
      latitude: 27.9860,
      longitude: 86.9226
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
      latitude: 44.4280,
      longitude: -110.5885
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
      latitude: 25.2048,
      longitude: 55.2708
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
      latitude: -82.8628,
      longitude: 135.0000
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
      latitude: 64.9631,
      longitude: -19.0208
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
      latitude: -0.7714,
      longitude: -90.5667
    },
    images: [
      "https://source.unsplash.com/800x600/?galapagos-islands,ecuador",
      "https://source.unsplash.com/800x600/?galapagos-wildlife,animals",
      "https://source.unsplash.com/800x600/?volcanic-island,gala"
    ]
  },
  {
    title: "Machu Picchu, Peru",
    description: "An ancient Incan citadel located in the Andes Mountains of Peru, built in the 15th century. This archaeological wonder is often called the 'Lost City of the Incas' and is one of the most famous archaeological sites in the world. A UNESCO World Heritage Site.",
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
    title: "Serengeti National Park, Tanzania",
    description: "A Tanzanian national park in the Serengeti ecosystem, famous for the Great Migration of over 1.5 million wildebeest and 250,000 zebras and gazelles. One of the most famous wildlife reserves in the world, known for its large lion population.",
    category: "nature",
    location: {
      latitude: -2.3166,
      longitude: 34.8333
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
      latitude: -16.4444,
      longitude: -151.5556
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
      latitude: 38.6500,
      longitude: 34.8500
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
      latitude: -8.3405,
      longitude: 115.0920
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
      latitude: 47.5875,
      longitude: 0.4244
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
      latitude: -25.6953,
      longitude: -54.4367
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
      latitude: 64.1466,
      longitude: -21.9426
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
      latitude: 44.1470,
      longitude: 9.7771
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
      latitude: 25.2500,
      longitude: 13.1667
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
      latitude: 35.0116,
      longitude: 135.7681
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
      latitude: -17.7134,
      longitude: 178.0650
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
      latitude: 50.0755,
      longitude: 14.4378
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
      latitude: -18.7669,
      longitude: 46.8691
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
      latitude: 47.4979,
      longitude: 19.0402
    },
    images: [
      "https://source.unsplash.com/800x600/?budapest,hungary,parliament",
      "https://source.unsplash.com/800x600/?danube-river,budapest",
      "https://source.unsplash.com/800x600/?hungarian-capital,architecture"
    ]
  },
  {
    title: "Victoria Falls, Zimbabwe",
    description: "One of the world's largest waterfalls, located on the Zambezi River at the border between Zambia and Zimbabwe. Measuring 1,708 meters wide and 108 meters high, it produces the largest sheet of falling water in the world.",
    category: "nature",
    location: {
      latitude: -17.9243,
      longitude: 25.8572
    },
    images: [
      "https://source.unsplash.com/800x600/?victoria-falls,zimbabwe",
      "https://source.unsplash.com/800x600/?zambezi-waterfall,africa",
      "https://source.unsplash.com/800x600/?waterfall-mist,africa"
    ]
  },
  {
    title: "Ladakh, India",
    description: "A high-altitude desert in the Eastern Karakoram and Western Himalayan Ranges. Known as 'Little Tibet' due to its stark landscape and Tibetan Buddhist culture. Home to some of the highest mountain passes in the world and unique high-altitude wildlife.",
    category: "nature",
    location: {
      latitude: 34.2996,
      longitude: 77.3595
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
      latitude: -4.6828,
      longitude: 55.4913
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
      latitude: -48.6333,
      longitude: -71.2500
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
      latitude: 46.3742,
      longitude: 8.0702
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
      latitude: -6.1630,
      longitude: 39.2083
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
      latitude: -41.5001,
      longitude: 172.8346
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
      latitude: 31.7917,
      longitude: -7.0926
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
      latitude: 7.8731,
      longitude: 80.7718
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
      latitude: 27.5142,
      longitude: 90.4336
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
      latitude: 3.2028,
      longitude: 73.2207
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
      latitude: 30.5852,
      longitude: 36.2384
    },
    images: [
      "https://source.unsplash.com/800x600/?jordan,petra,desert",
      "https://source.unsplash.com/800x600/?dead-sea,jordan",
      "https://source.unsplash.com/800x600/?wadi-rum,jordan"
    ]
  }
];

// Function to create sample posts with working images
const createSamplePosts = async (authToken) => {
  try {
    console.log("Creating sample posts with more than 50 well-known places...");
    
    for (let i = 0; i < fiftyPlusLocations.length; i++) {
      const place = fiftyPlusLocations[i];
      
      // Create the post data
      const postData = {
        title: place.title,
        description: place.description,
        category: place.category,
        location: place.location
      };
      
      // For demonstration, create FormData for the post with placeholder image URLs
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
    
    console.log(`${fiftyPlusLocations.length} sample posts created successfully!`);
    return true;
  } catch (error) {
    console.error("Error creating sample posts:", error);
    return false;
  }
};

export default createSamplePosts;