const axios = require('axios');

// Location suggestion controller
const getSuggestions = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: 5, // Limit the number of suggestions
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching location suggestions:', error);
        res.status(500).json({ message: 'Error fetching location suggestions' });
    }
};

// Get coordinates based on the query
const getCoordinates = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: 1,
            },
        });

        if (response.data.length > 0) {
            const coordinates = {
                lat: response.data[0].lat,
                lon: response.data[0].lon,
            };
            return res.json(coordinates);
        } else {
            return res.status(404).json({ message: 'No coordinates found' });
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        res.status(500).json({ message: 'Error fetching coordinates' });
    }
};

module.exports = { getSuggestions, getCoordinates };
