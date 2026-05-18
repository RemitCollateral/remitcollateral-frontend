/**
 * Exponential backoff utility for RPC failures
 */

/** Configuration for retry behavior */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  delayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
}

/**
 * Waits for a specified duration
 * @param ms - Milliseconds to wait
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay cap
 */
function calculateDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add 0-30% jitter
  const delay = exponentialDelay + jitter;
  return Math.min(delay, maxDelayMs);
}

/**
 * Execute an async function with exponential backoff retry logic
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Result of the function
 * @throws Error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  const { maxRetries, delayMs, maxDelayMs = 30000 } = config;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      const delay = calculateDelay(attempt, delayMs, maxDelayMs);
      await sleep(delay);
    }
  }

  throw new Error(
    `Failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`
  );
}
