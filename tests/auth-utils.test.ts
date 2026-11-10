import { describe, it, expect } from 'vitest';
import {
  normalizeUsername,
  validateUsername,
  createPseudoEmail,
  validatePassword,
} from '@/lib/auth/auth-utils';

describe('auth-utils', () => {
  describe('normalizeUsername', () => {
    it('lowercases and trims username', () => {
      expect(normalizeUsername('  JohnDoe  ')).toBe('johndoe');
    });
  });

  describe('validateUsername', () => {
    it('accepts valid alphanumeric usernames with underscores', () => {
      expect(validateUsername('john_doe123')).toBeNull();
      expect(validateUsername('alex')).toBeNull();
    });

    it('rejects usernames under 3 characters', () => {
      expect(validateUsername('ab')).toBe('Username must be at least 3 characters long');
    });

    it('rejects special characters other than underscore', () => {
      expect(validateUsername('john@doe')).toBe(
        'Username can only contain letters, numbers, and underscores'
      );
      expect(validateUsername('user-name')).toBe(
        'Username can only contain letters, numbers, and underscores'
      );
    });
  });

  describe('createPseudoEmail', () => {
    it('constructs consistent pseudo email domain', () => {
      expect(createPseudoEmail('Athlete1')).toBe('athlete1@wrkout.app');
    });
  });

  describe('validatePassword', () => {
    it('accepts compliant passwords', () => {
      expect(validatePassword('StrongP@ss1')).toBeNull();
    });

    it('enforces 8 character length minimum', () => {
      expect(validatePassword('Abc1!')).toBe('Password must be at least 8 characters long');
    });

    it('enforces uppercase, lowercase, and numbers', () => {
      expect(validatePassword('lowercase123')).toBe(
        'Password must contain at least one uppercase letter'
      );
      expect(validatePassword('UPPERCASE123')).toBe(
        'Password must contain at least one lowercase letter'
      );
      expect(validatePassword('NoNumbersHere')).toBe('Password must contain at least one number');
    });
  });
});
