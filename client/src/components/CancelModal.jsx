import React, { useState } from 'react';

const CancelModal = ({ open, cancelledBy, onSubmit, onClose }) => {
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleRatingChange = (e) => {
    setRating(Number(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(rating);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-sm">
        <h2 className="text-xl font-semibold mb-2 text-center">
          Ride Cancelled
        </h2>
        <p className="mb-4 text-center text-gray-700">
          {cancelledBy === 'user' ? 'Rider cancelled the ride.' : 'Captain cancelled the ride.'}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <label className="mb-2 font-medium">Rate your experience:</label>
          <select value={rating} onChange={handleRatingChange} className="mb-4 p-2 border rounded">
            {[5,4,3,2,1].map(v => (
              <option key={v} value={v}>{v} Star{v > 1 ? 's' : ''}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded w-full font-medium disabled:opacity-60"
            disabled={submitting}
          >
            Submit Rating
          </button>
          <button
            type="button"
            className="mt-2 text-gray-500 underline text-sm"
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
        </form>
      </div>
    </div>
  );
};

export default CancelModal;
