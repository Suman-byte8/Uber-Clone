const twilio = require('twilio');
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Send OTP
const sendOtp = async (req, res) => {
    const { phoneNumber } = req.body;

    const otp = Math.floor(Math.random() * 9000) + 1000; // Generate a 4-digit OTP

    console.log(otp)

    try {
        await client.messages.create({
            body: `Your OTP is ${otp}`,
            from: TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        // Store OTP in a temporary store (e.g., in-memory, Redis, or database)
        // For simplicity, we'll use a global variable here (not recommended for production)
        global.otpStore = { phoneNumber, otp };

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

// Verify OTP
const verifyOtp = (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (global.otpStore && global.otpStore.phoneNumber === phoneNumber && global.otpStore.otp === otp) {
        delete global.otpStore; // Clear OTP after verification
        res.status(200).json({ message: 'OTP verified successfully' });
    } else {
        res.status(400).json({ message: 'Invalid OTP' });
    }
};

module.exports = { sendOtp, verifyOtp };