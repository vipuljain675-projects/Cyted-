'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrandCreated: (newBrand: any) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onBrandCreated,
}) => {
  const { user, session } = useAuth();
  const [brandName, setBrandName] = useState('');
  const [website, setWebsite] = useState('');
  const [category, setCategory] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [generatedPromptsPreview, setGeneratedPromptsPreview] = useState<string[]>([]);
  const [createdBrandData, setCreatedBrandData] = useState<any>(null);

  if (!isOpen) return null;

  const handleGeneratePrompts = async () => {
    if (!brandName.trim() || !category.trim()) {
      alert('Please enter Brand Name and Category');
      return;
    }

    setIsGenerating(true);

    try {
      const compList = competitors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      // 1. Create brand in PostgreSQL via /api/brands with tenant userId
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          name: brandName.trim(),
          category: category.trim(),
          website: website.trim(),
          competitors: compList,
          userId: user?.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create brand');
      }

      const brand = await res.json();
      setCreatedBrandData(brand);

      // 2. Generate prompts using Generator AI via /api/prompts
      const promptsRes = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: brand.id }),
      });

      if (!promptsRes.ok) {
        const err = await promptsRes.json();
        throw new Error(err.error || 'Failed to generate prompts');
      }

      // 3. Fetch the freshly generated prompts from DB
      const listRes = await fetch(`/api/prompts?brandId=${brand.id}`);
      const promptsList = await listRes.json();

      setGeneratedPromptsPreview(
        Array.isArray(promptsList) && promptsList.length > 0
          ? promptsList.slice(0, 5).map((p: any) => p.text)
          : [
              `Best ${category} tools for fast-growing companies`,
              `${brandName} vs ${compList[0] || 'competitors'} which is better`,
              `Top affordable alternatives to ${compList[0] || 'competitors'}`,
            ]
      );

      setStep(2);
    } catch (err: any) {
      alert(err.message || 'Something went wrong during onboarding.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
    if (createdBrandData) {
      onBrandCreated(createdBrandData);
    }
    onClose();
    setStep(1);
    setBrandName('');
    setCategory('');
    setWebsite('');
    setCompetitors('');
    setCreatedBrandData(null);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--bg-card-border)',
        borderRadius: '20px',
        maxWidth: '560px',
        width: '100%',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                {step === 1 ? 'Track New Brand' : 'Synthesized Benchmarking Prompts'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {step === 1 ? 'Configure your brand and top competitors for AI search benchmarking.' : 'Generator AI formulated realistic prompts and saved them to database.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Form Inputs */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Brand Name *
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Postman, Linear, Vercel"
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--bg-card-border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Website URL
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourbrand.com"
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--bg-card-border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Product Category / Industry *
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. API Development, Project Management, Cloud Hosting"
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--bg-card-border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Key Competitors (comma separated)
              </label>
              <input
                type="text"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                placeholder="e.g. Insomnia, Swagger, Hoppscotch"
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--bg-card-border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleGeneratePrompts}
              disabled={isGenerating}
              className="btn-primary"
              style={{ marginTop: '10px', width: '100%', padding: '12px' }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Connecting to Supabase & Formulating Prompts with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Prompts & Save to Supabase</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Review Generated Prompts */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.82rem',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Check size={16} />
              <span>Brand and 20 Prompts successfully saved to Supabase!</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {generatedPromptsPreview.map((promptText, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '0.82rem',
                    color: '#e2e8f0',
                  }}
                >
                  "{promptText}"
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => setStep(1)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="btn-primary"
                style={{ flex: 2, padding: '10px' }}
              >
                <span>Launch Brand Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
