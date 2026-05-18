/**
 * XDR decoding utility for Soroban events
 */
import { xdr } from '@stellar/stellar-sdk';
import type { DecodedEvent, RawEvent } from './types';

/**
 * Decodes raw XDR event data into plain JavaScript objects
 */
export class XdrDecoder {
  /**
   * Decodes a raw Soroban event into a typed DecodedEvent
   * @param rawEvent - Raw event from RPC
   * @returns Decoded event with parsed data
   */
  decodeEvent(rawEvent: RawEvent): DecodedEvent {
    const topic = this.decodeTopics(rawEvent.topics);
    const data = this.decodeValue(rawEvent.value);

    return {
      contractId: rawEvent.contractId,
      topic,
      data,
      ledgerSequence: rawEvent.ledgerSequence,
      txHash: rawEvent.txHash,
    };
  }

  /**
   * Decodes event topics to extract the event name
   * @param topics - Array of XDR-encoded topic strings
   * @returns Decoded topic name
   */
  private decodeTopics(topics: string[]): string {
    if (topics.length === 0) {
      return 'unknown';
    }

    try {
      // First topic is typically the event identifier/name
      const topicXdr = Buffer.from(topics[0], 'base64');
      const scVal = xdr.ScVal.fromXDR(topicXdr);
      return this.scValToString(scVal);
    } catch {
      return 'unknown';
    }
  }

  /**
   * Decodes an XDR value string into a JavaScript object
   * @param value - Base64-encoded XDR value
   * @returns Decoded JavaScript object
   */
  private decodeValue(value: string): Record<string, unknown> {
    try {
      const valueXdr = Buffer.from(value, 'base64');
      const scVal = xdr.ScVal.fromXDR(valueXdr);
      const result = this.scValToObject(scVal);
      return typeof result === 'object' && result !== null
        ? (result as Record<string, unknown>)
        : { value: result };
    } catch (error) {
      return { raw: value, error: error instanceof Error ? error.message : 'Decode failed' };
    }
  }

  /**
   * Converts an ScVal to a JavaScript object
   * @param scVal - Stellar XDR ScVal
   * @returns JavaScript representation
   */
  private scValToObject(scVal: xdr.ScVal): Record<string, unknown> | unknown {
    const valType = scVal.switch();
    switch (true) {
      case valType.value === xdr.ScValType.scvBool().value:
        return scVal.b();

      case valType.value === xdr.ScValType.scvU32().value:
      case valType.value === xdr.ScValType.scvI32().value:
        return scVal.u32() ?? scVal.i32();

      case valType.value === xdr.ScValType.scvU64().value:
      case valType.value === xdr.ScValType.scvI64().value:
      case valType.value === xdr.ScValType.scvU128().value:
      case valType.value === xdr.ScValType.scvI128().value:
      case valType.value === xdr.ScValType.scvU256().value:
      case valType.value === xdr.ScValType.scvI256().value:
        return this.decodeInt(scVal);

      case valType.value === xdr.ScValType.scvBytes().value:
        return scVal.bytes()?.toString('base64') ?? '';

      case valType.value === xdr.ScValType.scvString().value:
        return scVal.str()?.toString() ?? '';

      case valType.value === xdr.ScValType.scvSymbol().value:
        return scVal.sym()?.toString() ?? '';

      case valType.value === xdr.ScValType.scvVec().value:
        return this.decodeVec(scVal);

      case valType.value === xdr.ScValType.scvMap().value:
        return this.decodeMap(scVal);

      case valType.value === xdr.ScValType.scvAddress().value:
        return this.decodeAddress(scVal);

      case valType.value === xdr.ScValType.scvContractInstance().value:
      case valType.value === xdr.ScValType.scvLedgerKeyContractInstance().value:
        return { type: 'contract_instance' };

      case valType.value === xdr.ScValType.scvTimepoint().value:
        return scVal.timepoint();

      case valType.value === xdr.ScValType.scvDuration().value:
        return scVal.duration();

      default:
        return { type: 'unknown', switch: scVal.switch().value };
    }
  }

  /**
   * Converts an ScVal to a string representation
   * @param scVal - Stellar XDR ScVal
   * @returns String representation
   */
  private scValToString(scVal: xdr.ScVal): string {
    const obj = this.scValToObject(scVal);
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number' || typeof obj === 'bigint') return String(obj);
    if (typeof obj === 'boolean') return String(obj);
    return JSON.stringify(obj);
  }

  /**
   * Decodes integer types to BigInt or number
   * @param scVal - Stellar XDR ScVal containing an integer
   * @returns BigInt or number
   */
  private decodeInt(scVal: xdr.ScVal): bigint | number {
    const switchVal = scVal.switch() as any;

    try {
      if (switchVal.value === xdr.ScValType.scvU64().value) {
        const u64 = scVal.u64();
        return u64 ? BigInt(u64.toString()) : BigInt(0);
      }
      if (switchVal.value === xdr.ScValType.scvI64().value) {
        const i64 = scVal.i64();
        return i64 ? BigInt(i64.toString()) : BigInt(0);
      }
      if (switchVal.value === xdr.ScValType.scvU128().value) {
        const u128 = scVal.u128();
        return u128 ? BigInt(u128.toString()) : BigInt(0);
      }
      if (switchVal.value === xdr.ScValType.scvI128().value) {
        const i128 = scVal.i128();
        return i128 ? BigInt(i128.toString()) : BigInt(0);
      }
      if (switchVal.value === xdr.ScValType.scvU256().value) {
        const u256 = scVal.u256();
        return u256 ? BigInt(u256.toString()) : BigInt(0);
      }
      if (switchVal.value === xdr.ScValType.scvI256().value) {
        const i256 = scVal.i256();
        return i256 ? BigInt(i256.toString()) : BigInt(0);
      }
    } catch {
      return 0;
    }

    return 0;
  }

  /**
   * Decodes a vector ScVal
   * @param scVal - Stellar XDR ScVal containing a vector
   * @returns Array of decoded values
   */
  private decodeVec(scVal: xdr.ScVal): unknown[] {
    const vec = scVal.vec();
    if (!vec) return [];
    return vec.map((item: xdr.ScVal) => this.scValToObject(item));
  }

  /**
   * Decodes a map ScVal
   * @param scVal - Stellar XDR ScVal containing a map
   * @returns Decoded object
   */
  private decodeMap(scVal: xdr.ScVal): Record<string, unknown> {
    const map = scVal.map();
    if (!map) return {};

    const result: Record<string, unknown> = {};
    for (const entry of map) {
      const key = this.scValToObject(entry.key());
      const value = this.scValToObject(entry.val());
      const keyStr = typeof key === 'string' ? key : String(key);
      result[keyStr] = value;
    }
    return result;
  }

  /**
   * Decodes an address ScVal
   * @param scVal - Stellar XDR ScVal containing an address
   * @returns Decoded address string
   */
  private decodeAddress(scVal: xdr.ScVal): string {
    const address = scVal.address();
    if (!address) return '';

    const accountId = address.accountId();
    if (accountId) {
      return accountId.toString();
    }

    const contractId = address.contractId();
    if (contractId) {
      return contractId.toString('hex');
    }

    return '';
  }
}
