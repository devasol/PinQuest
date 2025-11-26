import React from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  type = 'info',
  size = 'md' 
}) => {
  if (!isOpen) return null;

  const typeClasses = {
    info: 'border-blue-500 bg-blue-50',
    success: 'border-green-500 bg-green-50',
    warning: 'border-yellow-500 bg-yellow-50',
    error: 'border-red-500 bg-red-50',
    confirm: 'border-orange-500 bg-orange-50'
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-lg shadow-xl border-l-4 ${typeClasses[type]}`}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            {children}
          </div>
          
          {footer && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;