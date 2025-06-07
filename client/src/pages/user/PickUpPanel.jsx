const PickUpPanel = ({
    contentRef,
    panelState,
    pickupState,
    dropoffState,
    handlePickupSearch,
    handleDropoffSearch,
    handleInputFocus,
    handleSuggestionSelect,
    activeInput,
    onConfirmTrip,
    setDropoffState,
  }) => {
    return (
      <div
        ref={contentRef}
        className={`text-white px-4 transition-all duration-300 ${
          !panelState.isOpen ? "" : "h-full"
        }`}
      >
        <h1 className="text-2xl font-medium text-center mb-2 transform transition-all duration-300">
          Set your destination
        </h1>
        <h4 className="text-lg text-center mb-4 transform transition-all duration-300">
          Enter pickup and drop off locations
        </h4>
        <hr className="mb-4 opacity-50 transition-opacity duration-300" />
  
        <div className="flex flex-col gap-4">
          {/* Pickup Location */}
          <div className="relative transform transition-all duration-300">
            <div className="flex bg-[#343b41] p-3 rounded-xl text-white text-xl hover:bg-[#3a4147] transition-colors duration-300">
              <i className="ri-map-pin-line mr-2"></i>
              <input
                type="text"
                placeholder="Enter pickup location"
                value={pickupState.query}
                onChange={(e) => handlePickupSearch(e.target.value)}
                onFocus={() => handleInputFocus("pickup")}
                className="bg-transparent w-full outline-none border-0 transition-all duration-300"
              />
              {pickupState.isLoading ? (
                <i className="ri-loader-4-line animate-spin"></i>
              ) : (
                <i className="ri-search-line"></i>
              )}
            </div>
          </div>
  
          {/* Dropoff Location */}
          {panelState.isOpen && (
            <div
              className={`relative transform transition-all duration-300 ${
                dropoffState.isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex bg-[#343b41] p-3 rounded-xl text-white text-xl hover:bg-[#3a4147] transition-colors duration-300">
                <i className="ri-flag-line mr-2"></i>
                <input
                  type="text"
                  placeholder="Enter dropoff location"
                  value={dropoffState.query}
                  onChange={(e) => handleDropoffSearch(e.target.value)}
                  onFocus={() => handleInputFocus("dropoff")}
                  className="bg-transparent w-full outline-none border-0 transition-all duration-300"
                />
                {dropoffState.isLoading ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <i className="ri-search-line"></i>
                )}
              </div>
            </div>
          )}
  
          {/* Suggestions Section */}
          {panelState.isOpen && (
            <div className="common-suggestions-container w-full mt-2 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20 transform transition-all duration-300">
              {(pickupState.active
                ? pickupState.suggestions
                : dropoffState.suggestions
              ).map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => {
                    handleSuggestionSelect(suggestion);
                    if (activeInput === "dropoff") {
                      // Clear suggestions if dropoff is selected
                      setDropoffState((prev) => ({ ...prev, suggestions: [] }));
                    }
                  }}
                  className="p-3 text-white hover:bg-gray-700 cursor-pointer transition-all duration-300 flex gap-2 text-base"
                  style={{
                    transitionDelay: `${index * 50}ms`,
                  }}
                >
                  <i className="ri-map-pin-fill"></i>
                  {suggestion.display_name}
                </div>
              ))}
            </div>
          )}
  
          <button
            className={`w-full p-3 rounded-xl text-xl font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
              !pickupState.query || !dropoffState.query
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gray-300 text-gray-800 hover:bg-gray-400"
            }`}
            onClick={() => {
              if (pickupState.query && dropoffState.query) {
                onConfirmTrip();
              }
            }}
            disabled={!pickupState.query || !dropoffState.query}
          >
            Confirm Trip
          </button>
        </div>
      </div>
    );
  };

export default PickUpPanel;