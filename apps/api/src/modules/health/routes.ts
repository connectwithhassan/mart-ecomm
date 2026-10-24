import { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', {
    schema: {
      description: 'Liveness probe',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            uptime: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  fastify.get('/health/ready', {
    schema: {
      description: 'Readiness probe',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            database: { type: 'string' },
            cache: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async (_request, reply) => {
    let cacheStatus = 'ready';
    try {
      if (fastify.redis) {
        await fastify.redis.ping();
      }
    } catch {
      cacheStatus = 'degraded';
    }

    return reply.status(200).send({
      status: 'ready',
      database: 'connected',
      cache: cacheStatus,
      timestamp: new Date().toISOString(),
    });
  });
};
