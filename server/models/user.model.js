const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
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
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'] // E.164 format
    },
    role: {
        type: String,
        default: "user"
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    location: {
        lat: { type: Number, }, // Latitude
        lng: { type: Number, }  // Longitude
    },
    // profilePicture: {
    //     type: String, // URL for the profile picture
    //     default: 'https://example.com/default-avatar.png'
    // },
    rides: [
        { type: Schema.Types.ObjectId, ref: 'Ride' } // Reference to rides the user has taken
    ],

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema);
