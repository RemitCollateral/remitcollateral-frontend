/**
 * Event poller for Soroban RPC getEvents endpoint
 */
import { SorobanRpc } from '@stellar/stellar-sdk';
import { CursorState } from './CursorState';
import { XdrDecoder } from './XdrDecoder';
import { withRetry } from './retry';
import type {
  StellarNotifyConfig,
  DecodedEvent,
  RawEvent,
} from './types';

/**
 * Callback for new events
 */
export type EventHandler = (events: DecodedEvent[]) => void;

/**
 * Polls the Soroban RPC getEvents endpoint
 */
export class EventPoller {
  private server: SorobanRpc.Server;
  private cursorState: CursorState;
  private xdrDecoder: XdrDecoder;
  private config: Required<StellarNotifyConfig>;
  private eventHandler: EventHandler;
  private pollTimer: ReturnType<typeof setTimeout> | null;
  private isRunning: boolean;

  /**
   * Creates a new EventPoller instance
   * @param config - StellarNotify configuration
   * @param eventHandler - Callback for new events
   */
  constructor(config: Required<StellarNotifyConfig>, eventHandler: EventHandler) {
    this.server = new SorobanRpc.Server(config.rpcUrl);
    this.cursorState = new CursorState();
    this.xdrDecoder = new XdrDecoder();
    this.config = config;
    this.eventHandler = eventHandler;
    this.pollTimer = null;
    this.isRunning = false;
  }

  /**
   * Starts polling for events
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.schedulePoll();
  }

  /**
   * Stops polling for events
   */
  stop(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Checks if poller is running
   * @returns True if polling
   */
  isPolling(): boolean {
    return this.isRunning;
  }

  /**
   * Gets the current cursor state
   * @returns Cursor state
   */
  getCursorState(): CursorState {
    return this.cursorState;
  }

  /**
   * Schedules the next poll
   */
  private schedulePoll(): void {
    if (!this.isRunning) return;

    this.pollTimer = setTimeout(() => {
      void this.poll();
    }, this.config.pollInterval);
  }

  /**
   * Executes a single poll for events
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const events = await withRetry(
        () => this.fetchEvents(),
        {
          maxRetries: this.config.maxRetries,
          delayMs: this.config.retryDelayMs,
        }
      );

      if (events.length > 0) {
        this.eventHandler(events);
      }
    } catch (error) {
      // Error already logged by retry utility
      // Continue polling despite errors
    } finally {
      this.schedulePoll();
    }
  }

  /**
   * Fetches events from the RPC server
   * @returns Array of decoded events
   */
  private async fetchEvents(): Promise<DecodedEvent[]> {
    const cursor = this.cursorState.getCursor();
    const startLedger = cursor ? undefined : this.cursorState.getLastLedgerSequence() || 1;

    // Build filter for all contracts we care about
    // Using a simple filter - in production you might want more specific filters
    const request: SorobanRpc.GetEventsRequest = {
      startLedger,
      filters: [
        {
          type: 'contract',
        },
      ],
      cursor,
    };

    const response = await this.server.getEvents(request);

    // Update cursor state
    if (response.latestLedger > 0) {
      this.cursorState.update(response.latestLedger, response.cursor);
    }

    // Decode events
    const rawEvents = this.normalizeEvents(response.events);
    return rawEvents.map((raw) => this.xdrDecoder.decodeEvent(raw));
  }

  /**
   * Normalizes events from RPC response
   * @param events - Events from RPC
   * @returns Normalized raw events
   */
  private normalizeEvents(
    events: SorobanRpc.EventResponse[] | undefined
  ): RawEvent[] {
    if (!events || events.length === 0) return [];

    return events.map((event) => ({
      type: 'contract',
      contractId: event.contractId?.toString() ?? '',
      topics: event.topic ?? [],
      value: event.value ?? '',
      ledgerSequence: event.ledgerSequence ?? 0,
      txHash: event.txHash?.toString('hex') ?? '',
    }));
  }
}
