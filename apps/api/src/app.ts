import Fastify, { FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import crypto from 'node:crypto';
import { setupErrorHandler } from './plugins/errorHandler.js';
import { setupJwtPlugin } from './plugins/jwt.js';
import { setupSwaggerPlugin } from './plugins/swagger.js';
import { setupRedisPlugin } from './plugins/redis.js';
import { healthRoutes } from './modules/health/routes.js';
import { authRoutes } from './modules/auth/routes.js';
import { regionsRoutes } from './modules/regions/routes.js';
import type { Env } from './config/env.js';

export async function buildApp(env: Partial<Env> = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : { level: 'info' },
    trustProxy: true,
    genReqId: () => crypto.randomUUID(),
    requestIdHeader: 'x-request-id',
  });

  // Global plugins
  await app.register(sensible);

  const corsOrigin = env.CORS_ORIGIN || '*';
  const origins =
    corsOrigin === '*'
      ? true
      : corsOrigin.includes(',')
        ? corsOrigin.split(',').map((o) => o.trim())
        : corsOrigin;

  await app.register(cors, {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // JWT & RBAC
  const jwtSecret = env.JWT_SECRET || 'super-secret-development-key-with-minimum-32-characters!';
  await setupJwtPlugin(app, jwtSecret);

  // OpenAPI Swagger Docs
  await setupSwaggerPlugin(app);

  // Error Handler
  setupErrorHandler(app);

  // Redis Cache & Locks
  const redisUrl = env.REDIS_URL || 'mock://';
  await setupRedisPlugin(app, redisUrl);

  // Module Routes
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(regionsRoutes, { prefix: '/api/v1/regions' });

  return app;
}
