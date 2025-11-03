const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Register
router.post(
    '/register',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['admin', 'lecturer']).withMessage('Role must be admin or lecturer')
    ],
    authController.register
);

// Login
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').exists().withMessage('Password is required')
    ],
    authController.login
);

// Profile
router.get('/profile', authMiddleware, authController.profile);

module.exports = router;