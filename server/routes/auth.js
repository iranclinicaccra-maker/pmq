const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for: ${username}`);

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            console.log('User not found');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        console.log(`User found: ${user.username}, Role: ${user.role}`);

        // For initial admin user with plain text 'admin' (migration scenario)
        // In production, ALWAYS use bcrypt.compare
        let validPassword = false;
        if (user.username === 'admin' && user.password_hash === 'admin') {
            console.log('Checking plain text admin password...');
            validPassword = (password === 'admin');
            // Auto-update to hashed password if it was plain text
            if (validPassword) {
                console.log('Updating admin password to hash...');
                const hash = await bcrypt.hash('admin', 10);
                await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
            }
        } else {
            console.log('Checking hashed password...');
            validPassword = await bcrypt.compare(password, user.password_hash);
        }

        if (!validPassword) {
            console.log('Invalid password');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('Password valid. Creating session...');
        // Create session
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            full_name: user.full_name
        };

        console.log('Session created:', req.session.user);
        res.json({ success: true, user: req.session.user });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// Get Current User
router.get('/me', isAuthenticated, (req, res) => {
    res.json({ user: req.session.user });
});

// Change Password
router.post('/change-password', isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    try {
        const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
