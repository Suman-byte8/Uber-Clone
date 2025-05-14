import { useEffect } from 'react';

const CancellationModal = ({ isOpen, onClose, cancelledBy, isDriver }) => {
  useEffect(() => {
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const message = isDriver 
    ? `Ride was cancelled by ${cancelledBy === 'driver' ? 'you' : 'the rider'}`
    : `Ride was cancelled by ${cancelledBy === 'rider' ? 'you' : 'the driver'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
        
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <i className="ri-close-circle-line text-red-500 text-3xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Ride Cancelled</h3>
        </div>
        
        <p className="text-gray-600 mb-6 text-center">
          {message}
        </p>
        
        <button
          onClick={onClose}
          className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default CancellationModal;