const axios = require('axios');
const NOMINATIM_API_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const User = require('../models/user.model')
const mongoose = require('mongoose');
const Captain = require('../models/captain.model'); // Import Captain model


// Location suggestion controller
const getSuggestions = async (req, res) => {
    const { query } = req.query;

    // Check if query is provided
    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    try {
        // Fetch suggestions from Nominatim API
        const response = await axios.get(NOMINATIM_API_BASE_URL, {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: 5, // Limit the number of suggestions
            },
        });

        // Check if data exists
        if (response.data && response.data.length > 0) {
            res.json(response.data);
        } else {
            res.status(404).json({ message: 'No suggestions found' });
        }
    } catch (error) {
        console.error('Error fetching location suggestions:', error.message);
        res.status(500).json({
            message: 'Error fetching location suggestions',
            error: error.message, // Optional: Include more details for debugging
        });
    }
};

// Get coordinates based on the query
const getCoordinates = async (req, res) => {
    const { query } = req.query;

    // Check if query is provided
    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    try {
        // Fetch coordinates from Nominatim API
        const response = await axios.get(NOMINATIM_API_BASE_URL, {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: 1, // Only fetch one result
            },
        });

        // Check if data exists
        if (response.data && response.data.length > 0) {
            const coordinates = {
                lat: response.data[0].lat,
                lon: response.data[0].lon,
            };
            res.json(coordinates);
        } else {
            res.status(404).json({ message: 'No coordinates found' });
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error.message);
        res.status(500).json({
            message: 'Error fetching coordinates',
            error: error.message, // Optional: Include more details for debugging
        });
    }
};

// Controller: Update User Location
const updateLocation = async (req, res) => {
    const { userId, lat, lon, role } = req.body;

    // Log the incoming data for debugging
    console.log('Received data:', { userId, lat, lon, role });

    if (!userId || !lat || !lon || !role) {
        return res.status(400).json({ message: 'userId, lat, lon, and role are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId format' });
    }

    try {
        let user;
        if (role === 'captain') {
            user = await Captain.findByIdAndUpdate(
                userId,
                { 'currentLocation.lat': lat, 'currentLocation.lon': lon },
                { new: true }
            );
        } else {
            user = await User.findByIdAndUpdate(
                userId,
                { 'currentLocation.lat': lat, 'currentLocation.lon': lon },
                { new: true }
            );
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Location updated successfully', user });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: 'Error updating location', error: error.message });
    }
};

module.exports = { getSuggestions, getCoordinates, updateLocation };
