import { describe, expect, it } from 'vitest';
import { resolveApiMode, resolveApiUrl } from './config';

describe('resolveApiMode', () => {
  it('accepts the two real modes in any environment', () => {
    for (const env of ['production', 'development', 'test', undefined]) {
      expect(resolveApiMode('live', env)).toBe('live');
      expect(resolveApiMode('mock', env)).toBe('mock');
    }
  });

  it('refuses to build for production without an explicit mode, rather than serving mock data', () => {
    expect(() => resolveApiMode(undefined, 'production')).toThrow(/not set/);
    expect(() => resolveApiMode('', 'production')).toThrow(/not set/);
  });

  it('keeps the convenient mock default for local development and tests', () => {
    expect(resolveApiMode(undefined, 'development')).toBe('mock');
    expect(resolveApiMode(undefined, 'test')).toBe('mock');
  });

  it('treats a typo as an error, not as mock', () => {
    expect(() => resolveApiMode('Live', 'production')).toThrow(/"mock" or "live"/);
    expect(() => resolveApiMode('prod', 'development')).toThrow(/"mock" or "live"/);
  });
});

describe('resolveApiUrl', () => {
  it('uses the configured URL', () => {
    expect(resolveApiUrl('https://api.example/api/v1', 'live', 'production')).toBe('https://api.example/api/v1');
  });

  it('refuses a live production build with no backend, rather than pointing every visitor at localhost', () => {
    expect(() => resolveApiUrl(undefined, 'live', 'production')).toThrow(/not set/);
  });

  it('still defaults to localhost for local development and for mock mode, which never calls it', () => {
    expect(resolveApiUrl(undefined, 'live', 'development')).toBe('http://localhost:4000/api/v1');
    expect(resolveApiUrl(undefined, 'mock', 'production')).toBe('http://localhost:4000/api/v1');
  });
});
