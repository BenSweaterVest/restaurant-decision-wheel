/**
 * Shared Utilities Tests
 *
 * Tests for shared API utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  generateUUID,
  validateServiceTypes,
  validateProfileId,
  validateURL,
  validateRestaurantData
} from '../../functions/api/_shared.js';

describe('Shared Utilities', () => {
  describe('generateUUID', () => {
    it('should generate valid UUID v4 format', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('validateServiceTypes', () => {
    it('should validate correct service types', () => {
      const result = validateServiceTypes(['takeout', 'delivery', 'dine-in']);

      expect(result.valid).toBe(true);
      expect(result.invalidTypes).toHaveLength(0);
    });

    it('should detect invalid service types', () => {
      const result = validateServiceTypes(['takeout', 'invalid', 'dine-in']);

      expect(result.valid).toBe(false);
      expect(result.invalidTypes).toContain('invalid');
    });

    it('should validate at-home service type', () => {
      const result = validateServiceTypes(['at-home']);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateProfileId', () => {
    it('should validate correct profile ID format', () => {
      expect(validateProfileId('quick-lunch')).toBe(true);
      expect(validateProfileId('with-sarah')).toBe(true);
      expect(validateProfileId('date-night-2024')).toBe(true);
    });

    it('should reject uppercase letters', () => {
      expect(validateProfileId('Quick-Lunch')).toBe(false);
    });

    it('should reject special characters', () => {
      expect(validateProfileId('quick_lunch')).toBe(false);
      expect(validateProfileId('quick.lunch')).toBe(false);
      expect(validateProfileId('quick lunch')).toBe(false);
    });

    it('should accept numbers and hyphens', () => {
      expect(validateProfileId('profile-123')).toBe(true);
      expect(validateProfileId('123-profile')).toBe(true);
    });
  });

  describe('validateURL', () => {
    it('should validate correct URLs', async () => {
      const result = await validateURL('https://example.com/menu');

      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should validate HTTP URLs', async () => {
      const result = await validateURL('http://example.com');

      expect(result.valid).toBe(true);
    });

    it('should allow empty URLs', async () => {
      const result = await validateURL('');

      expect(result.valid).toBe(true);
    });

    it('should reject invalid URLs', async () => {
      const result = await validateURL('not-a-url');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateRestaurantData', () => {
    it('should validate complete restaurant data', () => {
      const restaurant = {
        name: 'Test Restaurant',
        foodTypes: ['Italian', 'Pizza'],
        serviceTypes: ['takeout', 'delivery'],
        profiles: ['quick-lunch']
      };

      const result = validateRestaurantData(restaurant);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require restaurant name', () => {
      const restaurant = {
        foodTypes: ['Italian'],
        serviceTypes: ['takeout']
      };

      const result = validateRestaurantData(restaurant);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Restaurant name is required');
    });

    it('should require at least one food type', () => {
      const restaurant = {
        name: 'Test Restaurant',
        foodTypes: [],
        serviceTypes: ['takeout']
      };

      const result = validateRestaurantData(restaurant);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('food type'))).toBe(true);
    });

    it('should require at least one service type', () => {
      const restaurant = {
        name: 'Test Restaurant',
        foodTypes: ['Italian'],
        serviceTypes: []
      };

      const result = validateRestaurantData(restaurant);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('service type'))).toBe(true);
    });

    it('should validate service types format', () => {
      const restaurant = {
        name: 'Test Restaurant',
        foodTypes: ['Italian'],
        serviceTypes: ['invalid-service']
      };

      const result = validateRestaurantData(restaurant);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid service types'))).toBe(true);
    });

    it('should validate profiles is an array', () => {
      const restaurant = {
        name: 'Test Restaurant',
        foodTypes: ['Italian'],
        serviceTypes: ['takeout'],
        profiles: 'not-an-array'
      };

      const result = validateRestaurantData(restaurant);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Profiles must be an array'))).toBe(true);
    });

    it('should validate dietary restrictions is an array', () => {
      const restaurant = {
        name: 'Test Restaurant',
        foodTypes: ['Italian'],
        serviceTypes: ['takeout'],
        dietaryRestrictions: 'not-an-array'
      };

      const result = validateRestaurantData(restaurant);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Dietary restrictions must be an array'))).toBe(
        true
      );
    });
  });
});
