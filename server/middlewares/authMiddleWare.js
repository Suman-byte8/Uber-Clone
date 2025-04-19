const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Captain = require('../models/captain.model');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            console.log("Decoded token:", decoded); // 👈 LOG HERE

            let user;
            if (decoded.role === 'captain') {
                user = await Captain.findById(decoded.id).select('-password');
            } else {
                user = await User.findById(decoded.id).select('-password');
            }

            console.log("Fetched user:", user); // 👈 AND LOG HERE

            req.user = user;

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};


// Middleware to authorize based on user or captain model
const authorize = (expectedRole) => {
    return (req, res, next) => {
      if (!req.user || req.user.role !== expectedRole) {
        return res.status(403).json({
          message: `Not authorized to access this route, Expected role: ${expectedRole}`
        });
      }
      next();
    };
  };
  

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Adjust expiration as needed
    });
};

module.exports = { protect, authorize, generateToken };

