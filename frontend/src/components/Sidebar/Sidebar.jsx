import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Search, MapPin, Grid3X3, Bookmark, Navigation, 
  Home, User, Settings, LogOut, Heart, Star, Bell, Compass, 
  Layers, Minus, ChevronLeft, ChevronRight, ChevronUp, 
  ChevronDown, LocateFixed, LayoutGrid, ScanSearch, Map as MapIcon, 
  Sparkles, Coffee, Utensils, Zap, Shield, Telescope,
  SquareTerminal, Globe, Activity, LifeBuoy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({
  onLogout = () => {},
  user = null,
  toggleWindow = () => {},
  showSavedLocationsOnMap = false,
  updateUserLocation = () => {},
  followUser = false,
  locationLoading = false,
  setFollowUser = () => {},
  isSidebarExpanded,
  toggleSidebar,
  isMobile = false,
  activeSidebarWindow = null,
  setActiveSidebarWindow = () => {}
}) => {
  const location = useLocation();

  // Navigation Items with "UIBlocks" Pro Mapping
  const navGroups = [
    {
      title: 'Navigation',
      items: [
        { id: 'feed', label: 'Dashboard', icon: LayoutGrid, path: '/' },
        { id: 'category', label: 'Explore Map', icon: Compass, action: () => toggleWindow('category-window') },
        { id: 'track', label: 'Precision Tracking', icon: LocateFixed, action: () => {
          if (followUser) { updateUserLocation(); setFollowUser(false); }
          else { updateUserLocation().then(() => setFollowUser(true)); }
        }}
      ]
    },
    {
      title: 'Collection',
      items: [
        { id: 'map-type', label: 'Map Layers', icon: Layers, action: () => toggleWindow('map-type-window') },
        { id: 'saved-locations', label: 'Saved Pins', icon: Bookmark, action: () => toggleWindow('saved-locations-window') }
      ]
    }
  ];

  const sidebarVariants = {
    expanded: { width: 240 },
    collapsed: { width: 90 }
  };

  const navItemVariants = {
    expanded: { width: '100%' },
    collapsed: { width: '48px' }
  };

  const hasWindowOpen = activeSidebarWindow !== null;

  return (
    <div className={`fixed left-0 top-0 bottom-0 h-screen z-[8080] flex select-none ${isMobile ? 'hidden' : ''}`}>
        <motion.aside
          initial={false}
          animate={isSidebarExpanded ? 'expanded' : 'collapsed'}
          variants={sidebarVariants}
          className="h-full bg-white border-r border-slate-100 shadow-sm flex flex-col py-8 overflow-hidden"
        >
         {/* Pro Logo Block */}
         <motion.div 
            layout
            className={`mb-12 flex items-center w-full overflow-hidden ${isSidebarExpanded ? 'justify-start px-8' : 'justify-center'}`}
         >
            <motion.div 
              layout
              className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-100 cursor-pointer active:scale-95 transition-transform"
              onClick={toggleSidebar}
            >
               <Zap size={18} className="text-white fill-white" />
            </motion.div>
            <AnimatePresence mode="wait">
              {isSidebarExpanded && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.1 }}
                  className="ml-4 flex flex-col flex-1 whitespace-nowrap overflow-hidden"
                >
                  <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-1">PinQuest</h1>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500/90">Social Map</span>
                </motion.div>
              )}
            </AnimatePresence>
         </motion.div>

         {/* Global Level Pro Navigation */}
         <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar overflow-x-hidden">
            {navGroups.map((group, gIdx) => (
               <div key={gIdx} className="space-y-4">
                  {isSidebarExpanded && (
                    <h4 className="px-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                      {group.title}
                    </h4>
                  )}
                  <div className="flex flex-col items-center space-y-1">
                     {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = (item.path && location.pathname === item.path && !activeSidebarWindow) || 
                                         (activeSidebarWindow === item.id);
                        
                        return (
                          <motion.button
                            layout
                            key={item.id}
                            animate={isSidebarExpanded ? 'expanded' : 'collapsed'}
                            variants={navItemVariants}
                            onClick={item.action || (() => {})}
                            className={`h-11 flex items-center transition-all duration-300 relative group
                               ${isActive ? 'bg-slate-50' : 'hover:bg-slate-50'}
                               ${isSidebarExpanded ? 'rounded-l-xl pl-6' : 'rounded-xl'}`}
                          >
                             {/* Active Pillar Indicator - PRO UIBlocks Style - Flush to the absolute window edge */}
                             {isActive && (
                               <motion.div 
                                 layoutId="activePillar"
                                 className="absolute right-0 top-0 bottom-0 w-[5px] bg-slate-900 rounded-l-md z-[10]" 
                               />
                             )}

                             <div className={`w-11 h-11 flex-shrink-0 flex items-center justify-center transition-colors
                                ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-900'}`}>
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                             </div>
                             <AnimatePresence>
                                {isSidebarExpanded && (
                                  <motion.span 
                                    initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }}
                                    className={`ml-4 text-[13px] font-bold tracking-tight whitespace-nowrap overflow-hidden
                                       ${isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'}`}
                                  >
                                    {item.label}
                                  </motion.span>
                                )}
                             </AnimatePresence>
                          </motion.button>
                        );
                     })}
                  </div>
               </div>
            ))}
         </div>

         {/* UIBlocks Styled Profile Footer */}
         <motion.div 
           layout
           className={`mt-auto pt-8 border-t border-slate-100 w-full flex flex-col items-center space-y-4 ${isSidebarExpanded ? 'px-6' : 'px-0'}`}
         >
           {user ? (
             <motion.button 
               layout 
               animate={isSidebarExpanded ? 'expanded' : 'collapsed'}
               variants={navItemVariants}
               className="h-14 flex items-center bg-slate-900 rounded-xl px-4 text-white hover:bg-black transition-colors shadow-lg shadow-slate-200"
             >
               <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
               </div>
               {isSidebarExpanded && (
                 <div className="ml-3 flex flex-col text-left overflow-hidden">
                    <span className="text-[11px] font-black uppercase tracking-widest leading-none truncate">Profile</span>
                    <span className="text-[10px] font-black text-teal-400/90 tracking-widest mt-1 truncate">{user.name}</span>
                 </div>
               )}
             </motion.button>
           ) : (
             <Link to="/login" className="w-full px-6">
                <motion.button 
                  layout
                  className={`h-14 w-full bg-slate-900 text-white rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all
                    ${!isSidebarExpanded && 'p-0 w-12 h-12 rounded-lg ml-auto mr-auto'}`}
                >
                  <User size={18} strokeWidth={2.5} />
                  {isSidebarExpanded && <span className="font-black text-[11px] uppercase tracking-[0.2em]">Sign In</span>}
                </motion.button>
             </Link>
           )}

           <div className={`flex items-center w-full ${isSidebarExpanded ? 'justify-between px-8' : 'flex-col space-y-4'}`}>
              <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                 <Settings size={18} />
              </button>
              <button 
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                 <LogOut size={18} />
              </button>
           </div>
         </motion.div>
        </motion.aside>

        {/* Transition Arrows Center Anchor */}
        <div className="relative h-full flex items-center">
            {/* Simplified Toggle - Only show if NO windows are open to keep the layout centered */}
            {!hasWindowOpen && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleSidebar}
                className="absolute left-[-20px] z-[8081] w-10 h-14 bg-white border border-slate-100 shadow-xl rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
              >
                {isSidebarExpanded ? <ChevronLeft size={18} strokeWidth={3} /> : <ChevronRight size={18} strokeWidth={3} />}
              </motion.button>
            )}
        </div>
    </div>
  );
};

export default Sidebar;