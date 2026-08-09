const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = userQuery.rows[0];

        // Check if user is blocked
        if (user.status === 'BLOCKED') {
            return res.status(403).json({ message: 'Account is blocked. Please contact system admin.' });
        }

        // Check if user is temporarily locked out (PB004)
        if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
            return res.status(429).json({ 
                message: 'Account temporarily locked due to 5 failed attempts. Please try again later.' 
            });
        }

        // Verify password hash (RA 10173 compliant - PB005)
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            const attempts = user.failed_login_attempts + 1;
            
            if (attempts >= 5) {
                const lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
                await db.query(
                    'UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE id = $3',
                    [attempts, lockoutTime, user.id]
                );
                return res.status(429).json({ 
                    message: 'Account locked due to 5 consecutive failed login attempts.' 
                });
            } else {
                await db.query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [attempts, user.id]);
                return res.status(401).json({ message: `Invalid credentials. ${5 - attempts} attempts remaining.` });
            }
        }

        // Reset failed login counter on successful login
        await db.query(
            'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1',
            [user.id]
        );

        // Issue JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'siyasat_super_secret_key_2026',
            { expiresIn: '8h' }
        );

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;