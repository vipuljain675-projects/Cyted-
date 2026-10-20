'use client';

import React from 'react';
import { Trophy, TrendingUp, HelpCircle } from 'lucide-react';

export interface CompetitorSOV {
  name: string;
  share: number; // percentage (e.g. 42.8)
  mentions: number; // total out of 30
  avgPosition: number; // rank, e.g. 1.8
  sentiment: string; // "92% Pos"
  isPrimary?: boolean;
}

interface ShareOfVoiceChartProps {
  brandName: string;
  competitors: CompetitorSOV[];
}

export const ShareOfVoiceChart: React.FC<ShareOfVoiceChartProps> = ({
  brandName,
  competitors,
}) => {
  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Share of Voice (SOV) Benchmark
            </h3>
            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
              Multi-LLM Aggregated
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Percentage of total AI brand recommendations across tested LLM providers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
          <Trophy size={14} color="#f59e0b" />
          <span>Category Leaderboard</span>
        </div>
      </div>

      {/* Competitor Bars List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {competitors.map((item, idx) => {
          const isPrimary = item.isPrimary || item.name.toLowerCase() === brandName.toLowerCase();
          return (
            <div
              key={item.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: isPrimary ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: isPrimary ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(255, 255, 255, 0.04)',
                transition: 'all 200ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: idx === 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: idx === 0 ? '#fbbf24' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{
                    fontWeight: isPrimary ? 800 : 600,
                    fontSize: '0.92rem',
                    color: isPrimary ? '#a5b4fc' : '#f1f5f9',
                  }}>
                    {item.name} {isPrimary && '(Your Brand)'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-subtle)' }}>
                    Mentions: <strong style={{ color: '#e2e8f0' }}>{item.mentions}</strong>
                  </span>
                  <span style={{ color: 'var(--text-subtle)' }}>
                    Avg Rank: <strong style={{ color: '#e2e8f0' }}>{item.avgPosition && item.avgPosition > 0 ? `#${item.avgPosition}` : '—'}</strong>
                  </span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: isPrimary ? '#818cf8' : '#cbd5e1',
                    minWidth: '50px',
                    textAlign: 'right',
                  }}>
                    {item.share}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div style={{
                width: '100%',
                height: '8px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div
                  style={{
                    width: `${item.share}%`,
                    height: '100%',
                    borderRadius: '9999px',
                    background: isPrimary
                      ? 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)'
                      : idx === 0
                      ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
                      : 'linear-gradient(90deg, #475569 0%, #64748b 100%)',
                    boxShadow: isPrimary ? '0 0 12px rgba(99, 102, 241, 0.6)' : 'none',
                    transition: 'width 800ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
