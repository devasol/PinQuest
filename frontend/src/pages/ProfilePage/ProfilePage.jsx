import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  User, MapPin, Star, Bookmark, Activity, Calendar, Image as ImageIcon, 
  Settings, LogOut, ChevronRight, Edit3, Trash2, Save, X, Plus, Clock,
  Map as MapIcon, Heart, Share2, Grid, List, Shield, Mail, Pencil,
  TrendingUp, Award, Zap, Moon, Sun
} from 'lucide-react';
import OptimizedImage from '../../components/OptimizedImage';
import { getImageUrl } from '../../utils/imageUtils';
import usePageTitle from '../../services/usePageTitle';
import './ProfilePage.css';

// --- Atomic Components ---

const DockItem = ({ active, id, label, icon: Icon, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`dock-item group ${active ? 'active' : ''}`}
  >
    <Icon className="w-5 h-5" />
    <span className="tooltip">{label}</span>
    {active && (
      <motion.div
        layoutId="dockGlow"
        className="absolute inset-0 bg-white/20 rounded-[inherit]"
        initial={false}
      />
    )}
  </button>
);

const BentoCard = ({ children, className, title, subtitle, icon: Icon, span = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className={`glass-canvas-card custom-rounded p-8 flex flex-col justify-between ${span} ${className} glow-pulse`}
  >
    <div className="flex justify-between items-start mb-6">
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">{subtitle}</h3>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white font-space tracking-tight">{title}</h2>
      </div>
      {Icon && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-white">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
    <div className="flex-1">{children}</div>
  </motion.div>
);

const ProfilePage = () => {
  usePageTitle("Profile Canvas");
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showModal } = useModal();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(user || {});
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [savedLocations, setSavedLocations] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      setUserData(user);
      setEditData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
      });
      loadUserData();
    }
  }, [isAuthenticated, user]);

  const loadUserData = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

      const savedRes = await fetch(`${apiBase}/users/saved-locations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (savedRes.ok) {
          const data = await savedRes.json();
          setSavedLocations(data.data?.savedLocations || []);
      }

      const postsRes = await fetch(`${apiBase}/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (postsRes.ok) {
        const data = await postsRes.json();
        const myPosts = data.data?.filter(p => p.postedBy?._id === user?._id || p.postedBy === user?._id) || [];
        setUserPosts(myPosts);
      }
      
      const localActivities = [];
      userPosts.slice(0, 3).forEach(p => localActivities.push({ id: `p-${p._id}`, title: `Pin: ${p.title}`, type: 'post' }));
      setActivities(localActivities);
    } catch (err) { console.error(err); } finally { setLoadingData(false); }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        setUserData(prev => ({ ...prev, ...editData }));
        setIsEditing(false);
        showModal({ title: "Canvas Updated", message: "Explorer identity refined.", type: 'success' });
      }
    } catch (err) { console.error(err); } finally { setLoadingData(false); }
  };

  if (loading || (loadingData && !userData.email)) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="w-12 h-12 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="profile-canvas no-scrollbar font-inter transition-all duration-700">
      
      {/* Floating Header */}
      <div className="max-w-7xl mx-auto px-6 mb-12 flex items-center justify-between">
          <div className="flex items-center space-x-12">
              <div className="offset-ring">
                  <div className="w-24 h-24 offset-inner overflow-hidden flex items-center justify-center">
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-3xl font-black font-space">
                          {userData.name?.charAt(0) || 'E'}
                      </div>
                  </div>
              </div>
              <div>
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white font-space tracking-tighter mb-1">
                      {userData.name || 'Anonymous'} <span className="text-indigo-600">.</span>
                  </h1>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Explorer Index 729</p>
              </div>
          </div>
          <div className="flex items-center space-x-3">
              <button 
                  onClick={toggleTheme}
                  className="w-14 h-14 glass-canvas-card custom-rounded flex items-center justify-center hover:scale-110 active:scale-95 text-slate-900 dark:text-white"
              >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-8 h-14 glass-canvas-card custom-rounded font-black text-[10px] tracking-widest uppercase hover:scale-[1.05] active:scale-95 text-slate-900 dark:text-white"
              >
                  {isEditing ? 'Cancel' : 'Refine'}
              </button>
              <button 
                  onClick={logout}
                  className="w-14 h-14 bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center custom-rounded hover:scale-110"
              >
                  <LogOut className="w-5 h-5" />
              </button>
          </div>
      </div>

      {/* Unique Content Stage */}
      <main className="max-w-7xl mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            {activeTab === 'profile' && (
                <div className="masonry-grid">
                    <BentoCard span="span-2 row-2" title="Explorer Origins" subtitle="Chronicle" icon={User} className="border-indigo-500/10">
                        {isEditing ? (
                            <div className="space-y-6 pt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Handle</label>
                                    <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Base Environment</label>
                                    <input type="text" value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Narrative Pulse</label>
                                    <textarea rows={3} value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                                </div>
                                <button onClick={handleUpdateProfile} className="w-full p-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase">Sync Changes</button>
                            </div>
                        ) : (
                            <div className="space-y-8 pt-4">
                                <p className="text-xl font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic pr-10">"{userData.bio || "The explorer has not yet left a mark on the universal grid. Every coordinate starts at zero."}"</p>
                                <div className="h-px bg-slate-100 dark:bg-slate-800"></div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base</p>
                                        <p className="text-lg font-bold dark:text-white">{userData.location || 'Undisclosed'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked</p>
                                        <p className="text-lg font-bold dark:text-white">{userData.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </BentoCard>
                    <BentoCard span="span-1" title={userPosts.length} subtitle="Discoveries" icon={Award} />
                    <BentoCard span="span-1" title={savedLocations.length} subtitle="Pinned Nodes" icon={Bookmark} />
                    <BentoCard span="span-2" title="Network Health" subtitle="Diagnostics" icon={Shield}>
                        <div className="flex items-end space-x-2 pt-4">
                            {[40, 70, 45, 90, 65, 80, 50, 85].map((h, i) => (
                                <div key={i} className="flex-1 bg-indigo-500/20 rounded-full relative overflow-hidden h-16">
                                    <motion.div 
                                        initial={{ height: 0 }} 
                                        animate={{ height: `${h}%` }} 
                                        className="absolute bottom-0 left-0 right-0 bg-indigo-600" 
                                    />
                                </div>
                            ))}
                        </div>
                    </BentoCard>
                </div>
            )}

            {activeTab === 'saved' && (
                <div className="masonry-grid">
                    {savedLocations.length > 0 ? savedLocations.map((loc, i) => (
                        <div key={loc.id || i} className={`glass-canvas-card custom-rounded overflow-hidden group ${i % 3 === 0 ? 'span-2' : ''}`}>
                            <div className="h-48 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <OptimizedImage src={loc.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            <div className="p-8">
                                <h3 className="text-2xl font-black dark:text-white font-space mb-2">{loc.title || loc.name}</h3>
                                <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center">
                                    Relocate PIN <ChevronRight className="w-3 h-3 ml-1" />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <BentoCard span="span-3" title="Zero Pins Detected" subtitle="Coordinate Archive" />
                    )}
                </div>
            )}

            {activeTab === 'posts' && (
                <div className="space-y-8">
                    {userPosts.length > 0 ? userPosts.map((post, i) => (
                        <BentoCard key={post._id} title={post.title} subtitle={post.category || 'Discovery'}>
                            <div className="flex flex-col md:flex-row gap-8 items-center pt-4">
                                <div className="w-48 h-32 rounded-3xl overflow-hidden shadow-2xl">
                                    <OptimizedImage src={post.image} className="w-full h-full object-cover" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{post.description}</p>
                            </div>
                        </BentoCard>
                    )) : (
                        <BentoCard span="span-4" title="Void" subtitle="Broadcast Index" />
                    )}
                </div>
            )}

            {activeTab === 'activities' && (
                <BentoCard span="span-4" title="System Radar" subtitle="Activity Pulse">
                    <div className="space-y-8 pt-8 pl-4 border-l-2 border-indigo-500/20">
                        {['Record Synchronized', 'New Discovery Pinned', 'Security Keys Rotated'].map((t, i) => (
                            <div key={i} className="relative">
                                <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full border-4 border-white dark:border-slate-900 shadow-lg" />
                                <div className="pl-6">
                                    <p className="text-lg font-bold dark:text-white">{t}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Time: 09:22:12</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </BentoCard>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-xl mx-auto space-y-4 pt-12">
                   <BentoCard title="Visual Protocol" subtitle="Environment" icon={Settings}>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                             <div className="flex items-center space-x-3">
                                 <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><Moon className="w-4 h-4" /></div>
                                 <p className="font-bold text-sm dark:text-white uppercase tracking-tighter">Midnight Shift</p>
                             </div>
                             <div 
                                onClick={toggleTheme}
                             className={`w-12 h-6 rounded-full cursor-pointer transition-all duration-300 flex items-center px-1 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                 <motion.div animate={{ x: theme === 'dark' ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-md" />
                             </div>
                        </div>
                   </BentoCard>
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Unique Floating Dock */}
      <div className="floating-dock">
          <DockItem active={activeTab === 'profile'} id="profile" label="Canvas" icon={Grid} onClick={setActiveTab} />
          <DockItem active={activeTab === 'saved'} id="saved" label="Nodes" icon={Bookmark} onClick={setActiveTab} />
          <DockItem active={activeTab === 'posts'} id="posts" label="Broadcasts" icon={MapIcon} onClick={setActiveTab} />
          <DockItem active={activeTab === 'activities'} id="activities" label="Pulse" icon={Activity} onClick={setActiveTab} />
          <div className="w-[1px] h-8 bg-white/10 my-auto mx-2" />
          <DockItem active={activeTab === 'settings'} id="settings" label="Config" icon={Settings} onClick={setActiveTab} />
      </div>
    </div>
  );
};

export default ProfilePage;