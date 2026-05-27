import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  MapPin,
  Grid3X3,
  Bookmark,
  Navigation,
  Home,
  User,
  Settings,
  LogOut,
  Heart,
  Star,
  Bell,
  Compass,
  Layers,
  Minus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  LocateFixed,
  LayoutGrid,
  ScanSearch,
  Map as MapIcon,
  Sparkles,
  Coffee,
  Utensils,
  Zap,
  Shield,
  Telescope,
  SquareTerminal,
  Globe,
  Activity,
  LifeBuoy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = React.memo(
  ({
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
    setActiveSidebarWindow = () => {},
    openAuthModal = () => {},
  }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const navGroups = useMemo(
      () => [
        {
          title: "Navigation",
          items: [
            { id: "dashboard", label: "Feed", icon: LayoutGrid, path: "/" },
            {
              id: "category",
              label: "Library",
              icon: Compass,
              action: () => toggleWindow("category-window"),
            },
            {
              id: "track",
              label: "Locate",
              icon: LocateFixed,
              action: () => {
                if (followUser) {
                  updateUserLocation();
                  setFollowUser(false);
                } else {
                  updateUserLocation().then(() => setFollowUser(true));
                }
              },
            },
          ],
        },
        {
          title: "Collection",
          items: [
            {
              id: "map-type",
              label: "Layers",
              icon: Layers,
              action: () => toggleWindow("map-type-window"),
            },
            {
              id: "saved-locations",
              label: "Saved",
              icon: Bookmark,
              action: () => toggleWindow("saved-locations-window"),
            },
          ],
        },
      ],
      [toggleWindow, followUser, updateUserLocation, setFollowUser],
    );

    const sidebarVariants = useMemo(
      () => ({
        expanded: { width: 240 },
        collapsed: { width: 90 },
      }),
      [],
    );

    const navItemVariants = useMemo(
      () => ({
        expanded: { width: "100%" },
        collapsed: { width: "48px" },
      }),
      [],
    );

    const hasWindowOpen = activeSidebarWindow !== null;

    // PREMIUM MOBILE HUB: Interactive & High-End
    const mobileItems = useMemo(
      () => [
        { id: "dashboard", label: "Home", icon: LayoutGrid, path: "/" },
        {
          id: "category",
          label: "Library",
          icon: Compass,
          action: () => toggleWindow("category-window"),
        },
        {
          id: "track",
          label: "Locate",
          icon: LocateFixed,
          action: () => {
            updateUserLocation();
            setFollowUser(!followUser);
          },
        },
        {
          id: "map-type",
          label: "Layers",
          icon: Layers,
          action: () => toggleWindow("map-type-window"),
        },
        {
          id: "profile",
          label: "Profile",
          icon: User,
          action: user ? null : openAuthModal,
          path: user ? "/profile" : null,
        },
      ],
      [
        toggleWindow,
        updateUserLocation,
        setFollowUser,
        followUser,
        user,
        openAuthModal,
      ],
    );

    if (isMobile) {
      return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[94%] max-w-[440px] z-[9000] font-jakarta">
          {/* Superior Floating Container */}
          <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-[16px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] px-4 py-4 flex items-center justify-between overflow-hidden transition-colors duration-300">
            {/* Reactive Background Pill */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-teal-500/5 via-transparent to-slate-200/5 rotate-12" />
            </div>

            {mobileItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                (item.path &&
                  location.pathname === item.path &&
                  !activeSidebarWindow) ||
                activeSidebarWindow === item.id;

              const Content = (
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  className="relative flex flex-col items-center gap-1.5"
                >
                  {/* Active Indicator Bar (Top) */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveBar"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute -top-[12px] w-5 h-[3px] bg-teal-400 rounded-b-full shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                      />
                    )}
                  </AnimatePresence>

                  <div
                    className={`w-10 h-10 rounded-[4px] flex items-center justify-center transition-all duration-300
                  ${isActive ? "bg-slate-900/10 text-teal-600 border border-teal-200/50" : "text-slate-400"}`}
                  >
                    <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  </div>

                  <span
                    className={`text-[8px] font-black tracking-[0.2em] transition-colors duration-300
                  ${isActive ? "text-teal-600" : "text-slate-400"}`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              );

              if (item.path) {
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="flex-1 flex justify-center no-underline cursor-pointer"
                  >
                    {Content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="flex-1 flex justify-center cursor-pointer outline-none"
                >
                  {Content}
                </button>
              );
            })}
          </div>

          {/* Mobile Theme Toggle Pill */}

          {/* Precision Tracking Pulse (Mobile specific state indicator) */}
          {followUser && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[8px] font-black px-3 py-0.5 rounded-full shadow-lg shadow-teal-500/30 animate-pulse tracking-widest border border-teal-400 uppercase">
              Tracking Active
            </div>
          )}
        </div>
      );
    }

    // DESKTOP SIDEBAR: Standardized with New Pro Branding
    return (
      <div
        className={`fixed left-0 top-0 bottom-0 h-screen z-[8080] flex select-none`}
      >
        <motion.aside
          initial={false}
          animate={isSidebarExpanded ? "expanded" : "collapsed"}
          variants={sidebarVariants}
          className="h-full bg-white border-r border-slate-100 shadow-sm flex flex-col py-8 overflow-hidden transition-colors duration-300"
        >
          <motion.div
            layout
            className={`mb-12 flex items-center w-full overflow-hidden ${isSidebarExpanded ? "justify-start px-8" : "justify-center"}`}
          >
            <motion.div
              layout
              className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-slate-100 cursor-pointer active:scale-95 transition-all duration-300"
              onClick={toggleSidebar}
            >
              <Zap size={18} className="text-white fill-white" />
            </motion.div>
            <AnimatePresence mode="wait">
              {isSidebarExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.1 }}
                  className="ml-4 flex flex-col flex-1 whitespace-nowrap overflow-hidden"
                >
                  <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-1 transition-colors duration-300">
                    PinQuest
                  </h1>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500/90 transition-colors duration-300">
                    Social Map
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

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
                    const isActive =
                      (item.path &&
                        location.pathname === item.path &&
                        !activeSidebarWindow) ||
                      activeSidebarWindow === item.id;

                    return (
                      <motion.button
                        layout
                        key={item.id}
                        animate={isSidebarExpanded ? "expanded" : "collapsed"}
                        variants={navItemVariants}
                        onClick={item.action || (() => {})}
                        className={`h-11 flex items-center transition-all duration-300 relative group
                               ${isActive ? "bg-slate-50" : "hover:bg-slate-50"}
                               ${isSidebarExpanded ? "rounded-l-xl pl-6" : "rounded-xl"}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activePillar"
                            className="absolute right-0 top-0 bottom-0 w-[5px] bg-slate-900 rounded-l-md z-[10] transition-colors duration-300"
                          />
                        )}

                        <div
                          className={`w-11 h-11 flex-shrink-0 flex items-center justify-center transition-colors duration-300
                                ${isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-900"}`}
                        >
                          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <AnimatePresence>
                          {isSidebarExpanded && (
                            <motion.span
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -5 }}
                              className={`ml-4 text-[13px] font-bold tracking-tight whitespace-nowrap overflow-hidden transition-colors duration-300
                                       ${isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-900"}`}
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

          <motion.div
            layout
            className={`mt-auto pt-8 border-t border-slate-100 w-full flex flex-col items-center space-y-4 transition-colors duration-300 ${isSidebarExpanded ? "px-6" : "px-0"}`}
          >
            {user ? (
              <div className="w-full flex justify-center">
                <motion.button
                  onClick={() =>
                    navigate(
                      user.role === "admin" ? "/admin/dashboard" : "/profile",
                    )
                  }
                  layout
                  className={`h-12 bg-slate-900 text-white flex items-center shadow-xl shadow-slate-200/40 transition-all hover:bg-black
                    ${isSidebarExpanded ? "w-[calc(100%-2rem)] px-4 rounded-[4px]" : "w-12 h-12 justify-center rounded-[4px]"}`}
                >
                  <div className="flex items-center justify-center flex-shrink-0">
                    <User size={18} strokeWidth={2.5} className="text-white" />
                  </div>
                  {isSidebarExpanded && (
                    <div className="ml-3 flex flex-col text-left overflow-hidden">
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none truncate">
                        Your Profile
                      </span>
                      <span className="text-[9px] font-black text-teal-400 tracking-[0.2em] mt-1 truncate">
                        {user.name}
                      </span>
                    </div>
                  )}
                </motion.button>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <motion.button
                  onClick={openAuthModal}
                  layout
                  className={`h-12 bg-slate-900 text-white flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-200/40 hover:bg-black
                     ${isSidebarExpanded ? "w-[calc(100%-2rem)] rounded-[4px]" : "w-12 h-12 rounded-[4px]"}`}
                >
                  <User size={18} strokeWidth={2.5} />
                  {isSidebarExpanded && (
                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">
                      Sign In
                    </span>
                  )}
                </motion.button>
              </div>
            )}

            <div
              className={`flex items-center w-full transition-all duration-300 ${isSidebarExpanded ? "justify-end px-10 pt-4" : "flex-col space-y-6 pt-2"}`}
            >
              {user && (
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-500 hover:scale-110 transition-all"
                  title="Logout"
                >
                  <LogOut size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </motion.div>
        </motion.aside>

        <div className="relative h-full flex items-center">
          {!hasWindowOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleSidebar}
              className="absolute left-[-20px] z-[8081] w-10 h-14 bg-white border border-slate-100 shadow-xl rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors duration-300"
            >
              {isSidebarExpanded ? (
                <ChevronLeft size={18} strokeWidth={3} />
              ) : (
                <ChevronRight size={18} strokeWidth={3} />
              )}
            </motion.button>
          )}
        </div>
      </div>
    );
  },
);

export default Sidebar;
