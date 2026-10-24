import { z } from 'zod';

const DEV_FALLBACK_JWT = 'super-secret-development-key-with-minimum-32-characters!';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    HOST: z.string().default('0.0.0.0'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').default(DEV_FALLBACK_JWT),
    DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/marketplace'),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    CORS_ORIGIN: z.string().default('*'),
    PAYMENT_ADAPTER: z.enum(['mock', 'stripe']).default('mock'),
    TAX_ADAPTER: z.enum(['mock', 'stripe_tax', 'avalara']).default('mock'),
    LOGISTICS_ADAPTER: z.enum(['mock', 'easypost']).default('mock'),
    PAYOUT_ADAPTER: z.enum(['mock', 'wise']).default('mock'),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production') {
        return data.JWT_SECRET !== DEV_FALLBACK_JWT;
      }
      return true;
    },
    {
      message: 'Production requires a secure, non-default JWT_SECRET. Dev fallback secret is strictly prohibited.',
      path: ['JWT_SECRET'],
    }
  )
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production') {
        return data.CORS_ORIGIN !== '*';
      }
      return true;
    },
    {
      message: 'Production requires an explicit CORS_ORIGIN allowlist (wildcard * is strictly prohibited in production).',
      path: ['CORS_ORIGIN'],
    }
  );

export type Env = z.infer<typeof envSchema>;

export function loadEnv(overrideEnv?: Record<string, string | undefined>): Env {
  const envToParse = overrideEnv || process.env;
  const result = envSchema.safeParse(envToParse);
  if (!result.success) {
    const formatted = result.error.format();
    console.error('❌ Security/Environment validation failed:', formatted);
    throw new Error(`Environment validation failed: ${JSON.stringify(formatted)}`);
  }
  return result.data;
}
