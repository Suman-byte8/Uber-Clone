const User = require('../models/user.model');
const { comparePassword } = require('../services/comparePassword');
const { hashPassword } = require('../services/hashPassword');
const { generateToken } = require('../services/JWToken');

// @desc    Register a new user
// @route   POST /api/users/signup
// @access  Public

const signup = async (req, res) => {
    try {
        const { name, email, phoneNumber, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email },
                { phoneNumber: phoneNumber }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists with this email or phone number'
            });
        }

        const hashedPassword = await hashPassword(password)

        // Create new user
        const user = await User.create({
            name,
            email,
            phoneNumber,
            password: hashedPassword,

        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                token: generateToken(user._id, user.role)
            });
        } else {
            res.status(400).json({
                message: 'Invalid user data'
            });
        }

    } catch (error) {
        res.status(500).json({
            message: 'Error creating user',
            error: error.message
        });
    }
};

async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        // Check if password is correct
        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        res.status(200).json({
            _id: user._id,
            message: "User logged in successfully",
            token: token
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error logging in user',
            error: error.message
        });
    }
}

// Controller to get account details
const getAccountDetails = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch user details (excluding password)
        const user = await User.findById(userId, 'name email phoneNumber');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};




module.exports = { signup, login, getAccountDetails };
