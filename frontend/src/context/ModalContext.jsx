import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertTriangle, Trash2, LogOut, Info, CheckCircle, X } from 'lucide-react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'primary', // 'primary' | 'danger' | 'warning'
    iconType: 'info', // 'logout' | 'trash' | 'danger' | 'warning' | 'info' | 'success'
    isAlert: false, // if true, only show "OK" button
    resolve: null,
  });

  const confirm = useCallback(({
    title = 'Please Confirm',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'primary',
    icon = 'info'
  }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        confirmVariant,
        iconType: icon,
        isAlert: false,
        resolve,
      });
    });
  }, []);

  const showAlert = useCallback(({
    title = 'Notice',
    message = '',
    confirmText = 'OK',
    confirmVariant = 'primary',
    icon = 'info'
  }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText: '',
        confirmVariant,
        iconType: icon,
        isAlert: true,
        resolve,
      });
    });
  }, []);

  const handleClose = (result) => {
    if (modalState.resolve) {
      modalState.resolve(result);
    }
    setModalState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  // Keyboard shortcut: ESC to cancel, Enter to confirm
  useEffect(() => {
    if (!modalState.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleClose(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState.isOpen, modalState.resolve]);

  const renderIcon = () => {
    switch (modalState.iconType) {
      case 'logout':
        return <LogOut size={26} className="modal-icon-svg text-amber-600" />;
      case 'trash':
      case 'danger':
        return <Trash2 size={26} className="modal-icon-svg text-danger-600" />;
      case 'warning':
        return <AlertTriangle size={26} className="modal-icon-svg text-warning-600" />;
      case 'success':
        return <CheckCircle size={26} className="modal-icon-svg text-success-600" />;
      case 'info':
      default:
        return <Info size={26} className="modal-icon-svg text-primary-600" />;
    }
  };

  const getIconWrapperClass = () => {
    switch (modalState.iconType) {
      case 'logout':
        return 'modal-icon-circle bg-amber-50';
      case 'trash':
      case 'danger':
        return 'modal-icon-circle bg-danger-50';
      case 'warning':
        return 'modal-icon-circle bg-warning-50';
      case 'success':
        return 'modal-icon-circle bg-success-50';
      case 'info':
      default:
        return 'modal-icon-circle bg-primary-50';
    }
  };

  const getConfirmBtnClass = () => {
    if (modalState.confirmVariant === 'danger') {
      return 'btn btn-danger-custom';
    }
    if (modalState.confirmVariant === 'warning') {
      return 'btn btn-warning-custom';
    }
    return 'btn btn-primary';
  };

  return (
    <ModalContext.Provider value={{ confirm, showAlert }}>
      {children}

      {modalState.isOpen && (
        <div 
          className="custom-modal-backdrop" 
          onClick={() => handleClose(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="custom-modal-box" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="custom-modal-close-btn" 
              onClick={() => handleClose(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="custom-modal-header">
              <div className={getIconWrapperClass()}>
                {renderIcon()}
              </div>
              <div className="custom-modal-title-group">
                <h3 className="custom-modal-title">{modalState.title}</h3>
                <p className="custom-modal-message">{modalState.message}</p>
              </div>
            </div>

            <div className="custom-modal-actions">
              {!modalState.isAlert && (
                <button
                  type="button"
                  className="btn btn-secondary custom-modal-cancel-btn"
                  onClick={() => handleClose(false)}
                >
                  {modalState.cancelText}
                </button>
              )}
              <button
                type="button"
                className={getConfirmBtnClass()}
                onClick={() => handleClose(true)}
                autoFocus
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

