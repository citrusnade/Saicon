const express = require('express');
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const calculateBalance = (userId) => {
    const received = db.prepare('SELECT SUM(amount) as total FROM transactions WHERE receiver_id = ?').get(userId).total || 0;
    const sent = db.prepare('SELECT SUM(amount) as total FROM transactions WHERE sender_id = ?').get(userId).total || 0;
    const adjustments = db.prepare('SELECT SUM(amount) as total FROM point_adjustments WHERE user_id = ?').get(userId).total || 0;
    return received - sent + adjustments;
};

router.get('/balance', authMiddleware, (req, res) => {
    try {
        const balance = calculateBalance(req.user.userId);
        res.json({ balance });
    } catch (error) {
        console.error('Failed to get balance:', error);
        res.status(500).json({ message: 'Failed to retrieve balance' });
    }
});

router.post('/send', authMiddleware, (req, res) => {
    const { receiverNickname, amount } = req.body;
    const senderId = req.user.userId;

    if (!receiverNickname || !amount) {
        return res.status(400).json({ message: 'Receiver nickname and amount are required.' });
    }

    if (typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
        return res.status(400).json({ message: 'Amount must be a positive integer.' });
    }

    const receiver = db.prepare('SELECT id FROM users WHERE nickname = ?').get(receiverNickname);
    if (!receiver) {
        return res.status(404).json({ message: 'Receiver not found.' });
    }

    if (receiver.id === senderId) {
        return res.status(400).json({ message: 'You cannot send points to yourself.' });
    }

    const senderBalance = calculateBalance(senderId);
    if (senderBalance < amount) {
        return res.status(400).json({ message: 'Insufficient balance.' });
    }

    try {
        const stmt = db.prepare('INSERT INTO transactions (sender_id, receiver_id, amount) VALUES (?, ?, ?)');
        stmt.run(senderId, receiver.id, amount);
        res.status(200).json({ message: 'Points sent successfully.' });
    } catch (error) {
        console.error('Transaction failed:', error);
        res.status(500).json({ message: 'Failed to send points.' });
    }
});

router.get('/history', authMiddleware, (req, res) => {
    const userId = req.user.userId;

    try {
        const sent = db.prepare(`
            SELECT 'sent' as type, t.amount, u.nickname as party, t.created_at
            FROM transactions t
            JOIN users u ON t.receiver_id = u.id
            WHERE t.sender_id = ?
        `).all(userId);

        const received = db.prepare(`
            SELECT 'received' as type, t.amount, u.nickname as party, t.created_at
            FROM transactions t
            JOIN users u ON t.sender_id = u.id
            WHERE t.receiver_id = ?
        `).all(userId);

        const adjustments = db.prepare(`
            SELECT 'adjustment' as type, pa.amount, u.nickname as party, pa.created_at
            FROM point_adjustments pa
            JOIN users u ON pa.admin_id = u.id
            WHERE pa.user_id = ?
        `).all(userId);

        const history = [...sent, ...received, ...adjustments];

        history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(history);

    } catch (error) {
        console.error('Failed to get history:', error);
        res.status(500).json({ message: 'Failed to retrieve transaction history.' });
    }
});


module.exports = router;