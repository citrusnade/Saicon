const request = require('supertest');
const app = require('../server');
const db = require('../db/database');

describe('Transaction Endpoints', () => {
    let adminToken, user1Token, user2Token;
    let adminId, user1Id, user2Id;

    beforeAll(async () => {
        db.exec('DELETE FROM users; DELETE FROM transactions; DELETE FROM point_adjustments;');

        // Create users for testing transactions
        const adminRes = await request(app).post('/api/auth/login').send({ nickname: 'tx_admin', inviteCode: 'admin01' });
        adminToken = adminRes.body.token;
        adminId = adminRes.body.user.id;

        const user1Res = await request(app).post('/api/auth/login').send({ nickname: 'tx_user1', inviteCode: 'user01' });
        user1Token = user1Res.body.token;
        user1Id = user1Res.body.user.id;

        const user2Res = await request(app).post('/api/auth/login').send({ nickname: 'tx_user2', inviteCode: 'user02' });
        user2Token = user2Res.body.token;
        user2Id = user2Res.body.user.id;

        // Admin issues initial points to user1 to enable sending
        await request(app)
            .post('/api/admin/adjust')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ userId: user1Id, amount: 500, reason: 'Initial points' });
    });

    it('should allow user1 to send points to user2', async () => {
        const res = await request(app)
            .post('/api/transactions/send')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ receiverNickname: 'tx_user2', amount: 100 });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Points sent successfully.');
    });

    it('should reflect the correct balance for user1 and user2 after transaction', async () => {
        // Check user1's balance (500 issued - 100 sent = 400)
        const balance1Res = await request(app)
            .get('/api/transactions/balance')
            .set('Authorization', `Bearer ${user1Token}`);
        expect(balance1Res.statusCode).toBe(200);
        expect(balance1Res.body.balance).toBe(400);

        // Check user2's balance (0 initial + 100 received = 100)
        const balance2Res = await request(app)
            .get('/api/transactions/balance')
            .set('Authorization', `Bearer ${user2Token}`);
        expect(balance2Res.statusCode).toBe(200);
        expect(balance2Res.body.balance).toBe(100);
    });

    it('should prevent a user from sending more points than they have', async () => {
        const res = await request(app)
            .post('/api/transactions/send')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({ receiverNickname: 'tx_user2', amount: 999 }); // User1 only has 400

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Insufficient balance.');
    });

    it('should retrieve the transaction history for user1', async () => {
        const res = await request(app)
            .get('/api/transactions/history')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2); // 1 adjustment received, 1 sent
        expect(res.body[0].type).toBe('sent');
        expect(res.body[0].amount).toBe(100);
        expect(res.body[1].type).toBe('adjustment');
        expect(res.body[1].amount).toBe(500);
    });
});