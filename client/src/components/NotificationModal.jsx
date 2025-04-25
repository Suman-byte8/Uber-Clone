import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
// Ensure React and useEffect are imported for hook usage
const NotificationModal = ({ open, title, message, onClose }) => {
  useEffect(() => {
    if (open) console.log('NotificationModal opened:', { title, message });
  }, [open, title, message]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-sm text-center">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="mb-4 text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
};

export default NotificationModal;
