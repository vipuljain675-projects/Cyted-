'use client';

import React from 'react';
import { Cpu, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface ModelComparisonProps {
  brandName?: string;
  hasAuditRun?: boolean;
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({
  brandName = 'Your Brand',
  hasAuditRun = false,
}) => {
  const models = [
    {
      name: 'Qwen 3.8 27B',
      provider: 'Groq (Ultra-fast Inference)',
      badge: 'badge-emerald',
      status: hasAuditRun ? 'Analyzed ✓' : 'Pending Audit',
      highlight: hasAuditRun
        ? `Groq evaluated. Tests how high-speed open-weight LLMs rank and recommend ${brandName}.`
        : `Click "Audit AI Visibility" to evaluate Groq model recommendation patterns.`,
    },
    {
      name: 'Gemini 3.5 Flash',
      provider: 'Google AI (Gemini Engine)',
      badge: 'badge-cyan',
      status: hasAuditRun ? 'Analyzed ✓' : 'Pending Audit',
      highlight: hasAuditRun
        ? `Google AI evaluated across all prompts. High reasoning quality and stable citations for ${brandName}.`
        : `Click "Audit AI Visibility" to test ${brandName} across Google AI.`,
    },
    {
      name: 'GPT-OSS 120B',
      provider: 'Groq (120B Flagship Open LLM)',
      badge: 'badge-indigo',
      status: hasAuditRun ? 'Analyzed ✓' : 'Pending Audit',
      highlight: hasAuditRun
        ? `Groq GPT-OSS evaluated. High-capacity 120B parameter model testing deep category citations for ${brandName}.`
        : `Click "Audit AI Visibility" to test ${brandName} across Groq 120B engine.`,
    },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Multi-LLM Intelligence Matrix
            </h3>
            <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
              {models.length} Providers
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Compare how different foundation models perceive and recommend {brandName}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
          <Cpu size={14} color="#818cf8" />
          <span>Real API Benchmarks</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {models.map((model) => (
          <div
            key={model.name}
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'all 200ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                  {model.name}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  {model.provider}
                </span>
              </div>
              <span className={`badge ${model.badge}`} style={{ fontSize: '0.68rem' }}>
                {model.status}
              </span>
            </div>

            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {hasAuditRun ? (
                <CheckCircle2 size={16} color="#34d399" />
              ) : (
                <Clock size={16} color="var(--text-subtle)" />
              )}
              <span style={{ fontSize: '0.82rem', color: hasAuditRun ? '#34d399' : 'var(--text-subtle)', fontWeight: 600 }}>
                {hasAuditRun ? 'All prompts tested' : 'Awaiting audit run'}
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
              {model.highlight}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
