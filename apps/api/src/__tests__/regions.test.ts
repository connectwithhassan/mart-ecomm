import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('Regions & Exchange Rates Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ NODE_ENV: 'test' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/regions returns active regions list', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/regions',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some((r: any) => r.code === 'US')).toBe(true);
    expect(body.data.some((r: any) => r.code === 'EU')).toBe(true);
  });

  it('GET /api/v1/regions/exchange-rates returns FX rates with 1.5% buffer', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/regions/exchange-rates',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.baseCurrency).toBe('USD');
    expect(body.data.bufferPercentage).toBe(1.5);
    expect(body.data.rates.EUR).toBeDefined();
    expect(body.data.rates.EUR.effectiveRate).toBeGreaterThan(body.data.rates.EUR.marketRate);
  });
});
