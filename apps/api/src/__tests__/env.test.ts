import { describe, it, expect } from 'vitest';
import { loadEnv } from '../config/env.js';

describe('Environment & Security Validation', () => {
  it('loads valid development configuration with defaults', () => {
    const env = loadEnv({ NODE_ENV: 'development' });
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(4000);
    expect(env.CORS_ORIGIN).toBe('*');
  });

  it('fails startup in production if JWT_SECRET is the dev fallback', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        CORS_ORIGIN: 'https://storefront.marketplace.global',
      })
    ).toThrow(/Production requires a secure, non-default JWT_SECRET/);
  });

  it('fails startup in production if CORS_ORIGIN is wildcard *', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-very-long-production-jwt-secret-string-32-chars-min',
        CORS_ORIGIN: '*',
      })
    ).toThrow(/wildcard \* is strictly prohibited in production/);
  });

  it('succeeds in production when non-default JWT_SECRET and explicit CORS allowlist are provided', () => {
    const env = loadEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'production-super-secure-key-with-over-32-characters-entropy!',
      CORS_ORIGIN: 'https://marketplace.global,https://seller.marketplace.global',
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.CORS_ORIGIN).toBe('https://marketplace.global,https://seller.marketplace.global');
  });
});
