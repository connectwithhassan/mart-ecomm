import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('Redis Cache & Lock Plugin', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ NODE_ENV: 'test', REDIS_URL: 'mock://' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('stores and retrieves key from Redis', async () => {
    await app.redis.set('test:key:1', 'lock_acquired_123');
    const value = await app.redis.get('test:key:1');
    expect(value).toBe('lock_acquired_123');
  });

  it('deletes key from Redis', async () => {
    await app.redis.set('test:key:2', 'temp_val');
    await app.redis.del('test:key:2');
    const value = await app.redis.get('test:key:2');
    expect(value).toBeNull();
  });

  it('pings Redis successfully', async () => {
    const pong = await app.redis.ping();
    expect(pong).toBe('PONG');
  });
});
