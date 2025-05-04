import React, { useState } from 'react';
import filledStar from '../assets/filled_star.png';
import emptyStar from '../assets/empty_star.png';

const RatingForm = ({ onSubmit, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleStarClick = (value) => {
    setRating(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    onSubmit(rating);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center">
      <label className="mb-2 font-semibold text-lg">Rate your experience</label>

      <div className="flex mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <img
            key={star}
            src={hovered >= star || rating >= star ? filledStar : emptyStar}
            alt={`${star} star`}
            className="w-8 h-8 mx-1 cursor-pointer transition-transform hover:scale-110"
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          />
        ))}
      </div>

      <button
        type="submit"
        className="bg-black text-white px-5 py-2 rounded w-full font-medium disabled:opacity-60 transition"
        disabled={submitting || rating === 0}
      >
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>

      <button
        type="button"
        onClick={onClose}
        className="mt-3 text-sm text-gray-500 underline"
        disabled={submitting}
      >
        Close
      </button>
    </form>
  );
};

export default RatingForm;
