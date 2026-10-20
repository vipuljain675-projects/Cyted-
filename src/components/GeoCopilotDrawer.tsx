'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  Target,
  Zap,
  GripVertical,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface GeoCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  width?: number;
  onWidthChange?: (newWidth: number) => void;
  onDragChange?: (isDragging: boolean) => void;
  brandName?: string;
  category?: string;
  metrics?: {
    visibility: number | string;
    sov: number | string;
    avgRank: number | string;
    sentiment: number | string;
  };
  competitors?: any[];
  prompts?: any[];
}

export const GeoCopilotDrawer: React.FC<GeoCopilotDrawerProps> = ({
  isOpen,
  onClose,
  width = 460,
  onWidthChange,
  onDragChange,
  brandName = 'Your Brand',
  category = 'Industry Category',
  metrics = { visibility: 0, sov: 0, avgRank: '—', sentiment: 0 },
  competitors = [],
  prompts = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState<number>(width || 460);
  const [isDragging, setIsDragging] = useState(false);
  const [isWide, setIsWide] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal width when prop changes
  useEffect(() => {
    if (width && width !== panelWidth) {
      setPanelWidth(width);
    }
  }, [width]);

  // Drag-to-slide resize listener (supports mouse and touch)
  useEffect(() => {
    const updateWidthFromClientX = (clientX: number) => {
      const rawWidth = window.innerWidth - clientX;
      const minW = 360;
      const maxW = Math.min(window.innerWidth - 300, 960);

      // Snap close if dragged too far right
      if (rawWidth < 220) {
        onClose();
        setIsDragging(false);
        if (onDragChange) onDragChange(false);
        return;
      }

      const clamped = Math.max(minW, Math.min(maxW, rawWidth));
      setPanelWidth(clamped);
      if (onWidthChange) onWidthChange(clamped);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updateWidthFromClientX(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !e.touches[0]) return;
      updateWidthFromClientX(e.touches[0].clientX);
    };

    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        if (onDragChange) onDragChange(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, onWidthChange, onDragChange, onClose]);

  const applyWidth = (newW: number) => {
    setPanelWidth(newW);
    setIsWide(newW >= 660);
    if (onWidthChange) onWidthChange(newW);
  };

  const toggleWide = () => {
    const nextWide = !isWide;
    setIsWide(nextWide);
    const targetW = nextWide ? 700 : 460;
    applyWidth(targetW);
  };

  // Initialize first greeting when drawer opens or brand changes
  useEffect(() => {
    if (messages.length === 0 && brandName) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `👋 Hi! I'm **Cyted Copilot**, your dedicated AI Search Strategist.

I've loaded live audit intelligence for **${brandName}**:
• **AI Visibility**: ${metrics.visibility}% across tested models
• **Share of Voice**: ${metrics.sov}% vs competitors
• **Average Position**: #${metrics.avgRank}
• **Positive Sentiment**: ${metrics.sentiment}%

Ask me how to overtake competitors, fix neutral citations, or capture high-intent buyers!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [brandName, metrics, messages.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Format competitor data for API
  const competitorContext = (competitors || []).map((c: any) => ({
    name: c.name || c,
    share: c.share,
    avgPosition: c.avgPosition,
    mentions: c.mentions,
  }));

  // Format prompts summary for API
  const promptsSummary = (prompts || []).slice(0, 10).map((p: any) => ({
    query: p.query,
    position: p.position,
    sentiment: p.sentiment,
    isMentioned: p.isMentioned,
    competitor: p.modelResponses?.[0]?.competitorsMentioned?.[0] || 'Competitors',
  }));

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newThread = [...messages, userMsg];
    setMessages(newThread);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          category,
          metrics,
          competitors: competitorContext,
          promptsSummary,
          messages: newThread.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Apologies, I encountered an issue analyzing your live search data.';

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('[Copilot send error]', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: 'Network connection error. Please verify the AI engine status and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickChips = [
    { label: 'Overtake Nike for #1', prompt: `How specifically can ${brandName} overtake Nike to capture the #1 position in 2025 running shoe queries?` },
    { label: 'Fix 33% Sentiment Gap', prompt: `Why is our positive sentiment only ${metrics.sentiment}% and what exact proof points should we add to product pages?` },
    { label: 'Defend Price vs Brooks', prompt: `How should we structure content to overcome price objections when AI compares ${brandName} to Brooks?` },
    { label: 'Top AI Search Blindspots', prompt: `Based on the audit prompts, which customer queries represent our biggest missed demand?` },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Side-by-Side Docked Copilot Panel — Drag-to-Slide */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: `${panelWidth}px`,
          height: '100vh',
          background: 'rgba(10, 13, 20, 0.98)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '-8px 0 35px rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(20px)',
          zIndex: 85,
          display: 'flex',
          flexDirection: 'column',
          animation: isDragging ? 'none' : 'slideInRight 260ms cubic-bezier(0.16, 1, 0.3, 1)',
          transition: isDragging ? 'none' : 'width 200ms ease',
        }}
      >
        {/* Drag Handle — Left edge resize bar & grab pill */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
            if (onDragChange) onDragChange(true);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            if (onDragChange) onDragChange(true);
          }}
          onDoubleClick={() => toggleWide()}
          title="Drag to slide & resize panel (or double-click to toggle)"
          style={{
            position: 'absolute',
            top: 0,
            left: '-12px',
            width: '24px',
            height: '100%',
            cursor: 'ew-resize',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Subtle vertical indicator bar */}
          <div
            style={{
              position: 'absolute',
              left: '11px',
              top: 0,
              bottom: 0,
              width: '2px',
              background: isDragging ? '#6366f1' : 'transparent',
              boxShadow: isDragging ? '0 0 12px #6366f1' : 'none',
              transition: 'background 150ms ease, box-shadow 150ms ease',
            }}
          />

          {/* Visual grab pill tab */}
          <div
            style={{
              position: 'relative',
              width: '20px',
              height: '56px',
              borderRadius: '10px',
              background: isDragging ? '#6366f1' : 'rgba(26, 31, 46, 0.95)',
              border: isDragging ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: isDragging
                ? '0 0 16px rgba(99, 102, 241, 0.5)'
                : '0 4px 14px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDragging ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              transition: 'all 150ms ease',
              backdropFilter: 'blur(8px)',
            }}
          >
            <GripVertical size={13} />
          </div>
        </div>

        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.01)',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} color="#fff" />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
                  Cyted Copilot
                </h3>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399' }} />
                  Live Context
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                AI Search Growth Advisor for <strong style={{ color: '#cbd5e1' }}>{brandName}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Quick width presets */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '2px',
                gap: '2px',
              }}
            >
              <button
                onClick={() => applyWidth(460)}
                title="Default Width (460px)"
                style={{
                  fontSize: '0.67rem',
                  fontWeight: 600,
                  padding: '3px 7px',
                  borderRadius: '6px',
                  background: panelWidth <= 500 ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: panelWidth <= 500 ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                460px
              </button>
              <button
                onClick={() => applyWidth(680)}
                title="Split View (680px)"
                style={{
                  fontSize: '0.67rem',
                  fontWeight: 600,
                  padding: '3px 7px',
                  borderRadius: '6px',
                  background: panelWidth > 500 && panelWidth < 800 ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: panelWidth > 500 && panelWidth < 800 ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                680px
              </button>
              <button
                onClick={() => applyWidth(900)}
                title="Expanded Wide View (900px)"
                style={{
                  fontSize: '0.67rem',
                  fontWeight: 600,
                  padding: '3px 7px',
                  borderRadius: '6px',
                  background: panelWidth >= 800 ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: panelWidth >= 800 ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                Wide
              </button>
            </div>

            {/* Expand / Collapse toggle */}
            <button
              onClick={toggleWide}
              title={isWide ? 'Collapse panel to default' : 'Expand panel wider'}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {isWide ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              title="Close Copilot"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Quick Starter Chips */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            background: 'rgba(99, 102, 241, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#a5b4fc', fontWeight: 700 }}>
            <Zap size={12} color="#818cf8" />
            <span>QUICK STRATEGY QUESTIONS</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.prompt)}
                disabled={isLoading}
                style={{
                  fontSize: '0.72rem',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  textAlign: 'left',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.68rem',
                    color: 'var(--text-subtle)',
                    padding: '0 4px',
                  }}
                >
                  {isUser ? (
                    <>
                      <span>You</span>
                      <User size={12} />
                    </>
                  ) : (
                    <>
                      <Bot size={12} color="#818cf8" />
                      <span style={{ color: '#a5b4fc', fontWeight: 700 }}>Cyted Copilot</span>
                    </>
                  )}
                  <span>• {msg.timestamp}</span>
                </div>

                <div
                  style={{
                    maxWidth: '92%',
                    padding: '12px 14px',
                    borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isUser
                      ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.07)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    lineHeight: '1.55',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    position: 'relative',
                  }}
                >
                  {msg.content}

                  {!isUser && (
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                        paddingTop: '6px',
                      }}
                    >
                      <button
                        onClick={() => copyMessage(msg.id, msg.content)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: copiedId === msg.id ? '#34d399' : 'var(--text-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.68rem',
                        }}
                      >
                        {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontSize: '0.76rem', padding: '10px 4px' }}>
              <Loader2 size={16} className="animate-spin" color="#818cf8" />
              <span>Analyzing live search audit & formulating strategy...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(10, 13, 20, 0.98)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '6px 8px 6px 14px',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${brandName} rankings, Nike, or content...`}
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: inputValue.trim() && !isLoading ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 150ms ease',
              }}
            >
              <Send size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-subtle)', padding: '0 4px' }}>
            <span>Powered by Gemini & Groq Multi-LLM Context</span>
            <span>Press <strong>Enter ↵</strong></span>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
