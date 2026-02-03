import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

describe('Support Messages System', () => {
  let testUser: any;
  let testAdmin: any;
  let userToken: string;
  let adminToken: string;
  let conversationId: string;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-support-user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    // Create test admin
    testAdmin = await prisma.user.create({
      data: {
        email: 'test-support-admin@example.com',
        password: 'hashedpassword',
        name: 'Test Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Generate tokens
    userToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      config.jwt.secret
    );

    adminToken = jwt.sign(
      { userId: testAdmin.id, email: testAdmin.email, role: testAdmin.role },
      config.jwt.secret
    );
  });

  afterAll(async () => {
    // Cleanup
    await prisma.message.deleteMany({
      where: {
        conversation: {
          OR: [
            { userId: testUser.id },
            { guestEmail: 'test-guest@example.com' },
          ],
        },
      },
    });

    await prisma.supportNotification.deleteMany({
      where: { userId: testUser.id },
    });

    await prisma.conversation.deleteMany({
      where: {
        OR: [
          { userId: testUser.id },
          { guestEmail: 'test-guest@example.com' },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test-support-user@example.com', 'test-support-admin@example.com'],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('POST /api/contact - Guest User', () => {
    it('should reject contact without email for guest', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({
          message: 'Test message from guest',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should create conversation for guest with email', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({
          message: 'Test message from guest',
          guestEmail: 'test-guest@example.com',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.conversationId).toBeDefined();
    });
  });

  describe('POST /api/contact - Logged-in User', () => {
    it('should create conversation for logged-in user without email', async () => {
      const response = await request(app)
        .post('/api/contact')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'Test message from logged-in user',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.conversationId).toBeDefined();
      
      conversationId = response.body.data.conversationId;
    });

    it('should reject email for logged-in user', async () => {
      const response = await request(app)
        .post('/api/contact')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'Test message',
          guestEmail: 'should-not-accept@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/me/conversations', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/me/conversations');
      
      expect(response.status).toBe(401);
    });

    it('should return user conversations', async () => {
      const response = await request(app)
        .get('/api/me/conversations')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.conversations)).toBe(true);
      expect(response.body.data.conversations.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/me/conversations/:id', () => {
    it('should return conversation details', async () => {
      const response = await request(app)
        .get(`/api/me/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(conversationId);
      expect(Array.isArray(response.body.data.messages)).toBe(true);
    });

    it('should not allow access to other user conversation', async () => {
      // Create another user and conversation
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-user@example.com',
          password: 'hashedpassword',
          role: 'USER',
          status: 'ACTIVE',
        },
      });

      const otherToken = jwt.sign(
        { userId: otherUser.id, email: otherUser.email, role: otherUser.role },
        config.jwt.secret
      );

      const response = await request(app)
        .get(`/api/me/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Admin Endpoints', () => {
    it('GET /admin/conversations should require admin role', async () => {
      const response = await request(app)
        .get('/admin/conversations')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
    });

    it('should get all conversations as admin', async () => {
      const response = await request(app)
        .get('/admin/conversations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.conversations)).toBe(true);
    });

    it('should allow admin to reply to conversation', async () => {
      const response = await request(app)
        .post(`/admin/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          body: 'Admin reply to user',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should create notification for user when admin replies', async () => {
      // Check if notification was created
      const notifications = await prisma.supportNotification.findMany({
        where: {
          userId: testUser.id,
          conversationId,
          isRead: false,
        },
      });

      expect(notifications.length).toBeGreaterThan(0);
    });
  });

  describe('Unread notifications', () => {
    it('should return unread count', async () => {
      const response = await request(app)
        .get('/api/me/support-notifications/count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should mark conversation as read', async () => {
      const response = await request(app)
        .post(`/api/me/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify count decreased
      const countResponse = await request(app)
        .get('/api/me/support-notifications/count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(countResponse.body.data.count).toBe(0);
    });
  });
});
