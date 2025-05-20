import React from "react";
import { useNavigate } from "react-router-dom";

const RideHistory = ({ rides }) => {


  // Sample ride data for testing
  const sampleRides = rides || [
    {
      time: new Date().getTime(),
      fare: 150,
      destination: "Malda, West Bengal",
    },
    {
      time: new Date().getTime() - 86400000, // 1 day ago
      fare: 200,
      destination: "Kolkata, West Bengal",
    },
  ];

  return (
    <div className="w-full h-full bg-white p-4 overflow-y-auto">

      <h2 className="text-xl font-bold mb-4">Ride History</h2>
      {sampleRides.length > 0 ? (
        sampleRides.map((ride, index) => (
          <div key={index} className="p-4 border rounded-lg shadow-sm bg-gray-50 mb-4">
            <p>
              <strong>Time:</strong>{" "}
              {new Date(ride.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>
              <strong>Fare:</strong> ₹{ride.fare}
            </p>
            <p>
              <strong>Destination:</strong> {ride.destination}
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No ride history available.</p>
      )}
    </div>
  );
};

export default RideHistory;