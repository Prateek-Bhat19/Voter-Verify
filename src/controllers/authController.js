const User = require('../models/userModel');
const otpUtils = require('../utils/otpUtils');
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const jwtSecret = process.env.JWT_SECRET;

const client = new twilio(accountSid, authToken);
const otps = {};

const signup = async (req, res) => {
    try {

        const { name, email, password, adharNumber, phoneNumber, voterId } = req.body;

        // Validate required fields
        if (!email || !password || !phoneNumber) {
            return res.status(400).json({ error: "Email, password, and phone number are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email },
                { phoneNumber },
                { adharNumber },
                { voterId }
            ]
        });

        if (existingUser) {
            let duplicateField = '';
            if (existingUser.email === email) duplicateField = 'email';
            else if (existingUser.phoneNumber === phoneNumber) duplicateField = 'phone number';
            else if (existingUser.adharNumber === adharNumber) duplicateField = 'Aadhar number';
            else if (existingUser.voterId === voterId) duplicateField = 'voter ID';
            
            return res.status(400).json({ 
                error: `User with this ${duplicateField} already exists` 
            });
        }

        // Create user without hashing password (the model will handle it)
        const user = new User({ 
            name, 
            email, 
            password, // Pass plain password, model will hash it
            adharNumber, 
            phoneNumber, 
            voterId,
            phoneNumberVerified: true // Set to true by default since we're not using OTP
        });

        await user.save();
        
        res.status(201).json({ 
            message: 'Signup successful. You can now login.',
            userId: user._id
        });
    } catch (error) {
        console.error('Signup error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Signup failed. Please try again later." });
    }
};


const moment = require('moment');
const sendOTP = async (req, res) => {
    const { phoneNumber } = req.body;
    const otp = otpUtils.generateOTP();
    try {

        await client.messages.create({
            body: `Your OTP is: ${otp}`,
            from: twilioPhoneNumber,
            to: phoneNumber,
        });

        const expiresAt = moment().add(5, 'minutes').toDate();
        otps[phoneNumber] = { otp, expiresAt };
        res.json({ message: 'OTP sent successfully.' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        console.error('Twilio error details:', error.message, error.code);
        res.status(500).json({ error: 'Failed to send OTP.' });
    }
};


const verifyOTP = async (req, res) => {
    const { phoneNumber, otp } = req.body;
    const storedOtpData = otps[phoneNumber];

    if (!storedOtpData || !storedOtpData.otp) {
        return res.status(400).json({ error: "OTP expired or invalid." });
    }

    if (storedOtpData.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP." });
    }

    if (!moment().isBefore(storedOtpData.expiresAt)) {
        return res.status(400).json({ error: "OTP has expired." });
    }

    delete otps[phoneNumber]; // Remove OTP after use

    try {
        const existingUser = await User.findOne({ phoneNumber });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found. Please sign up first." });
        }

        const updatedUser = await User.findOneAndUpdate(
            { phoneNumber },
            { phoneNumberVerified: true },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(500).json({ error: "Failed to update verification status." });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({ message: "Phone number successfully verified!", token });
    } catch (dbError) {
        console.error("Database error during OTP verification: ", dbError);
        return res.status(500).json({ error: "Database error" });
    }
};


const verifyOTPAndGetUID = async (req, res) => {
    const { phoneNumber, otp } = req.body;
    const storedOtpData = otps[phoneNumber];

    if (storedOtpData && storedOtpData.otp === otp) {
        if(moment().isBefore(storedOtpData.expiresAt)){
            delete otps[phoneNumber];
            try {
                const user = await User.findOne({ phoneNumber });
                if (!user) {
                    return res.status(404).json({ error: 'User not found with this phone number.' });
                }
                return res.status(200).json({ message: 'Phone number successfully verified!', user: user });
            } catch (dbError) {
                console.error("Database error during OTP verification: ", dbError);
                return res.status(500).json({ error: 'Database error during OTP verification.' });
            }
        } else {
            return res.status(400).json({error: "OTP has expired."});
        }
    } else {
        return res.status(400).json({ error: 'Invalid OTP.' });
    }
};


// In your authController.js
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        if (!user.password) {
            return res.status(401).json({ error: "Invalid user account configuration" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.status(200).json({ 
            token,
            userId: user._id.toString(),
            phoneNumber: user.phoneNumber,
            isAdmin: user.isAdmin,
            name: user.name
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: "Login failed. Please try again later." });
    }
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email, isAdmin: true }).select('+password');
        
        if (!user || !user.password) {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }
        
        const token = jwt.sign({ 
            userId: user._id,
            isAdmin: true 
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        
        res.status(200).json({ 
            token,
            userId: user._id.toString(),
            isAdmin: true
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ error: "Admin login failed" });
    }
};

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const refreshToken = async (req, res) => {
    try {
        const oldToken = req.header("Authorization")?.split(" ")[1];
        if (!oldToken) {
            return res.status(401).json({ message: "No token provided." });
        }

        const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, { ignoreExpiration: true });
        const newToken = generateToken(decoded.userId);

        res.status(200).json({ token: newToken });
    } catch (error) {
        console.error("Refresh Token Error:", error);
        res.status(401).json({ message: "Invalid refresh request." });
    }
};



module.exports = { signup, sendOTP, verifyOTP, verifyOTPAndGetUID, login, adminLogin, refreshToken  };