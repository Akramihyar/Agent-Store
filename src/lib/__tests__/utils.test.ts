import { describe, it, expect } from 'vitest';
import { cn, validateUrl, formatTimestamp, generateJobId } from '../utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('combines class names correctly', () => {
      expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
      expect(cn('btn', false && 'hidden', 'active')).toBe('btn active');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500'); // tailwind-merge should keep last
    });

    it('handles empty and undefined values', () => {
      expect(cn()).toBe('');
      expect(cn('', 'btn')).toBe('btn');
      expect(cn(undefined, 'btn')).toBe('btn');
    });
  });

  describe('validateUrl', () => {
    it('validates correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://test.com')).toBe(true);
      expect(validateUrl('https://subdomain.example.com/path?query=1')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('javascript:alert(1)')).toBe(false);
      expect(validateUrl('example.com')).toBe(false); // missing protocol
    });
  });

  describe('formatTimestamp', () => {
    it('formats timestamps correctly', () => {
      const timestamp = '2025-09-15T12:30:45.000Z';
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/\d{2}:\d{2}/); // Should match HH:MM format
    });

    it('handles invalid timestamps', () => {
      expect(formatTimestamp('invalid-date')).toBe('Invalid date');
      expect(formatTimestamp('')).toBe('Invalid date');
      expect(formatTimestamp('not-a-timestamp')).toBe('Invalid date');
    });

    it('formats different timezones consistently', () => {
      const timestamp = '2025-09-15T00:00:00.000Z';
      const result = formatTimestamp(timestamp);
      expect(typeof result).toBe('string');
      expect(result).not.toBe('Invalid date');
    });
  });

  describe('generateJobId', () => {
    it('generates unique job IDs', () => {
      const id1 = generateJobId();
      const id2 = generateJobId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^job_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^job_\d+_[a-z0-9]+$/);
    });

    it('includes timestamp in job ID', () => {
      const before = Date.now();
      const jobId = generateJobId();
      const after = Date.now();

      const timestampPart = jobId.split('_')[1];
      const timestamp = parseInt(timestampPart);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('generates IDs with correct format', () => {
      const jobId = generateJobId();
      const parts = jobId.split('_');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('job');
      expect(parts[1]).toMatch(/^\d+$/); // timestamp
      expect(parts[2]).toMatch(/^[a-z0-9]+$/); // random string
    });
  });
});