// services/promptService.ts
import { db } from '@/lib/db';
import { callCheapLLM } from '@/lib/llm';

function buildMetaPrompt(
  brandName: string,
  category: string,
  competitors: string[]
): string {
  const compList = competitors.length > 0 ? competitors.join(', ') : 'leading competitors';
  const firstComp = competitors[0] || 'competitors';

  return `You are a generative search and market research expert.
Generate exactly 15 realistic search queries that a real consumer or buyer would ask an AI assistant when searching for or evaluating "${category}".
Brand to track: "${brandName}"
Competitors: ${compList}

Guidelines:
- Include high-intent buyer discovery questions (e.g. "Best ${category} for 2025", "Top recommended ${category} brands")
- Include direct comparison queries (e.g. "${brandName} vs ${firstComp} review and comparison")
- Include alternative recommendations (e.g. "Top alternatives to ${firstComp} with best quality")
- Include practical purchasing or decision questions (e.g. "Where to buy ${brandName}", "Is ${brandName} worth the price")
- Match the exact tone and terminology of "${category}" (do NOT mention software/APIs unless the category is software/APIs).

Respond ONLY with a valid JSON array of strings. Do not include markdown codeblocks or conversational text.
Example format:
["Best options for ${category}", "${brandName} vs ${firstComp} review"]`;
}

function detectPromptType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes(' vs ') || lower.includes('compare') || lower.includes('better'))
    return 'comparison';
  if (lower.includes('alternative') || lower.includes('instead of') || lower.includes('replace'))
    return 'alternative';
  if (lower.includes('how to') || lower.includes('why') || lower.includes('worth') || lower.includes('review'))
    return 'problem';
  return 'discovery';
}

function extractPromptsFromText(text: string, brandName: string, category: string, competitors: string[]): string[] {
  // 1. Try finding JSON array
  try {
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => String(p).trim()).filter(Boolean);
      }
    }
  } catch {
    // fallback to line parsing
  }

  // 2. Line by line numbered fallback: e.g. "1. Query"
  const lines = text.split('\n')
    .map((l) => l.replace(/^\d+[\.\)\-]\s*/, '').replace(/^["']|["']$/g, '').trim())
    .filter((l) => l.length > 8 && !l.startsWith('[') && !l.startsWith(']'));

  if (lines.length >= 3) {
    return lines;
  }

  // 3. Guaranteed smart fallback templates if model returns unstructured text
  const comp = competitors[0] || 'competitors';
  return [
    `Best ${category} in 2025`,
    `Top rated ${category} for quality and value`,
    `${brandName} vs ${comp} which is better`,
    `Most recommended ${category} brands`,
    `Top alternatives to ${comp}`,
    `Is ${brandName} worth the price`,
    `${brandName} reviews and customer feedback`,
    `How does ${brandName} compare to ${comp}`,
  ];
}

export const promptService = {
  async generateAndSave(brandId: string): Promise<{ count: number }> {
    const brand = await db.brand.findUnique({
      where: { id: brandId },
      include: { competitors: true },
    });

    if (!brand) throw new Error(`Brand not found: ${brandId}`);

    const competitorNames = brand.competitors.map((c) => c.name);
    const metaPrompt = buildMetaPrompt(brand.name, brand.category, competitorNames);
    
    let promptTexts: string[] = [];
    try {
      const response = await callCheapLLM(metaPrompt);
      promptTexts = extractPromptsFromText(response.text, brand.name, brand.category, competitorNames);
    } catch {
      promptTexts = extractPromptsFromText('', brand.name, brand.category, competitorNames);
    }

    await db.prompt.deleteMany({ where: { brandId } });

    await db.prompt.createMany({
      data: promptTexts.map((text: string) => ({
        text: text.trim(),
        type: detectPromptType(text),
        brandId,
      })),
    });

    return { count: promptTexts.length };
  },

  async listByBrand(brandId: string) {
    // Find the latest completed run for this brand
    const latestRun = await db.run.findFirst({
      where: { brandId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    return db.prompt.findMany({
      where: { brandId },
      include: {
        responses: {
          where: latestRun ? { runId: latestRun.id } : { id: '' }, // no results if no run
          orderBy: { createdAt: 'desc' },
          include: {
            mentions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
