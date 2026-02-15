/**
 * WhatsApp Distribution Module - Basic Integration Test
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { messageBuilder } from '../src/modules/whatsapp/distribution/message-builder.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('WhatsApp Distribution Module', () => {
  describe('Message Builder', () => {
    it('should build a basic ad message', () => {
      const mockAd = {
        id: 'test-id',
        title: 'דירה 4 חדרים למכירה',
        description: 'דירה מרווחת ומשופצת ברמה גבוהה',
        price: 2500000,
        adNumber: 12345,
        Category: {
          nameHe: 'דירות למכירה',
          slug: 'sale',
        },
        City: {
          nameHe: 'תל אביב',
        },
        Street: {
          name: 'רחוב ביאליק',
        },
        customFields: {
          rooms: 4,
          squareMeters: 110,
          floor: 3,
        },
        AdImage: [
          {
            url: 'https://example.com/image.jpg',
            brandedUrl: null,
            order: 0,
          },
        ],
      } as any;

      const result = messageBuilder.buildAdMessage(mockAd);

      expect(result).toBeDefined();
      expect(result.messageText).toContain('דירה 4 חדרים למכירה');
      expect(result.messageText).toContain('תל אביב');
      expect(result.messageText).toContain('₪2,500,000');
      expect(result.messageText).toContain('4 חדרים');
      expect(result.messageText).toContain('110 מ"ר');
      expect(result.listingUrl).toContain('/listing/test-id/');
      expect(result.metadata.adNumber).toBe(12345);
    });

    it('should build a digest message', () => {
      const mockAds = [
        {
          id: 'ad1',
          title: 'דירה 3 חדרים',
          adNumber: 101,
          price: 1800000,
          Category: { nameHe: 'דירות למכירה', slug: 'sale' },
          City: { nameHe: 'רמת גן' },
        },
        {
          id: 'ad2',
          title: 'דירה 5 חדרים',
          adNumber: 102,
          price: 3200000,
          Category: { nameHe: 'דירות למכירה', slug: 'sale' },
          City: { nameHe: 'תל אביב' },
        },
      ] as any[];

      const result = messageBuilder.buildDigestMessage(mockAds, 'קבוצת בני ברק');

      expect(result.messageText).toContain('קבוצת בני ברק');
      expect(result.messageText).toContain('2 נכסים');
      expect(result.messageText).toContain('דירה 3 חדרים');
      expect(result.messageText).toContain('דירה 5 חדרים');
    });

    it('should truncate long text correctly', () => {
      const longDescription = 'א'.repeat(500);
      const mockAd = {
        id: 'test',
        title: 'טייטל',
        description: longDescription,
        adNumber: 1,
        Category: {},
        City: {},
      } as any;

      const result = messageBuilder.buildAdMessage(mockAd);

      expect(result.messageText.length).toBeLessThan(4000);
    });

    it('should sanitize text (remove control characters)', () => {
      const mockAd = {
        id: 'test',
        title: 'Title\x00with\x01control\x02chars',
        adNumber: 1,
        Category: {},
        City: {},
      } as any;

      const result = messageBuilder.buildAdMessage(mockAd);

      expect(result.messageText).not.toContain('\x00');
      expect(result.messageText).not.toContain('\x01');
    });

    it('should create WhatsApp web link', () => {
      const text = 'שלום עולם';
      const link = messageBuilder.buildWhatsAppWebLink(text);

      expect(link).toContain('https://web.whatsapp.com/send');
      expect(link).toContain('text=');
      expect(decodeURIComponent(link)).toContain('שלום עולם');
    });
  });

  describe('Routing Engine (Integration)', () => {
    it('should exist', () => {
      const { routingEngine } = require('../src/modules/whatsapp/distribution/routing-engine.service');
      expect(routingEngine).toBeDefined();
      expect(routingEngine.findMatchingGroups).toBeDefined();
    });
  });

  describe('Distribution Service (Integration)', () => {
    it('should exist', () => {
      const { distributionService } = require('../src/modules/whatsapp/distribution/distribution.service');
      expect(distributionService).toBeDefined();
      expect(distributionService.createDistributionItems).toBeDefined();
      expect(distributionService.markSent).toBeDefined();
    });
  });

  describe('Audit Service', () => {
    it('should exist', () => {
      const { auditService } = require('../src/modules/whatsapp/distribution/audit.service');
      expect(auditService).toBeDefined();
      expect(auditService.log).toBeDefined();
    });
  });
});
