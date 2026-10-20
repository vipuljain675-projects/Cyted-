'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { LandingHero } from '@/components/LandingHero';
import { MetricCard } from '@/components/MetricCard';
import { ShareOfVoiceChart, CompetitorSOV } from '@/components/ShareOfVoiceChart';
import { ModelComparison } from '@/components/ModelComparison';
import { PromptsExplorer, PromptItem } from '@/components/PromptsExplorer';
import { ContentOpportunities } from '@/components/ContentOpportunities';
import { OnboardingModal } from '@/components/OnboardingModal';
import { GeoCopilotDrawer } from '@/components/GeoCopilotDrawer';
import { Eye, TrendingUp, Award, Smile, Plus, Sparkles, RefreshCw } from 'lucide-react';

export interface BrandData {
  id: string;
  name: string;
  website: string;
  category: string;
  competitors: string[];
  visibility: number;
  visibilityChange: string;
  sov: number;
  sovChange: string;
  avgRank: number | string;
  sentiment: number;
  competitorSOV: CompetitorSOV[];
  prompts: PromptItem[];
  hasAuditRun: boolean;
}

export default function DashboardPage() {
  const { user, session, loading: authLoading } = useAuth();

  const [brands, setBrands] = useState<BrandData[]>([]);
  const [currentBrandId, setCurrentBrandId] = useState<string>('');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotWidth, setCopilotWidth] = useState(460);
  const [isCopilotDragging, setIsCopilotDragging] = useState(false);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditStatusText, setAuditStatusText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const loadBrandDetails = useCallback(async (brandId: string, baseBrandInfo: any) => {
    try {
      const promptsRes = await fetch(`/api/prompts?brandId=${brandId}`);
      const rawPrompts = await promptsRes.json();

      let trackedBrandMentionsCount = 0;
      let totalResponsesWithTracking = 0;
      let totalRanksSum = 0;
      let rankedCount = 0;
      let positiveCount = 0;

      const formattedPrompts: PromptItem[] = Array.isArray(rawPrompts) && rawPrompts.length > 0
        ? rawPrompts.map((p: any) => {
            const allResponses = Array.isArray(p.responses) ? p.responses : [];
            const hasResponse = allResponses.length > 0;

            // Find tracked mention across any model response for this prompt
            let trackedMention = null;
            let bestResponse = allResponses[0] || null;

            for (const resp of allResponses) {
              const m = (resp.mentions || []).find((mention: any) => mention.isTrackedBrand);
              if (m) {
                trackedMention = m;
                bestResponse = resp;
                break;
              }
            }

            if (hasResponse) {
              totalResponsesWithTracking++;
              if (trackedMention) {
                trackedBrandMentionsCount++;
                if (trackedMention.position) {
                  totalRanksSum += trackedMention.position;
                  rankedCount++;
                }
                if (trackedMention.sentiment === 'positive') {
                  positiveCount++;
                }
              }
            }

            const isMentioned = Boolean(trackedMention);
            const position = trackedMention?.position || null;
            const sentiment = trackedMention ? trackedMention.sentiment : 'none';
            const modelsTested: string[] = Array.from(
              new Set<string>(allResponses.map((r: any) => String(r.model)).filter(Boolean))
            );

            const modelResponses = allResponses.map((r: any) => {
              const m = (r.mentions || []).find((mention: any) => mention.isTrackedBrand);
              const compMentions = (r.mentions || [])
                .filter((mention: any) => !mention.isTrackedBrand)
                .map((mention: any) => mention.brandName);

              return {
                model: r.model,
                rawText: r.rawText,
                isMentioned: Boolean(m),
                position: m?.position || null,
                sentiment: m?.sentiment || 'none',
                insight: m
                  ? `Ranked #${m.position || 'Cited'} by ${r.model}. Context snippet: "${m.contextSnippet}"`
                  : `MISSING: ${baseBrandInfo.name} was not cited in ${r.model}'s answer.`,
                competitorsMentioned: compMentions,
              };
            });

            return {
              id: p.id,
              query: p.text,
              category: p.type === 'comparison' ? 'Comparison' : p.type === 'alternative' ? 'Alternative' : 'Discovery',
              isMentioned,
              position,
              sentiment,
              testedModels: modelsTested,
              sampleAiResponse: bestResponse
                ? bestResponse.rawText
                : 'No audit run executed for this query yet. Click "Audit AI Visibility" above to test this query against foundation models.',
              annotatedInsight: trackedMention
                ? `Ranked #${trackedMention.position || 'Cited'} by AI. Context snippet: "${trackedMention.contextSnippet}"`
                : bestResponse
                ? 'MISSING: Brand was not cited in this AI answer. High-priority GEO opportunity!'
                : 'Pending initial audit run.',
              modelResponses,
            };
          })
        : [];

      const hasAuditRun = totalResponsesWithTracking > 0;

      // Real calculated metrics (0 when no audit has been run yet)
      const realVisibility = hasAuditRun
        ? Number(((trackedBrandMentionsCount / totalResponsesWithTracking) * 100).toFixed(1))
        : 0;

      const realAvgRank = rankedCount > 0
        ? Number((totalRanksSum / rankedCount).toFixed(1))
        : '—';

      const realSentiment = trackedBrandMentionsCount > 0
        ? Number(((positiveCount / trackedBrandMentionsCount) * 100).toFixed(1))
        : 0;

      const analyticsRes = await fetch(`/api/analytics?brandId=${brandId}`);
      const analytics = await analyticsRes.json();

      const compNames = baseBrandInfo.competitors?.map((c: any) => typeof c === 'string' ? c : c.name) || [];

      // Build competitor SOV from REAL analytics data
      const sovFromAPI = analytics.shareOfVoice || [];
      const sovMap: Record<string, { mentionCount: number; sharePercent: number }> = {};
      for (const entry of sovFromAPI) {
        sovMap[entry.brandName] = { mentionCount: entry.mentionCount, sharePercent: entry.sharePercent };
      }

      // Compute real competitor mention data from responses
      const competitorMentionData: Record<string, { count: number; posSum: number; posCount: number; positiveSent: number }> = {};
      if (Array.isArray(rawPrompts)) {
        for (const p of rawPrompts) {
          const resp = p.responses?.[0];
          if (!resp) continue;
          for (const m of (resp.mentions || [])) {
            if (!competitorMentionData[m.brandName]) {
              competitorMentionData[m.brandName] = { count: 0, posSum: 0, posCount: 0, positiveSent: 0 };
            }
            competitorMentionData[m.brandName].count++;
            if (m.position) {
              competitorMentionData[m.brandName].posSum += m.position;
              competitorMentionData[m.brandName].posCount++;
            }
            if (m.sentiment === 'positive') {
              competitorMentionData[m.brandName].positiveSent++;
            }
          }
        }
      }

      const sovData: CompetitorSOV[] = [
        {
          name: baseBrandInfo.name,
          share: hasAuditRun ? (sovMap[baseBrandInfo.name]?.sharePercent ?? realVisibility) : 0,
          mentions: trackedBrandMentionsCount,
          avgPosition: typeof realAvgRank === 'number' ? realAvgRank : 0,
          sentiment: hasAuditRun ? `${realSentiment}% Pos` : '—',
          isPrimary: true,
        },
        ...compNames.map((c: string) => {
          const cData = competitorMentionData[c];
          const cSOV = sovMap[c];
          return {
            name: c,
            share: hasAuditRun ? (cSOV?.sharePercent ?? (cData ? Math.round((cData.count / Math.max(1, totalResponsesWithTracking)) * 100) : 0)) : 0,
            mentions: cData?.count ?? 0,
            avgPosition: cData?.posCount ? Number((cData.posSum / cData.posCount).toFixed(1)) : 0,
            sentiment: hasAuditRun ? (cData ? `${cData.count > 0 ? Math.round((cData.positiveSent / cData.count) * 100) : 0}% Pos` : '0% Pos') : '—',
            isPrimary: false,
          };
        }),
      ];

      return {
        id: brandId,
        name: baseBrandInfo.name,
        website: baseBrandInfo.website || '',
        category: baseBrandInfo.category,
        competitors: compNames,
        visibility: realVisibility,
        visibilityChange: hasAuditRun ? 'Live' : 'Pending',
        sov: hasAuditRun ? analytics.shareOfVoice?.[0]?.sharePercent || realVisibility : 0,
        sovChange: hasAuditRun ? 'Live' : 'Pending',
        avgRank: realAvgRank,
        sentiment: realSentiment,
        competitorSOV: sovData,
        prompts: formattedPrompts,
        hasAuditRun,
      };
    } catch (e) {
      console.error('[loadBrandDetails error]', e);
      return null;
    }
  }, []);

  const refreshBrandsFromDB = useCallback(async () => {
    if (!user) {
      setIsLoaded(true);
      return;
    }
    try {
      const res = await fetch(`/api/brands?userId=${user.id}`, {
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      });
      const dbBrands = await res.json();

      if (Array.isArray(dbBrands) && dbBrands.length > 0) {
        const loadedList: BrandData[] = [];
        for (const b of dbBrands) {
          const detail = await loadBrandDetails(b.id, b);
          if (detail) loadedList.push(detail);
        }
        if (loadedList.length > 0) {
          setBrands(loadedList);
          setCurrentBrandId((prev) => prev || loadedList[0].id);
        } else {
          setBrands([]);
          setCurrentBrandId('');
        }
      } else {
        setBrands([]);
        setCurrentBrandId('');
      }
    } catch (err) {
      console.error('[refreshBrandsFromDB]', err);
    } finally {
      setIsLoaded(true);
    }
  }, [user, session, loadBrandDetails]);

  // Only fetch brands from DB if the user is signed in
  useEffect(() => {
    if (user) {
      refreshBrandsFromDB();
    } else {
      setIsLoaded(true);
    }
  }, [user, refreshBrandsFromDB]);

  const activeBrand = brands.find((b) => b.id === currentBrandId);

  const handleBrandCreated = async (createdBrand: any) => {
    await refreshBrandsFromDB();
    if (createdBrand?.id) {
      setCurrentBrandId(createdBrand.id);
    }
  };

  const handleTriggerAudit = async () => {
    if (!activeBrand) return;
    setIsRunningAudit(true);
    setAuditProgress(5);
    setAuditStatusText(`Dispatching multi-LLM audit for "${activeBrand.name}"...`);

    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: activeBrand.id }),
      });
      const runData = await res.json();

      if (!runData.runId) {
        setAuditStatusText('Failed to start audit run');
        setIsRunningAudit(false);
        return;
      }

      const totalJobs = runData.totalJobs || 30;
      setAuditProgress(10);
      setAuditStatusText(`Querying AI models... (0/${totalJobs} completed)`);

      // Poll real progress every 3 seconds
      const interval = setInterval(async () => {
        try {
          const checkRes = await fetch(`/api/runs?runId=${runData.runId}`);
          const checkData = await checkRes.json();
          const completed = checkData.completedJobs || 0;
          const total = checkData.totalJobs || totalJobs;
          const pct = Math.min(98, Math.round((completed / total) * 100));

          setAuditProgress(pct);
          setAuditStatusText(`Querying AI models & extracting mentions... (${completed}/${total} completed)`);

          if (checkData.status === 'completed' || completed >= total) {
            clearInterval(interval);
            setAuditProgress(100);
            setAuditStatusText('✅ GEO audit complete — metrics updated!');
            await refreshBrandsFromDB();
            setTimeout(() => {
              setIsRunningAudit(false);
              setAuditProgress(0);
            }, 2000);
          }
        } catch {
          // keep polling on network blip
        }
      }, 3000);
    } catch (err) {
      console.error('Audit failed', err);
      setAuditStatusText('Audit failed — check console for details');
      setTimeout(() => setIsRunningAudit(false), 3000);
    }
  };

  // 1. Initial Auth Loading State
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: 'var(--bg-main)',
      }}>
        <div style={{
          position: 'relative',
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
        }}>
          <img
            src="/cyted-logo.png"
            alt="Cyted Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <RefreshCw size={16} className="animate-spin" color="#818cf8" />
          <span>Initializing Cyted Engine...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State: Show Frontpage with Logo & Features (Mechanism as requested)
  if (!user) {
    return <LandingHero />;
  }

  // 3. Authenticated Data Loading State
  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={24} className="animate-spin" color="#818cf8" />
      </div>
    );
  }

  // 4. Authenticated Workspace Dashboard
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        paddingRight: isCopilotOpen ? `${copilotWidth}px` : '0',
        transition: isCopilotDragging ? 'none' : 'padding-right 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}
    >
      <Navbar
        currentBrandId={currentBrandId}
        brands={brands.map((b) => ({ id: b.id, name: b.name, category: b.category }))}
        onBrandChange={setCurrentBrandId}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onTriggerAudit={handleTriggerAudit}
        isRunningAudit={isRunningAudit}
        onOpenCopilot={() => setIsCopilotOpen((prev) => !prev)}
      />

      <main
        style={{
          maxWidth: isCopilotOpen ? '100%' : '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '30px 28px 60px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          transition: 'max-width 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {isRunningAudit && (
          <div className="glass-card" style={{
            padding: '16px 20px',
            borderColor: 'rgba(99, 102, 241, 0.5)',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} className="animate-spin" color="#818cf8" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e0e7ff' }}>
                  {auditStatusText}
                </span>
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#a5b4fc' }}>
                {auditProgress}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${auditProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                transition: 'width 400ms ease',
              }} />
            </div>
          </div>
        )}

        {brands.length === 0 ? (
          <div className="glass-card" style={{
            padding: '70px 30px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            maxWidth: '720px',
            margin: '40px auto',
          }}>
            <div style={{
              width: '88px',
              height: '88px',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
            }}>
              <img
                src="/cyted-logo.png"
                alt="Cyted Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
                Start Tracking Your AI Search Visibility
              </h2>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--text-muted)',
                marginTop: '10px',
                lineHeight: '1.6',
                maxWidth: '540px',
              }}>
                Traditional SEO tracks Google rankings. <strong>Cyted</strong> measures whether ChatGPT, Gemini, and Groq recommend your brand when customers ask for solutions.
              </p>
            </div>

            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="btn-primary"
              style={{ padding: '14px 28px', fontSize: '0.95rem' }}
            >
              <Sparkles size={18} />
              <span>Track Your First Brand</span>
            </button>
          </div>
        ) : activeBrand ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
                    {activeBrand.name} AI Search Overview
                  </h1>
                  <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                    Category: {activeBrand.category}
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Evaluating brand mentions, recommendation rankings, and citations across 3 foundation models.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                >
                  <Plus size={15} />
                  <span>Track Another Brand</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              <MetricCard
                title="AI Visibility Rate"
                value={activeBrand.hasAuditRun ? `${activeBrand.visibility}%` : '0%'}
                change={activeBrand.visibilityChange}
                isPositive={activeBrand.hasAuditRun}
                subtitle={activeBrand.hasAuditRun ? "Mentioned in target queries across tested LLMs" : "Pending audit run across models"}
                icon={<Eye size={18} />}
                accentColor="99, 102, 241"
              />

              <MetricCard
                title="Share of Voice (SOV)"
                value={activeBrand.hasAuditRun ? `${activeBrand.sov}%` : '0%'}
                change={activeBrand.sovChange}
                isPositive={activeBrand.hasAuditRun}
                subtitle={activeBrand.hasAuditRun ? "Category recommendation share vs competitors" : "Pending audit run across models"}
                icon={<TrendingUp size={18} />}
                accentColor="6, 182, 212"
              />

              <MetricCard
                title="Average Recommended Rank"
                value={activeBrand.hasAuditRun && activeBrand.avgRank !== '—' ? `#${activeBrand.avgRank}` : '—'}
                change={activeBrand.hasAuditRun ? "Live" : "Awaiting Run"}
                isPositive={activeBrand.hasAuditRun}
                subtitle="Average recommendation position when cited"
                icon={<Award size={18} />}
                accentColor="245, 158, 11"
              />

              <MetricCard
                title="Positive Sentiment Rate"
                value={activeBrand.hasAuditRun ? `${activeBrand.sentiment}%` : '0%'}
                change={activeBrand.hasAuditRun ? "Live" : "Pending"}
                isPositive={activeBrand.hasAuditRun}
                subtitle="Context sentiment extracted by Analyzer"
                icon={<Smile size={18} />}
                accentColor="16, 185, 129"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
              <ShareOfVoiceChart
                brandName={activeBrand.name}
                competitors={activeBrand.competitorSOV}
              />
              <ContentOpportunities
                brandName={activeBrand.name}
                category={activeBrand.category}
                competitors={activeBrand.competitors}
                prompts={activeBrand.prompts}
                hasAuditRun={activeBrand.hasAuditRun}
              />
            </div>

            <ModelComparison
              brandName={activeBrand.name}
              hasAuditRun={activeBrand.hasAuditRun}
            />

            <PromptsExplorer prompts={activeBrand.prompts} />
          </>
        ) : null}
      </main>

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onBrandCreated={handleBrandCreated}
      />

      {/* Floating Action Button for Cyted GEO Copilot */}
      {activeBrand && !isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          style={{
            position: 'fixed',
            bottom: '26px',
            right: '28px',
            zIndex: 80,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            borderRadius: '9999px',
            padding: '12px 20px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 32px rgba(99, 102, 241, 0.45), 0 2px 10px rgba(0, 0, 0, 0.6)',
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 14px 40px rgba(99, 102, 241, 0.6), 0 4px 14px rgba(0, 0, 0, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 32px rgba(99, 102, 241, 0.45), 0 2px 10px rgba(0, 0, 0, 0.6)';
          }}
        >
          <Sparkles size={16} color="#fff" />
          <span>Ask Cyted AI</span>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.22)',
              padding: '2px 7px',
              borderRadius: '9999px',
              fontSize: '0.67rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
          >
            Copilot
          </span>
        </button>
      )}

      {/* Slide-out GEO Copilot Drawer */}
      {activeBrand && (
        <GeoCopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          width={copilotWidth}
          onWidthChange={setCopilotWidth}
          onDragChange={setIsCopilotDragging}
          brandName={activeBrand.name}
          category={activeBrand.category}
          metrics={{
            visibility: activeBrand.visibility,
            sov: activeBrand.sov,
            avgRank: activeBrand.avgRank,
            sentiment: activeBrand.sentiment,
          }}
          competitors={activeBrand.competitorSOV}
          prompts={activeBrand.prompts}
        />
      )}
    </div>
  );
}
