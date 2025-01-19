const PickUpPanel = ({
    contentRef,
    panelState,
    pickupState,
    dropoffState,
    handlePickupSearch,
    handleDropoffSearch,
    handleInputFocus,
    handleSuggestionSelect,
    setPickupState,
    setDropoffState,
    debouncedPickupSearch,
    debouncedDropoffSearch, // Add the debounced functions as props
  }) => {
    return (
      <div
        ref={contentRef}
        className={`text-white px-4 transition-all duration-800 ${
          !panelState.isOpen ? "" : "h-full"
        }`}
      >
        <h1 className="text-2xl font-medium text-center mb-2 transform transition-all duration-800">
          Set your destination
        </h1>
        <h4 className="text-lg text-center mb-4 transform transition-all duration-800">
          Enter pickup and drop off locations
        </h4>
        <hr className="mb-4 opacity-50 transition-opacity duration-800" />
  
        <div className="flex flex-col gap-4">
          {/* Pickup Location */}
          <div className="relative transform transition-all duration-800">
            <div className="flex bg-[#343b41] p-3 rounded-xl text-white text-xl hover:bg-[#3a4147] transition-colors duration-800">
              <i className="ri-map-pin-line mr-2"></i>
              <input
                type="text"
                placeholder="Enter pickup location"
                value={pickupState.query}
                onChange={(e) => handlePickupSearch(e.target.value)} // Use debounced function
                onFocus={handleInputFocus}
                className="bg-transparent w-full outline-none border-0 transition-all duration-800"
              />
              {pickupState.isLoading ? (
                <i className="ri-loader-4-line animate-spin"></i>
              ) : (
                <i className="ri-search-line"></i>
              )}
            </div>
          </div>
  
          {/* Dropoff Location - Only display if panel is open */}
          {panelState.isOpen && (
            <div
              className={`relative transform transition-all duration-800 ${
                dropoffState.isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex bg-[#343b41] p-3 rounded-xl text-white text-xl hover:bg-[#3a4147] transition-colors duration-800">
                <i className="ri-flag-line mr-2"></i>
                <input
                  type="text"
                  placeholder="Enter dropoff location"
                  value={dropoffState.query}
                  onChange={(e) => handleDropoffSearch(e.target.value)} // Use debounced function
                  onFocus={handleInputFocus}
                  className="bg-transparent w-full outline-none border-0 transition-all duration-800"
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
          {panelState.isOpen &&
            (pickupState.suggestions.length > 0 ||
              dropoffState.suggestions.length > 0) && (
              <div className="common-suggestions-container w-full mt-2 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20 transform transition-all duration-800">
                {[...pickupState.suggestions, ...dropoffState.suggestions].map(
                  (suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        if (pickupState.suggestions.includes(suggestion)) {
                          handleSuggestionSelect(
                            suggestion,
                            setPickupState,
                            ".common-suggestions-container"
                          );
                        } else {
                          handleSuggestionSelect(
                            suggestion,
                            setDropoffState,
                            ".common-suggestions-container"
                          );
                        }
                      }}
                      className="p-3 text-white hover:bg-gray-700 cursor-pointer transition-all duration-800 flex gap-2 text-base"
                      style={{
                        transitionDelay: `${index * 50}ms`,
                      }}
                    >
                      <i className="ri-map-pin-fill"></i>
                      {suggestion.display_name}
                    </div>
                  )
                )}
              </div>
            )}
  
          <button
            className="bg-gray-300 w-full p-3 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-400 transition-all duration-800 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => {
              /* Add confirmation logic */
            }}
          >
            Confirm Trip
          </button>
        </div>
      </div>
    );
  };


  export default PickUpPanel;