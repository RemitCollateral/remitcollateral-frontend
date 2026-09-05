'use client';

/**
 * Holds the wallet-authenticated guarantor session for the whole app.
 *
 * Connecting runs the full challenge-response the backend expects:
 * request a challenge, sign it with Freighter, exchange it for a token.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearSession, getSessionToken, getStoredGuarantor, saveSession } from '@/lib/session';
import { connectWallet, signChallenge } from '@/lib/stellar/freighter';
import type { Guarantor } from '@/lib/types';

type SessionStatus = 'loading' | 'connected' | 'disconnected';

interface SessionValue {
  status: SessionStatus;
  guarantor: Guarantor | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [guarantor, setGuarantor] = useState<Guarantor | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore an existing session on first paint; localStorage is client-only.
  useEffect(() => {
    const token = getSessionToken();
    const stored = getStoredGuarantor();
    if (token && stored) {
      setGuarantor(stored);
      setStatus('connected');
    } else {
      setStatus('disconnected');
    }
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const address = await connectWallet();
      const challenge = await api.getChallenge(address);
      const signature = await signChallenge(challenge.challenge, address);
      const session = await api.verifyChallenge(address, signature);

      saveSession(session.token, session.guarantor);
      setGuarantor(session.guarantor);
      setStatus('connected');
      router.push('/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not connect wallet.');
    } finally {
      setConnecting(false);
    }
  }, [router]);

  const disconnect = useCallback(() => {
    clearSession();
    setGuarantor(null);
    setStatus('disconnected');
    router.push('/');
  }, [router]);

  const value = useMemo(
    () => ({ status, guarantor, connecting, error, connect, disconnect }),
    [status, guarantor, connecting, error, connect, disconnect],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
