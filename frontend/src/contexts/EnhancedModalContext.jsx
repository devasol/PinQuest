import React, { createContext, useContext, useState } from 'react';
import Modal from './Modal';

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
    cancelText: 'Cancel',
    showCloseButton: true,
    showConfirmButton: true,
    showCancelButton: false,
    showIcon: true,
    autoClose: 0,
    size: 'md',
    variant: 'solid',
    closable: true,
    backdrop: true,
    animationType: 'scale'
  });

  const showModal = ({
    title,
    message,
    type = 'default',
    onConfirm,
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCloseButton = true,
    showConfirmButton = true,
    showCancelButton = false,
    showIcon = true,
    autoClose = 0,
    size = 'md',
    variant = 'solid',
    closable = true,
    backdrop = true,
    animationType = 'scale'
  }) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => hideModal()),
      confirmText,
      cancelText,
      showCloseButton,
      showConfirmButton,
      showCancelButton,
      showIcon,
      autoClose,
      size,
      variant,
      closable,
      backdrop,
      animationType
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
        cancelText={modalConfig.cancelText}
        showCloseButton={modalConfig.showCloseButton}
        showConfirmButton={modalConfig.showConfirmButton}
        showCancelButton={modalConfig.showCancelButton}
        showIcon={modalConfig.showIcon}
        autoClose={modalConfig.autoClose}
        size={modalConfig.size}
        variant={modalConfig.variant}
        closable={modalConfig.closable}
        backdrop={modalConfig.backdrop}
        animationType={modalConfig.animationType}
      >
        {modalConfig.message}
      </Modal>
    </ModalContext.Provider>
  );
};

export default ModalContext;