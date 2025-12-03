import React, { useState } from 'react';
import { useModal } from '../contexts/ModalContext';
import EnhancedMessageModal from './EnhancedMessageModal';

const AmazingModalShowcase = () => {
  const { showModal } = useModal();
  const [customModal, setCustomModal] = useState(false);

  // Demo function showing how to use the enhanced modal context
  const showEnhancedSuccess = () => {
    showModal({
      title: 'Success!',
      message: 'Your operation completed successfully with enhanced styling and animations.',
      type: 'success',
      confirmText: 'Great!',
      size: 'md',
      animationType: 'scale',
      autoClose: 0
    });
  };

  const showEnhancedError = () => {
    showModal({
      title: 'Error',
      message: 'There was an issue with your request. Please try again later.',
      type: 'error',
      confirmText: 'Try Again',
      cancelText: 'Cancel',
      showCancelButton: true,
      size: 'md',
      animationType: 'slide'
    });
  };

  const showEnhancedInfo = () => {
    showModal({
      title: 'Information',
      message: 'This is an informational message with beautiful animations and modern UI.',
      type: 'info',
      confirmText: 'Got it',
      autoClose: 5000,
      size: 'md',
      animationType: 'fade'
    });
  };

  const showCustomModal = () => {
    setCustomModal(true);
  };

  // Demo using the EnhancedMessageModal directly
  const showLoadingModal = () => {
    showModal({
      title: 'Processing',
      message: 'Please wait while your request is being processed...',
      type: 'loading',
      showConfirmButton: false,
      showCloseButton: false,
      size: 'md'
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Amazing Modal Showcase</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience our modern, responsive, and beautiful modal system with smooth animations and interactive features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 p-6 rounded-2xl border border-emerald-100">
          <h3 className="text-xl font-semibold text-emerald-800 mb-3">Success Modal</h3>
          <p className="text-gray-600 mb-4">Beautiful success messages with animations</p>
          <button
            onClick={showEnhancedSuccess}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            Show Success
          </button>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl border border-red-100">
          <h3 className="text-xl font-semibold text-red-800 mb-3">Error Modal</h3>
          <p className="text-gray-600 mb-4">Clear error messaging with optional actions</p>
          <button
            onClick={showEnhancedError}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            Show Error
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
          <h3 className="text-xl font-semibold text-blue-800 mb-3">Info Modal</h3>
          <p className="text-gray-600 mb-4">Informative messages with auto-close option</p>
          <button
            onClick={showEnhancedInfo}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            Show Info
          </button>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
          <h3 className="text-xl font-semibold text-amber-800 mb-3">Loading Modal</h3>
          <p className="text-gray-600 mb-4">Spinner with loading state messaging</p>
          <button
            onClick={showLoadingModal}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            Show Loading
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-2xl border border-purple-100">
          <h3 className="text-xl font-semibold text-purple-800 mb-3">Custom Modal</h3>
          <p className="text-gray-600 mb-4">Advanced features with custom actions</p>
          <button
            onClick={showCustomModal}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            Show Custom
          </button>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Responsive Design</h3>
          <p className="text-gray-600 mb-4">Perfectly adapts to all screen sizes</p>
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Modal Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full mt-1">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Smooth Animations</h4>
                <p className="text-gray-600 text-sm">Framer Motion powered animations with multiple transition options</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full mt-1">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Multiple Variants</h4>
                <p className="text-gray-600 text-sm">Solid, outline, and elevated designs for different use cases</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full mt-1">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Auto-Close Capability</h4>
                <p className="text-gray-600 text-sm">Progress bars and auto-close functionality for timed messages</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full mt-1">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Responsive Design</h4>
                <p className="text-gray-600 text-sm">Perfectly adapts to mobile, tablet, and desktop screens</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full mt-1">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Accessibility First</h4>
                <p className="text-gray-600 text-sm">Keyboard navigation, screen reader support, and ARIA labels</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full mt-1">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Modern UI Design</h4>
                <p className="text-gray-600 text-sm">Beautiful color schemes, proper spacing, and elegant typography</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Enhanced Modal */}
      <EnhancedMessageModal
        isOpen={customModal}
        onClose={() => setCustomModal(false)}
        title="Custom Actions Modal"
        message="This modal demonstrates custom actions and advanced features. You can add multiple action buttons, custom icons, and various interactive elements."
        type="info"
        onConfirm={() => setCustomModal(false)}
        confirmText="Got it"
        showCloseButton={true}
        size="lg"
        animationType="scale"
        actions={[
          {
            text: "Action 1",
            onClick: () => { console.log("Action 1 clicked"); },
            buttonColor: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/50 text-white"
          },
          {
            text: "Action 2",
            onClick: () => { console.log("Action 2 clicked"); },
            buttonColor: "bg-purple-500 hover:bg-purple-600 focus:ring-purple-500/50 text-white"
          }
        ]}
      />
    </div>
  );
};

export default AmazingModalShowcase;