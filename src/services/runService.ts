// services/runService.ts
// ──────────────────────────────────────────────────────────────────
// Role: Creates a Run record and executes prompt-testing across LLMs
// Runs DIRECTLY in-process (no Redis/BullMQ needed)
// Each prompt×provider pair is independent — one failure won't stop others
// ──────────────────────────────────────────────────────────────────

import { db } from '@/lib/db';
import { callLLM, TEST_PROVIDERS } from '@/lib/llm';
import { analyzerService } from '@/services/analyzerService';

// Helper: sleep to avoid rate-limiting
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Direct execution — runs ALL prompt×provider combos with error isolation
async function executeRunDirectly(
  runId: string,
  brandId: string,
  prompts: Array<{ id: string; text: string }>
) {
  console.log(`[DirectRun] Starting run ${runId} | ${prompts.length} prompts × ${TEST_PROVIDERS.length} providers = ${prompts.length * TEST_PROVIDERS.length} jobs`);

  const brand = await db.brand.findUnique({
    where: { id: brandId },
    include: { competitors: true },
  });
  if (!brand) {
    console.error(`[DirectRun] Brand not found: ${brandId}`);
    await db.run.update({ where: { id: runId }, data: { status: 'failed' } });
    return;
  }

  const competitorNames = brand.competitors.map((c) => c.name);
  let successCount = 0;
  let failCount = 0;

  for (let pi = 0; pi < prompts.length; pi++) {
    const prompt = prompts[pi];

    for (let pvi = 0; pvi < TEST_PROVIDERS.length; pvi++) {
      const provider = TEST_PROVIDERS[pvi];
      const jobLabel = `[${pi + 1}/${prompts.length}][${provider}]`;

      try {
        console.log(`${jobLabel} Calling LLM for: "${prompt.text.slice(0, 60)}..."`);

        // 1. Call AI — NO cross-fallback. Each provider succeeds or fails independently.
        let llmRes;
        try {
          llmRes = await Promise.race([
            callLLM(prompt.text, provider),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('LLM call timed out after 45s')), 45000)
            ),
          ]);
        } catch (providerErr: any) {
          console.warn(`${jobLabel} Provider ${provider} failed: ${providerErr?.message || providerErr}`);
          failCount++;
          await db.run.update({
            where: { id: runId },
            data: { completedJobs: { increment: 1 } },
          });
          continue;
        }

        if (!llmRes?.text) {
          console.warn(`${jobLabel} Empty response, skipping analysis`);
          failCount++;
          await db.run.update({
            where: { id: runId },
            data: { completedJobs: { increment: 1 } },
          });
          continue;
        }

        console.log(`${jobLabel} Got ${llmRes.text.length} chars response`);

        // 2. Save raw response
        const savedResponse = await db.response.create({
          data: {
            runId,
            promptId: prompt.id,
            model: provider,
            rawText: llmRes.text,
          },
        });

        // 3. Analyze for brand mentions
        const mentions = await analyzerService.analyze(
          llmRes.text,
          brand.name,
          competitorNames
        );

        console.log(`${jobLabel} Found ${mentions.length} brand mentions`);

        // 4. Save mentions
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

        successCount++;
      } catch (jobErr: any) {
        console.error(`${jobLabel} FAILED:`, jobErr?.message || jobErr);
        failCount++;
      }

      // 5. Always increment completedJobs (even on failure)
      try {
        await db.run.update({
          where: { id: runId },
          data: { completedJobs: { increment: 1 } },
        });
      } catch (dbErr) {
        console.error(`${jobLabel} DB update failed:`, dbErr);
      }

      // 6. Rate-limit delay between API calls (2.2s for safe throughput)
      await sleep(2200);
    }
  }

  // Mark run as completed
  try {
    await db.run.update({
      where: { id: runId },
      data: { status: 'completed' },
    });
    console.log(`[DirectRun] ✅ Run ${runId} DONE | success=${successCount} fail=${failCount}`);
  } catch (err) {
    console.error(`[DirectRun] Failed to mark run as completed:`, err);
  }
}

export const runService = {
  async startRun(brandId: string): Promise<{ runId: string; totalJobs: number }> {
    // 1. Fetch prompts for this brand
    const prompts = await db.prompt.findMany({ where: { brandId } });

    if (prompts.length === 0) {
      throw new Error('No prompts found for this brand. Generate prompts first.');
    }

    // 2. Calculate total: prompts × providers
    const totalJobs = prompts.length * TEST_PROVIDERS.length;

    // 3. Create Run record in DB
    const run = await db.run.create({
      data: {
        brandId,
        status: 'running',
        totalJobs,
        completedJobs: 0,
      },
    });

    console.log(`[RunService] Created run ${run.id} | ${totalJobs} total jobs`);

    // 4. Run in background (fire-and-forget — API returns immediately)
    executeRunDirectly(run.id, brandId, prompts).catch((e) =>
      console.error('[RunService Background Error]', e)
    );

    return { runId: run.id, totalJobs };
  },

  async getRunStatus(runId: string) {
    return db.run.findUnique({
      where: { id: runId },
      select: {
        id: true,
        status: true,
        totalJobs: true,
        completedJobs: true,
        createdAt: true,
      },
    });
  },

  async listRunsByBrand(brandId: string) {
    return db.run.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  },
};
