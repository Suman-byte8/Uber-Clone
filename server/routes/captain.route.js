const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  registerCaptain, 
  loginCaptain, 
  getCaptainDetails, 
  updateCaptainDetails, 
  toggleOnlineStatus,
  updateLocation
} = require('../controllers/captain.controller');
const { protect, authorize } = require('../middlewares/authMiddleWare');

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

// Captain login route with validation
router.post('/login', [
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
], loginCaptain);

// Update captain location route
router.put('/:captainId/location', protect, authorize('captain'), updateLocation);

// Get captain details route (protected - only for captains)
router.get('/:captainId', protect, authorize('captain'), getCaptainDetails);

// Public route to get basic captain details for ride matching
router.get('/:captainId/public', getCaptainDetails);

// Update captain details route with validation
router.put('/:captainId', [
    protect, 
    authorize('captain'),
    body('name').optional().isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
    body('vehicle.make').optional().notEmpty().withMessage('Vehicle make cannot be empty'),
    body('vehicle.model').optional().notEmpty().withMessage('Vehicle model cannot be empty'),
    body('vehicle.year').optional().isNumeric().withMessage('Vehicle year must be a number'),
    body('vehicle.color').optional().notEmpty().withMessage('Vehicle color cannot be empty'),
    body('vehicle.licensePlate').optional().notEmpty().withMessage('License plate cannot be empty'),
    body('drivingLicense.expiryDate').optional().isISO8601().withMessage('Valid license expiry date is required')
], updateCaptainDetails);

// Toggle captain active status
router.put('/:captainId/toggle-status', protect, authorize('captain'), toggleOnlineStatus);


module.exports = router;
