import React, { createContext, useContext, useState } from 'react';
import Modal from '../components/Modal';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: null,
    confirmText: 'OK',
    showCloseButton: true,
    showConfirmButton: true
  });

  const showModal = ({
    title,
    message,
    type = 'default',
    onConfirm,
    confirmText = 'OK',
    showCloseButton = true,
    showConfirmButton = true
  }) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => hideModal()),
      confirmText,
      showCloseButton,
      showConfirmButton
    });
  };

  const hideModal = () => {
    setModalConfig(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const handleConfirm = () => {
    if (modalConfig.onConfirm) {
      modalConfig.onConfirm();
    }
    hideModal();
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={hideModal}
        title={modalConfig.title}
        type={modalConfig.type}
        onConfirm={handleConfirm}
        confirmText={modalConfig.confirmText}
        showCloseButton={modalConfig.showCloseButton}
        showConfirmButton={modalConfig.showConfirmButton}
      >
        {modalConfig.message}
      </Modal>
    </ModalContext.Provider>
  );
};