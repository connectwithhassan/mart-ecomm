import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';
import { QueueManager } from './workers/index.js';

async function startServer(): Promise<void> {
  const env = loadEnv();
  const app = await buildApp(env);
  const queueManager = new QueueManager(env.REDIS_URL);
  await queueManager.initialize();

  try {
    const address = await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Fastify Gateway listening at ${address}`);
    console.log(`📖 OpenAPI Documentation available at ${address}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const closeSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of closeSignals) {
    process.on(signal, async () => {
      console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
      try {
        await queueManager.close();
        await app.close();
        console.log('✅ Server and worker queues closed cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during graceful shutdown:', err);
        process.exit(1);
      }
    });
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}
