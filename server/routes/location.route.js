const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');

// Route for location suggestions
router.get('/suggestions', locationController.getSuggestions);
router.get('/coordinates', locationController.getCoordinates);
// Route: POST /update-location
router.post('/update', locationController.updateLocation);

// New route for reverse geocoding
router.get('/reverse', locationController.getReverseGeocode);

module.exports = router;
