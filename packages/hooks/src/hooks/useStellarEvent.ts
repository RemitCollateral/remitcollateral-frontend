/**
 * Hook for real-time Soroban contract events
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { StellarNotify, type DecodedEvent } from '@astronlabs/notify';
import { useStellarContext } from '../context/StellarProvider';
import type { StellarEventResult, EventCallback } from '../types';

/**
 * Hook for listening to Soroban contract events in real-time
 *
 * @example
 * ```tsx
 * const { event, isListening, error } = useStellarEvent(contractId, 'transfer');
 *
 * useEffect(() => {
 *   if (event) {
 *     console.log('Transfer:', event.data);
 *   }
 * }, [event]);
 * ```
 */
export function useStellarEvent(
  contractId: string,
  topic: string
): StellarEventResult {
  const { config } = useStellarContext();
  const notifyRef = useRef<StellarNotify | null>(null);
  const [event, setEvent] = useState<DecodedEvent | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Event handler callback
   */
  const handleEvent: EventCallback = useCallback((decodedEvent) => {
    setEvent(decodedEvent);
  }, []);

  useEffect(() => {
    if (!contractId || !topic) {
      return;
    }

    setError(null);
    setIsListening(true);

    try {
      // Create notify instance if needed
      if (!notifyRef.current) {
        notifyRef.current = new StellarNotify({
          rpcUrl: config.rpcUrl,
          network: config.network,
        });
      }

      // Subscribe to events
      const unsubscribe = notifyRef.current.onEvent(
        contractId,
        topic,
        handleEvent
      );

      return () => {
        unsubscribe();
        setIsListening(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to listen to events'));
      setIsListening(false);
      return undefined;
    }
  }, [contractId, topic, config.rpcUrl, config.network, handleEvent]);

  return {
    event,
    isListening,
    error,
  };
}
