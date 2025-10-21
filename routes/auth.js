const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const { ensureGuest } = require('../middleware/auth');

// Login page
router.get('/login', ensureGuest, (req, res) => {
    res.render('login', { title: 'Login' });
});

// Login POST
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/auth/login',
        failureFlash: true
    })(req, res, next);
});

// Register page
router.get('/register', ensureGuest, (req, res) => {
    res.render('register', { title: 'Register' });
});

// Register POST
router.post('/register', async (req, res) => {
    const { username, email, password, password2 } = req.body;
    let errors = [];

    // Validation
    if (!username || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 8) {
        errors.push({ msg: 'Password should be at least 8 characters' });
    }

    if (errors.length > 0) {
        return res.render('register', {
            errors,
            username,
            email
        });
    }

    try {
        const existingUser = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { username }] 
        });

        if (existingUser) {
            errors.push({ msg: 'Email or username already registered' });
            return res.render('register', { errors, username, email });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        await User.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.render('register', {
            errors: [{ msg: 'Something went wrong' }],
            username,
            email
        });
    }
});

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/auth/login' }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

// Logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/');
    });
});

module.exports = router;