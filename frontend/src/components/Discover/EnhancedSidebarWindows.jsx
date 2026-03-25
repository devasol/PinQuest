import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Grid3X3, Bookmark, Navigation, Home, 
  User, Settings, LogOut, Heart, Star, Bell, 
  TrendingUp, Award, Globe, Users, Check, SlidersHorizontal,
  Trees, Building2, ShoppingBag, Utensils, Calendar, Map as MapIcon,
  Layers, Map, Sun, Moon, Database, Navigation2, Bike, Mountain, 
  Wind, Cloud, Search, CheckCircle2, Inbox, Compass
} from 'lucide-react';
import { adminAPI } from '../../services/api';

// Pro-level responsive window width
const getResponsiveWidth = () => {
  if (window.innerWidth >= 1280) return '360px';
  if (window.innerWidth >= 1024) return '340px';
  return '100vw'; 
};

// Structural Left Positioning - Clean Flush Align
const getWindowLeftPosition = (isSidebarExpanded, windowWidth) => {
  if (windowWidth < 768) return '0';
  // Precise math: Sidebar(240/90) + LeftPadding(0)
  return isSidebarExpanded ? '240px' : '90px';
};

const EnhancedSidebarWindows = ({ 
  showWindows = {},
  setShowWindows = () => {},
  selectedCategory = 'all',
  setSelectedCategory = () => {},
  viewMode = 'grid',
  setViewMode = () => {},
  mapType = 'street',
  setMapType = () => {},
  favoritePosts = new Set(),
  posts = [],
  togglePostBookmark = () => {},
  bookmarkLoading = null,
  showSavedLocationsOnMap = false,
  setShowSavedLocationsOnMap = () => {},
  user = null,
  updateUserLocation = () => {},
  followUser = false,
  isSidebarExpanded = false,
  authToken = null,
  activeSidebarWindow = null,
  setActiveSidebarWindow = () => {}
}) => {
  const categories = [
    { id: 'all', name: 'All Locations', icon: MapIcon, description: 'Every destination explored' },
    { id: 'nature', name: 'Nature & Parks', icon: Trees, description: 'Green spaces and scenery' },
    { id: 'culture', name: 'Art & History', icon: Building2, description: 'Museums and galleries' },
    { id: 'shopping', name: 'Shopping Hubs', icon: ShoppingBag, description: 'Boutiques and markets' },
    { id: 'food', name: 'Food & Drink', icon: Utensils, description: 'Restaurants and bars' },
    { id: 'event', name: 'Active Events', icon: Calendar, description: 'Festivals and happenings' },
    { id: 'general', name: 'General Sites', icon: MapPin, description: 'Other points of interest' }
  ];

  const mapTypes = [
    { id: 'street', name: 'Standard View', description: 'Clean vector navigation', icon: MapIcon },
    { id: 'satellite', name: 'Satellite Map', description: 'Real-world vertical view', icon: Globe },
    { id: 'terrain', name: 'Physical Terrain', description: 'Elevation & landscape', icon: Mountain },
    { id: 'dark', name: 'Midnight Map', description: 'Low-light high contrast', icon: Moon },
    { id: 'light', name: 'Soft Daylight', description: 'Minimalist clean view', icon: Sun },
    { id: 'navigation', name: 'Tactical Flow', description: 'Route-optimized view', icon: Navigation2 }
  ];

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeWindow = useCallback((windowId) => {
    setShowWindows(prev => ({ ...prev, [windowId]: false }));
    setActiveSidebarWindow(null);
  }, [setShowWindows, setActiveSidebarWindow]);

  const closeAllWindows = () => {
    setShowWindows({
      'category-window': false,
      'view-mode-window': false,
      'map-type-window': false,
      'saved-locations-window': false,
      'notifications-window': false
    });
    setActiveSidebarWindow(null);
  };

  const hasOpenWindow = Object.values(showWindows).some(open => open);
  const isMobile = windowWidth < 768;

  const windowVariants = {
    hidden: { x: isMobile ? 0 : -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 220 } },
    exit: { x: isMobile ? 0 : -20, opacity: 0, transition: { duration: 0.2 } }
  };

  const WindowShell = ({ id, title, children, icon: HeaderIcon }) => (
    <motion.div 
      variants={windowVariants}
      initial="hidden" animate="visible" exit="exit"
      className="fixed top-0 bottom-0 z-[8040] flex flex-col font-jakarta bg-white border-r border-slate-100 shadow-[20px_0_50px_-15px_rgba(0,0,0,0.05)]"
      style={{ 
        width: isMobile ? '100%' : getResponsiveWidth(),
        left: isMobile ? '0' : getWindowLeftPosition(isSidebarExpanded, windowWidth),
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Superior Header - Bold UIBlocks Style */}
        <div className="px-8 pt-10 pb-6 flex items-center justify-between">
          <div className="flex flex-col">
             <div className="flex items-center gap-2 text-teal-600 mb-2">
               {HeaderIcon ? <HeaderIcon size={16} strokeWidth={2.5} /> : <SlidersHorizontal size={16} />}
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Active Filter</span>
             </div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{title}</h2>
          </div>
          <button 
            onClick={() => closeWindow(id)}
            className="w-10 h-10 rounded-[4px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Fluid Content - Structural & Simple */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-2">
          {children}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="z-[8000]">
      {hasOpenWindow && isMobile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[8005]"
          onClick={closeAllWindows}
        />
      )}

      <AnimatePresence mode="wait">
        {/* Categories */}
        {showWindows['category-window'] && (
          <WindowShell id="category-window" title="Library" icon={Grid3X3}>
            {categories.map((cat, idx) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                onClick={() => { setSelectedCategory(cat.id); closeWindow('category-window'); }}
                className={`w-full flex items-center gap-5 p-4 rounded-[4px] transition-all border
                  ${selectedCategory === cat.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' : 'hover:bg-slate-50 border-transparent text-slate-800'}`}
              >
                <div className={`w-10 h-10 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-colors
                  ${selectedCategory === cat.id ? 'bg-white/10' : 'bg-slate-50 text-teal-500'}`}>
                  {cat.icon && <cat.icon size={20} strokeWidth={2.5} />}
                </div>
                <div className="text-left flex-1 min-w-0">
                   <p className="font-black text-xs uppercase tracking-widest">{cat.name}</p>
                   <p className={`text-[11px] font-bold mt-1 ${selectedCategory === cat.id ? 'text-slate-400' : 'text-slate-400'}`}>{cat.description}</p>
                </div>
              </motion.button>
            ))}
          </WindowShell>
        )}

        {/* Map Layers */}
        {showWindows['map-type-window'] && (
          <WindowShell id="map-type-window" title="Map Core" icon={Layers}>
            <div className="grid grid-cols-1 gap-2">
              {mapTypes.map((type, idx) => (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  onClick={() => { setMapType(type.id); closeWindow('map-type-window'); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-[4px] transition-all border
                    ${mapType === type.id ? 'border-teal-600 bg-teal-50/50 text-teal-900' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                >
                  <div className={`w-10 h-10 rounded-[4px] flex items-center justify-center ${mapType === type.id ? 'bg-teal-600 text-white' : 'bg-slate-900 text-white'}`}>
                     {type.icon && <type.icon size={18} strokeWidth={2} />}
                  </div>
                  <div className="text-left">
                     <p className="font-black text-[11px] uppercase tracking-widest">{type.name}</p>
                     <p className="text-[10px] font-bold text-slate-400 mt-1">{type.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </WindowShell>
        )}

        {/* Collections with UIBlocks Grid Aesthetic */}
        {showWindows['saved-locations-window'] && (
          <WindowShell id="saved-locations-window" title="Collections" icon={Bookmark}>
            <div className="mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">Active Bookmarks ({favoritePosts.size})</h4>
              
              {posts.filter(p => favoritePosts.has(p.id)).length > 0 ? (
                <div className="space-y-3">
                  {posts.filter(p => favoritePosts.has(p.id)).map((p, idx) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-white border border-slate-100 rounded-[4px] flex gap-4 shadow-sm hover:border-slate-300 transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-[4px] bg-slate-50 flex-shrink-0 flex items-center justify-center text-slate-900 overflow-hidden border border-slate-100 group-hover:border-slate-300">
                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <MapPin size={22} />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <h5 className="font-black text-slate-900 text-sm tracking-tighter truncate">{p.title}</h5>
                         <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mt-1">{p.category || 'POINT'}</p>
                      </div>
                      <button onClick={() => togglePostBookmark(p)} className="text-slate-300 hover:text-slate-900 p-2 transition-colors">
                         <LogOut size={16} /> {/* Logout icon used as 'remove' in pro style often */}
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                   <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                   <div className="space-y-1">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Nothing found</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Empty Collection</p>
                   </div>
                </div>
              )}
            </div>

            <div className="mt-12 pt-10 border-t border-slate-100 space-y-4">
               <button onClick={() => updateUserLocation()} 
                  className="w-full h-14 bg-slate-900 text-white rounded-[4px] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all">
                  <Navigation2 size={16} strokeWidth={3}/>
                  Precision Sync
               </button>
               <button onClick={() => setShowSavedLocationsOnMap(!showSavedLocationsOnMap)}
                  className={`w-full h-14 rounded-[4px] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all border-2
                    ${showSavedLocationsOnMap ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-white border-slate-100 text-slate-400'}`}>
                  <Bookmark size={16} />
                  {showSavedLocationsOnMap ? 'Hide Collection' : 'Show Collection'}
               </button>
            </div>
          </WindowShell>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSidebarWindows;