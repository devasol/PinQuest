import React, { useState } from "react";
import OptimizedImage from '../OptimizedImage';

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Categories data
  const categories = [
    {
      id: 1,
      title: "Beaches & Coastlines",
      description: "Tropical coasts, islands & seaside vibes",
      icon: "🏖️",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      color: "from-blue-400 to-cyan-400",
    },
    {
      id: 2,
      title: "Mountains & Hiking Trails",
      description: "Trekking, viewpoints, nature adventures",
      icon: "⛰️",
      image:
        "https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      color: "from-green-500 to-emerald-600",
    },
    {
      id: 3,
      title: "Food & Culinary Experiences",
      description: "Local dishes, cafés, street food",
      icon: "🍜",
      image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      color: "from-orange-400 to-red-500",
    },
    {
      id: 4,
      title: "Historical & Cultural Sites",
      description: "Museums, heritage landmarks, ancient sites",
      icon: "🏛️",
      image:
        "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      color: "from-amber-600 to-yellow-600",
    },
    {
      id: 5,
      title: "Cityscapes & Urban Lifestyle",
      description: "Modern city touring, events & nightlife",
      icon: "🏙️",
      image:
        "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: 6,
      title: "Adventure & Outdoor Activities",
      description: "Camping, rafting, climbing & extreme sports",
      icon: "🚀",
      image:
        "https://images.unsplash.com/photo-1519501025264-65ba15a82390?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      color: "from-red-500 to-pink-600",
    },
    {
      id: 7,
      title: "Relaxation & Wellness Spots",
      description: "Peaceful retreats, nature resorts, rest spots",
      icon: "🧘",
      image:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      color: "from-teal-400 to-blue-500",
    },
    {
      id: 8,
      title: "Wildlife & Nature Parks",
      description: "National parks, zoos, jungle trails",
      icon: "🦁",
      image:
        "https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
      color: "from-lime-500 to-green-600",
    },
  ];

  // Trending destinations
  const trendingDestinations = [
    {
      id: 1,
      name: "Bali",
      category: "Beaches",
      image:
        "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 2,
      name: "Switzerland",
      category: "Mountains",
      image:
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 3,
      name: "Tokyo",
      category: "Food & Urban Culture",
      image:
        "https://images.unsplash.com/photo-1540959733332-8a43b3a4f8c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    },
    {
      id: 4,
      name: "Italy",
      category: "Historical Sites",
      image:
        "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <header className="pt-24 pb-6 sm:pt-32 sm:pb-8 px-4 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4">
          Discover Your Next Adventure by Category
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xl sm:max-w-2xl mx-auto mb-6 sm:mb-8">
          Choose a travel style that inspires you and explore experiences shared
          by real travelers from around the world.
        </p>

        {/* Search & Filter Section */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <input
                type="text"
                placeholder="Search destinations, experiences..."
                className="w-full px-4 py-2 sm:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <select
                className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.title}>
                    {category.title}
                  </option>
                ))}
              </select>
              <select
                className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="most-liked">Most Liked</option>
                <option value="friends">Visited by Friends</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Category Grid */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
            >
              <div className="relative h-40 sm:h-44 md:h-48 overflow-hidden">
                <OptimizedImage
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60`}
                ></div>
                <div className="absolute top-3 left-3 text-2xl sm:text-3xl bg-white bg-opacity-20 rounded-lg p-1 sm:p-2 backdrop-blur-sm">
                  {category.icon}
                </div>
              </div>

              <div className="p-4 sm:p-5 md:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                  {category.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{category.description}</p>
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-300 hover:from-blue-600 hover:to-purple-700 hover:shadow-lg transform hover:-translate-y-1">
                  Explore
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trending Destinations */}
        <section className="mb-12 sm:mb-16">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
              Top Trending This Week
            </h2>
            <button className="text-blue-600 font-semibold hover:text-blue-700 transition-colors text-sm sm:text-base">
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trendingDestinations.map((destination) => (
              <div
                key={destination.id}
                className="group relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="relative h-36 sm:h-40 md:h-48 overflow-hidden">
                  <OptimizedImage
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold">{destination.name}</h3>
                    <p className="text-xs sm:text-sm md:text-base text-blue-200">{destination.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* User Contribution CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-center text-white">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Have a place to share?</h2>
          <p className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 opacity-90">
            Pin your travel story with photos and memories!
          </p>
          <button className="bg-white text-blue-600 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg transition-all duration-300 hover:bg-gray-100 hover:shadow-lg transform hover:-translate-y-1">
            Add New Pin
          </button>
          <p className="mt-4 text-sm sm:text-base text-blue-100">
            Start your own travel journey — Pin your first place on the map!
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 sm:py-8 text-center">
        <p className="text-sm sm:text-base text-gray-400">
          © 2024 Travel Explorer. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Categories;
