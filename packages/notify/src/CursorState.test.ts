import { describe, it, expect } from 'vitest';
import { CursorState } from './CursorState';

describe('CursorState', () => {
  it('should initialize with default ledger 0', () => {
    const cursor = new CursorState();

    expect(cursor.getLastLedgerSequence()).toBe(0);
    expect(cursor.getCursor()).toBeUndefined();
  });

  it('should initialize with custom ledger', () => {
    const cursor = new CursorState(1000);

    expect(cursor.getLastLedgerSequence()).toBe(1000);
  });

  it('should update cursor and ledger sequence', () => {
    const cursor = new CursorState();

    cursor.update(100, 'cursor-100');

    expect(cursor.getLastLedgerSequence()).toBe(100);
    expect(cursor.getCursor()).toBe('cursor-100');
  });

  it('should not update to older ledger', () => {
    const cursor = new CursorState(200);

    update.update(100, 'cursor-100');

    expect(cursor.getLastLedgerSequence()).toBe(200);
    expect(cursor.getCursor()).toBeUndefined();
  });

  it('should reset to default', () => {
    const cursor = new CursorState(500);
    cursor.update(600, 'cursor-600');

    cursor.reset();

    expect(cursor.getLastLedgerSequence()).toBe(0);
    expect(cursor.getCursor()).toBeUndefined();
  });

  it('should reset to specific ledger', () => {
    const cursor = new CursorState(500);
    cursor.update(600, 'cursor-600');

    cursor.reset(1000);

    expect(cursor.getLastLedgerSequence()).toBe(1000);
    expect(cursor.getCursor()).toBeUndefined();
  });
});
