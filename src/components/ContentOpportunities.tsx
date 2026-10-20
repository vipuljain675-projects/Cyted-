'use client';

import React, { useState, useMemo } from 'react';
import {
  Target,
  ArrowRightLeft,
  Sparkles,
  Zap,
  ArrowUpRight,
  Check,
  X,
  FileText,
  Loader2,
  AlertTriangle,
  Compass,
  TrendingUp,
  Award,
} from 'lucide-react';

import { PromptItem } from './PromptsExplorer';

export interface BusinessOpportunity {
  id: string;
  title: string;
  badge: string;
  badgeType: 'amber' | 'emerald' | 'indigo' | 'rose';
  businessGap: string; // The commercial bottleneck in AI search
  actionPlan: string; // The exact content playbook to publish
  expectedImpact: string; // Bottom-line commercial ROI
  targetQuery?: string;
  competitorFocus?: string;
  category: string;
  targetModel: string;
  actionLabel: string;
}

interface ContentOpportunitiesProps {
  brandName?: string;
  category?: string;
  competitors?: string[];
  prompts?: PromptItem[];
  hasAuditRun?: boolean;
}

export const ContentOpportunities: React.FC<ContentOpportunitiesProps> = ({
  brandName = 'Your Brand',
  category = 'Industry Solutions',
  competitors = ['Competitors'],
  prompts = [],
  hasAuditRun = false,
}) => {
  const [activeModalOpp, setActiveModalOpp] = useState<BusinessOpportunity | null>(null);
  const [briefText, setBriefText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const primaryComp = competitors[0] || 'Competitor';

  // Intelligently compute dynamic, business-first opportunities from real LLM audit data
  const opportunities = useMemo<BusinessOpportunity[]>(() => {
    const opps: BusinessOpportunity[] = [];

    // 1. Find queries where brand was tested but completely missed (100% blindspot)
    const missedPrompts = (prompts || []).filter(
      (p) => (!p.isMentioned || p.position === null) && p.testedModels && p.testedModels.length > 0
    );

    // 2. Find queries where brand is ranked sub-optimally (Rank > 1, e.g. #2, #3, #4 behind competitor)
    const subRankPrompts = (prompts || []).filter(
      (p) => p.isMentioned && p.position && p.position > 1
    ).sort((a, b) => (b.position || 0) - (a.position || 0)); // Rank #4 before #2

    // 3. Find comparison queries (direct purchase intent)
    const comparisonPrompts = (prompts || []).filter(
      (p) =>
        p.category === 'Comparison' ||
        p.query.toLowerCase().includes(' vs ') ||
        p.query.toLowerCase().includes('compared to') ||
        p.query.toLowerCase().includes('worth the price')
    );

    // 4. Find queries where sentiment was neutral (lukewarm, no strong recommendation)
    const neutralPrompts = (prompts || []).filter(
      (p) => p.isMentioned && p.sentiment === 'neutral'
    );

    // Helper to find which competitor was cited top in a prompt
    const findTopCompetitor = (prompt?: PromptItem): string => {
      if (!prompt?.modelResponses) return primaryComp;
      for (const resp of prompt.modelResponses) {
        if (resp.competitorsMentioned && resp.competitorsMentioned.length > 0) {
          const first = resp.competitorsMentioned[0];
          const cleanName = first.replace(/\s*\(#\d+\)/, '').trim();
          if (cleanName) return cleanName;
        }
      }
      return primaryComp;
    };

    if (hasAuditRun) {
      // OPPORTUNITY 1: Sub-optimal Rank Conquest (Flip Rank #X -> #1) OR Top Missed Query
      if (subRankPrompts.length > 0) {
        const targetPrompt = subRankPrompts[0];
        const comp = findTopCompetitor(targetPrompt);
        opps.push({
          id: `opp-rank-${targetPrompt.id}`,
          title: `Overtake ${comp} for #1 in "${targetPrompt.query}"`,
          badge: `Flip Rank #${targetPrompt.position} → #1`,
          badgeType: 'amber',
          businessGap: `Generative search engines currently recommend ${comp} as the #1 choice for this high-intent query, pushing ${brandName} down to #${targetPrompt.position}.`,
          actionPlan: `Publish a dedicated wear-test & performance benchmark guide highlighting ${brandName}'s superior durability and specifications so LLMs crown ${brandName} as the undisputed #1 recommendation.`,
          expectedImpact: `Reclaim the #1 recommendation spot across Gemini, ChatGPT, and Claude for active buyers.`,
          targetQuery: targetPrompt.query,
          competitorFocus: comp,
          category: 'Rank Conquest',
          targetModel: 'Multi-LLM Synthesis',
          actionLabel: 'Generate AI Brief',
        });
      } else if (missedPrompts.length > 0) {
        const topMissed = missedPrompts[0];
        const comp = findTopCompetitor(topMissed);
        opps.push({
          id: `opp-missed-${topMissed.id}`,
          title: `Capture 100% Missed Demand in "${topMissed.query}"`,
          badge: '100% Demand Capture',
          badgeType: 'rose',
          businessGap: `AI engines currently cite ${comp} and alternatives while completely omitting ${brandName}, surrendering 100% of these high-intent searchers to competitors.`,
          actionPlan: `Launch an authoritative solution guide addressing this specific problem with clear product recommendations and expert endorsements so AI models index ${brandName}.`,
          expectedImpact: `Stop losing prospective customers to ${comp} and open a new inbound acquisition channel.`,
          targetQuery: topMissed.query,
          competitorFocus: comp,
          category: 'Unclaimed Demand',
          targetModel: 'Google Gemini & Groq',
          actionLabel: 'Generate AI Brief',
        });
      } else {
        opps.push({
          id: 'opp-defend-top',
          title: `Defend Category Leadership in "${category}"`,
          badge: 'Protect #1 Share',
          badgeType: 'emerald',
          businessGap: `${brandName} currently leads citations, but ${primaryComp} is actively cited in competitor queries and attempting to dilute your recommendation share.`,
          actionPlan: `Publish an updated 2025 Category Buyer's Report with lab test metrics and customer reviews to solidify topical authority.`,
          expectedImpact: `Prevent competitor conquesting and maintain 40%+ Share of Voice in AI search.`,
          targetQuery: `Best ${category} for 2025`,
          competitorFocus: primaryComp,
          category: 'Market Defense',
          targetModel: 'Multi-LLM Synthesis',
          actionLabel: 'Generate AI Brief',
        });
      }

      // OPPORTUNITY 2: Win High-Intent Comparison Queries (Bottom-of-Funnel Conversion)
      const compTarget = comparisonPrompts.find((p) => p.sentiment === 'neutral' || !p.isMentioned) || comparisonPrompts[0];
      if (compTarget) {
        const comp = findTopCompetitor(compTarget);
        opps.push({
          id: `opp-comp-${compTarget.id}`,
          title: `Win the "${brandName} vs ${comp}" AI Decision Moment`,
          badge: 'High Purchase Intent',
          badgeType: 'indigo',
          businessGap: `Shoppers asking AI to compare ${brandName} vs ${comp} are at the final checkout step. Currently, AI answers deliver balanced, neutral trade-offs rather than declaring ${brandName} as the clear winner.`,
          actionPlan: `Deploy an official side-by-side comparison landing page featuring verified specs, durability lifespan benchmarks, and customer reviews directly addressing ${comp}.`,
          expectedImpact: `Convert high-intent comparison searchers into direct sales and eliminate buyer drop-off to ${comp}.`,
          targetQuery: compTarget.query,
          competitorFocus: comp,
          category: 'Buyer Conversion',
          targetModel: 'Generative AI Search',
          actionLabel: 'Generate AI Brief',
        });
      } else {
        opps.push({
          id: 'opp-comp-default',
          title: `Launch Official "${brandName} vs ${primaryComp}" Comparison Hub`,
          badge: 'High Purchase Intent',
          badgeType: 'indigo',
          businessGap: `When buyers ask AI to compare ${brandName} and ${primaryComp}, engines synthesize data from Reddit and third-party blogs without your verified official data.`,
          actionPlan: `Build a definitive comparison matrix comparing key features, pricing, and warranty to ensure AI quotes your verified competitive advantages.`,
          expectedImpact: `Turn comparison searches into direct e-commerce sales.`,
          targetQuery: `${brandName} vs ${primaryComp} comparison`,
          competitorFocus: primaryComp,
          category: 'Buyer Conversion',
          targetModel: 'LLM Synthesis',
          actionLabel: 'Generate AI Brief',
        });
      }

      // OPPORTUNITY 3: Sentiment Conversion OR Price/Value Resistance
      const pricePrompt = prompts.find((p) => p.query.toLowerCase().includes('worth the price') || p.query.toLowerCase().includes('expensive'));
      if (pricePrompt) {
        opps.push({
          id: `opp-price-${pricePrompt.id}`,
          title: `Neutralize Price Resistance in "${pricePrompt.query}"`,
          badge: 'Overcome Price Friction',
          badgeType: 'emerald',
          businessGap: `Price-sensitive buyers asking AI if ${brandName} justifies its price receive neutral answers without concrete proof of your superior lifespan and value.`,
          actionPlan: `Publish a "Cost-per-Use & Durability Breakdown" proving that ${brandName}'s premium materials outlast standard alternatives, demonstrating lower total cost of ownership.`,
          expectedImpact: `Convert hesitant, price-conscious shoppers into confident buyers.`,
          targetQuery: pricePrompt.query,
          competitorFocus: primaryComp,
          category: 'Value Justification',
          targetModel: 'LLM Synthesis',
          actionLabel: 'Generate AI Brief',
        });
      } else if (neutralPrompts.length > 0) {
        const targetNeutral = neutralPrompts[0];
        opps.push({
          id: `opp-neutral-${targetNeutral.id}`,
          title: `Turn Neutral Citations into #1 Recommendations in "${targetNeutral.query}"`,
          badge: 'Convert Neutral Citations',
          badgeType: 'amber',
          businessGap: `AI engines cite ${brandName} neutrally as one of many options, without highlighting why customers should pick you over alternatives.`,
          actionPlan: `Enrich product pages with verified customer satisfaction statistics, lab test certifications, and clear outcome badges so LLMs extract persuasive recommendation soundbites.`,
          expectedImpact: `Elevate recommendation conviction and turn passive citations into active referrals.`,
          targetQuery: targetNeutral.query,
          competitorFocus: primaryComp,
          category: 'Sentiment Lift',
          targetModel: 'Generative Search',
          actionLabel: 'Generate AI Brief',
        });
      } else if (missedPrompts.length > 1) {
        const secondMissed = missedPrompts[1];
        const comp = findTopCompetitor(secondMissed);
        opps.push({
          id: `opp-missed-2-${secondMissed.id}`,
          title: `Close Competitive Blindspot in "${secondMissed.query}"`,
          badge: 'Capture Unclaimed Volume',
          badgeType: 'rose',
          businessGap: `${comp} dominates AI citations for this problem query while ${brandName} is missing from the answer completely.`,
          actionPlan: `Publish a problem-solving guide with actionable advice and product placement to establish topical relevance.`,
          expectedImpact: `Capture inbound runner demand currently captured entirely by ${comp}.`,
          targetQuery: secondMissed.query,
          competitorFocus: comp,
          category: 'Demand Capture',
          targetModel: 'Multi-LLM Synthesis',
          actionLabel: 'Generate AI Brief',
        });
      } else {
        opps.push({
          id: 'opp-trust-general',
          title: `Embed Third-Party Trust Badges & Lab Certifications`,
          badge: '+18% Buyer Conversion',
          badgeType: 'emerald',
          businessGap: `Generative models favor brands that cite accredited third-party testing, medical endorsements, or clinical lab trials.`,
          actionPlan: `Add verifiable testing badges and expert endorsements to product descriptions so AI models quote hard proof points.`,
          expectedImpact: `Boost recommendation frequency in authoritative buyer queries.`,
          targetQuery: `Most durable ${category} brands`,
          competitorFocus: primaryComp,
          category: 'Trust & Authority',
          targetModel: 'Knowledge Graph',
          actionLabel: 'Generate AI Brief',
        });
      }
    } else {
      // PRE-AUDIT RECOMMENDATIONS: Clear business strategies before audit execution
      opps.push({
        id: 'opp-pre-1',
        title: `Launch Official "${brandName} vs ${primaryComp}" Comparison Hub`,
        badge: 'High Purchase Intent',
        badgeType: 'indigo',
        businessGap: `Generative engines synthesize comparison queries from unverified forums and competitor-biased blogs unless you provide an official side-by-side spec page.`,
        actionPlan: `Publish an objective, feature-by-feature comparison guide with verified pricing and warranty specs so AI models quote your domain directly.`,
        expectedImpact: `Win high-intent shoppers comparing you against ${primaryComp}.`,
        targetQuery: `${brandName} vs ${primaryComp} comparison`,
        competitorFocus: primaryComp,
        category: 'Buyer Conversion',
        targetModel: 'LLM Synthesis',
        actionLabel: 'Generate AI Brief',
      });
      opps.push({
        id: 'opp-pre-2',
        title: `Publish Definitive 2025 "${category}" Buyer's Guide`,
        badge: 'Category Leadership',
        badgeType: 'amber',
        businessGap: `AI engines prioritize structured, comprehensive buying guides when answering broad "Best in Category" queries.`,
        actionPlan: `Create an in-depth decision guide helping buyers choose the right product based on specific needs, durability, and budget.`,
        expectedImpact: `Establish topical authority to rank #1 in top-of-funnel generative searches.`,
        targetQuery: `Best ${category} for 2025`,
        competitorFocus: primaryComp,
        category: 'Top-of-Funnel SEO',
        targetModel: 'Generative AI Search',
        actionLabel: 'Generate AI Brief',
      });
      opps.push({
        id: 'opp-pre-3',
        title: `Embed Verifiable Lab Benchmarks & Customer Trust Signals`,
        badge: 'Sentiment & Trust',
        badgeType: 'emerald',
        businessGap: `LLMs default to neutral descriptions unless supported by concrete numbers, certified lab test results, or accredited reviews.`,
        actionPlan: `Publish quantifiable performance data (e.g. lifespan, materials, customer satisfaction rates) to give AI engines concrete reasons to recommend your brand.`,
        expectedImpact: `Drive enthusiastic, #1 recommendations instead of neutral mentions.`,
        targetQuery: `Most durable ${category} brands`,
        competitorFocus: primaryComp,
        category: 'Trust & Authority',
        targetModel: 'Multi-LLM Knowledge',
        actionLabel: 'Generate AI Brief',
      });
    }

    return opps.slice(0, 3);
  }, [brandName, category, competitors, prompts, hasAuditRun, primaryComp]);

  const handleOpenBrief = async (opp: BusinessOpportunity) => {
    setActiveModalOpp(opp);
    setBriefText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: opp.title,
          description: opp.businessGap,
          businessGap: opp.businessGap,
          actionPlan: opp.actionPlan,
          expectedImpact: opp.expectedImpact,
          targetQuery: opp.targetQuery,
          competitorFocus: opp.competitorFocus,
          brandName,
          targetModel: opp.targetModel,
        }),
      });

      const data = await res.json();
      if (data.briefMarkdown) {
        setBriefText(data.briefMarkdown);
      } else {
        setBriefText('### Failed to generate brief.\nPlease check that the AI provider is available.');
      }
    } catch {
      setBriefText('### Network error generating brief.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeStyle = (type: BusinessOpportunity['badgeType']) => {
    switch (type) {
      case 'amber':
        return {
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        };
      case 'emerald':
        return {
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        };
      case 'rose':
        return {
          background: 'rgba(244, 63, 94, 0.15)',
          color: '#fb7185',
          border: '1px solid rgba(244, 63, 94, 0.3)',
        };
      case 'indigo':
      default:
        return {
          background: 'rgba(99, 102, 241, 0.15)',
          color: '#a5b4fc',
          border: '1px solid rgba(99, 102, 241, 0.3)',
        };
    }
  };

  const getIconForCategory = (cat: string) => {
    if (cat.includes('Rank')) return <Target size={18} color="#fbbf24" />;
    if (cat.includes('Buyer') || cat.includes('Conversion')) return <ArrowRightLeft size={18} color="#818cf8" />;
    if (cat.includes('Demand') || cat.includes('Unclaimed')) return <Zap size={18} color="#f43f5e" />;
    if (cat.includes('Value') || cat.includes('Sentiment')) return <Sparkles size={18} color="#34d399" />;
    return <Award size={18} color="#38bdf8" />;
  };

  return (
    <>
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                Actionable GEO Opportunities
              </h3>
              <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                High-ROI Growth Engine
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Practical, business-focused strategies to increase {brandName} sales and #1 recommendations in AI search answers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <TrendingUp size={14} color="#fbbf24" />
            <span style={{ fontWeight: 600 }}>Commercial Impact Focus</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              style={{
                padding: '18px 20px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'all 200ms ease',
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getIconForCategory(opp.category)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                      {opp.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          ...getBadgeStyle(opp.badgeType),
                        }}
                      >
                        {opp.badge}
                      </span>
                      {opp.competitorFocus && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                          Competitor: <strong style={{ color: '#e2e8f0' }}>{opp.competitorFocus}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBrief(opp)}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.78rem',
                    padding: '8px 14px',
                    gap: '6px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    color: '#c7d2fe',
                  }}
                >
                  <Sparkles size={14} color="#818cf8" />
                  <span>{opp.actionLabel}</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Business Problem & Action Plan Callouts */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '10px',
                }}
              >
                {/* Current Bottleneck */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.04)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <AlertTriangle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#f87171' }}>
                      Current AI Search Bottleneck
                    </span>
                    <p style={{ fontSize: '0.79rem', color: '#cbd5e1', marginTop: '2px', lineHeight: 1.45 }}>
                      {opp.businessGap}
                    </p>
                  </div>
                </div>

                {/* Recommended Marketing Action */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(6, 182, 212, 0.04)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <Compass size={15} color="#22d3ee" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#22d3ee' }}>
                      Strategic Marketing Action
                    </span>
                    <p style={{ fontSize: '0.79rem', color: '#cbd5e1', marginTop: '2px', lineHeight: 1.45 }}>
                      {opp.actionPlan}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Meta Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '0.73rem',
                  color: 'var(--text-subtle)',
                  paddingTop: '4px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {opp.targetQuery && (
                    <span style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '2px 8px', borderRadius: '6px' }}>
                      Target Query: <span style={{ color: '#e2e8f0', fontStyle: 'italic' }}>&ldquo;{opp.targetQuery}&rdquo;</span>
                    </span>
                  )}
                  <span>Category: <strong style={{ color: '#cbd5e1' }}>{opp.category}</strong></span>
                </div>
                <span style={{ color: '#94a3b8' }}>
                  Impact: <strong style={{ color: '#38bdf8' }}>{opp.expectedImpact}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI GEO Brief Modal */}
      {activeModalOpp && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--bg-card-border)',
              borderRadius: '20px',
              maxWidth: '760px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--bg-card-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={18} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                    Executive GEO Brief: {activeModalOpp.title}
                  </h3>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Autonomous Growth & Content Playbook for {brandName} • Target: {activeModalOpp.targetModel}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveModalOpp(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                flex: 1,
                color: '#e2e8f0',
                fontSize: '0.88rem',
                lineHeight: '1.65',
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    padding: '70px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Loader2 size={32} className="animate-spin" color="#818cf8" />
                  <span style={{ fontSize: '0.9rem', color: '#c7d2fe', fontWeight: 600 }}>
                    Synthesizing executive GEO content brief with AI...
                  </span>
                  <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                    Formulating competitive conquest strategy, content structure, and proof data.
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '22px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '0.86rem',
                    lineHeight: '1.6',
                  }}
                >
                  {briefText}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!isLoading && (
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--bg-card-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  onClick={copyToClipboard}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '8px 14px', gap: '6px' }}
                >
                  {copied ? <Check size={14} color="#34d399" /> : null}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Brief Markdown'}</span>
                </button>
                <button
                  onClick={() => setActiveModalOpp(null)}
                  className="btn-primary"
                  style={{ fontSize: '0.82rem', padding: '8px 18px' }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
