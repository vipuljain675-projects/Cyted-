// api/brief/route.ts — Live Content & GEO Brief generator using AI
import { callCheapLLM } from '@/lib/llm';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      title,
      description,
      businessGap,
      actionPlan,
      expectedImpact,
      targetQuery,
      competitorFocus,
      brandName,
      targetModel,
    } = await req.json();

    const prompt = `You are a Senior Generative Engine Optimization (GEO) & Growth Content Strategist.
Create an executive-level, highly actionable Content Strategy & GEO Brief for "${brandName || 'our brand'}" to win top recommendation status in generative AI search engines (ChatGPT, Google Gemini, Claude, Perplexity).

Target Strategy: "${title}"
${targetQuery ? `Target AI Query: "${targetQuery}"` : ''}
${competitorFocus ? `Competitor to Overtake: "${competitorFocus}"` : ''}
Current AI Search Bottleneck: "${businessGap || description || ''}"
Recommended Action Playbook: "${actionPlan || ''}"
Expected Business Impact: "${expectedImpact || ''}"

Generate a thorough, practical, and executive-ready Content Brief in clean GitHub Markdown:

# 🎯 Executive Brief: ${title}

## 1. Business Objective & Commercial Opportunity
- **Target Searcher Profile**: Who is asking this query and what is their buying intent?
- **Current AI Search Bottleneck**: Why AI models currently favor ${competitorFocus || 'competitors'} or remain neutral.
- **The Win Condition**: Exactly what facts, data, and positioning will cause LLMs to recommend ${brandName || 'our brand'} as the #1 choice.

## 2. Recommended Content Asset to Publish
- **Asset Type**: (e.g., In-Depth Lab Comparison, Authoritative Category Guide, Price-to-Value Breakdown)
- **Target URL Slug**: (e.g., /compare/${brandName?.toLowerCase() || 'brand'}-vs-${competitorFocus?.toLowerCase() || 'competitor'})
- **Recommended H1 Title**: (High-CTR, authoritative title)
- **H2 & H3 Content Outline**: Full hierarchical structure with key talking points under each heading.

## 3. Data Proof Matrix & Comparison Benchmarks (What LLMs Quote)
Provide a concrete markdown table comparing key decision metrics (e.g., durability, specs, cost-per-use, clinical/lab test results) that AI engines can extract as structured facts.

## 4. Persuasive Differentiation & Customer Proof Points
- Specific claims to substantiate (e.g., warranty, lab wear tests, customer satisfaction rates).
- Quotes or trust badges to embed.

## 5. Technical GEO & Distribution Checklist
- Schema types to embed (FAQPage, Product, Review).
- Authoritative citation sources to seed (e.g., industry forums, Reddit, editorial publications).

Write with crisp, professional marketing authority. Return only the markdown without introductory preamble.`;

    const res = await callCheapLLM(prompt);
    return Response.json({ briefMarkdown: res.text });
  } catch (err: any) {
    console.error('[POST /api/brief]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
