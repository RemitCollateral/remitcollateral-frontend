import { describe, it, expect } from 'vitest';
import { XdrDecoder } from './XdrDecoder';
import type { RawEvent } from './types';

describe('XdrDecoder', () => {
  const decoder = new XdrDecoder();

  it('should create decoder instance', () => {
    expect(decoder).toBeInstanceOf(XdrDecoder);
  });

  it('should decode event with unknown topic on empty topics', () => {
    const rawEvent: RawEvent = {
      type: 'contract',
      contractId: 'C123',
      topics: [],
      value: 'AAAAAQ==', // Empty map XDR
      ledgerSequence: 100,
      txHash: 'abc123',
    };

    const decoded = decoder.decodeEvent(rawEvent);

    expect(decoded.topic).toBe('unknown');
    expect(decoded.contractId).toBe('C123');
    expect(decoded.ledgerSequence).toBe(100);
    expect(decoded.txHash).toBe('abc123');
  });

  it('should handle invalid XDR gracefully', () => {
    const rawEvent: RawEvent = {
      type: 'contract',
      contractId: 'C123',
      topics: ['invalid-xdr'],
      value: 'invalid-value',
      ledgerSequence: 100,
      txHash: 'abc123',
    };

    const decoded = decoder.decodeEvent(rawEvent);

    expect(decoded.topic).toBe('unknown');
    expect(decoded.data).toHaveProperty('raw');
    expect(decoded.data).toHaveProperty('error');
  });
});
