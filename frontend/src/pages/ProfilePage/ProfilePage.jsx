import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useModal } from '../../contexts/ModalContext';
import { useTheme } from '../../contexts/ThemeContext'; // Import theme hook
import { 
  User, MapPin, Star, Bookmark, Activity, Calendar, Image as ImageIcon, 
  Settings, LogOut, ChevronRight, Edit3, Trash2, Save, X, Plus, Clock,
  Map as MapIcon, Heart, Share2, Grid, List, Shield, Mail, Pencil,
  TrendingUp, Award, Zap, Moon, Sun, ToggleLeft, ToggleRight
} from 'lucide-react';
import OptimizedImage from '../../components/OptimizedImage';
import { getImageUrl } from '../../utils/imageUtils';
import usePageTitle from '../../services/usePageTitle';
import './ProfilePage.css';

// --- Sub-components ---

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-4 transition-all duration-300"
  >
    <div className={`w-11 h-11 rounded-xl ${colorClass} flex items-center justify-center shadow-md shadow-gray-200 dark:shadow-none`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 font-inter">{label}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-white font-space tracking-tight">{value}</p>
    </div>
  </motion.div>
);

const TabButton = ({ active, id, label, icon: Icon, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`relative flex items-center space-x-3 px-4 py-3 font-bold transition-all duration-300 rounded-xl w-full text-left ${
      active 
        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20' 
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/30 dark:hover:bg-slate-800/30'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'stroke-[2px]' : 'stroke-1.5'}`} />
    <span className="font-inter text-sm tracking-tight">{label}</span>
    {active && (
      <motion.div
        layoutId="activeTabGlow"
        className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-600 rounded-full"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
  </button>
);

const ProfilePage = () => {
  usePageTitle("User Dashboard");
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Use theme context
  const { showModal } = useModal();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(user || {});
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [savedLocations, setSavedLocations] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Initialize data
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

      await generateActivityLog();
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const generateActivityLog = async () => {
    const localActivities = [];
    userPosts.slice(0, 5).forEach(p => localActivities.push({
      id: `post-${p._id}`, type: 'post', title: `Shared "${p.title}"`,
      timestamp: p.datePosted || new Date().toISOString(), icon: MapPin
    }));
    savedLocations.slice(0, 5).forEach(l => localActivities.push({
      id: `save-${l.id}`, type: 'saved', title: `Saved a new spot`,
      timestamp: l.savedAt || new Date().toISOString(), icon: Bookmark
    }));
    
    localActivities.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    setActivities(localActivities);
  };

  const handleUpdateProfile = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: editData.name,
          bio: editData.bio,
          location: editData.location
        }),
      });

      if (response.ok) {
        setUserData(prev => ({ ...prev, ...editData }));
        setIsEditing(false);
        showModal({ title: "Updated", message: "Details saved.", type: 'success' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Explorer';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  if (loading || (loadingData && !userData.email)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] pb-16 transition-all duration-300 font-inter">
      <div className="h-44 bg-slate-900 dark:bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.85),rgba(15,23,42,0.85)),url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-20 relative z-10">
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 md:p-7 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/40 dark:shadow-none">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl profile-picture-ring overflow-hidden shadow-xl bg-indigo-600">
                  <div className="w-full h-full rounded-[1.2rem] profile-picture-inner bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-indigo-600 font-space overflow-hidden">
                    {userData.image ? (
                        <OptimizedImage src={userData.image} alt={userData.name} className="w-full h-full object-cover" />
                    ) : (
                        userData.name?.charAt(0)?.toUpperCase() || 'E'
                    )}
                  </div>
                </div>
                <button className="absolute -bottom-1 -right-1 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-indigo-600 hover:scale-110 transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-3 mb-1">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-space">{userData.name || 'Anonymous'}</h1>
                  <div className="px-2 py-0.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">PRO</div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-4">
                    <p className="text-sm text-slate-400 font-medium flex items-center justify-center md:justify-start">
                        <Mail className="w-3.5 h-3.5 mr-2" /> {userData.email}
                    </p>
                    <p className="text-sm text-indigo-500 font-bold flex items-center justify-center md:justify-start">
                        <Zap className="w-3.5 h-3.5 mr-2" /> Level 12 Explorer
                    </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
                <button 
                  onClick={toggleTheme}
                  className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all shadow-sm"
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-6 py-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl font-black text-[10px] tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center shadow-lg"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-2" /> {isEditing ? 'Cancel' : 'Edit'}
                </button>
                <button 
                  onClick={() => logout()}
                  className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-500 hover:text-white transition-all shadow-md"
                >
                  <LogOut className="w-5 h-5" />
                </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={MapIcon} label="Total Posts" value={userPosts.length} colorClass="bg-blue-600" />
            <StatCard icon={Bookmark} label="Saves" value={savedLocations.length} colorClass="bg-indigo-600" />
            <StatCard icon={Award} label="Reputation" value="4.9" colorClass="bg-amber-500" />
            <StatCard icon={TrendingUp} label="Reach" value="High" colorClass="bg-emerald-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3">
                <div className="glass-card rounded-2xl p-3 flex flex-col space-y-1 sticky top-6">
                    <p className="px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Navigator</p>
                    <TabButton active={activeTab === 'profile'} id="profile" label="Identity" icon={User} onClick={setActiveTab} />
                    <TabButton active={activeTab === 'saved'} id="saved" label="Bookmarks" icon={Bookmark} onClick={setActiveTab} />
                    <TabButton active={activeTab === 'posts'} id="posts" label="Discoveries" icon={MapIcon} onClick={setActiveTab} />
                    <TabButton active={activeTab === 'activities'} id="activities" label="Pulse" icon={Activity} onClick={setActiveTab} />
                    <div className="h-px bg-slate-100 dark:bg-slate-800/50 my-2 mx-2"></div>
                    <TabButton active={activeTab === 'settings'} id="settings" label="Preferences" icon={Settings} onClick={setActiveTab} />
                </div>
            </div>

            <div className="lg:col-span-9 min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden group">
                        <div className="mb-8">
                            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1 font-space uppercase tracking-tight">Account Particulars</h2>
                            <p className="text-xs text-slate-400 font-medium">Verified PinQuest Data Node</p>
                        </div>

                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Explorer Handle</label>
                                <input 
                                    type="text" value={editData.name} 
                                    onChange={e => setEditData({...editData, name: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-sm text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Base</label>
                                <input 
                                    type="text" value={editData.location} 
                                    onChange={e => setEditData({...editData, location: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-sm text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Field Bio</label>
                                <textarea 
                                    value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-sm text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end pt-2">
                                <button onClick={handleUpdateProfile} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-indigo-500/20">Commit</button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Handle', value: userData.name, icon: User, color: 'text-blue-500' },
                                { label: 'Mail', value: userData.email, icon: Mail, color: 'text-indigo-500' },
                                { label: 'Base', value: userData.location || 'Deep Sea', icon: MapPin, color: 'text-purple-500' },
                                { label: 'Entry', value: formatDate(userData.createdAt), icon: Calendar, color: 'text-emerald-500' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 group hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 ${item.color} shadow-sm group-hover:scale-110 transition-all`}>
                                            <item.icon className="w-4 h-4 stroke-[2px]" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
                                            <p className="text-base font-bold font-space text-slate-900 dark:text-white">{item.value}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="md:col-span-2 p-5 rounded-2xl bg-indigo-50/20 dark:bg-indigo-900/10 border border-indigo-100/30 dark:border-indigo-900/30 relative">
                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-2">Origins</p>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                    "{userData.bio || "The map remains blank."}"
                                </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'saved' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-space tracking-tight uppercase">Archive</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{savedLocations.length} Points</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {savedLocations.length > 0 ? savedLocations.map((loc, idx) => (
                                <motion.div key={loc.id || idx} whileHover={{ y: -3 }} className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-none">
                                    <div className="h-40 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                                        <OptimizedImage src={loc.image} className="w-full h-full object-cover" />
                                        <div className="absolute top-4 right-4">
                                            <button className="p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold dark:text-white mb-1 font-space tracking-tight">{loc.title || loc.name}</h3>
                                        <div className="flex items-center text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">
                                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                                            {loc.location || 'Universal Grid'}
                                        </div>
                                        <button className="w-full py-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shadow-md">Relocate</button>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="md:col-span-2 py-20 text-center glass-card rounded-[2rem] border-dashed border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center">
                                    <Bookmark className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-4" />
                                    <p className="text-sm font-black text-slate-300 dark:text-slate-700 font-space tracking-widest uppercase">Archive Empty</p>
                                </div>
                            )}
                        </div>
                    </div>
                  )}

                  {activeTab === 'posts' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-slate-900 dark:bg-slate-800 p-6 rounded-[1.5rem] text-white">
                            <div>
                                <h2 className="text-xl font-extrabold font-space uppercase tracking-tight">Discoveries</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Global Database Entry</p>
                            </div>
                            <button className="px-5 py-2.5 bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-500/20">
                                Share New
                            </button>
                        </div>
                        <div className="space-y-4">
                            {userPosts.length > 0 ? userPosts.map((post, idx) => (
                                <motion.div key={post._id || idx} className="glass-card flex flex-col md:flex-row rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                                    <div className="md:w-56 h-48 md:h-auto bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                                        <OptimizedImage src={post.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-bold dark:text-white font-space tracking-tight">{post.title}</h3>
                                                <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Edit3 className="w-4 h-4" /></button>
                                            </div>
                                            <p className="text-slate-500 text-sm font-medium line-clamp-2 leading-relaxed mb-4">{post.description}</p>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex space-x-6">
                                                <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                                                    {formatDate(post.datePosted)}
                                                </div>
                                                <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Heart className="w-3.5 h-3.5 mr-1.5 text-red-500" />
                                                    1.2k
                                                </div>
                                            </div>
                                            <div className="px-3 py-0.5 bg-slate-900 dark:bg-indigo-600 text-white rounded text-[8px] font-black uppercase tracking-widest">Public</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="py-20 text-center glass-card rounded-[2rem] border-dashed border-2 border-slate-100 dark:border-slate-800">
                                    <MapIcon className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
                                </div>
                            )}
                        </div>
                    </div>
                  )}

                  {activeTab === 'activities' && (
                    <div className="glass-card rounded-[2rem] p-8 h-full border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-3 mb-10">
                            <div className="w-10 h-1 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-space uppercase tracking-tight">Pulse</h2>
                        </div>
                        <div className="relative pl-10 space-y-12 activity-line">
                            {activities.length > 0 ? activities.map((act, idx) => (
                                <div key={act.id || idx} className="relative flex items-start group">
                                    <div className="absolute -left-[54px] w-11 h-11 bg-white dark:bg-slate-900 border border-slate-900 dark:border-indigo-600 rounded-xl flex items-center justify-center z-20 shadow-lg shadow-slate-900/5">
                                        <act.icon className="w-4 h-4 stroke-[2px]" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white font-space tracking-tight uppercase">{act.title}</h4>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 flex items-center">
                                                <Clock className="w-3 h-3 mr-1" /> {formatDate(act.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-inter">System verified record Entry.</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-slate-200 dark:text-slate-700 font-black uppercase tracking-widest">No Pulse</div>
                            )}
                        </div>
                    </div>
                  )}

                  {activeTab === 'settings' && (
                      <div className="max-w-2xl space-y-6">
                          <div className="p-8 bg-slate-900 dark:bg-slate-800/80 rounded-[2rem] text-white">
                              <h2 className="text-xl font-extrabold font-space uppercase tracking-tight mb-6">Environment</h2>
                              <div className="space-y-4">
                                  <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                      <div>
                                          <p className="font-bold text-base font-space tracking-tight uppercase">Dark Protocol</p>
                                          <p className="text-slate-400 text-[10px]">Toggle between visual environments.</p>
                                      </div>
                                      <button onClick={toggleTheme} className="transition-all hover:scale-110">
                                          {theme === 'dark' ? <ToggleRight className="w-8 h-8 text-indigo-400" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                                      </button>
                                  </div>
                                  <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 opacity-40 cursor-not-allowed">
                                      <div>
                                          <p className="font-bold text-base font-space tracking-tight uppercase">Network Pings</p>
                                          <p className="text-slate-400 text-[10px]">Real-time security updates.</p>
                                      </div>
                                      <ToggleLeft className="w-8 h-8 text-slate-500" />
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;