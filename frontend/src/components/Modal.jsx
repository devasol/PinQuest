import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckCircle2, AlertTriangle, AlertCircle, Info, 
  HelpCircle, ShieldCheck, Zap, Mail, Trash2, 
  Lock, KeyRound, UserMinus, LogOut
} from 'lucide-react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  type = 'default', // 'default', 'success', 'error', 'warning', 'info', 'confirmation'
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCloseButton = true,
  showConfirmButton = true,
  showCancelButton = false,
  showIcon = true,
  autoClose = 0, 
  duration = 5000, 
  size = 'md', 
  variant = 'solid', 
  closable = true,
  backdrop = true,
  animationType = 'scale'
}) => {
  useEffect(() => {
    let timer;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closable && onClose) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      if (autoClose > 0) {
        timer = setTimeout(() => onClose(), autoClose);
      }
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, onClose, closable, autoClose]);

  if (!isOpen) return null;

  const getTypeStyle = () => {
    switch (type) {
      case 'success':
        return {
          icon: ShieldCheck,
          accent: 'teal-500',
          bg: 'teal-50/50',
          text: 'teal-900',
          button: 'bg-teal-500 hover:bg-teal-600 shadow-teal-100',
          border: 'border-teal-100'
        };
      case 'error':
        return {
          icon: AlertCircle,
          accent: 'red-500',
          bg: 'red-50/50',
          text: 'red-900',
          button: 'bg-red-500 hover:bg-red-600 shadow-red-100',
          border: 'border-red-100'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          accent: 'amber-500',
          bg: 'amber-50/50',
          text: 'amber-900',
          button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100',
          border: 'border-amber-100'
        };
      case 'info':
        return {
          icon: Lock, // Pro style uses Lock for auth
          accent: 'teal-500', 
          bg: 'slate-50',
          text: 'slate-900',
          button: 'bg-slate-900 hover:bg-black shadow-slate-200',
          border: 'border-slate-100'
        };
      case 'confirmation':
        return {
          icon: HelpCircle,
          accent: 'slate-900',
          bg: 'slate-50',
          text: 'slate-900',
          button: 'bg-slate-900 hover:bg-black shadow-slate-200',
          border: 'border-slate-100'
        };
      default:
        return {
          icon: Zap,
          accent: 'slate-900',
          bg: 'white',
          text: 'slate-900',
          button: 'bg-slate-900 hover:bg-black shadow-slate-200',
          border: 'border-slate-100'
        };
    }
  };

  const style = getTypeStyle();
  const IconComponent = style.icon;

  const animationVariants = {
    scale: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
      exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
    },
    slide: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
      exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-3xl'
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Pro Backdrop - Deeper Blur/Darkness */}
          {backdrop && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99998]"
              onClick={closable ? onClose : undefined}
            />
          )}

          <div className="fixed inset-0 flex items-center justify-center p-6 z-[99999] pointer-events-none">
            <motion.div
               variants={animationVariants[animationType === 'fade' ? 'slide' : animationType]}
               initial="hidden" animate="visible" exit="exit"
               className={`${sizeClasses[size]} w-full bg-white rounded-[2.5rem] shadow-[0_45px_100px_-20px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden pointer-events-auto flex flex-col font-jakarta`}
               onClick={(e) => e.stopPropagation()}
            >
               {/* Pro Header Navigation - Simplified but Impactful */}
               <div className="px-10 pt-10 pb-6 flex items-center justify-between">
                  <div className="flex flex-col">
                     <div className={`flex items-center gap-2 mb-2 text-${style.accent}`}>
                        {showIcon && <IconComponent size={18} strokeWidth={3} />}
                        <span className="text-[10px] font-black uppercase tracking-[0.25em]">Security Protocol</span>
                     </div>
                     <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{title || 'Attention'}</h2>
                  </div>
                  {showCloseButton && (
                    <button 
                       onClick={onClose}
                       className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                    >
                       <X size={20} strokeWidth={2.5} />
                    </button>
                  )}
               </div>

               {/* Modal Body - Simple & Direct */}
               <div className="px-10 py-6 min-h-[80px]">
                  <div className="text-[15px] font-bold text-slate-500 leading-relaxed">
                     {children}
                  </div>
               </div>

               {/* Pro Footer - Structural Contrast */}
               <div className="px-10 py-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4 mt-auto">
                  {showCancelButton && (
                    <button 
                      onClick={onClose}
                      className="h-14 px-8 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:border-slate-300 hover:text-slate-900 transition-all active:scale-[0.98]"
                    >
                       {cancelText}
                    </button>
                  )}
                  {showConfirmButton && (
                    <button 
                       onClick={handleConfirm}
                       className={`h-14 px-10 rounded-2xl ${style.button} text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] flex items-center gap-3`}
                    >
                       {confirmText}
                       <Zap size={14} fill="white" />
                    </button>
                  )}
               </div>

               {/* Progress bar tracking for auto-close */}
               {autoClose > 0 && (
                 <div className="h-1.5 w-full bg-slate-100">
                   <motion.div 
                     className={`h-full bg-${style.accent}`}
                     initial={{ width: '100%' }}
                     animate={{ width: '0%' }}
                     transition={{ duration: autoClose / 1000, ease: "linear" }}
                   />
                 </div>
               )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;