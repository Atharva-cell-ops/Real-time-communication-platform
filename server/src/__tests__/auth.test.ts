import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { generateMeetingCode } from '../utils/meetingCode.js';

describe('Authentication & Cryptography Utilities', () => {
  it('should securely hash passwords and verify matching passwords', async () => {
    const rawPassword = 'SuperSecretPassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash).toMatch(/^\$2[aby]\$\d+\$/);

    const isMatch = await comparePassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should generate and verify valid JWT tokens', () => {
    const payload = {
      userId: 'user-uuid-1234',
      email: 'alex@connectx.io',
      name: 'Alex Rivera',
    };

    const token = generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.name).toBe(payload.name);
  });

  it('should generate standard 3-segment meeting codes (e.g. abc-defg-hij)', () => {
    const code = generateMeetingCode();
    expect(code).toMatch(/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
  });

  it('should generate unique meeting codes across invocations', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const code = generateMeetingCode();
      expect(set.has(code)).toBe(false);
      set.add(code);
    }
    expect(set.size).toBe(50);
  });
});
