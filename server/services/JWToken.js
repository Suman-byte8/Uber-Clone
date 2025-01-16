const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    // Generate JWT token valid for 30 days
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

module.exports = { generateToken };
