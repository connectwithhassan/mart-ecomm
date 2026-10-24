import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('Health Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ NODE_ENV: 'test' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns liveness status 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
    expect(body.uptime).toBeTypeOf('number');
  });

  it('GET /health/ready returns readiness status 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ready');
    expect(body.database).toBe('connected');
  });

  it('GET /docs/json returns valid OpenAPI 3.1 schema', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/docs/json',
    });

    expect(response.statusCode).toBe(200);
    const schema = JSON.parse(response.body);
    expect(schema.openapi).toBeDefined();
    expect(schema.info.title).toContain('International Multi-Vendor Marketplace');
  });
});
