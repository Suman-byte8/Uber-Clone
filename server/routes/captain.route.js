const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { registerCaptain,loginCaptain } = require('../controllers/captain.controller');

// Captain signup route with validation
router.post('/signup', [
    // Validate captain personal details
    body('name').isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('phoneNumber').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please enter a valid phone number'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

    // Validate driving license details
    body('drivingLicense.number').notEmpty().withMessage('Driving license number is required'),
    body('drivingLicense.expiryDate').isISO8601().withMessage('Valid license expiry date is required'),

    // Validate vehicle details
    body('vehicle.make').notEmpty().withMessage('Vehicle make is required'),
    body('vehicle.model').notEmpty().withMessage('Vehicle model is required'),
    body('vehicle.year').isNumeric().withMessage('Valid vehicle year is required'),
    body('vehicle.color').notEmpty().withMessage('Vehicle color is required'),
    body('vehicle.licensePlate').notEmpty().withMessage('License plate number is required')
], registerCaptain);

router.post('/login', [
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], loginCaptain);



module.exports = router;
