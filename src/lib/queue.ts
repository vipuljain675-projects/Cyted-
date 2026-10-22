// lib/queue.ts — BullMQ Queue Producer for Cyted
// ──────────────────────────────────────────────────────────────────
// Redis + BullMQ connections are FULLY LAZY:
//   - No Redis connection is created on import
//   - No Redis connection is created until someone calls addPromptJobsToQueue()
//   - If Redis is unavailable, it silently falls back (returns false)
//   - Connection timeout: 5 seconds (prevents blocking the server)
// ──────────────────────────────────────────────────────────────────

import type { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

// Module-level singletons (only instantiated on first actual use)
let redisClient: Redis | null = null;
let promptRunQueue: Queue | null = null;

/**
 * Creates or returns a singleton Redis client.
 * Only called internally when we ACTUALLY need to push jobs.
 */
function getOrCreateRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;

  if (!redisClient) {
    // Dynamic require to avoid loading ioredis at module-import time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require('ioredis').default || require('ioredis');

    redisClient = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,          // Don't connect until .connect() or first command
      connectTimeout: 5000,       // 5s max to establish connection
      commandTimeout: 10000,      // 10s max per command
      retryStrategy(times: number) {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 500, 2000);
      },
    });

    // Suppress unhandled error events (prevents crashing the server)
    redisClient!.on('error', (err: Error) => {
      console.warn('[Redis] Connection error (non-fatal):', err.message);
    });
  }

  return redisClient;
}

/**
 * Creates or returns a singleton BullMQ Queue.
 * Only called internally when we ACTUALLY need to push jobs.
 */
function getOrCreateQueue(): Queue | null {
  const redis = getOrCreateRedisClient();
  if (!redis) return null;

  if (!promptRunQueue) {
    // Dynamic require to avoid loading bullmq at module-import time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Queue: BullQueue } = require('bullmq');

    promptRunQueue = new BullQueue('prompt-run', {
      connection: redis,
    });
  }

  return promptRunQueue;
}

/**
 * Enqueues prompt evaluation jobs into the BullMQ queue.
 * This is the ONLY public function — everything else is internal.
 *
 * @returns true if jobs were successfully enqueued, false if Redis unavailable
 */
export async function addPromptJobsToQueue(
  runId: string,
  brandId: string,
  prompts: Array<{ id: string; text: string }>
): Promise<boolean> {
  // Dynamically import TEST_PROVIDERS to avoid circular deps
  const { TEST_PROVIDERS } = await import('@/lib/llm');

  const queue = getOrCreateQueue();
  if (!queue) return false;

  try {
    const jobs = [];
    for (const prompt of prompts) {
      for (const provider of TEST_PROVIDERS) {
        jobs.push({
          name: `eval-${prompt.id}-${provider}`,
          data: {
            runId,
            promptId: prompt.id,
            brandId,
            provider,
          },
          opts: {
            attempts: 3,
            backoff: {
              type: 'exponential' as const,
              delay: 2000,
            },
            removeOnComplete: 200,
            removeOnFail: 500,
          },
        });
      }
    }

    // Race the enqueue against a 8-second timeout
    await Promise.race([
      queue.addBulk(jobs),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis enqueue timed out after 8s')), 8000)
      ),
    ]);

    console.log(`[BullMQ Queue] ✅ Enqueued ${jobs.length} jobs into 'prompt-run' queue for Run ${runId}`);
    return true;
  } catch (err) {
    console.warn('[BullMQ Queue Warning] Could not push to Redis queue, falling back to direct runner:', err);
    return false;
  }
}
