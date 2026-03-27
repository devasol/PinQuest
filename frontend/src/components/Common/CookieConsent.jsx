import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Check } from 'lucide-react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Delay showing the banner for a better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[10000]"
        >
          <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden relative group">
            {/* Subtle glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-teal-500/10 rounded-2xl blur-xl group-hover:opacity-100 transition-opacity opacity-0 -z-10" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Shield size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-1">
                  Cookie Protocol
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-outfit uppercase tracking-tight">
                  We use cookies to enhance your navigation experience, serve personalized content, and analyze our traffic. 
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAccept}
                    className="flex-1 bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    <Check size={14} strokeWidth={3} />
                    Accept All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReject}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X size={14} strokeWidth={3} />
                    Necessary Only
                  </motion.button>
                </div>
              </div>
            </div>
            
            {/* Minimalist decorative element */}
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Shield size={80} className="-rotate-12 translate-x-8 -translate-y-8" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
