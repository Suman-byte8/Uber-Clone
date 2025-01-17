const express = require('express');
const router = express.Router();
const { getSuggestions } = require('../controllers/location.controller');

// Route for location suggestions
router.get('/suggestions', getSuggestions);

module.exports = router;
