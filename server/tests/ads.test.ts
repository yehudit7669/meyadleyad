import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import { mockPrisma } from './setup';
import jwt from 'jsonwebtoken';

describe('Ads Module', () => {
  let userToken: string;
  let adminToken: string;
  const userId = 'user-uuid-1';
  const adminId = 'admin-uuid-2';

  beforeEach(() => {
    // Generate test tokens
    userToken = jwt.sign(
      { userId, role: 'USER' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: adminId, role: 'ADMIN' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/ads', () => {
    it('should return all approved ads', async () => {
      const mockAds = [
        {
          id: '1',
          title: 'Test Ad 1',
          description: 'Description 1',
          price: 1000,
          status: 'APPROVED',
          user: { name: 'User 1' },
          category: { nameHe: 'קטגוריה' },
          city: { nameHe: 'עיר' },
        },
        {
          id: '2',
          title: 'Test Ad 2',
          description: 'Description 2',
          price: 2000,
          status: 'APPROVED',
          user: { name: 'User 2' },
          category: { nameHe: 'קטגוריה' },
          city: { nameHe: 'עיר' },
        },
      ];

      (mockPrisma.ad.findMany as any).mockResolvedValue(mockAds);

      const response = await request(app)
        .get('/api/ads')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.ads).toHaveLength(2);
      expect(response.body.data.ads[0].status).toBe('APPROVED');
    });

    it('should filter ads by category', async () => {
      (mockPrisma.ad.findMany as any).mockResolvedValue([
        {
          id: '1',
          title: 'Real Estate Ad',
          categoryId: '1',
          status: 'APPROVED',
        },
      ]);

      const response = await request(app)
        .get('/api/ads?category=1')
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should filter ads by city', async () => {
      (mockPrisma.ad.findMany as any).mockResolvedValue([
        {
          id: '1',
          title: 'Tel Aviv Ad',
          cityId: '1',
          status: 'APPROVED',
        },
      ]);

      const response = await request(app)
        .get('/api/ads?city=1')
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should search ads by title', async () => {
      (mockPrisma.ad.findMany as any).mockResolvedValue([
        {
          id: '1',
          title: 'iPhone 15 Pro',
          status: 'APPROVED',
        },
      ]);

      const response = await request(app)
        .get('/api/ads?search=iPhone')
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should paginate results', async () => {
      (mockPrisma.ad.findMany as any).mockResolvedValue([]);
      (mockPrisma.ad.count as any).mockResolvedValue(0);

      const response = await request(app)
        .get('/api/ads?page=2&limit=10')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/ads/:id', () => {
    it('should return ad details', async () => {
      const mockAd = {
        id: '1',
        title: 'Test Ad',
        description: 'Test Description',
        price: 1000,
        status: 'APPROVED',
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
        },
        category: { nameHe: 'קטגוריה' },
        city: { nameHe: 'תל אביב' },
        images: ['image1.jpg', 'image2.jpg'],
      };

      (mockPrisma.ad.findUnique as any).mockResolvedValue(mockAd);

      const response = await request(app)
        .get('/api/ads/1')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
    });

    it('should return 404 if ad not found', async () => {
      (mockPrisma.ad.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/ads/999')
        .expect(404);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/ads', () => {
    it('should create a new ad when authenticated', async () => {
      const adData = {
        title: 'New Ad for Testing',
        description: 'New Description for testing ad creation',
        price: 1500,
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        cityId: '550e8400-e29b-41d4-a716-446655440001',
      };

      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        role: 'USER',
      });

      (mockPrisma.ad.create as any).mockResolvedValue({
        id: '1',
        ...adData,
        status: 'PENDING',
        userId: userId,
      });

      const response = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${userToken}`)
        .send(adData)
        .expect(201);

      expect(response.body.status).toBe('success');
    });

    it('should return 401 if not authenticated', async () => {
      const adData = {
        title: 'New Ad',
        description: 'Description',
        price: 1000,
      };

      const response = await request(app)
        .post('/api/ads')
        .send(adData)
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    it('should validate required fields', async () => {
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: '1',
        role: 'USER',
      });

      const response = await request(app)
        .post('/api/ads')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Only Title' })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/ads/:id', () => {
    it('should update own ad', async () => {
      const adId = '550e8400-e29b-41d4-a716-446655440012';
      const updateData = {
        title: 'Updated Title',
        price: 2000,
      };

      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        role: 'USER',
      });

      (mockPrisma.ad.findUnique as any).mockResolvedValue({
        id: adId,
        userId: userId,
        title: 'Old Title',
      });

      (mockPrisma.ad.update as any).mockResolvedValue({
        id: adId,
        ...updateData,
        userId: userId,
      });

      const response = await request(app)
        .put(`/api/ads/${adId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe('Updated Title');
    });

    it('should return 403 if trying to update another user ad', async () => {
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: '1',
        role: 'USER',
      });

      (mockPrisma.ad.findUnique as any).mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440011',
        userId: 'other-user-id',
        status: 'APPROVED',
      });

      const response = await request(app)
        .put('/api/ads/550e8400-e29b-41d4-a716-446655440011')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'New Title for Testing' })
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/ads/:id', () => {
    it('should delete own ad', async () => {
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        role: 'USER',
      });

      (mockPrisma.ad.findUnique as any).mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440012',
        userId: userId,
      });

      (mockPrisma.ad.delete as any).mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440012',
      });

      const response = await request(app)
        .delete('/api/ads/550e8400-e29b-41d4-a716-446655440012')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  describe('PATCH /api/ads/:id/approve (Admin)', () => {
    it('should approve ad as admin', async () => {
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: adminId,
        role: 'ADMIN',
      });

      (mockPrisma.ad.findUnique as any).mockResolvedValue({
        id: '1',
        status: 'PENDING',
        title: 'Test Ad',
        user: {
          id: userId,
          email: 'user@example.com',
        },
      });

      (mockPrisma.ad.update as any).mockResolvedValue({
        id: '1',
        status: 'APPROVED',
        title: 'Test Ad',
      });

      const response = await request(app)
        .post('/api/admin/ads/1/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should return 403 if not admin', async () => {
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: '1',
        role: 'USER',
      });

      const response = await request(app)
        .post('/api/admin/ads/1/approve')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /api/ads/:id/reject (Admin)', () => {
    it('should reject ad as admin', async () => {
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: adminId,
        role: 'ADMIN',
      });

      (mockPrisma.ad.findUnique as any).mockResolvedValue({
        id: '1',
        status: 'PENDING',
        title: 'Test Ad',
        user: {
          id: userId,
          email: 'user@example.com',
        },
      });

      (mockPrisma.ad.update as any).mockResolvedValue({
        id: '1',
        status: 'REJECTED',
        rejectionReason: 'Invalid content',
      });

      const response = await request(app)
        .post('/api/admin/ads/1/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Invalid content' })
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });
});
