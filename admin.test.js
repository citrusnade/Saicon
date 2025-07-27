const request = require('supertest');
const app = require('../server');
const db = require('../db/database');

describe('Admin Endpoints', () => {
    let adminToken, userToken;
    let userId;

    beforeAll(async () => {
        db.exec('DELETE FROM users; DELETE FROM transactions; DELETE FROM point_adjustments;');

        // Create users for testing admin actions
        const adminRes = await request(app).post('/api/auth/login').send({ nickname: 'ad_admin', inviteCode: 'admin01' });
        adminToken = adminRes.body.token;

        const userRes = await request(app).post('/api/auth/login').send({ nickname: 'ad_user', inviteCode: 'user01' });
        userToken = userRes.body.token;
        userId = userRes.body.user.id;
    });

    it('should allow an admin to issue points to a user', async () => {
        const res = await request(app)
            .post('/api/admin/adjust')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ userId: userId, amount: 1000, reason: 'Test issuance' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Point adjustment successful.');

        // Verify the user's balance reflects the change
        const balanceRes = await request(app)
            .get('/api/transactions/balance')
            .set('Authorization', `Bearer ${userToken}`);
        expect(balanceRes.body.balance).toBe(1000);
    });

    it('should allow an admin to deduct points from a user', async () => {
        const res = await request(app)
            .post('/api/admin/adjust')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ userId: userId, amount: -200, reason: 'Test deduction' });

        expect(res.statusCode).toBe(200);

        // Verify the user's balance reflects the change (1000 - 200 = 800)
        const balanceRes = await request(app)
            .get('/api/transactions/balance')
            .set('Authorization', `Bearer ${userToken}`);
        expect(balanceRes.body.balance).toBe(800);
    });

    it('should prevent a non-admin user from accessing admin routes', async () => {
        const res = await request(app)
            .post('/api/admin/adjust')
            .set('Authorization', `Bearer ${userToken}`) // Using regular user token
            .send({ userId: userId, amount: 50, reason: 'Hacking attempt' });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('Access denied. Admin role required.');
    });

    afterAll(() => {
        db.close();
    });
});