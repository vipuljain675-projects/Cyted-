// lib/queue.ts — BullMQ Queue Producer for Cyted
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { TEST_PROVIDERS } from '@/lib/llm';

let redisClient: Redis | null = null;
let promptRunQueue: Queue | null = null;

export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
  }
  return redisClient;
}

export function getPromptQueue(): Queue | null {
  const redis = getRedisClient();
  if (!redis) return null;

  if (!promptRunQueue) {
    promptRunQueue = new Queue('prompt-run', {
      connection: redis,
    });
  }
  return promptRunQueue;
}

export async function addPromptJobsToQueue(
  runId: string,
  brandId: string,
  prompts: Array<{ id: string; text: string }>
): Promise<boolean> {
  const queue = getPromptQueue();
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
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: 200,
            removeOnFail: 500,
          },
        });
      }
    }

    await queue.addBulk(jobs);
    console.log(`[BullMQ Queue] ✅ Enqueued ${jobs.length} jobs into 'prompt-run' queue for Run ${runId}`);
    return true;
  } catch (err) {
    console.warn('[BullMQ Queue Warning] Could not push to Redis queue, falling back to direct runner:', err);
    return false;
  }
}
