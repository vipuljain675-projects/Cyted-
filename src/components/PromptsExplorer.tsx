'use client';

import React, { useState } from 'react';
import { Search, Eye, Filter, CheckCircle, XCircle, ArrowRight, MessageSquareCode, X } from 'lucide-react';

export interface ModelResponseDetail {
  model: string;
  rawText: string;
  isMentioned: boolean;
  position: number | null;
  sentiment: string;
  insight: string;
  competitorsMentioned?: string[];
}

export interface PromptItem {
  id: string;
  query: string;
  category: 'Discovery' | 'Comparison' | 'Alternative' | 'Problem-Solving';
  isMentioned: boolean;
  position: number | null;
  sentiment: 'positive' | 'neutral' | 'negative' | 'none';
  testedModels: string[];
  sampleAiResponse: string;
  annotatedInsight: string;
  modelResponses?: ModelResponseDetail[];
}

interface PromptsExplorerProps {
  prompts?: PromptItem[];
}

export const PromptsExplorer: React.FC<PromptsExplorerProps> = ({ prompts = [] }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activePromptModal, setActivePromptModal] = useState<PromptItem | null>(null);
  const [selectedModelTab, setSelectedModelTab] = useState<number>(0);

  const categories = ['All', 'Discovery', 'Comparison', 'Alternative', 'Problem-Solving'];

  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch = p.query.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Generated Prompts & Audit Trace
            </h3>
            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              {prompts.length} Active Prompts
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Search queries autonomously formulated by Generator AI and evaluated across LLMs.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={15} color="var(--text-subtle)" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
          }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompt queries..."
            style={{
              width: '100%',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--bg-card-border)',
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: selectedCategory === cat ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
              background: selectedCategory === cat ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: selectedCategory === cat ? '#a5b4fc' : 'var(--text-muted)',
              transition: 'all 150ms ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prompts Table */}
      <div style={{
        overflowX: 'auto',
        borderRadius: '10px',
        border: '1px solid var(--bg-card-border)',
        background: 'rgba(0, 0, 0, 0.25)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bg-card-border)', color: 'var(--text-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Prompt Query</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Visibility Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Rank</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sentiment</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrompts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No prompts found. Click "Run GEO Audit" or generate prompts for this brand.
                </td>
              </tr>
            ) : (
              filteredPrompts.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 150ms ease',
                  }}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f1f5f9', maxWidth: '340px' }}>
                    {item.query}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {item.testedModels && item.testedModels.length > 0 ? (
                      item.isMentioned ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 600 }}>
                          <CheckCircle size={14} /> Mentioned
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 500 }}>
                          <XCircle size={14} /> Not Cited
                        </span>
                      )
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontWeight: 500 }}>
                        <XCircle size={14} /> Pending Audit
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                    {item.position ? (
                      <span style={{ color: item.position === 1 ? '#38bdf8' : '#cbd5e1' }}>
                        #{item.position}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {item.testedModels && item.testedModels.length > 0 ? (
                      item.isMentioned ? (
                        item.sentiment === 'positive' ? (
                          <span className="badge badge-emerald">Positive</span>
                        ) : item.sentiment === 'negative' ? (
                          <span className="badge badge-red">Negative</span>
                        ) : (
                          <span className="badge badge-amber">Neutral</span>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>—</span>
                      )
                    ) : (
                      <span className="badge badge-zinc">Pending Audit</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setActivePromptModal(item);
                        setSelectedModelTab(0);
                      }}
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Eye size={12} />
                      <span>View Response</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect AI Response Modal */}
      {activePromptModal && (() => {
        const formatModelName = (name: string) => {
          const lower = name.toLowerCase();
          if (lower.includes('gemini') || lower.includes('gemma')) return 'Google AI (Gemini)';
          if (lower.includes('oss') || lower.includes('120b') || lower.includes('gpt')) return 'Groq GPT-OSS 120B';
          if (lower.includes('qwen') || lower.includes('groq')) return 'Groq Qwen 3.8 27B';
          return name;
        };

        const rawModelResponses = activePromptModal.modelResponses || [];
        // Deduplicate: Keep only the single response per provider
        const seen = new Set<string>();
        const modelResponses = rawModelResponses.filter((mr) => {
          const key = formatModelName(mr.model);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const activeResp = modelResponses[selectedModelTab] || {
          model: activePromptModal.testedModels?.[0] || 'AI Model',
          rawText: activePromptModal.sampleAiResponse,
          isMentioned: activePromptModal.isMentioned,
          position: activePromptModal.position,
          sentiment: activePromptModal.sentiment,
          insight: activePromptModal.annotatedInsight,
          competitorsMentioned: [],
        };

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--bg-card-border)',
              borderRadius: '16px',
              maxWidth: '720px',
              width: '100%',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquareCode size={20} color="#818cf8" />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                    AI Response Inspector
                  </h4>
                </div>
                <button
                  onClick={() => setActivePromptModal(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Queried Prompt */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.85rem',
              }}>
                <span style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>Queried Prompt:</span>
                <div style={{ color: '#fff', fontWeight: 600, marginTop: '4px' }}>
                  "{activePromptModal.query}"
                </div>
              </div>

              {/* Model Tabs if multiple responses exist */}
              {modelResponses.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Select Foundation Model ({modelResponses.length} Tested):
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {modelResponses.map((mr, idx) => {
                      const isSelected = selectedModelTab === idx;
                      return (
                        <button
                          key={mr.model + idx}
                          onClick={() => setSelectedModelTab(idx)}
                          style={{
                            padding: '7px 14px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: isSelected ? '#fff' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 150ms ease',
                          }}
                        >
                          <span>{formatModelName(mr.model)}</span>
                          {mr.isMentioned ? (
                            <span style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                            }}>
                              Mentioned {mr.position ? `#${mr.position}` : '✓'}
                            </span>
                          ) : (
                            <span style={{
                              background: 'rgba(248, 113, 113, 0.15)',
                              color: '#f87171',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                            }}>
                              Not Cited
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Raw Response */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Raw Response from <strong style={{ color: '#a5b4fc' }}>{formatModelName(activeResp.model)}</strong>:
                  </span>
                </div>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '0.82rem',
                  lineHeight: '1.6',
                  color: '#cbd5e1',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}>
                  {activeResp.rawText}
                </div>
              </div>

              {/* Extraction Insight */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc' }}>
                  ANALYZER EXTRACTION INSIGHT:
                </span>
                <p style={{ fontSize: '0.82rem', color: '#e0e7ff', lineHeight: '1.4' }}>
                  {activeResp.insight}
                </p>
                {activeResp.competitorsMentioned && activeResp.competitorsMentioned.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                    Competitors Cited by this model: <strong style={{ color: '#f1f5f9' }}>{activeResp.competitorsMentioned.join(', ')}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setActivePromptModal(null)}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '8px 18px' }}
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
