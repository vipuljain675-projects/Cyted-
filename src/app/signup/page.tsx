'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Lock, Mail, User, Building, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { user, signInWithGoogle, signInWithMicrosoft, signUpWithEmail } = useAuth();

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUpWithEmail(email, password, {
        full_name: fullName,
        company: companyName,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
      } else {
        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Signup failed');
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setSocialLoading('google');
      setErrorMessage(null);
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error.message);
        setSocialLoading(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google signup failed');
      setSocialLoading(null);
    }
  };

  const handleMicrosoftSignup = async () => {
    try {
      setSocialLoading('microsoft');
      setErrorMessage(null);
      const { error } = await signInWithMicrosoft();
      if (error) {
        setErrorMessage(error.message);
        setSocialLoading(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Microsoft signup failed');
      setSocialLoading(null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      background: 'radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.15), rgba(7, 9, 14, 0.95) 70%)',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '25%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)',
        filter: 'blur(75px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        filter: 'blur(75px)',
        pointerEvents: 'none',
      }} />

      {/* Auth Glass Card */}
      <div className="glass-card" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '38px 36px',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 1,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 92, 246, 0.15)',
      }}>
        {/* Brand & Logo Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
          <Link href="/" style={{
            position: 'relative',
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.6)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            cursor: 'pointer',
          }}>
            <img
              src="/cyted-logo.png"
              alt="Cyted Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Link>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
                Join Cyted
              </h1>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                Free 14-Day Trial
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Start tracking your brand visibility in generative search
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            color: '#fca5a5',
            fontSize: '0.82rem',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '10px',
            color: '#6ee7b7',
            fontSize: '0.82rem',
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Social Registration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={socialLoading !== null || isLoading}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '11px', gap: '8px', justifyContent: 'center' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>{socialLoading === 'google' ? 'Connecting...' : 'Google'}</span>
          </button>

          <button
            type="button"
            onClick={handleMicrosoftSignup}
            disabled={socialLoading !== null || isLoading}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '11px', gap: '8px', justifyContent: 'center' }}
          >
            <svg width="17" height="17" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            <span>{socialLoading === 'microsoft' ? 'Connecting...' : 'Microsoft'}</span>
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--text-subtle)',
          fontSize: '0.74rem',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
          <span>OR SIGN UP WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--text-subtle)" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }} />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--bg-card-border)',
                  borderRadius: '10px',
                  padding: '10px 14px 10px 38px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
              Company / Brand
            </label>
            <div style={{ position: 'relative' }}>
              <Building size={16} color="var(--text-subtle)" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }} />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--bg-card-border)',
                  borderRadius: '10px',
                  padding: '10px 14px 10px 38px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
              Work Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-subtle)" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@acme.com"
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--bg-card-border)',
                  borderRadius: '10px',
                  padding: '10px 14px 10px 38px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-subtle)" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--bg-card-border)',
                  borderRadius: '10px',
                  padding: '10px 14px 10px 38px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || socialLoading !== null}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating Workspace...</span>
              </>
            ) : (
              <>
                <span>Start Free 14-Day Trial</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'underline' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
