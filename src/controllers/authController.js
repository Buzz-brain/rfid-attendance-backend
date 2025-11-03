const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

// @route   POST /api/auth/register
// @desc    Register a new user (admin/lecturer)
// @access  Public
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { name, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        user = new User({ name, email, password, role });
        await user.save();
        const token = generateToken(user._id, user.role);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   POST /api/auth/login
// @desc    Login user and get token
// @access  Public
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        const token = generateToken(user._id, user.role);
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Protected
exports.profile = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    res.json({
        success: true,
        message: 'Profile fetched successfully',
        data: req.user
    });
};