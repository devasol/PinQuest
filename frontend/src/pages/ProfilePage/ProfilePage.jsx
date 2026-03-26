import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  User, MapPin, Star, Bookmark, Activity, Calendar, Image as ImageIcon, 
  Settings, LogOut, ChevronRight, Edit3, Trash2, Save, X, Plus, Clock,
  Map as MapIcon, Heart, Share2, Grid, List, Shield, Mail, Pencil,
  TrendingUp, Award, Zap, Moon, Sun, Layout, CheckCircle
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
    whileHover={{ y: -3 }}
    className={`glass-canvas-card custom-rounded p-8 flex flex-col justify-between ${span} ${className} glow-pulse`}
  >
    <div className="flex justify-between items-start mb-6">
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">{subtitle}</h3>
        <h2 className="text-xl font-black text-slate-900 dark:text-white font-space tracking-tight">{title}</h2>
      </div>
      {Icon && (
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white">
          <Icon className="w-4 h-4" />
        </div>
      )}
    </div>
    <div className="flex-1">{children}</div>
  </motion.div>
);

const ProfilePage = () => {
  usePageTitle("User Dashboard");
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

      const savedRes = await fetch(`${apiBase}/users/saved-locations`, { headers: { Authorization: `Bearer ${token}` } });
      if (savedRes.ok) {
          const data = await savedRes.json();
          setSavedLocations(data.data?.savedLocations || []);
      }

      const postsRes = await fetch(`${apiBase}/posts`, { headers: { Authorization: `Bearer ${token}` } });
      if (postsRes.ok) {
        const data = await postsRes.json();
        const myPosts = data.data?.filter(p => p.postedBy?._id === user?._id || p.postedBy === user?._id) || [];
        setUserPosts(myPosts);
      }
      
      const localActivities = [];
      userPosts.slice(0, 3).forEach(p => localActivities.push({ id: `p-${p._id}`, title: `Posted: ${p.title}`, type: 'post' }));
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
        showModal({ title: "Profile Updated", message: "Your changes have been saved.", type: 'success' });
      }
    } catch (err) { console.error(err); } finally { setLoadingData(false); }
  };

  if (loading || (loadingData && !userData.email)) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="profile-canvas no-scrollbar font-inter transition-all duration-700">
      
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto px-6 mb-12 flex items-center justify-between">
          <div className="flex items-center space-x-8">
              <div className="offset-ring">
                  <div className="w-20 h-20 offset-inner overflow-hidden flex items-center justify-center">
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-2xl font-black font-space">
                          {userData.name?.charAt(0) || 'U'}
                      </div>
                  </div>
              </div>
              <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white font-space tracking-tight">
                      {userData.name || 'User Dashboard'}
                  </h1>
                  <p className="text-indigo-600 font-bold text-[11px] uppercase tracking-widest">Active Member Since {new Date(userData.createdAt).getFullYear()}</p>
              </div>
          </div>
          <div className="flex items-center space-x-2">
              <button onClick={toggleTheme} className="w-12 h-12 glass-canvas-card custom-rounded flex items-center justify-center hover:scale-105 active:scale-95 text-slate-900 dark:text-white">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-6 h-12 glass-canvas-card custom-rounded font-black text-[10px] tracking-widest uppercase hover:scale-105 active:scale-95 text-slate-900 dark:text-white"
              >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              <button onClick={logout} className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center custom-rounded hover:scale-105">
                  <LogOut className="w-4 h-4" />
              </button>
          </div>
      </div>

      {/* Main Content Pane */}
      <main className="max-w-7xl mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'profile' && (
                <div className="masonry-grid">
                    <BentoCard span="span-2 row-2" title="Account Details" subtitle="My Profile" icon={User}>
                        {isEditing ? (
                            <div className="space-y-4 pt-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Name</label>
                                    <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl outline-none border border-transparent focus:border-indigo-500 dark:text-white text-sm font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Location</label>
                                    <input type="text" value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} className="w-full bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl outline-none border border-transparent focus:border-indigo-500 dark:text-white text-sm font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Bio</label>
                                    <textarea rows={2} value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl outline-none border border-transparent focus:border-indigo-500 dark:text-white text-sm font-bold" />
                                </div>
                                <button onClick={handleUpdateProfile} className="w-full p-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] tracking-widest uppercase mt-2">Update Account</button>
                            </div>
                        ) : (
                            <div className="space-y-6 pt-4">
                                <p className="text-lg font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic pr-4">{userData.bio || "No biography provided yet. Add some flavor to your profile."}</p>
                                <div className="h-px bg-slate-100 dark:bg-slate-800"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Base</p>
                                        <p className="text-base font-bold dark:text-white">{userData.location || 'Not Specified'}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Verified Email</p>
                                        <p className="text-base font-bold dark:text-white truncate">{userData.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </BentoCard>
                    <BentoCard span="span-1" title={userPosts.length} subtitle="Published Posts" icon={Layout} />
                    <BentoCard span="span-1" title={savedLocations.length} subtitle="Saved Locations" icon={Bookmark} />
                    <BentoCard span="span-2" title="Onboarding Progress" subtitle="Profile Setup" icon={CheckCircle}>
                        <div className="pt-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion</span>
                                <span className="text-xs font-bold text-indigo-600">85%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-indigo-600 rounded-full" />
                            </div>
                            <p className="text-[9px] text-slate-400 mt-3 font-medium">Add a profile image to reach 100%.</p>
                        </div>
                    </BentoCard>
                </div>
            )}

            {activeTab === 'saved' && (
                <div className="masonry-grid">
                    {savedLocations.length > 0 ? savedLocations.map((loc, i) => (
                        <div key={loc.id || i} className={`glass-canvas-card custom-rounded overflow-hidden group ${i % 3 === 0 ? 'span-2' : ''}`}>
                            <div className="h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <OptimizedImage src={loc.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold dark:text-white font-space mb-2">{loc.title || loc.name}</h3>
                                <div className="flex items-center space-x-2">
                                  <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View Map</button>
                                  <span className="text-slate-300">•</span>
                                  <button onClick={() => showModal({ title: "Remove Location", message: "Remove this place from your saves?", type: 'warning' })} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Remove</button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <BentoCard span="span-4" title="Empty Library" subtitle="Your Saves" icon={Bookmark}>
                            <p className="text-slate-500 text-sm py-4">You haven't saved any locations yet. Go to Discover to find amazing places.</p>
                        </BentoCard>
                    )}
                </div>
            )}

            {activeTab === 'posts' && (
                <div className="space-y-6">
                    {userPosts.length > 0 ? userPosts.map((post, i) => (
                        <div key={post._id} className="glass-canvas-card custom-rounded p-6 flex items-center space-x-8">
                            <div className="w-40 h-28 bg-slate-50 rounded-2xl overflow-hidden shadow-lg border border-white/50">
                                <OptimizedImage src={post.image} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">{post.category || 'General'}</p>
                                <h3 className="text-xl font-bold dark:text-white mb-2">{post.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{post.description}</p>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white hover:bg-slate-100 transition-all"><Edit3 className="w-4 h-4" /></button>
                              <button className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )) : (
                        <BentoCard span="span-4" title="No Posts Shared" subtitle="Your Activity" icon={Layout} />
                    )}
                </div>
            )}

            {activeTab === 'activities' && (
                <BentoCard span="span-4" title="Recent History" subtitle="Activity Log" icon={Clock}>
                    <div className="space-y-6 pt-6">
                        {activities.length > 0 ? activities.map((act, i) => (
                            <div key={i} className="flex items-center space-x-6 p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-white/5">
                                <div className="p-3 bg-indigo-600 rounded-xl text-white"><Plus className="w-4 h-4" /></div>
                                <div className="flex-1">
                                    <p className="font-bold dark:text-white text-sm">{act.title}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entry Logged 1 hour ago</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </div>
                        )) : (
                            <p className="text-slate-400 text-sm text-center py-10">No recent activity detected.</p>
                        )}
                    </div>
                </BentoCard>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-xl mx-auto space-y-4 pt-12">
                   <BentoCard title="Preferences" subtitle="Global Settings" icon={Settings}>
                        <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                             <div>
                                 <p className="font-bold text-sm dark:text-white uppercase tracking-tighter">Theme Selection</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}</p>
                             </div>
                             <div 
                                onClick={toggleTheme}
                                className={`w-12 h-6 rounded-full cursor-pointer transition-all duration-300 flex items-center px-1 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}
                             >
                                 <motion.div animate={{ x: theme === 'dark' ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-md" />
                             </div>
                        </div>
                   </BentoCard>
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Menu Dock */}
      <div className="floating-dock">
          <DockItem active={activeTab === 'profile'} id="profile" label="Profile" icon={User} onClick={setActiveTab} />
          <DockItem active={activeTab === 'saved'} id="saved" label="Saves" icon={Bookmark} onClick={setActiveTab} />
          <DockItem active={activeTab === 'posts'} id="posts" label="My Posts" icon={Layout} onClick={setActiveTab} />
          <DockItem active={activeTab === 'activities'} id="activities" label="Activity" icon={Clock} onClick={setActiveTab} />
          <div className="w-[1px] h-6 bg-white/10 my-auto mx-2" />
          <DockItem active={activeTab === 'settings'} id="settings" label="Settings" icon={Settings} onClick={setActiveTab} />
      </div>
    </div>
  );
};

export default ProfilePage;