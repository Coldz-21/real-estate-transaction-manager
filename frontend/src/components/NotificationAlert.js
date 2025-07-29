import React, { useEffect } from 'react';

const NotificationAlert = ({ message, type = 'info', onClose, autoClose = true, duration = 5000 }) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose, duration]);

  const getAlertClasses = () => {
    const baseClasses = 'alert flex items-center justify-between min-w-80 max-w-md shadow-lg';
    
    switch (type) {
      case 'success':
        return `${baseClasses} alert-success`;
      case 'error':
        return `${baseClasses} alert-error`;
      case 'warning':
        return `${baseClasses} alert-warning`;
      case 'info':
      default:
        return `${baseClasses} alert-info`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={getAlertClasses()}>
      <div className="flex items-center space-x-3">
        <span className="text-lg">{getIcon()}</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-lg hover:opacity-70 transition-opacity"
          aria-label="Close notification"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default NotificationAlert;
