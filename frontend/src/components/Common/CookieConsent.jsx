import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Check, Settings2 } from 'lucide-react';

// Memoized Toggle component to prevent unnecessary re-renders
const Toggle = memo(({ id, enabled, onClick, disabled }) => {
  // Use a stable click handler that calls the parent onClick with the id
  const handleClick = useCallback(() => {
    if (!disabled) onClick(id);
  }, [id, onClick, disabled]);

  return (
    <div className="flex items-center">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
          enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ width: '40px', height: '22px', minWidth: '40px', minHeight: '22px' }}
      >
        <motion.span
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 700, damping: 40 }}
          className="inline-block rounded-full bg-white shadow-sm"
          style={{ width: '18px', height: '18px' }}
        />
      </button>
    </div>
  );
});

Toggle.displayName = 'Toggle';

// Static categories outside component to prevent re-creation
const COOKIE_CATEGORIES = [
  { id: 'necessary', title: 'Necessary', desc: 'Required for basic site functionality.', required: true },
  { id: 'analytics', title: 'Analytics', desc: 'Helps us understand how you use the site.' },
  { id: 'marketing', title: 'Personalization', desc: 'Used for personalized content and features.' }
];

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = useCallback(() => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      all: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  }, []);

  const handleReject = useCallback(() => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      all: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      ...preferences,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  }, [preferences]);

  const togglePreference = useCallback((key) => {
    if (key === 'necessary') return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const closeConsent = useCallback(() => setIsVisible(false), []);
  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 100, opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 right-6 md:right-8 w-[calc(100%-3rem)] md:max-w-[420px] z-[10000]"
        >
          <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-6 md:p-7">
            
            <AnimatePresence mode="wait">
              {!showSettings ? (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <Cookie size={20} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        Cookie Consent
                      </h3>
                    </div>
                    <button 
                      onClick={closeConsent}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4 mb-7">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-outfit">
                      We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                    </p>
                    <button 
                      onClick={openSettings}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors uppercase tracking-widest"
                    >
                      <Settings2 size={12} strokeWidth={3} />
                      Cookie Settings
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAccept}
                      className="flex-1 bg-slate-900 dark:bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <Check size={16} strokeWidth={3} />
                      Accept All
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReject}
                      className="flex-1 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all border border-transparent dark:border-slate-700/50"
                    >
                      Reject All
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight italic uppercase">
                      Preference Center
                    </h3>
                    <button 
                      onClick={closeSettings}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      Back
                    </button>
                  </div>

                  <div className="space-y-5 mb-8">
                    {COOKIE_CATEGORIES.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{item.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-500 leading-tight">{item.desc}</p>
                        </div>
                        <Toggle 
                          id={item.id}
                          enabled={preferences[item.id]} 
                          onClick={togglePreference}
                          disabled={item.required}
                        />
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSavePreferences}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Save Preferences
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(CookieConsent);


