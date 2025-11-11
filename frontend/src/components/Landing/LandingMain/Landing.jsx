import { useState, useEffect } from "react";
import {
  MapPin,
  Compass,
  Users,
  Star,
  TrendingUp,
  Shield,
  ArrowRight,
  Play,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import MapComponent from "../MapComponent/MapComponent";

const Landing = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Compass className="h-8 w-8" />,
      title: "Discover Hidden Gems",
      description:
        "Find unique locations shared by our global community of explorers",
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "Pin Your Adventures",
      description: "Mark and share your favorite spots with interactive maps",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Join Communities",
      description: "Connect with fellow travelers and local experts",
    },
  ];

  const stats = [
    { number: "50K+", label: "Active Explorers" },
    { number: "1M+", label: "Pinned Locations" },
    { number: "150+", label: "Countries Covered" },
    { number: "4.9", label: "Rating" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative z-0">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1474')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Background overlay to maintain text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
        </div>

        <div
          className={`relative z-10 max-w-7xl mx-auto text-center transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">
              Join 50,000+ explorers worldwide
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-10">
            Discover the World
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent pb-4">
              Together
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            PinQuest helps you explore hidden gems, share your adventures, and
            connect with a global community of travelers. Your next great
            discovery is just a pin away.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25">
              Start Exploring Free
              <ArrowRight className="inline ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button className="group flex items-center gap-3 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:bg-white/10">
              <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                <Play className="h-5 w-5 ml-1" />
              </div>
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-6 w-6 text-white/60" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PinQuest
              </span>
              ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to explore, document, and share your
              adventures in one beautiful platform.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 ${
                  index === currentFeature ? "ring-2 ring-blue-500/50" : ""
                }`}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Additional Features */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                <TrendingUp className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Real-time Updates
                  </h4>
                  <p className="text-gray-600">
                    Get live information about locations from other explorers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                <Shield className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Verified Locations
                  </h4>
                  <p className="text-gray-600">
                    All pinned locations are verified by our community.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                <Star className="h-6 w-6 text-yellow-600 mt-1" />
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Personalized Recommendations
                  </h4>
                  <p className="text-gray-600">
                    Discover spots tailored to your interests and travel style.
                  </p>
                </div>
              </div>
            </div>

            {/* Demo Map/Image */}
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 border border-gray-200 p-4">
                <MapComponent className="rounded-2xl" />
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl p-12 border border-gray-200">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Ready to Start Your Adventure?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of explorers discovering hidden gems around the
              world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                Create Account Free
              </button>
              <button className="border border-gray-300 text-gray-700 bg-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:bg-gray-50">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
