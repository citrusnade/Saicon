const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const ADMIN_CODES = (process.env.ADMIN_INVITE_CODES || '').split(',');
const USER_CODES = (process.env.USER_INVITE_CODES || '').split(',');

router.post('/login', (req, res) => {
    const { inviteCode, nickname } = req.body;

    if (!inviteCode || !nickname) {
        return res.status(400).json({ message: 'Invite code and nickname are required.' });
    }

    let role = null;
    if (ADMIN_CODES.includes(inviteCode)) {
        role = 'admin';
    } else if (USER_CODES.includes(inviteCode)) {
        role = 'user';
    }

    if (!role) {
        return res.status(401).json({ message: 'Invalid invite code.' });
    }

    try {
        let user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname);

        if (!user) {
            const stmt = db.prepare('INSERT INTO users (nickname, role) VALUES (?, ?)');
            const info = stmt.run(nickname, role);
            user = { id: info.lastInsertRowid, nickname, role };
        } else {
            // Optional: If user exists, just log them in. Or return error if nickname must be unique on first registration.
            // For this implementation, we allow login if nickname exists.
        }

        const token = jwt.sign({ userId: user.id, nickname: user.nickname, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, nickname: user.nickname, role: user.role } });

    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ message: 'Nickname is already taken.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

router.get('/me', authMiddleware, (req, res) => {
    const user = db.prepare('SELECT id, nickname, role FROM users WHERE id = ?').get(req.user.userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
});

module.exports = router;