const express = require('express');
const router = express.Router();
const { getSuggestions, getCoordinates, updateUserLocation } = require('../controllers/location.controller');

// Route for location suggestions
router.get('/suggestions', getSuggestions);
router.get('/get-coordinates', getCoordinates)
// Route: POST /update-location
router.put('/update-location', updateUserLocation);

module.exports = router;
