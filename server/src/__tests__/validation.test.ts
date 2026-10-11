import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';
import { createMeetingSchema } from '../validations/meeting.validation.js';

describe('Zod Input Validation Schemas', () => {
  describe('Register Schema', () => {
    it('should validate correct user registration payload', () => {
      const valid = {
        name: 'Alex Rivera',
        email: 'alex@connectx.io',
        password: 'Password123!',
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email and short passwords', () => {
      const invalid = {
        name: 'A',
        email: 'not-an-email',
        password: '123',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('Login Schema', () => {
    it('should validate login credentials', () => {
      const valid = {
        email: 'alex@connectx.io',
        password: 'Password123!',
      };
      const result = loginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('Create Meeting Schema', () => {
    it('should validate meeting title and options', () => {
      const valid = {
        title: 'Sprint Planning',
        description: 'Reviewing backlog and assigning sprint cards',
        passcode: 'SecretPass123',
        isLocked: false,
      };
      const result = createMeetingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty meeting title', () => {
      const invalid = {
        title: ' ',
      };
      const result = createMeetingSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
