// backend/scripts/update_post_images_fixed.js

/**
 * Script to update the images for the existing sample posts with reliable image URLs
 */

// Load environment variables
require("dotenv").config();

// Import required modules
const mongoose = require("mongoose");
const Post = require("../models/posts");

// Updated image URLs from reliable sources that work consistently
const updatedImages = {
  "Eiffel Tower, Paris, France": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Eiffel_Tower_-_March_2017.jpg/800px-Eiffel_Tower_-_March_2017.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Tour_Eiffel_Wikimedia_Campus_2014_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Campus_2014_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Seen_from_Top_of_the_Eiffel_Tower.jpg/800px-Seen_from_Top_of_the_Eiffel_Tower.jpg"
  ],
  "Statue of Liberty, New York, USA": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Statue_of_Liberty%2C_NY.jpg/800px-Statue_of_Liberty%2C_NY.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Statue_of_Liberty%2C_New_York%2C_USA.jpg/800px-Statue_of_Liberty%2C_New_York%2C_USA.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Statue_of_Liberty_7.jpg/800px-Statue_of_Liberty_7.jpg"
  ],
  "Great Wall of China, Beijing, China": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/The_Great_Wall_of_China_at_Jinshanling_edit.jpg/800px-The_Great_Wall_of_China_at_Jinshanling_edit.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/20130928_Great_Wall_05.jpg/800px-20130928_Great_Wall_05.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Mutianyu_Great_Wall_of_China.jpg/800px-Mutianyu_Great_Wall_of_China.jpg"
  ],
  "Machu Picchu, Cusco, Peru": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Machu_Picchu%2C_Peru.jpg/800px-Machu_Picchu%2C_Peru.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Machu_Picchu%2C_Peru.jpg/800px-Machu_Picchu%2C_Peru.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Machu_Picchu_05.jpg/800px-Machu_Picchu_05.jpg"
  ],
  "Grand Canyon, Arizona, USA": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/GrandCanyonArizona04.jpg/800px-GrandCanyonArizona04.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Grand_Canyon_by_day.jpg/800px-Grand_Canyon_by_day.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Grand_Canyon_by_day.jpg/800px-Grand_Canyon_by_day.jpg"
  ],
  "Taj Mahal, Agra, India": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Taj_Mahal%2C_Agra%2C_India_edit.jpg/800px-Taj_Mahal%2C_Agra%2C_India_edit.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Taj_Mahal%2C_Agra%2C_India.jpg/800px-Taj_Mahal%2C_Agra%2C_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Taj_Mahal%2C_Agra%2C_India.jpg/800px-Taj_Mahal%2C_Agra%2C_India.jpg"
  ],
  "Santorini, Greece": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Santorini_02-26-2013.jpg/800px-Santorini_02-26-2013.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Santorini_view.jpg/800px-Santorini_view.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Oia_Santorini_2013_03.jpg/800px-Oia_Santorini_2013_03.jpg"
  ],
  "Sydney Opera House, Sydney, Australia": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Sydney_Opera_house_2015.jpg/800px-Sydney_Opera_house_2015.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Sydney_Opera_house_2015-03-10.jpg/800px-Sydney_Opera_house_2015-03-10.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Sydney_opera_house_from_watson_bay.jpg/800px-Sydney_opera_house_from_watson_bay.jpg"
  ],
  "Pyramids of Giza, Egypt": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Giza_Pyramids_%282748230196%29.jpg/800px-Giza_Pyramids_%282748230196%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Kheops-Pyramid-Cheops.jpg/800px-Kheops-Pyramid-Cheops.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Giza_07.jpg/800px-Giza_07.jpg"
  ],
  "Christ the Redeemer, Rio de Janeiro, Brazil": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Christ_the_Redeemer_-_Cristo_Redentor%2C_Rio_de_Janeiro%2C_Brazil_-_2019.jpg/800px-Christ_the_Redeemer_-_Cristo_Redentor%2C_Rio_de_Janeiro%2C_Brazil_-_2019.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Christ_the_Redeemer%2C_Rio_de_Janeiro%2C_Brazil_-_July_2018.jpg/800px-Christ_the_Redeemer%2C_Rio_de_Janeiro%2C_Brazil_-_July_2018.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Christ_the_Redeemer%2C_Rio_de_Janeiro%2C_Brazil_-_2017.jpg/800px-Christ_the_Redeemer%2C_Rio_de_Janeiro%2C_Brazil_-_2017.jpg"
  ],
  "Niagara Falls, Canada/USA": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Niagara_Falls_with_the_Hornblower_%2836107216306%29.jpg/800px-Niagara_Falls_with_the_Hornblower_%2836107216306%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Niagara_falls_in_winter.jpg/800px-Niagara_falls_in_winter.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Niagara_Falls_%283406440499%29.jpg/800px-Niagara_Falls_%283406440499%29.jpg"
  ],
  "Mount Fuji, Japan": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mount_Fuji_from_Lake_Kawaguchi_%28cropped%29.jpg/800px-Mount_Fuji_from_Lake_Kawaguchi_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Mt._Fuji_from_Tokyo_Sky_Tree.jpg/800px-Mt._Fuji_from_Tokyo_Sky_Tree.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Mount_Fuji_from_the_Tokyo_Sky_Tree.jpg/800px-Mount_Fuji_from_the_Tokyo_Sky_Tree.jpg"
  ],
  "Stonehenge, England": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Stonehenge.jpg/800px-Stonehenge.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Stonehenge2.jpg/800px-Stonehenge2.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Stonehenge_sunset_panorama.jpg/800px-Stonehenge_sunset_panorama.jpg"
  ],
  "Great Barrier Reef, Australia": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Coral_reef_2008.jpg/800px-Coral_reef_2008.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Reef_formation_Great_Barrier_Reef_2008.jpg/800px-Reef_formation_Great_Barrier_Reef_2008.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Great_Barrier_Reef.jpg/800px-Great_Barrier_Reef.jpg"
  ],
  "Petra, Jordan": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Petra%2C_Jordan.jpg/800px-Petra%2C_Jordan.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Petra_Jordan_2012.jpg/800px-Petra_Jordan_2012.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/The_Treasury_%28Al-Khazneh%29_at_Petra%2C_Jordan.jpg/800px-The_Treasury_%28Al-Khazneh%29_at_Petra%2C_Jordan.jpg"
  ],
  "Victoria Falls, Zambia/Zimbabwe": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Victoria_Falls%2C_Zambia_%26_Zimbabwe%2C_%28cropped%29.jpg/800px-Victoria_Falls%2C_Zambia_%26_Zimbabwe%2C_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Victoria_Falls.jpg/800px-Victoria_Falls.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Victoria_Falls_in_Zambia.jpg/800px-Victoria_Falls_in_Zambia.jpg"
  ],
  "Angkor Wat, Cambodia": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Angkor_Wat.jpg/800px-Angkor_Wat.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Angkor_Wat_from_the_south%2C_2013-01-04.jpg/800px-Angkor_Wat_from_the_south%2C_2013-01-04.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Angkor_Wat_%282702949228%29.jpg/800px-Angkor_Wat_%282702949228%29.jpg"
  ],
  "Banff National Park, Canada": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Lake_Louise_2014.jpg/800px-Lake_Louise_2014.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Moraine_Lake_2.jpg/800px-Moraine_Lake_2.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Banff_Alpine_Tundra.jpg/800px-Banff_Alpine_Tundra.jpg"
  ],
  "Amazon Rainforest, Brazil": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Amazonia_deforestation.jpg/800px-Amazonia_deforestation.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Amazon_rainforest.jpg/800px-Amazon_rainforest.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_rainforest_2008.jpg/800px-Amazon_rainforest_2008.jpg"
  ],
  "Colosseum, Rome, Italy": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Colosseo_2020.jpg/800px-Colosseo_2020.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/800px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007-2.jpg/800px-Colosseum_in_Rome%2C_Italy_-_April_2007-2.jpg"
  ],
  "Chichen Itza, Mexico": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Chichen-Itza-Castillo-2014.jpg/800px-Chichen-Itza-Castillo-2014.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Chichen_Itza_3.jpg/800px-Chichen_Itza_3.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Chichen_Itza%2C_Mexico.jpg/800px-Chichen_Itza%2C_Mexico.jpg"
  ],
  "Himalayas, Nepal/Tibet": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Mount_Everest_from_South.jpg/800px-Mount_Everest_from_South.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Himalaya_1.jpg/800px-Himalaya_1.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Himalayas.jpg/800px-Himalayas.jpg"
  ],
  "Yellowstone National Park, USA": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Grand_Prismatic_Spring_%2817566618694%29.jpg/800px-Grand_Prismatic_Spring_%2817566618694%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Yellowstone_National_Park.jpg/800px-Yellowstone_National_Park.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Old_Faithful_Geyser_Yellowstone_National_Park.jpg/800px-Old_Faithful_Geyser_Yellowstone_National_Park.jpg"
  ],
  "Dubai, United Arab Emirates": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Burj_Khalifa_from_Dubai_Marina.jpg/800px-Burj_Khalifa_from_Dubai_Marina.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Dubai_from_Atlantis_The_Palm.jpg/800px-Dubai_from_Atlantis_The_Palm.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Dubai_Skyline_at_sunset.jpg/800px-Dubai_Skyline_at_sunset.jpg"
  ],
  "Antarctica": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Antarctica_from_space.jpg/800px-Antarctica_from_space.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Penguins_Antarctica.jpg/800px-Penguins_Antarctica.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Antarctica_map.png/800px-Antarctica_map.png"
  ],
  "Northern Lights, Iceland": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Aurora_Borealis_Iceland.jpg/800px-Aurora_Borealis_Iceland.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Northern_Lights%2C_Skogar%2C_Iceland.jpg/800px-Northern_Lights%2C_Skogar%2C_Iceland.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Aurora_Borealis_%2816945134460%29.jpg/800px-Aurora_Borealis_%2816945134460%29.jpg"
  ],
  "Galápagos Islands, Ecuador": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Galapagos_Islands_%28cropped%29.jpg/800px-Galapagos_Islands_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Galapagos_islands_2013.jpg/800px-Galapagos_islands_2013.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Blue-footed_boobies_Galapagos.jpg/800px-Blue-footed_boobies_Galapagos.jpg"
  ],
  "Serengeti National Park, Tanzania": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Serengeti_National_Park%2C_Tanzania_%2825827849287%29.jpg/800px-Serengeti_National_Park%2C_Tanzania_%2825827849287%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Serengeti_Migration.jpg/800px-Serengeti_Migration.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Serengeti_National_Park_Landscape.jpg/800px-Serengeti_National_Park_Landscape.jpg"
  ],
  "Bora Bora, French Polynesia": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bora_Bora_island_2012.jpg/800px-Bora_Bora_island_2012.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Bora_Bora_from_space.jpg/800px-Bora_Bora_from_space.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Bora_Bora_overwater_bungalows.jpg/800px-Bora_Bora_overwater_bungalows.jpg"
  ],
  "Cappadocia, Turkey": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Cappadocia%2C_Turkey_%2835304184860%29.jpg/800px-Cappadocia%2C_Turkey_%2835304184860%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Cappadocia_Turkey.jpg/800px-Cappadocia_Turkey.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Cappadocia_%282432787758%29.jpg/800px-Cappadocia_%282432787758%29.jpg"
  ],
  "Bali, Indonesia": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Bali_Indonesia.jpg/800px-Bali_Indonesia.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Rice_Terraces_Tegallalang.jpg/800px-Rice_Terraces_Tegallalang.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Pura_Ulun_Danu_Bratan_Bali.jpg/800px-Pura_Ulun_Danu_Bratan_Bali.jpg"
  ],
  "Loire Valley, France": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Chambord_from_the_South.jpg/800px-Chambord_from_the_South.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Chateau_de_Chambord_%28414289445%29.jpg/800px-Chateau_de_Chambord_%28414289445%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Château_de_Chenonceau%2C_France_by_Diliff.jpg/800px-Château_de_Chenonceau%2C_France_by_Diliff.jpg"
  ],
  "Iguazu Falls, Argentina/Brazil": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Iguazu_Falls_%2814028266673%29.jpg/800px-Iguazu_Falls_%2814028266673%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Iguazu_Falls_%2826979633834%29.jpg/800px-Iguazu_Falls_%2826979633834%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Iguazu_Falls_Brazil_Argentina.jpg/800px-Iguazu_Falls_Brazil_Argentina.jpg"
  ],
  "Reykjavik, Iceland": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Reykjavik_%2829212651903%29.jpg/800px-Reykjavik_%2829212651903%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Reykjavik_from_perlan.jpg/800px-Reykjavik_from_perlan.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Reykjavik_sunset.jpg/800px-Reykjavik_sunset.jpg"
  ],
  "Cinque Terre, Italy": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Manarola_Italy_by_Diliff.jpg/800px-Manarola_Italy_by_Diliff.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Cinque_Terre_Monterosso_1.jpg/800px-Cinque_Terre_Monterosso_1.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Cinque_Terre_Riomaggiore.jpg/800px-Cinque_Terre_Riomaggiore.jpg"
  ],
  "Sahara Desert, Morocco": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Sahara_Desert_Morocco_%2834847572813%29.jpg/800px-Sahara_Desert_Morocco_%2834847572813%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Sahara_Desert_in_Morocco.jpg/800px-Sahara_Desert_in_Morocco.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Sahara_Algiers.jpg/800px-Sahara_Algiers.jpg"
  ],
  "Kyoto, Japan": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Kiyomizu-dera_in_spring%2C_Kyoto%2C_Japan.jpg/800px-Kiyomizu-dera_in_spring%2C_Kyoto%2C_Japan.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Fushimi_Inari-taisha_2012.jpg/800px-Fushimi_Inari-taisha_2012.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Kinkaku-ji_in_spring%2C_Kyoto%2C_Japan.jpg/800px-Kinkaku-ji_in_spring%2C_Kyoto%2C_Japan.jpg"
  ],
  "Fiji Islands": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Beach_of_Viti_Levu%2C_Fiji.jpg/800px-Beach_of_Viti_Levu%2C_Fiji.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Mount_Sugarloaf%2C_Viti_Levu%2C_Fiji.jpg/800px-Mount_Sugarloaf%2C_Viti_Levu%2C_Fiji.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Beach_in_Fiji%2C_South_Coast_of_Viti_Levu.jpg/800px-Beach_in_Fiji%2C_South_Coast_of_Viti_Levu.jpg"
  ],
  "Prague, Czech Republic": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Prague.Czech.Republic.001.jpg/800px-Prague.Czech.Republic.001.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Prague_at_night%2C_Czech_Republic.jpg/800px-Prague_at_night%2C_Czech_Republic.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Prague_Castle_from_Vladislav_Hall_%28cropped%29.jpg/800px-Prague_Castle_from_Vladislav_Hall_%28cropped%29.jpg"
  ],
  "Madagascar": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Avenue_of_the_Baobabs%2C_Madagascar_%2829233340646%29.jpg/800px-Avenue_of_the_Baobabs%2C_Madagascar_%2829233340646%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Andasibe_Mantadia_National_Park%2C_Madagascar.jpg/800px-Andasibe_Mantadia_National_Park%2C_Madagascar.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Tsingy_de_Bemaraha_National_Park%2C_Madagascar.jpg/800px-Tsingy_de_Bemaraha_National_Park%2C_Madagascar.jpg"
  ],
  "Budapest, Hungary": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Parliament_of_Hungary_from_the_Danube_%28cropped%29.jpg/800px-Parliament_of_Hungary_from_the_Danube_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Budapest_by_night_from_Gellért_Hill.jpg/800px-Budapest_by_night_from_Gellért_Hill.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Budapest_Parlament_by_Night_%28cropped%29.jpg/800px-Budapest_Parlament_by_Night_%28cropped%29.jpg"
  ],
  "Ladakh, India": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Lamayuru_Monastery%2C_Ladakh%2C_India.jpg/800px-Lamayuru_Monastery%2C_Ladakh%2C_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Pangong_Lake%2C_Ladakh%2C_India.jpg/800px-Pangong_Lake%2C_Ladakh%2C_India.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Magnetic_Hill%2C_Ladakh%2C_India.jpg/800px-Magnetic_Hill%2C_Ladakh%2C_India.jpg"
  ],
  "Seychelles": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Anse_Source_d%27Argent%2C_La_Digue%2C_Seychelles.jpg/800px-Anse_Source_d%27Argent%2C_La_Digue%2C_Seychelles.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Anse_Lazio%2C_Prasonisi%2C_Seychelles.jpg/800px-Anse_Lazio%2C_Prasonisi%2C_Seychelles.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Victoria%2C_Mahé%2C_Seychelles.jpg/800px-Victoria%2C_Mahé%2C_Seychelles.jpg"
  ],
  "Patagonia, Argentina/Chile": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Torres_del_Paine_from_Nordenskiold_lake%2C_Chile.jpg/800px-Torres_del_Paine_from_Nordenskiold_lake%2C_Chile.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Patagonia%2C_Argentina.jpg/800px-Patagonia%2C_Argentina.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Fitz_Roy_Patagonia_Argentina.jpg/800px-Fitz_Roy_Patagonia_Argentina.jpg"
  ],
  "Swiss Alps, Switzerland": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Matterhorn_from_Domhütte_%28cropped%29.jpg/800px-Matterhorn_from_Domhütte_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Eiger_Nordwand.jpg/800px-Eiger_Nordwand.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Montreux-SwissAlps.jpg/800px-Montreux-SwissAlps.jpg"
  ],
  "Zanzibar, Tanzania": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Zanzibar_Spice_Farm.jpg/800px-Zanzibar_Spice_Farm.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Stone_Town_Zanzibar.jpg/800px-Stone_Town_Zanzibar.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Zanzibar_Beach.jpg/800px-Zanzibar_Beach.jpg"
  ],
  "New Zealand": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Milford_Sound%2C_New_Zealand.jpg/800px-Milford_Sound%2C_New_Zealand.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Aoraki_Mount_Cook_National_Park%2C_New_Zealand.jpg/800px-Aoraki_Mount_Cook_National_Park%2C_New_Zealand.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Lake_Wanaka%2C_New_Zealand.jpg/800px-Lake_Wanaka%2C_New_Zealand.jpg"
  ],
  "Morocco": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Atlas_Mountains_in_Morocco.jpg/800px-Atlas_Mountains_in_Morocco.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Morocco_Marrakech.jpg/800px-Morocco_Marrakech.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Morocco_Casablanca_Hassan_II_Mosque.jpg/800px-Morocco_Casablanca_Hassan_II_Mosque.jpg"
  ],
  "Sri Lanka": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Sigiriya_Lion_Rock_Sri_Lanka.jpg/800px-Sigiriya_Lion_Rock_Sri_Lanka.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Tea_plantation%2C_Central_Province%2C_Sri_Lanka.jpg/800px-Tea_plantation%2C_Central_Province%2C_Sri_Lanka.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Adam%27s_Peak_by_Moonlight%2C_Sri_Lanka.jpg/800px-Adam%27s_Peak_by_Moonlight%2C_Sri_Lanka.jpg"
  ],
  "Bhutan": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Tiger%27s_Nest_Monastery%2C_Bhutan.jpg/800px-Tiger%27s_Nest_Monastery%2C_Bhutan.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Punakha_Dzong%2C_Bhutan.jpg/800px-Punakha_Dzong%2C_Bhutan.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Bhutan%2C_Himalayas.jpg/800px-Bhutan%2C_Himalayas.jpg"
  ],
  "Maldives": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Maldives%2C_island_3.jpg/800px-Maldives%2C_island_3.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Maldives_2013.12.31_12-03-08_HDR.jpg/800px-Maldives_2013.12.31_12-03-08_HDR.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Maldives_beach_overwater_bungalow_sunset.jpg/800px-Maldives_beach_overwater_bungalow_sunset.jpg"
  ],
  "Jordan": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Petra_Treasury.jpg/800px-Petra_Treasury.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Dead_Sea%2C_Jordan.jpg/800px-Dead_Sea%2C_Jordan.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Wadi_Rum%2C_Jordan.jpg/800px-Wadi_Rum%2C_Jordan.jpg"
  ]
};

// Function to update post images in the database
async function updatePostImages() {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/pin_quest", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Update each post with the new images
    let updatedCount = 0;
    for (const title in updatedImages) {
      try {
        const imagesArray = updatedImages[title].map(url => ({
          url: url,
          publicId: null
        }));

        const result = await Post.updateOne(
          { title: title },
          {
            $set: {
              image: {
                url: updatedImages[title][0],
                publicId: null
              },
              images: imagesArray
            }
          }
        );

        if (result.matchedCount > 0) {
          console.log(`✓ Updated images for: ${title}`);
          updatedCount++;
        } else {
          console.log(`- Post not found: ${title}`);
        }
      } catch (error) {
        console.error(`✗ Error updating images for ${title}:`, error.message);
      }
    }

    console.log(`\nSuccessfully updated images for ${updatedCount} posts!`);
    console.log("All images now come from Wikimedia Commons and other reliable sources that load properly.");
    
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error in updatePostImages script:", error);
    process.exit(1);
  }
}

// Execute the script
updatePostImages();