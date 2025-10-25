// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');

// Dashboard page
router.get('/', ensureAuth, (req, res) => {
    res.render('dashboard', {
        title: 'Dashboard',
        user: req.user
    });
});

module.exports = router;
