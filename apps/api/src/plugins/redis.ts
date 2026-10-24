import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis | InMemoryRedisMock;
  }
}

export class InMemoryRedisMock {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ...args: (string | number)[]): Promise<'OK'> {
    let ttlMs: number | undefined;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === 'EX' && typeof args[i + 1] === 'number') {
        ttlMs = (args[i + 1] as number) * 1000;
      } else if (args[i] === 'PX' && typeof args[i + 1] === 'number') {
        ttlMs = args[i + 1] as number;
      }
    }
    this.store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }
}

export async function setupRedisPlugin(app: FastifyInstance, redisUrl: string): Promise<void> {
  if (redisUrl.startsWith('mock://') || process.env.NODE_ENV === 'test') {
    app.log.info('Using InMemoryRedisMock for development/testing');
    const mock = new InMemoryRedisMock();
    app.decorate('redis', mock);
    return;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    await client.connect();
    app.decorate('redis', client);

    app.addHook('onClose', async () => {
      await client.quit();
    });
  } catch (err) {
    app.log.warn({ err }, 'Could not connect to Redis, falling back to InMemoryRedisMock');
    const mock = new InMemoryRedisMock();
    app.decorate('redis', mock);
  }
}
