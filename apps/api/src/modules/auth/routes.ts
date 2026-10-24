import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema } from '@marketplace/validation-schemas';
import type { User, UserJWTPayload } from '@marketplace/shared-types';

// In-memory user store for initial baseline & test runs
const usersMemoryStore = new Map<string, User & { passwordHash: string }>();

// Preload admin user for testing
const defaultAdminPasswordHash = bcrypt.hashSync('AdminSecure2026!', 10);
usersMemoryStore.set('admin@marketplace.global', {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@marketplace.global',
  passwordHash: defaultAdminPasswordHash,
  fullName: 'Super Administrator',
  role: 'super_admin',
  status: 'active',
  preferredCurrency: 'USD',
  preferredLanguage: 'en',
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post('/register', async (request, reply) => {
    const parseResult = registerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          type: 'https://errors.marketplace.global/validation/invalid-payload',
          title: 'Validation Failed',
          status: 400,
          detail: 'One or more registration fields failed validation.',
          instance: request.url,
          invalidParams: parseResult.error.errors.map((e) => ({
            name: e.path.join('.'),
            reason: e.message,
          })),
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { email, password, fullName, role, preferredCurrency, preferredLanguage } = parseResult.data;

    if (usersMemoryStore.has(email.toLowerCase())) {
      return reply.status(409).send({
        success: false,
        error: {
          type: 'https://errors.marketplace.global/auth/email-conflict',
          title: 'User Conflict',
          status: 409,
          detail: `User with email '${email}' already exists.`,
          instance: request.url,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const newUser: User & { passwordHash: string } = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role,
      status: 'active',
      preferredCurrency,
      preferredLanguage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    usersMemoryStore.set(email.toLowerCase(), newUser);

    const tokenPayload: UserJWTPayload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      sellerId: newUser.role === 'seller' ? `seller_${newUser.id.substring(0, 8)}` : undefined,
    };

    const token = fastify.jwt.sign(tokenPayload);

    const { passwordHash: _, ...sanitizedUser } = newUser;

    return reply.status(201).send({
      success: true,
      data: {
        user: sanitizedUser,
        token,
      },
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: {
          type: 'https://errors.marketplace.global/validation/invalid-payload',
          title: 'Validation Failed',
          status: 400,
          detail: 'Email and password are required.',
          instance: request.url,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { email, password } = parseResult.data;
    const user = usersMemoryStore.get(email.toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.status(401).send({
        success: false,
        error: {
          type: 'https://errors.marketplace.global/auth/invalid-credentials',
          title: 'Authentication Failed',
          status: 401,
          detail: 'Invalid email or password provided.',
          instance: request.url,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const tokenPayload: UserJWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sellerId: user.role === 'seller' ? `seller_${user.id.substring(0, 8)}` : undefined,
    };

    const token = fastify.jwt.sign(tokenPayload);
    const { passwordHash: _, ...sanitizedUser } = user;

    return reply.status(200).send({
      success: true,
      data: {
        user: sanitizedUser,
        token,
      },
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Authenticated Profile
  fastify.get(
    '/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user;
      return reply.status(200).send({
        success: true,
        data: {
          user,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );
};
