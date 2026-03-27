import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Check, Settings2 } from 'lucide-react';

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

  const handleManage = () => {
    // In a real app, this would open a more granular settings modal
    // For now, we'll just show a toast or log it
    console.log('Open cookie settings');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 100, opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 100, opacity: 0, scale: 0.95 }}
          transition={{ 
            type: 'spring', 
            damping: 25, 
            stiffness: 200,
            delay: 0.5 
          }}
          className="fixed bottom-6 right-6 md:right-8 w-[calc(100%-3rem)] md:max-w-[400px] z-[10000]"
        >
          <div className="relative group overflow-hidden">
            {/* Glossy Background with Gradient Border */}
            <div className="absolute -inset-[1px] bg-gradient-to-br from-indigo-500/20 via-transparent to-blue-500/20 rounded-3xl -z-10" />
            
            <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-6 md:p-7">
              
              {/* Header Section */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform duration-500">
                    <Cookie size={20} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                    Privacy Node
                  </h3>
                </div>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content Section */}
              <div className="space-y-4 mb-7">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed font-outfit">
                  We leverage advanced data protocols to optimize your exploration of PinQuest. 
                  By accepting, you authorize the synchronization of analytical and functional cookies.
                </p>
                <button 
                  onClick={handleManage}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors uppercase tracking-widest"
                >
                  <Settings2 size={12} strokeWidth={3} />
                  Configure Preferences
                </button>
              </div>

              {/* Action Section */}
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAccept}
                  className="relative overflow-hidden group/btn w-full bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
                >
                  <Check size={14} strokeWidth={3} />
                  Synchronize All
                </motion.button>
                
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReject}
                  className="w-full bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all border border-transparent dark:border-slate-700/50"
                >
                  Essential Only
                </motion.button>
              </div>

              {/* Decorative Subtle Line */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;

