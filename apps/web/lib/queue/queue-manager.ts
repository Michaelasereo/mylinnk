// Redis configuration (optional for Phase 2 testing)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisConnected = false;
let redis: any = null;
let Queue: any = null;
let QueueScheduler: any = null;

// Dynamically import Redis and BullMQ only if available
try {
  const redisModule = await import('ioredis');
  const bullmqModule = await import('bullmq');

  redis = new redisModule.default(redisUrl, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
  });

  Queue = bullmqModule.Queue;
  QueueScheduler = bullmqModule.QueueScheduler;

  // Test connection with timeout
  await Promise.race([
    redis.ping(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
  ]);

  redisConnected = true;
  console.log('✅ Redis connected for queue system');
} catch (error) {
  console.warn('⚠️ Redis/BullMQ not available, running without queue system:', error.message);
  redis = null;
  Queue = null;
  QueueScheduler = null;
}

// Queue definitions (only if Redis is available)
export const webhookQueue = redisConnected ? new Queue('webhooks', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,     // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay
    },
  },
}) : null;

// Dead letter queue for permanently failed webhooks
export const deadLetterQueue = redisConnected ? new Queue('webhooks:dead', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 0, // Keep all dead letter jobs
    removeOnFail: 0,
  },
}) : null;

// Queue scheduler for delayed jobs
export const webhookScheduler = redisConnected ? new QueueScheduler('webhooks', {
  connection: redis,
}) : null;

// Export all queues for management (only available queues)
export const queues = {
  webhookQueue,
  deadLetterQueue,
  redisConnected,
};

// Cleanup function
export async function closeQueues() {
  if (redisConnected) {
    await webhookQueue?.close();
    await deadLetterQueue?.close();
    await webhookScheduler?.close();
    await redis?.quit();
  }
}
