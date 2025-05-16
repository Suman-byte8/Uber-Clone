import React from "react";

const RideHistory = ({ rides, onBack }) => {
  return (
    <div className="w-full h-full bg-white p-4">
      <button
        onClick={onBack}
        className="text-blue-500 text-sm mb-4 hover:underline"
      >
        Back to Home
      </button>
      <h2 className="text-xl font-bold mb-4">Ride History</h2>
      {rides.length > 0 ? (
        <ul className="space-y-4">
          {rides.map((ride, index) => (
            <li
              key={index}
              className="p-4 border rounded-lg shadow-sm bg-gray-50"
            >
              <p>
                <strong>Time:</strong> {new Date(ride.time).toLocaleString()}
              </p>
              <p>
                <strong>Fare:</strong> ₹{ride.fare}
              </p>
              <p>
                <strong>Destination:</strong> {ride.destination}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No ride history available.</p>
      )}
    </div>
  );
};

export default RideHistory;