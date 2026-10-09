import { describe, it, expect } from 'vitest';
import {
  ltvForScore,
  compositeScore,
  buildSchedule,
  releasedRatio,
  round2,
} from './protocol';
import { PROTOCOL } from '@/lib/config';

describe('Protocol Math', () => {
  describe('ltvForScore', () => {
    it('returns baseLtv (1.5) for a reputation score of 0', () => {
      expect(ltvForScore(0)).toBe(PROTOCOL.baseLtv);
    });

    it('returns minLtv (1.1) for a perfect score of 1.0', () => {
      expect(ltvForScore(1.0)).toBe(PROTOCOL.minLtv);
    });

    it('clamps negative scores to baseLtv', () => {
      expect(ltvForScore(-0.5)).toBe(PROTOCOL.baseLtv);
    });

    it('clamps scores above 1.0 to minLtv', () => {
      expect(ltvForScore(1.5)).toBe(PROTOCOL.minLtv);
    });

    it('calculates mid-point score proportionally', () => {
      // 1.5 - (0.5 * (1.5 - 1.1)) = 1.5 - 0.2 = 1.3
      expect(ltvForScore(0.5)).toBe(1.3);
    });
  });

  describe('compositeScore', () => {
    it('ignores remittance score if observed history is below minimum months', () => {
      const score = compositeScore({
        remittance_score: 1.0,
        repayment_score: 1.0,
        remittance_months_observed: PROTOCOL.minRemittanceMonths - 1,
      });
      // only repayment counts: 1.0 * 0.6 = 0.6
      expect(score).toBe(0.6);
    });

    it('weights remittance 40% and repayment 60% when minimum history is met', () => {
      const score = compositeScore({
        remittance_score: 1.0,
        repayment_score: 1.0,
        remittance_months_observed: PROTOCOL.minRemittanceMonths,
      });
      expect(score).toBe(1.0);
    });
  });

  describe('buildSchedule', () => {
    it('builds installments totaling principal', () => {
      const installments = buildSchedule(1200, 4, 30, new Date('2026-01-01'));
      expect(installments).toHaveLength(4);
      expect(installments[0].installment).toBe(1);
      expect(installments[3].installment).toBe(4);
      const sum = installments.reduce((acc, curr) => acc + curr.amount_local, 0);
      expect(sum).toBe(1200);
    });
  });

  describe('round2', () => {
    it('rounds to two decimal places', () => {
      expect(round2(1.2345)).toBe(1.23);
      expect(round2(1.2367)).toBe(1.24);
    });
  });
});
