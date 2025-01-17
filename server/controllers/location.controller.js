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

module.exports = { getSuggestions };
