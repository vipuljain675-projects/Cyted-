'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  Eye as EyeIcon,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Award,
  Bot,
  Zap,
  Check,
  Eye,
  ShieldCheck
} from 'lucide-react';

export const LandingHero: React.FC = () => {
  const { signInWithGoogle, signInWithMicrosoft, signInWithEmail, signUpWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [authLoading, setAuthLoading] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading('google');
      setAuthError(null);
      const { error } = await signInWithGoogle();
      if (error) {
        setAuthError(error.message);
        setAuthLoading(null);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in with Google');
      setAuthLoading(null);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      setAuthLoading('microsoft');
      setAuthError(null);
      const { error } = await signInWithMicrosoft();
      if (error) {
        setAuthError(error.message);
        setAuthLoading(null);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in with Microsoft');
      setAuthLoading(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in both email and password.');
      return;
    }

    try {
      setAuthLoading('email');
      setAuthError(null);
      const { error } = await signInWithEmail(email, password);
      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          const { error: signUpError } = await signUpWithEmail(email, password, {
            full_name: email.split('@')[0],
            company: 'Brand HQ',
          });
          if (signUpError) {
            setAuthError(error.message);
            setAuthLoading(null);
          } else {
            setAuthSuccess('Account created & signing in...');
          }
        } else {
          setAuthError(error.message);
          setAuthLoading(null);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
      setAuthLoading(null);
    }
  };

  const handleAutofillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setAuthError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      backgroundImage: `
        linear-gradient(to right, rgba(226, 232, 240, 0.75) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(226, 232, 240, 0.75) 1px, transparent 1px)
      `,
      backgroundSize: '32px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      zIndex: 10,
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#0f172a',
    }}>
      {/* Main 2-Column Split Layout */}
      <div style={{
        maxWidth: '1380px',
        width: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
        gap: '48px',
        alignItems: 'center',
      }}>
        {/* ========================================================
            LEFT COLUMN: Brand Story + The 4 GEO Cards (Replacing the black box!)
           ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Brand Logo & Cloud Version Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(2, 101, 210, 0.25)',
                border: '1px solid rgba(2, 101, 210, 0.3)',
                flexShrink: 0,
              }}>
                <img
                  src="/cyted-logo.png"
                  alt="Cyted Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 850, letterSpacing: '-0.03em', color: '#0f172a' }}>
                Cyted <span style={{ color: '#0265d2' }}>AI</span>
              </span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#0265d2',
              fontSize: '0.73rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0265d2' }} />
              <span>ENTERPRISE CLOUD V4.2</span>
            </div>
          </div>

          {/* Eyebrow Label */}
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: '#0265d2',
            marginTop: '8px',
          }}>
            CYTED AI WORKSPACE & GEO PLATFORM
          </div>

          {/* Main Title */}
          <h1 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            fontWeight: 850,
            lineHeight: 1.15,
            letterSpacing: '-0.035em',
            color: '#0f172a',
          }}>
            The unified generative search intelligence platform for modern brands.
          </h1>

          {/* Subtitle Description */}
          <p style={{
            fontSize: '0.94rem',
            color: '#64748b',
            lineHeight: 1.6,
            maxWidth: '560px',
          }}>
            Cyted AI monitors and optimizes your brand visibility across ChatGPT, Google Gemini, and Groq — with autonomous GEO audits tracking Share of Voice, analyzing recommendation ranks, and discovering high-impact AI content gaps.
          </p>

          {/* ========================================================
              THE 4 GEO CARDS (Placed directly on the left in a 2x2 grid!)
             ======================================================== */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
            marginTop: '12px',
          }}>
            {/* Card 1: AI Visibility Rate */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px',
              boxShadow: '0 6px 18px -4px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#eef2ff',
                  border: '1px solid #e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4f46e5',
                }}>
                  <Eye size={18} />
                </div>
                <span style={{
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '9999px',
                }}>
                  Live Coverage
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  AI Visibility Rate
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, marginTop: '3px' }}>
                  Track % of generative queries where your brand is cited and recommended.
                </p>
              </div>
            </div>

            {/* Card 2: Share of Voice (SOV) */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px',
              boxShadow: '0 6px 18px -4px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#f0f9ff',
                  border: '1px solid #e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7',
                }}>
                  <TrendingUp size={18} />
                </div>
                <span style={{
                  background: '#fff7ed',
                  color: '#c2410c',
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '9999px',
                }}>
                  Leaderboard
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  Share of Voice (SOV)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, marginTop: '3px' }}>
                  Benchmark brand citation share vs direct competitors across LLMs.
                </p>
              </div>
            </div>

            {/* Card 3: Average Recommendation Rank */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px',
              boxShadow: '0 6px 18px -4px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706',
                }}>
                  <Award size={18} />
                </div>
                <span style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '9999px',
                }}>
                  #1 Placement
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  Average Rank
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, marginTop: '3px' }}>
                  Determine whether models cite you as #1 choice or secondary alternative.
                </p>
              </div>
            </div>

            {/* Card 4: Actionable AI Content Gaps */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px',
              boxShadow: '0 6px 18px -4px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#ecfdf5',
                  border: '1px solid #d1fae5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                }}>
                  <Bot size={18} />
                </div>
                <span style={{
                  background: '#f0fdf4',
                  color: '#15803d',
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '9999px',
                }}>
                  High-ROI Briefs
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  Actionable Content Gaps
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, marginTop: '3px' }}>
                  Identify queries where competitors win and receive GEO authority briefs.
                </p>
              </div>
            </div>
          </div>

          {/* Foundation Models Strip */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginTop: '4px',
            boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
            flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 700 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Tested Models:</span> Google Gemini 2.5 • Groq Llama 3.3 • ChatGPT
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#047857',
                background: '#ecfdf5',
                padding: '2px 8px',
                borderRadius: '6px',
              }}>
                ● Live Realtime Audits
              </span>
            </div>
          </div>

          {/* Compliance trust text */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.74rem',
            color: '#64748b',
            marginTop: '2px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontWeight: 600, color: '#0f172a' }}>All systems operational</span>
            </div>
            <span>•</span>
            <span>Enterprise Supabase Auth</span>
            <span>•</span>
            <span>SOC2 Type II</span>
            <span>•</span>
            <span>TLS 1.3</span>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: Extended Floating Auth Card (Stretches across right column!)
           ======================================================== */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'stretch' }}>
          <div style={{
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            padding: '40px 36px',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.09), 0 0 1px 1px rgba(226, 232, 240, 0.9)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}>
            {/* Card Header (NO ADMIN TABS!) */}
            <div>
              <h2 style={{
                fontSize: '1.85rem',
                fontWeight: 850,
                letterSpacing: '-0.025em',
                color: '#0f172a',
              }}>
                Welcome back
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                Sign in to your Cyted AI workspace.
              </p>
            </div>

            {/* Feedback Alerts */}
            {authError && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 14px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.82rem',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 14px',
                borderRadius: '10px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontSize: '0.82rem',
              }}>
                <Check size={16} style={{ flexShrink: 0 }} />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Side-by-Side Social OAuth Buttons (Google & Microsoft) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading !== null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '9px',
                  padding: '12px 14px',
                  borderRadius: '11px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  fontSize: '0.88rem',
                  fontWeight: 650,
                  cursor: authLoading !== null ? 'wait' : 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>{authLoading === 'google' ? 'Connecting...' : 'Google'}</span>
              </button>

              <button
                type="button"
                onClick={handleMicrosoftSignIn}
                disabled={authLoading !== null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '9px',
                  padding: '12px 14px',
                  borderRadius: '11px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  fontSize: '0.88rem',
                  fontWeight: 650,
                  cursor: authLoading !== null ? 'wait' : 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                <span>{authLoading === 'microsoft' ? 'Connecting...' : 'Microsoft'}</span>
              </button>
            </div>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.74rem',
              color: '#94a3b8',
            }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span>or continue with enterprise email</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 650, color: '#0f172a', marginBottom: '6px' }}>
                  Work email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} color="#94a3b8" style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@company.com"
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '11px',
                      padding: '11px 14px 11px 40px',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 650, color: '#0f172a' }}>
                    Password
                  </label>
                  <a href="#" style={{ fontSize: '0.78rem', color: '#0265d2', fontWeight: 600, textDecoration: 'none' }}>
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} color="#94a3b8" style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '11px',
                      padding: '11px 40px 11px 40px',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '13px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <EyeIcon size={17} />}
                  </button>
                </div>
              </div>

              {/* Keep me signed in */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#0265d2', cursor: 'pointer', width: '15px', height: '15px' }}
                />
                <label htmlFor="remember" style={{ fontSize: '0.82rem', color: '#64748b', cursor: 'pointer' }}>
                  Keep me signed in for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading !== null}
                style={{
                  width: '100%',
                  background: '#0265d2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '11px',
                  padding: '13px 18px',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  cursor: authLoading !== null ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(2, 101, 210, 0.28)',
                  transition: 'background 0.15s ease',
                  marginTop: '2px',
                }}
              >
                {authLoading === 'email' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing in to Cyted AI...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Cyted AI</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div style={{ fontSize: '0.74rem', color: '#94a3b8', textAlign: 'center', marginTop: '-4px' }}>
              Preview build — sign-in is secured with Supabase Auth.
            </div>

            {/* Instant Demo Access (Exact OneDesk Feature) */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e0f2fe',
              borderRadius: '14px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#0265d2',
                  fontSize: '0.77rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}>
                  <Zap size={14} fill="#0265d2" />
                  <span>INSTANT DEMO ACCESS</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                  Just reviewing? Credentials are shown live — click to autofill.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div
                  onClick={() => handleAutofillDemo('demo@cyted.ai', 'demo2026!')}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '0.76rem', fontWeight: 750, color: '#0f172a' }}>
                    Brand Manager
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                    demo@cyted.ai
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#0265d2', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span>Use brand demo</span>
                    <span>→</span>
                  </div>
                </div>

                <div
                  onClick={() => handleAutofillDemo('vipuljain675@gmail.com', 'ViPULMAC17$')}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '0.76rem', fontWeight: 750, color: '#0f172a' }}>
                    Admin Lead
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                    vipuljain675@...
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#0265d2', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span>Use admin demo</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signup Link */}
            <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
              Don't have an enterprise account?{' '}
              <Link href="/signup" style={{ color: '#0265d2', fontWeight: 700, textDecoration: 'none' }}>
                Create one free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
