const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Apply auth and admin middleware to all routes in this file
router.use(authMiddleware, adminMiddleware);

router.post('/adjust', (req, res) => {
    const { userId, amount, reason } = req.body;
    const adminId = req.user.userId;

    if (!userId || amount === undefined) {
        return res.status(400).json({ message: 'User ID and amount are required.' });
    }

    if (typeof amount !== 'number' || !Number.isInteger(amount)) {
        return res.status(400).json({ message: 'Amount must be an integer.' });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    try {
        const stmt = db.prepare('INSERT INTO point_adjustments (admin_id, user_id, amount, reason) VALUES (?, ?, ?, ?)');
        stmt.run(adminId, userId, amount, reason || null);
        res.status(200).json({ message: 'Point adjustment successful.' });
    } catch (error) {
        console.error('Point adjustment failed:', error);
        res.status(500).json({ message: 'Failed to adjust points.' });
    }
});

router.get('/transactions', (req, res) => {
    try {
        const user_to_user = db.prepare(`
            SELECT 'transfer' as type, t.id, s.nickname as sender, r.nickname as receiver, t.amount, t.created_at
            FROM transactions t
            JOIN users s ON t.sender_id = s.id
            JOIN users r ON t.receiver_id = r.id
        `).all();

        const adjustments = db.prepare(`
            SELECT 'adjustment' as type, pa.id, a.nickname as admin, u.nickname as user, pa.amount, pa.reason, pa.created_at
            FROM point_adjustments pa
            JOIN users a ON pa.admin_id = a.id
            JOIN users u ON pa.user_id = u.id
        `).all();

        const allTransactions = [...user_to_user, ...adjustments];
        allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(allTransactions);
    } catch (error) {
        console.error('Failed to get all transactions:', error);
        res.status(500).json({ message: 'Failed to retrieve all transactions.' });
    }
});

module.exports = router;