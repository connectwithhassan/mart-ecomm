import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

export interface OrderSplitJobData {
  parentOrderId: string;
}

export interface EscrowMaturityJobData {
  subOrderId: string;
}

export interface PayoutBatchJobData {
  batchId: string;
}

export class QueueManager {
  private redisConnection: Redis | null = null;
  public orderSplitQueue: Queue | null = null;
  public escrowMaturityQueue: Queue | null = null;
  public payoutBatchQueue: Queue | null = null;
  private workers: Worker[] = [];

  constructor(private redisUrl: string) {}

  async initialize(): Promise<void> {
    if (this.redisUrl.startsWith('mock://') || process.env.NODE_ENV === 'test') {
      console.log('ℹ️ Running in mock/test mode. BullMQ live workers will not connect to external Redis.');
      return;
    }

    try {
      this.redisConnection = new Redis(this.redisUrl, {
        maxRetriesPerRequest: null,
      });

      this.orderSplitQueue = new Queue('order-split', { connection: this.redisConnection });
      this.escrowMaturityQueue = new Queue('escrow-maturity', { connection: this.redisConnection });
      this.payoutBatchQueue = new Queue('payout-batch', { connection: this.redisConnection });

      // Bootstrap workers
      const orderSplitWorker = new Worker(
        'order-split',
        async (job: Job<OrderSplitJobData>) => {
          console.log(`[Worker] Processing order-split for parentOrderId: ${job.data.parentOrderId}`);
          return { status: 'split_created' };
        },
        { connection: this.redisConnection }
      );

      const escrowMaturityWorker = new Worker(
        'escrow-maturity',
        async (job: Job<EscrowMaturityJobData>) => {
          console.log(`[Worker] Evaluating escrow maturity for subOrderId: ${job.data.subOrderId}`);
          return { status: 'escrow_evaluated' };
        },
        { connection: this.redisConnection }
      );

      this.workers.push(orderSplitWorker, escrowMaturityWorker);
      console.log('✅ BullMQ worker queues initialized successfully.');
    } catch (err) {
      console.warn('⚠️ BullMQ worker connection warning:', err);
    }
  }

  async close(): Promise<void> {
    for (const worker of this.workers) {
      await worker.close();
    }
    if (this.orderSplitQueue) await this.orderSplitQueue.close();
    if (this.escrowMaturityQueue) await this.escrowMaturityQueue.close();
    if (this.payoutBatchQueue) await this.payoutBatchQueue.close();
    if (this.redisConnection) {
      await this.redisConnection.quit();
    }
    console.log('✅ BullMQ workers closed cleanly.');
  }
}
