const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const { ensureGuest } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/mailer');

// ---------- LOGIN ----------

router.get('/login', ensureGuest, (req, res) => {
    res.render('login', { title: 'Login' });
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('error_msg', info.message || 'Invalid credentials');
            return res.redirect('/auth/login');
        }
        // Block unverified users from logging in
        if (!user.isVerified) {
            req.flash('error_msg', 'Please verify your email before logging in. Check your inbox.');
            return res.redirect('/auth/login');
        }
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.redirect('/books/dashboard');
        });
    })(req, res, next);
});

// ---------- REGISTER ----------

router.get('/register', ensureGuest, (req, res) => {
    res.render('register', { title: 'Register' });
});

router.post('/register', async (req, res) => {
    const { username, email, password, password2 } = req.body;
    let errors = [];

    if (!username || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (password && password.length < 8) {
        errors.push({ msg: 'Password should be at least 8 characters' });
    }

    // Basic email format check (defense in depth; real check is the verification email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        errors.push({ msg: 'Please enter a valid email address' });
    }

    if (errors.length > 0) {
        return res.render('register', { errors, username, email });
    }

    try {
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }]
        });
        if (existingUser) {
            errors.push({ msg: 'Email or username already registered' });
            return res.render('register', { errors, username, email });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verifyToken = crypto.randomBytes(32).toString('hex');
        const verifyTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        const newUser = await User.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            isVerified: false,
            verifyToken,
            verifyTokenExpires
        });

        await sendVerificationEmail(newUser.email, newUser.username, verifyToken);

        req.flash('success_msg', 'Registration successful! Please check your email to verify your account before logging in.');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.render('register', {
            errors: [{ msg: 'Something went wrong. Please try again.' }],
            username,
            email
        });
    }
});

// ---------- EMAIL VERIFICATION ----------

router.get('/verify/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            verifyToken: req.params.token,
            verifyTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error_msg', 'Verification link is invalid or has expired. Please register again or request a new link.');
            return res.redirect('/auth/login');
        }

        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpires = undefined;
        await user.save();

        req.flash('success_msg', 'Email verified! You can now log in.');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong verifying your email.');
        res.redirect('/auth/login');
    }
});

// Resend verification email
router.get('/resend-verification', ensureGuest, (req, res) => {
    res.render('resend-verification', { title: 'Resend Verification' });
});

router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            req.flash('error_msg', 'No account found with that email.');
            return res.redirect('/auth/resend-verification');
        }
        if (user.isVerified) {
            req.flash('success_msg', 'That account is already verified. You can log in.');
            return res.redirect('/auth/login');
        }

        const verifyToken = crypto.randomBytes(32).toString('hex');
        user.verifyToken = verifyToken;
        user.verifyTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        await sendVerificationEmail(user.email, user.username, verifyToken);

        req.flash('success_msg', 'Verification email sent. Please check your inbox.');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.redirect('/auth/resend-verification');
    }
});

// ---------- FORGOT / RESET PASSWORD ----------

router.get('/forgot-password', ensureGuest, (req, res) => {
    res.render('forgot-password', { title: 'Forgot Password' });
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        // Always show the same message, whether or not the email exists —
        // this prevents attackers from using this form to discover registered emails
        const genericMsg = 'If that email is registered, a password reset link has been sent.';

        if (!user) {
            req.flash('success_msg', genericMsg);
            return res.redirect('/auth/login');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        await sendPasswordResetEmail(user.email, user.username, resetToken);

        req.flash('success_msg', genericMsg);
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.redirect('/auth/forgot-password');
    }
});

router.get('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error_msg', 'Password reset link is invalid or has expired.');
            return res.redirect('/auth/forgot-password');
        }

        res.render('reset-password', { title: 'Reset Password', token: req.params.token });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong.');
        res.redirect('/auth/forgot-password');
    }
});

router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password, password2 } = req.body;

        if (!password || password.length < 8) {
            req.flash('error_msg', 'Password should be at least 8 characters');
            return res.redirect(`/auth/reset-password/${req.params.token}`);
        }
        if (password !== password2) {
            req.flash('error_msg', 'Passwords do not match');
            return res.redirect(`/auth/reset-password/${req.params.token}`);
        }

        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error_msg', 'Password reset link is invalid or has expired.');
            return res.redirect('/auth/forgot-password');
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        req.flash('success_msg', 'Password updated! You can now log in.');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.redirect('/auth/forgot-password');
    }
});

// ---------- GOOGLE OAUTH ----------

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/login' }),
    (req, res) => {
        res.redirect('/books/dashboard');
    }
);

// ---------- LOGOUT ----------

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) console.error(err);
        req.flash('success_msg', 'You are logged out');
        res.redirect('/');
    });
});

module.exports = router;