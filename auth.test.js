const request = require('supertest');
const app = require('../server');
const db = require('../db/database');

describe('Auth Endpoints', () => {
    beforeAll(() => {
        // Run migrations and clear tables for a clean test environment
        db.exec('DELETE FROM users; DELETE FROM transactions; DELETE FROM point_adjustments;');
    });

    it('should register and login a new user with a valid user invite code', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                inviteCode: 'user01',
                nickname: 'testuser'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.nickname).toBe('testuser');
        expect(res.body.user.role).toBe('user');
    });

    it('should register and login a new admin with a valid admin invite code', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                inviteCode: 'admin01',
                nickname: 'testadmin'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.nickname).toBe('testadmin');
        expect(res.body.user.role).toBe('admin');
    });

    it('should fail to login with an invalid invite code', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                inviteCode: 'invalidcode',
                nickname: 'anotheruser'
            });
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Invalid invite code.');
    });

    it('should fail to register with a nickname that is already taken', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                inviteCode: 'user02',
                nickname: 'testuser' // already taken from the first test
            });
        expect(res.statusCode).toEqual(409);
        expect(res.body.message).toBe('Nickname is already taken.');
    });

    afterAll(() => {
        // It's good practice to close the DB connection after tests
        // db.close(); // Note: Closing might interfere with other test suites if run concurrently.
    });
});