import React, { useRef, useState } from "react";
import tempMap from "../../assets/temp_map.png";
import gsap from "gsap";
import axios from "axios";

const TripPlan = () => {
    const confirmDestinationPanelRef = useRef(null);
    const [suggestions, setSuggestions] = useState([]);
    const [query, setQuery] = useState('');

    const togglePanel = () => {
        if (confirmDestinationPanelRef.current) {
            if (confirmDestinationPanelRef.current.style.height === '100%') {
                gsap.to(confirmDestinationPanelRef.current, {
                    height: 'auto',
                    duration: 0.5,
                    ease: 'power1.out'
                });
            } else {
                gsap.to(confirmDestinationPanelRef.current, {
                    height: '100%',
                    duration: 0.5,
                    ease: 'power1.out'
                });
            }
        }
    };

    const handleInputChange = async (e) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 2) { // Fetch suggestions for queries longer than 2 characters
            try {
                const response = await axios.get(`/api/locations/suggestions?query=${value}`);
                setSuggestions(response.data);
                console.log(suggestions)
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        } else {
            setSuggestions([]);
        }
    };

    return (
        <div className="relative h-screen w-full">
            <button onClick={() => window.history.back()} className="_goBackBTN rounded-full bg-[#252525] w-12 h-12 absolute top-4 left-4 text-white flex items-center justify-center">
                <i className="ri-arrow-left-line text-3xl"></i>
            </button>

            <img src={tempMap} alt="" className="h-full w-full object-cover " />

            <div ref={confirmDestinationPanelRef} className="confirm_destination_panel w-full p-2 absolute bottom-0 bg-[#252525] rounded-t-xl">
                <button onClick={togglePanel} className="w-full text-center text-white text-2xl">
                    <i className={confirmDestinationPanelRef.current && confirmDestinationPanelRef.current.style.height === '100%' ? "ri-arrow-down-wide-line" : "ri-arrow-up-wide-line"}></i>
                </button>

                <h1 className="text-white text-2xl font-medium text-center">Set your destination</h1>
                <h4 className="text-white text-center text-lg ">Drag the map to move the pin</h4>
                <hr className="my-2" />

                <div className="w-full p-4 flex flex-col gap-4">
                    <div className="searchBar flex bg-[#343b41] p-3 rounded-xl text-white text-xl">
                        <input
                            type="text"
                            placeholder="Search for a destination"
                            value={query}
                            onChange={handleInputChange}
                            className="bg-transparent w-full outline-none border-0 "
                            onFocus={togglePanel}
                        />
                        <i className="ri-search-line"></i>
                    </div>

                    {suggestions.length > 0 && (
                        <div className="suggestions bg-white rounded-lg shadow-lg">
                            {suggestions.map((suggestion, index) => (
                                <div key={index} className="suggestion-item p-2 hover:bg-gray-200 cursor-pointer">
                                    {suggestion.display_name}
                                </div>
                            ))}
                        </div>
                    )}

                    <button className="bg-gray-300 w-full p-3 rounded-xl text-xl font-medium">Confirm destination</button>
                </div>
            </div>
        </div>
    );
};

export default TripPlan;
