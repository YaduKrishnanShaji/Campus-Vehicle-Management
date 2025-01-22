const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registration endpoint
router.post('/register', [
    // Validation middleware
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('phone_number').optional().matches(/^\+?[\d\s-]+$/).withMessage('Invalid phone number format')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, department, phone_number, profile_picture } = req.body;

        // Create user
        const userId = await User.createUser({
            name,
            email,
            password,
            department,
            phone_number,
            profile_picture
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Return success response with token
        res.status(201).json({
            message: 'Registration successful',
            token,
            redirect: '/dashboard'
        });

    } catch (error) {
        if (error.message === 'User already exists with this email') {
            return res.status(400).json({ message: error.message });
        }
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login endpoint
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Validate password
        const isValidPassword = await User.validatePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Update last login
        await User.updateLastLogin(user.id);

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Return success response
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            },
            redirect: '/dashboard'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router; 