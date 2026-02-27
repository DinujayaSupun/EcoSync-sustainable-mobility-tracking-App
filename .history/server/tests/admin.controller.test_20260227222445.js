const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Admin Controller Tests', () => {
  let adminToken;
  let adminUser;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
    }
  });

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      faculty: 'Engineering'
    });

    // Generate admin token
    adminToken = jwt.sign(
      { id: adminUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user',
      faculty: 'Science'
    });
  });

  afterEach(async () => {
    // Clean up
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/admin/stats', () => {
    it('should return admin statistics', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('totalCO2');
      expect(res.body).toHaveProperty('activeToday');
      expect(res.body).toHaveProperty('faculties');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/admin/stats');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return all users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0]).not.toHaveProperty('password');
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user role successfully', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.user.role).toBe('admin');
    });

    it('should prevent self-role modification', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toContain('Cannot modify your own role');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'invalid-email' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: adminUser.email });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Email already in use');
    });

    it('should reject invalid user ID', async () => {
      const res = await request(app)
        .put('/api/admin/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.statusCode).toBe(400);
    });

    it('should reject update with no fields', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('No fields to update');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user successfully', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify user was deleted
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should prevent self-deletion', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Cannot delete your own account');
    });

    it('should prevent deleting last admin', async () => {
      // Delete test user first
      await User.findByIdAndDelete(testUser._id);

      const res = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Cannot delete the last admin');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/admin/activity-logs', () => {
    it('should return activity logs', async () => {
      const res = await request(app)
        .get('/api/admin/activity-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('logs');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.logs)).toBe(true);
    });

    it('should filter logs by action', async () => {
      const res = await request(app)
        .get('/api/admin/activity-logs?action=UPDATE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.logs.every(log => log.action === 'UPDATE')).toBe(true);
    });

    it('should paginate logs', async () => {
      const res = await request(app)
        .get('/api/admin/activity-logs?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.pagination.logsPerPage).toBe(5);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on update endpoint', async () => {
      // Make multiple requests quickly
      const requests = [];
      for (let i = 0; i < 25; i++) {
        requests.push(
          request(app)
            .put(`/api/admin/users/${testUser._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ faculty: `Faculty ${i}` })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.statusCode === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should reject name with invalid characters', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test123!@#' });

      expect(res.statusCode).toBe(400);
    });

    it('should reject name that is too short', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'A' });

      expect(res.statusCode).toBe(400);
    });

    it('should reject invalid role value', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superadmin' });

      expect(res.statusCode).toBe(400);
    });
  });
});
