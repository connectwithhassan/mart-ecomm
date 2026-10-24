import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import type { UserRole, UserJWTPayload } from '@marketplace/shared-types';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorizeRoles: (roles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserJWTPayload;
    user: UserJWTPayload;
  }
}

export async function setupJwtPlugin(app: FastifyInstance, secret: string): Promise<void> {
  await app.register(fastifyJwt, {
    secret,
    sign: {
      expiresIn: '15m',
    },
  });

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (_err) {
      reply.status(401).send({
        success: false,
        error: {
          type: 'https://errors.marketplace.global/auth/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Valid authentication bearer token is required.',
          instance: request.url,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  app.decorate('authorizeRoles', (roles: UserRole[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;
      if (!user || !roles.includes(user.role)) {
        reply.status(403).send({
          success: false,
          error: {
            type: 'https://errors.marketplace.global/auth/forbidden',
            title: 'Forbidden',
            status: 403,
            detail: `Role '${user?.role || 'anonymous'}' lacks required permissions for this action.`,
            instance: request.url,
          },
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
          },
        });
      }
    };
  });
}
