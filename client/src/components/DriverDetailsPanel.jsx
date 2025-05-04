const DriverDetailsPanel = ({ driver, onCancel, onBack, cancelAllowed = true }) => (
  <div className="p-4 h-full flex flex-col">
    <button
      onClick={onBack} // Use the passed onBack handler
      className="flex items-center text-gray-600 mb-4 hover:text-gray-800 self-start"
    >
      <i className="ri-arrow-left-line text-2xl mr-2"></i>
      Back
    </button>

    <h2 className="text-2xl font-bold mb-4 text-center">
      Driver is on the way!
    </h2>

    <div className="flex items-center gap-4 border-b pb-4 mb-4">
      <img
        src={driver.photo || "/default-pfp.png"}
        alt={driver.name}
        className="w-16 h-16 rounded-full object-cover bg-gray-200"
      />
      <div>
        <h3 className="text-xl font-semibold">{driver.name}</h3>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <i className="ri-star-fill text-yellow-400"></i>
          <span>{driver.rating?.toFixed(1) || "N/A"}</span>
        </div>
        {driver.phoneNumber && (
          <div className="text-sm text-gray-600 mt-1">
            <i className="ri-phone-line mr-1"></i>
            {driver.phoneNumber}
          </div>
        )}
      </div>
    </div>

    {driver.vehicle && (
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Vehicle Details</h4>
        <div className="bg-gray-100 p-3 rounded-lg space-y-1 text-gray-800">
          <p>
            <span className="font-semibold">
              {driver.vehicle.make} {driver.vehicle.model}
            </span> ({driver.vehicle.color})
          </p>
          <p className="text-sm text-gray-600">
            Year: {driver.vehicle.year}
          </p>
          <p className="text-lg font-bold tracking-wider bg-yellow-50 p-2 rounded border border-yellow-200">
            <span className="text-sm font-normal text-gray-600 mr-2">Number Plate:</span>
            {driver.vehicle && driver.vehicle.licensePlate ? driver.vehicle.licensePlate : "Not available"}
          </p>
        </div>
      </div>
    )}

    {driver.estimatedArrival && (
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Estimated Arrival</h4>
        <div className="bg-blue-50 p-3 rounded-lg text-blue-800 font-semibold">
          <i className="ri-time-line mr-2"></i>
          {driver.estimatedArrival} minutes
        </div>
      </div>
    )}

    {/* TODO: Add map view here showing driver location */}
    <div className="flex-grow flex items-center justify-center text-gray-400 bg-gray-50 rounded my-4">
      Map Placeholder
    </div>

    <div className="flex gap-3 mt-auto mb-2">
      <button
        onClick={() => window.location.href = `tel:${driver.phoneNumber}`}
        className="flex-1 p-3 bg-gray-100 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200"
      >
        <i className="ri-phone-line"></i> Call
      </button>
      <button
        onClick={() => window.location.href = `sms:${driver.phoneNumber}`}
        className="flex-1 p-3 bg-gray-100 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200"
      >
        <i className="ri-message-2-line"></i> Message
      </button>
    </div>

    <button
      onClick={onCancel}
      disabled={!cancelAllowed}
      className="w-full p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium"
    >
      Cancel Ride
    </button>
  </div>
);

export default DriverDetailsPanel;