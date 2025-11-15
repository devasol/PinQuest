import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationModal = ({ 
  show, 
  onClose, 
  message, 
  type = 'info', // 'success', 'error', 'info', 'warning'
  autoClose = 5000 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default: // info
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default: // info
        return 'bg-blue-500';
    }
  };

  useEffect(() => {
    let timer;
    if (show && autoClose > 0) {
      timer = setTimeout(() => {
        onClose();
      }, autoClose);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [show, autoClose, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] max-w-md w-full mx-4 p-6 rounded-xl shadow-2xl`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <div className={`${getBgColor()} p-4 rounded-lg mb-4 flex items-center`}>
              {getIcon()}
              <h3 className="ml-3 text-white font-semibold">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </h3>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <p className="text-gray-800">{message}</p>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;