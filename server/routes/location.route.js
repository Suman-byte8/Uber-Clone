const express = require('express');
const router = express.Router();
const { getSuggestions, getCoordinates } = require('../controllers/location.controller');

// Route for location suggestions
router.get('/suggestions', getSuggestions);
router.get('/get-coordinates',getCoordinates)

module.exports = router;
