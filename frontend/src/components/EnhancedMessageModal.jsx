import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X, RotateCcw } from 'lucide-react';

const EnhancedMessageModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info', 'loading'
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCloseButton = true,
  showConfirmButton = true,
  showCancelButton = false,
  showIcon = true,
  autoClose = 0, // in milliseconds, 0 means no auto close
  duration = 5000, // for auto-close modals
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  variant = 'solid', // 'solid', 'outline', 'elevated'
  closable = true,
  backdrop = true,
  animationType = 'scale', // 'scale', 'slide', 'fade'
  showProgressBar = true,
  customIcon = null,
  actions = [], // Array of custom action buttons
  showRetryButton = false,
  onRetry = null
}) => {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          iconColor: 'text-emerald-500',
          accent: 'bg-emerald-500',
          buttonColor: 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500/50'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          iconColor: 'text-red-500',
          accent: 'bg-red-500',
          buttonColor: 'bg-red-500 hover:bg-red-600 focus:ring-red-500/50'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          iconColor: 'text-amber-500',
          accent: 'bg-amber-500',
          buttonColor: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/50'
        };
      case 'info':
        return {
          icon: Info,
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          iconColor: 'text-blue-500',
          accent: 'bg-blue-500',
          buttonColor: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/50'
        };
      case 'loading':
        return {
          icon: null,
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          iconColor: 'text-gray-500',
          accent: 'bg-gray-500',
          buttonColor: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500/50'
        };
      default:
        return {
          icon: Info,
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          iconColor: 'text-gray-500',
          accent: 'bg-gray-500',
          buttonColor: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500/50'
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = customIcon || config.icon;

  // Animation variants
  const modalVariants = {
    scale: {
      hidden: { 
        opacity: 0, 
        scale: 0.75,
        transition: { duration: 0.2, ease: "easeOut" }
      },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { 
          duration: 0.3, 
          ease: "easeOut",
          when: "beforeChildren",
          staggerChildren: 0.1
        }
      },
      exit: { 
        opacity: 0, 
        scale: 0.95,
        transition: { duration: 0.2, ease: "easeIn" }
      }
    },
    slide: {
      hidden: { 
        opacity: 0, 
        y: 50,
        transition: { duration: 0.2, ease: "easeOut" }
      },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.3, 
          ease: "easeOut",
          when: "beforeChildren",
          staggerChildren: 0.1
        }
      },
      exit: { 
        opacity: 0, 
        y: 50,
        transition: { duration: 0.2, ease: "easeIn" }
      }
    },
    fade: {
      hidden: { 
        opacity: 0,
        transition: { duration: 0.2, ease: "easeOut" }
      },
      visible: { 
        opacity: 1,
        transition: { 
          duration: 0.3, 
          ease: "easeOut",
          when: "beforeChildren",
          staggerChildren: 0.1
        }
      },
      exit: { 
        opacity: 0,
        transition: { duration: 0.2, ease: "easeIn" }
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm w-full mx-4',
    md: 'max-w-md w-full mx-4',
    lg: 'max-w-lg w-full mx-4',
    xl: 'max-w-xl w-full mx-4'
  };

  // Variant classes
  const variantClasses = {
    solid: `shadow-xl ${variant === 'solid' ? 'ring-1 ring-black/5' : ''}`,
    outline: `border ${variant === 'outline' ? 'bg-white' : ''}`,
    elevated: `shadow-2xl ${variant === 'elevated' ? 'ring-1 ring-black/10' : ''}`
  };

  const handleConfirmClick = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancelClick = () => {
    onClose();
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {backdrop && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closable ? onClose : undefined}
            />
          )}
          
          <motion.div
            className={`fixed inset-0 z-[99999] flex items-center justify-center p-4`}
            onClick={closable ? onClose : undefined}
          >
            <motion.div
              className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-2xl overflow-hidden ${config.bg} ${config.border} ${variant === 'outline' ? '' : 'border'}`}
              variants={modalVariants[animationType]}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b ${config.border} relative`}>
                <div className="flex items-center space-x-3">
                  {showIcon && IconComponent && (
                    <div className={`p-2 rounded-full ${config.iconColor} bg-opacity-10 ${config.bg}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                  )}
                  {title && (
                    <h2 className={`text-xl font-semibold ${config.text}`}>
                      {title}
                    </h2>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    className={`p-1 rounded-full hover:bg-gray-200 transition-colors ${config.text}`}
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Progress bar for auto-close modals */}
              {autoClose > 0 && showProgressBar && (
                <div className="h-1 w-full bg-gray-200">
                  <motion.div 
                    className={`h-full ${config.accent.replace('bg-', 'bg-')}`}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: autoClose / 1000, ease: "linear" }}
                  />
                </div>
              )}

              {/* Loading spinner for loading type */}
              {type === 'loading' && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              )}

              {/* Modal Body */}
              {!['loading'].includes(type) && (
                <motion.div 
                  className="p-6"
                  variants={contentVariants}
                >
                  {message && (
                    <p className={`text-gray-700 ${config.text}`}>
                      {message}
                    </p>
                  )}
                  
                  {/* Custom actions */}
                  {actions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {actions.map((action, index) => (
                        <button
                          key={index}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${action.buttonColor || 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/50 text-white'}`}
                          onClick={action.onClick}
                        >
                          {action.text}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50/30">
                {showCancelButton && (
                  <button
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                    onClick={handleCancelClick}
                  >
                    {cancelText}
                  </button>
                )}
                
                {showRetryButton && onRetry && (
                  <button
                    className="px-4 py-2 text-gray-700 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300 flex items-center space-x-2"
                    onClick={handleRetry}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retry</span>
                  </button>
                )}
                
                {showConfirmButton && (
                  <button
                    className={`px-4 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.buttonColor}`}
                    onClick={handleConfirmClick}
                  >
                    {confirmText}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EnhancedMessageModal;