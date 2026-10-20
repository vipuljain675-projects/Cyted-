// services/analyticsService.ts
// ──────────────────────────────────────────────────────────────────
// Role: Aggregates Mention table data into visibility metrics
// Called by: api/analytics/route.ts (GET)
// Calls: lib/db.ts — pure DB aggregation, NO AI calls
// ──────────────────────────────────────────────────────────────────

import { db } from '@/lib/db';

export interface BrandAnalytics {
  visibility: number;           // % of responses where brand was mentioned
  avgPosition: number | null;   // average rank when mentioned
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  shareOfVoice: Array<{
    brandName: string;
    mentionCount: number;
    sharePercent: number;
  }>;
  totalResponses: number;
  totalMentions: number;
}

export const analyticsService = {
  async getMetrics(brandId: string): Promise<BrandAnalytics> {
    // 1. Get the brand name + competitors
    const brand = await db.brand.findUnique({
      where: { id: brandId },
      include: { competitors: true },
    });

    if (!brand) throw new Error(`Brand not found: ${brandId}`);

    // Find the latest completed run for this brand
    const latestRun = await db.run.findFirst({
      where: { brandId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!latestRun) {
      return {
        visibility: 0,
        avgPosition: null,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        shareOfVoice: [],
        totalResponses: 0,
        totalMentions: 0,
      };
    }

    // 2. Total responses for this brand in LATEST run only
    const totalResponses = await db.response.count({
      where: { prompt: { brandId }, runId: latestRun.id },
    });

    if (totalResponses === 0) {
      return {
        visibility: 0,
        avgPosition: null,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        shareOfVoice: [],
        totalResponses: 0,
        totalMentions: 0,
      };
    }

    // 3. Mentions of our tracked brand (latest run only)
    const ourMentions = await db.mention.findMany({
      where: {
        isTrackedBrand: true,
        response: { prompt: { brandId }, runId: latestRun.id },
      },
      select: { position: true, sentiment: true },
    });

    // 4. Visibility = % of responses where brand appeared
    const visibility =
      totalResponses > 0
        ? Math.round((ourMentions.length / totalResponses) * 100 * 10) / 10
        : 0;

    // 5. Average position (only for mentions that have a position rank)
    const positionedMentions = ourMentions.filter((m) => m.position !== null);
    const avgPosition =
      positionedMentions.length > 0
        ? Math.round(
            (positionedMentions.reduce((sum, m) => sum + (m.position ?? 0), 0) /
              positionedMentions.length) *
              10
          ) / 10
        : null;

    // 6. Sentiment breakdown
    const sentimentBreakdown = {
      positive: ourMentions.filter((m) => m.sentiment === 'positive').length,
      neutral: ourMentions.filter((m) => m.sentiment === 'neutral').length,
      negative: ourMentions.filter((m) => m.sentiment === 'negative').length,
    };

    // 7. Share of Voice — all brand mentions (ours + all competitors) in latest run
    const allBrandNames = [brand.name, ...brand.competitors.map((c) => c.name)];
    const allMentions = await db.mention.findMany({
      where: {
        brandName: { in: allBrandNames },
        response: { prompt: { brandId }, runId: latestRun.id },
      },
      select: { brandName: true },
    });

    const totalMentions = allMentions.length;

    const mentionCounts: Record<string, number> = {};
    for (const m of allMentions) {
      mentionCounts[m.brandName] = (mentionCounts[m.brandName] ?? 0) + 1;
    }

    const shareOfVoice = Object.entries(mentionCounts)
      .map(([brandName, mentionCount]) => ({
        brandName,
        mentionCount,
        sharePercent:
          totalMentions > 0
            ? Math.round((mentionCount / totalMentions) * 100 * 10) / 10
            : 0,
      }))
      .sort((a, b) => b.mentionCount - a.mentionCount);

    return {
      visibility,
      avgPosition,
      sentimentBreakdown,
      shareOfVoice,
      totalResponses,
      totalMentions,
    };
  },
};
