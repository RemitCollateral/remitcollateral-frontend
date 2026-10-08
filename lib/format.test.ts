import { describe, it, expect } from 'vitest';
import {
  formatUsd,
  formatLocal,
  formatRatio,
  formatScore,
  truncateWallet,
} from './format';

describe('Formatters', () => {
  describe('formatUsd', () => {
    it('formats numeric amounts to USD currency string', () => {
      expect(formatUsd(1234.5)).toContain('1,234.50');
      expect(formatUsd(0)).toContain('0.00');
    });
  });

  describe('formatRatio', () => {
    it('formats ratios as percentages with single decimal precision', () => {
      expect(formatRatio(1.35)).toBe('135%');
      expect(formatRatio(0.055)).toBe('5.5%');
    });
  });

  describe('formatScore', () => {
    it('scales 0-1 score to 0-100 integer string', () => {
      expect(formatScore(0.85)).toBe('85');
      expect(formatScore(1)).toBe('100');
      expect(formatScore(0)).toBe('0');
    });
  });

  describe('truncateWallet', () => {
    it('truncates long Stellar public key addresses', () => {
      const address = 'GBXK7ZCMLQ4XR2PDTV3M6HSNAWQ2VJLKZ5YQF7TG3WNXHRBUE4C2MOCK';
      const truncated = truncateWallet(address, 6, 4);
      expect(truncated).toBe('GBXK7Z…MOCK');
    });

    it('returns short addresses untruncated', () => {
      expect(truncateWallet('GBXK', 6, 4)).toBe('GBXK');
    });
  });
});
