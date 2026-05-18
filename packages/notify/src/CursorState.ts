/**
 * Cursor state management for event pagination
 */
import type { CursorState as CursorStateType } from './types';

/**
 * Manages cursor state for tracking the last seen ledger sequence
 * in Soroban event polling
 */
export class CursorState {
  private state: CursorStateType;

  /**
   * Creates a new CursorState instance
   * @param initialLedger - Starting ledger sequence (defaults to 0)
   */
  constructor(initialLedger: number = 0) {
    this.state = {
      lastLedgerSequence: initialLedger,
      cursor: undefined,
    };
  }

  /**
   * Updates the cursor with new ledger information
   * @param ledgerSequence - Latest ledger sequence seen
   * @param cursor - Optional cursor string from RPC response
   */
  update(ledgerSequence: number, cursor?: string): void {
    if (ledgerSequence > this.state.lastLedgerSequence) {
      this.state.lastLedgerSequence = ledgerSequence;
      this.state.cursor = cursor;
    }
  }

  /**
   * Gets the current cursor value for RPC requests
   * @returns Cursor string or undefined
   */
  getCursor(): string | undefined {
    return this.state.cursor;
  }

  /**
   * Gets the last seen ledger sequence
   * @returns Ledger sequence number
   */
  getLastLedgerSequence(): number {
    return this.state.lastLedgerSequence;
  }

  /**
   * Resets the cursor state
   * @param ledgerSequence - Optional ledger to reset to (defaults to 0)
   */
  reset(ledgerSequence: number = 0): void {
    this.state = {
      lastLedgerSequence: ledgerSequence,
      cursor: undefined,
    };
  }
}
