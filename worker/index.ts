// worker/index.ts
// ──────────────────────────────────────────────────────────────────
// SEPARATE PROCESS — Run with: npm run worker
// Picks jobs from Redis → calls AI → saves response → analyzes → saves mentions
// ──────────────────────────────────────────────────────────────────

import 'dotenv/config';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { callLLM, callCheapLLM } from '../src/lib/llm';
import { analyzerService } from '../src/services/analyzerService';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const db = new PrismaClient();

const worker = new Worker(
  'prompt-run',
  async (job) => {
    const { runId, promptId, brandId, provider } = job.data;

    console.log(`[Worker] Job ${job.id} | provider=${provider} | promptId=${promptId}`);

    // ─── Step 1: Fetch prompt text from DB ────────────────────────
    const prompt = await db.prompt.findUnique({ where: { id: promptId } });
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    // ─── Step 2: Fetch brand + competitors for analysis ───────────
    const brand = await db.brand.findUnique({
      where: { id: brandId },
      include: { competitors: true },
    });
    if (!brand) {
      throw new Error(`Brand not found: ${brandId}`);
    }

    const competitorNames = brand.competitors.map((c: { name: string }) => c.name);

    // ─── Step 3: Call the AI provider ─────────────────────────────
    let rawText = '';
    try {
      const response = await callLLM(prompt.text, provider as 'groq' | 'groq_oss' | 'gemini');
      rawText = response.text;
    } catch (err) {
      console.error(`[Worker] LLM call failed (${provider}):`, err);
      throw err; // BullMQ will retry
    }

    // ─── Step 4: Save raw response to DB ──────────────────────────
    const savedResponse = await db.response.create({
      data: {
        runId,
        promptId,
        model: provider,
        rawText,
      },
    });

    // ─── Step 5: Analyze response — extract mentions ───────────────
    const mentions = await analyzerService.analyze(rawText, brand.name, competitorNames);

    // ─── Step 6: Save mentions to DB ──────────────────────────────
    if (mentions.length > 0) {
      await db.mention.createMany({
        data: mentions.map((m) => ({
          responseId: savedResponse.id,
          brandName: m.brandName,
          isTrackedBrand: m.isTrackedBrand,
          position: m.position,
          sentiment: m.sentiment,
          contextSnippet: m.contextSnippet,
        })),
      });
    }

    // ─── Step 7: Update run progress ──────────────────────────────
    const updatedRun = await db.run.update({
      where: { id: runId },
      data: { completedJobs: { increment: 1 } },
    });

    // Mark run as completed when all jobs are done
    if (updatedRun.completedJobs >= updatedRun.totalJobs) {
      await db.run.update({
        where: { id: runId },
        data: { status: 'completed' },
      });
      console.log(`[Worker] ✅ Run ${runId} COMPLETED`);
    }

    console.log(
      `[Worker] Job ${job.id} done | mentions: ${mentions.length} | progress: ${updatedRun.completedJobs}/${updatedRun.totalJobs}`
    );
  },
  {
    connection: redis,
    concurrency: 3, // 3 parallel jobs (stay within free-tier rate limits)
    limiter: {
      max: 10,
      duration: 1000, // max 10 jobs/sec globally
    },
  }
);

worker.on('failed', async (job, err) => {
  console.error(`[Worker] ❌ Job ${job?.id} failed:`, err.message);
  if (job?.data?.runId) {
    try {
      const updatedRun = await db.run.update({
        where: { id: job.data.runId },
        data: { completedJobs: { increment: 1 } },
      });
      if (updatedRun.completedJobs >= updatedRun.totalJobs) {
        await db.run.update({
          where: { id: job.data.runId },
          data: { status: 'completed' },
        });
        console.log(`[Worker] ✅ Run ${job.data.runId} marked completed after failure`);
      }
    } catch (e) {
      console.error('[Worker DB Update Error]', e);
    }
  }
});

worker.on('error', (err) => {
  console.error('[Worker] Error:', err.message);
});

console.log('🔧 Cyted Worker started — waiting for jobs in Redis queue...');
console.log('   Queue: prompt-run');
console.log('   Concurrency: 3');
console.log('   Providers: groq, gemini, openrouter');
