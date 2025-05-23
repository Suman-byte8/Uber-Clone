const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { signup, login, getAccountDetails, getPublicUserDetails } = require('../controllers/user.controller');
const { protect } = require('../middlewares/authMiddleWare');

// Public routes
router.post('/signup', [
    // Validation middleware
    check('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long'),
    check('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    check('phoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10}$/)
        .withMessage('Please provide a valid 10-digit phone number'),
    check('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    // Call controller function if validation passes
    signup(req, res);
});

router.post('/login', [
    // Validation middleware
    check('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    check('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    // Call controller function if validation passes
    login(req, res);
});

router.get('/:userId/public', getPublicUserDetails);

// Protected routes
router.get('/account', protect, getAccountDetails);

module.exports = router