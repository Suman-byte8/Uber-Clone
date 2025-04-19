const mongoose = require('mongoose');
const { Schema } = mongoose;

const captainSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        minlength: [3, 'Name must be at least 3 characters long'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    role: {
        type: String,
        default: "captain",
        immutable: true,  // Prevents the role from being changed after creation
        enum: ["captain"] // Ensures the role can only be "captain"
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    drivingLicense: {
        number: {
            type: String,
            required: [true, 'Driving license number is required'],
            unique: true
        },
        expiryDate: {
            type: Date,
            required: [true, 'License expiry date is required']
        }
    },
    vehicle: {
        make: {
            type: String,
            required: [true, 'Vehicle make is required']
        },
        model: {
            type: String, 
            required: [true, 'Vehicle model is required']
        },
        year: {
            type: Number,
            required: [true, 'Vehicle year is required']
        },
        color: {
            type: String,
            required: [true, 'Vehicle color is required']
        },
        licensePlate: {
            type: String,
            required: [true, 'License plate number is required'],
            unique: true
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Captain', captainSchema);

