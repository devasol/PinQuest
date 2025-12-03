import React, { useState } from 'react';
import EnhancedMessageModal from './EnhancedMessageModal';

const ModalDemo = () => {
  const [modals, setModals] = useState({
    success: false,
    error: false,
    warning: false,
    info: false,
    confirmation: false,
    loading: false
  });

  const openModal = (type) => {
    setModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setModals(prev => ({ ...prev, [type]: false }));
  };

  const handleConfirm = (type) => {
    console.log(`${type} confirmed!`);
    closeModal(type);
  };

  const handleRetry = () => {
    console.log('Retrying operation...');
    // Simulate retry functionality
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Amazing Modal Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button 
          onClick={() => openModal('success')}
          className="p-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          Show Success Modal
        </button>
        
        <button 
          onClick={() => openModal('error')}
          className="p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Show Error Modal
        </button>
        
        <button 
          onClick={() => openModal('warning')}
          className="p-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Show Warning Modal
        </button>
        
        <button 
          onClick={() => openModal('info')}
          className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Show Info Modal
        </button>
        
        <button 
          onClick={() => openModal('confirmation')}
          className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Show Confirmation Modal
        </button>
        
        <button 
          onClick={() => openModal('loading')}
          className="p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Show Loading Modal
        </button>
      </div>

      {/* Success Modal */}
      <EnhancedMessageModal
        isOpen={modals.success}
        onClose={() => closeModal('success')}
        title="Success!"
        message="Your operation completed successfully. All your data has been saved with security."
        type="success"
        onConfirm={() => handleConfirm('success')}
        confirmText="Great!"
        showCloseButton={true}
        autoClose={0}
        size="md"
        animationType="scale"
        actions={[
          {
            text: "View Details",
            onClick: () => { console.log("View details clicked"); },
            buttonColor: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600/50 text-white"
          }
        ]}
      />

      {/* Error Modal */}
      <EnhancedMessageModal
        isOpen={modals.error}
        onClose={() => closeModal('error')}
        title="Error Occurred"
        message="There was an issue processing your request. Please try again later or contact support."
        type="error"
        onConfirm={() => handleConfirm('error')}
        confirmText="Try Again"
        cancelText="Cancel"
        showCancelButton={true}
        showCloseButton={true}
        size="md"
        showRetryButton={true}
        onRetry={handleRetry}
        animationType="slide"
      />

      {/* Warning Modal */}
      <EnhancedMessageModal
        isOpen={modals.warning}
        onClose={() => closeModal('warning')}
        title="Warning"
        message="This action is irreversible and may cause permanent changes to your data. Are you sure you want to proceed?"
        type="warning"
        onConfirm={() => handleConfirm('warning')}
        confirmText="Proceed Anyway"
        cancelText="Cancel"
        showCancelButton={true}
        showCloseButton={true}
        size="md"
        animationType="fade"
      />

      {/* Info Modal */}
      <EnhancedMessageModal
        isOpen={modals.info}
        onClose={() => closeModal('info')}
        title="Information"
        message="Your account has been updated. Please check your email for verification instructions to complete the process."
        type="info"
        onConfirm={() => handleConfirm('info')}
        confirmText="Got it"
        showCloseButton={true}
        autoClose={5000}
        showProgressBar={true}
        size="md"
        animationType="scale"
      />

      {/* Confirmation Modal */}
      <EnhancedMessageModal
        isOpen={modals.confirmation}
        onClose={() => closeModal('confirmation')}
        title="Confirm Action"
        message="Are you sure you want to delete this item? This action cannot be undone and will permanently remove all associated data."
        type="info"
        onConfirm={() => handleConfirm('confirmation')}
        confirmText="Delete"
        cancelText="Cancel"
        showCancelButton={true}
        showCloseButton={true}
        size="md"
        animationType="slide"
      />

      {/* Loading Modal */}
      <EnhancedMessageModal
        isOpen={modals.loading}
        onClose={() => closeModal('loading')}
        title="Processing"
        message="Please wait while we process your request. This may take a few moments..."
        type="loading"
        showConfirmButton={false}
        showCloseButton={false}
        size="md"
        animationType="scale"
      />
    </div>
  );
};

export default ModalDemo;