import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('Auth & RBAC Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ NODE_ENV: 'test' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/register registers new user and issues JWT', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'seller.tokyo@marketplace.global',
        password: 'SecurePassword2026!',
        fullName: 'Tokyo Audio Vendor',
        role: 'seller',
        preferredCurrency: 'USD',
        preferredLanguage: 'en',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('seller.tokyo@marketplace.global');
    expect(body.data.user.role).toBe('seller');
    expect(body.data.user.passwordHash).toBeUndefined(); // Never expose hash!
    expect(body.data.token).toBeTypeOf('string');
  });

  it('POST /api/v1/auth/register rejects duplicate email with 409 Conflict', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'seller.tokyo@marketplace.global',
        password: 'AnotherPassword2026!',
        fullName: 'Duplicate Vendor',
        role: 'seller',
      },
    });

    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.status).toBe(409);
  });

  it('POST /api/v1/auth/register rejects invalid email with 400 and RFC 7807 details', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'not-an-email',
        password: 'short',
        fullName: 'A',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.invalidParams).toBeDefined();
    expect(body.error.invalidParams.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/auth/login logs in valid user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'seller.tokyo@marketplace.global',
        password: 'SecurePassword2026!',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTypeOf('string');
  });

  it('POST /api/v1/auth/login rejects wrong password with 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'seller.tokyo@marketplace.global',
        password: 'WrongPassword!',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('GET /api/v1/auth/me rejects request without Bearer token with 401', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    });

    expect(response.statusCode).toBe(401);
  });

  it('GET /api/v1/auth/me returns authenticated user with valid token', async () => {
    // Login to get token
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'admin@marketplace.global',
        password: 'AdminSecure2026!',
      },
    });
    const { token } = JSON.parse(loginRes.body).data;

    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(meRes.statusCode).toBe(200);
    const body = JSON.parse(meRes.body);
    expect(body.data.user.email).toBe('admin@marketplace.global');
    expect(body.data.user.role).toBe('super_admin');
  });
});
