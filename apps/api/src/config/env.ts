import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').default('super-secret-development-key-with-minimum-32-characters!'),
  DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/marketplace'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CORS_ORIGIN: z.string().default('*'),
  PAYMENT_ADAPTER: z.enum(['mock', 'stripe']).default('mock'),
  TAX_ADAPTER: z.enum(['mock', 'stripe_tax', 'avalara']).default('mock'),
  LOGISTICS_ADAPTER: z.enum(['mock', 'easypost']).default('mock'),
  PAYOUT_ADAPTER: z.enum(['mock', 'wise']).default('mock'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:', result.error.format());
    throw new Error('Environment variable validation failed');
  }
  return result.data;
}
