import { describe, it, expect, vi } from 'vitest';
import { withRetry, type RetryConfig } from './retry';

describe('withRetry', () => {
  const defaultConfig: RetryConfig = {
    maxRetries: 3,
    delayMs: 10,
    maxDelayMs: 100,
  };

  it('should return result on successful execution', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withRetry(fn, defaultConfig);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, defaultConfig);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after exhausting retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent failure'));

    await expect(withRetry(fn, defaultConfig)).rejects.toThrow(
      'Failed after 4 attempts'
    );
    expect(fn).toHaveBeenCalledTimes(4); // initial + 3 retries
  });

  it('should handle non-Error exceptions', async () => {
    const fn = vi.fn().mockRejectedValue('string error');

    await expect(withRetry(fn, { ...defaultConfig, maxRetries: 0 })).rejects.toThrow(
      'Last error: string error'
    );
  });
});
