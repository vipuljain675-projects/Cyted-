// services/analyzerService.ts
// ──────────────────────────────────────────────────────────────────
// Enhanced mention & rank extractor using robust pattern matching
// Extracts: brand name, position in numbered lists, sentiment, context
// ──────────────────────────────────────────────────────────────────

export interface ExtractedMention {
  brandName: string;
  isTrackedBrand: boolean;
  position: number | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  contextSnippet: string;
}

// Detect position/rank in AI response using multi-layer extraction
function detectPosition(
  fullText: string,
  brand: string,
  allBrands: string[]
): number | null {
  const brandRegex = new RegExp(`\\b${escapeRegex(brand)}\\b`, 'i');
  if (!brandRegex.test(fullText)) return null;

  const lines = fullText.split('\n');

  // Strategy 1: Explicit numbered list item or heading containing the brand
  // Examples: "1. Brand", "### 1. Brand", "* 1. Brand", "**1. Brand**", "(1) Brand", "1) Brand"
  for (const line of lines) {
    if (!brandRegex.test(line)) continue;

    // Heading or list item with number: e.g. "### 1. ", "* 1. ", "1. ", "1) "
    const numMatch = line.match(/(?:^|\n|[\s*#\-–—])(\d{1,2})[.):\-–—]\s/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num >= 1 && num <= 20) return num;
    }

    // "Rank 2", "ranked #3", "Position 1", "#1"
    const rankMatch = line.match(/(?:rank(?:ed)?|position|#)\s*(\d{1,2})/i);
    if (rankMatch) {
      const num = parseInt(rankMatch[1], 10);
      if (num >= 1 && num <= 20) return num;
    }
  }

  // Strategy 2: Bulleted list order (unordered bullets like "* Brand" or "- Brand")
  // If the response lists recommendations in bullet points, rank them by bullet index
  const bulletLines = lines.filter((l) => /^\s*[\*\-•]\s+/.test(l));
  if (bulletLines.length > 1) {
    const bulletIdx = bulletLines.findIndex((l) => brandRegex.test(l));
    if (bulletIdx !== -1) {
      return bulletIdx + 1; // 1-indexed rank
    }
  }

  // Strategy 3: Order of appearance among all cited brands
  // In generative AI, whichever brand is cited first in the text is ranked #1
  const brandFirstIndex = fullText.search(brandRegex);
  if (brandFirstIndex !== -1) {
    const appearances: { name: string; index: number }[] = [];
    for (const b of allBrands) {
      const bRegex = new RegExp(`\\b${escapeRegex(b)}\\b`, 'i');
      const idx = fullText.search(bRegex);
      if (idx !== -1) appearances.push({ name: b, index: idx });
    }
    appearances.sort((a, b) => a.index - b.index);
    const rankIndex = appearances.findIndex(
      (a) => a.name.toLowerCase() === brand.toLowerCase()
    );
    if (rankIndex !== -1) {
      return rankIndex + 1;
    }
  }

  return 1;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Sentiment from local context around the brand mention
function detectSentiment(snippet: string): 'positive' | 'neutral' | 'negative' {
  const lower = snippet.toLowerCase();

  const negativeWords = ['expensive', 'steep', 'lacks', 'complex', 'difficult', 'slow', 'outdated', 'limited', 'confusing', 'bloated', 'poor', 'worst', 'avoid', 'drawback', 'downside', 'disadvantage'];
  const positiveWords = ['best', 'excellent', 'great', 'popular', 'powerful', 'robust', 'easy', 'leading', 'top', 'recommended', 'reliable', 'fast', 'comprehensive', 'intuitive', 'free', 'modern', 'versatile', 'user-friendly', 'well-known', 'solid', 'industry-standard', 'favorite', 'strong', 'trusted'];

  let posScore = 0;
  let negScore = 0;

  for (const w of positiveWords) {
    if (lower.includes(w)) posScore++;
  }
  for (const w of negativeWords) {
    if (lower.includes(w)) negScore++;
  }

  if (negScore > posScore) return 'negative';
  if (posScore > 0) return 'positive';
  return 'neutral';
}

export const analyzerService = {
  async analyze(
    rawText: string,
    trackedBrand: string,
    competitors: string[]
  ): Promise<ExtractedMention[]> {
    const allBrands = [trackedBrand, ...competitors];
    const mentions: ExtractedMention[] = [];

    for (const brand of allBrands) {
      const regex = new RegExp(`\\b${escapeRegex(brand)}\\b`, 'i');
      const matchIndex = rawText.search(regex);

      if (matchIndex !== -1) {
        // Find the line(s) where brand was mentioned for context
        const lines = rawText.split('\n');
        const matchingLines = lines.filter((l) => regex.test(l));
        const contextLine = matchingLines[0] || rawText.slice(matchIndex, matchIndex + 300);

        // Get surrounding context (±1 lines)
        const lineIdx = lines.findIndex((l) => regex.test(l));
        const contextRange = lines
          .slice(Math.max(0, lineIdx - 1), lineIdx + 2)
          .join(' ')
          .trim();

        // Detect position in numbered lists or by citation order
        const position = detectPosition(rawText, brand, allBrands);

        // Detect sentiment from broader context
        const sentiment = detectSentiment(contextRange || contextLine);

        mentions.push({
          brandName: brand,
          isTrackedBrand: brand.toLowerCase() === trackedBrand.toLowerCase(),
          position,
          sentiment,
          contextSnippet: (contextRange || contextLine).trim().slice(0, 300),
        });
      }
    }

    return mentions;
  },
};
