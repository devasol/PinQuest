import React from 'react';
import { useModal } from '../contexts/ModalContext';

const TestModalComponent = () => {
  const { showModal } = useModal();

  const showSuccessMessage = () => {
    showModal({
      title: 'Success!',
      message: 'Your operation completed successfully',
      type: 'success',
      confirmText: 'Great!'
    });
  };

  const showErrorMessage = () => {
    showModal({
      title: 'Error',
      message: 'There was an error processing your request',
      type: 'error',
      confirmText: 'Try Again'
    });
  };

  const showWarningMessage = () => {
    showModal({
      title: 'Warning',
      message: 'This action cannot be undone',
      type: 'warning',
      confirmText: 'Proceed',
      cancelText: 'Cancel',
      showCancelButton: true
    });
  };

  const showInfoMessage = () => {
    showModal({
      title: 'Info',
      message: 'This is an informational message',
      type: 'info',
      confirmText: 'Got it'
    });
  };

  const showAutoCloseMessage = () => {
    showModal({
      title: 'Auto Close',
      message: 'This message will close automatically in 3 seconds',
      type: 'info',
      confirmText: 'Got it',
      autoClose: 3000
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Test Modal Integration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button 
          onClick={showSuccessMessage}
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg transition-colors"
        >
          Show Success
        </button>
        <button 
          onClick={showErrorMessage}
          className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition-colors"
        >
          Show Error
        </button>
        <button 
          onClick={showWarningMessage}
          className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-lg transition-colors"
        >
          Show Warning
        </button>
        <button 
          onClick={showInfoMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors"
        >
          Show Info
        </button>
        <button 
          onClick={showAutoCloseMessage}
          className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg transition-colors"
        >
          Show Auto Close
        </button>
      </div>
    </div>
  );
};

export default TestModalComponent;