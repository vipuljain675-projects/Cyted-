'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Plus,
  Play,
  ShieldCheck,
  ChevronDown,
  User as UserIcon,
  LogOut,
  LogIn,
  ArrowRight
} from 'lucide-react';

interface BrandOption {
  id: string;
  name: string;
  category: string;
}

interface NavbarProps {
  currentBrandId: string;
  brands: BrandOption[];
  onBrandChange: (brandId: string) => void;
  onOpenOnboarding: () => void;
  onTriggerAudit: () => void;
  isRunningAudit: boolean;
  onOpenCopilot?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentBrandId,
  brands,
  onBrandChange,
  onOpenOnboarding,
  onTriggerAudit,
  isRunningAudit,
  onOpenCopilot,
}) => {
  const { user, signOut, signInWithGoogle, signInWithMicrosoft } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Extract user details from Supabase metadata
  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User';

  const userAvatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  return (
    <header style={{
      width: '100%',
      borderBottom: '1px solid var(--bg-card-border)',
      background: 'rgba(7, 9, 14, 0.92)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Brand Logo & Platform Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            flexShrink: 0,
          }}>
            <img
              src="/cyted-logo.png"
              alt="Cyted Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
                Cyted
              </span>
              <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                GEO Engine
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              AI Search Analytics & Visibility Platform
            </div>
          </div>
        </Link>

        {/* Brand Selector Dropdown (Only for Authenticated Users) */}
        {user && brands.length > 0 && (
          <div style={{ marginLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 500 }}>
              Tracking:
            </span>
            <div style={{ position: 'relative' }}>
              <select
                value={currentBrandId}
                onChange={(e) => onBrandChange(e.target.value)}
                style={{
                  appearance: 'none',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--bg-card-border)',
                  borderRadius: '8px',
                  padding: '6px 32px 6px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.category})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} color="var(--text-muted)" style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons & Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user ? (
          /* Authenticated Controls */
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '9999px',
              fontSize: '0.76rem',
              color: '#34d399',
              fontWeight: 600,
            }}>
              <ShieldCheck size={14} />
              <span>Engine Ready</span>
            </div>

            <button
              onClick={onOpenOnboarding}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '7px 13px' }}
            >
              <Plus size={15} />
              <span>Add Brand</span>
            </button>

            {onOpenCopilot && brands.length > 0 && (
              <button
                onClick={onOpenCopilot}
                className="btn-secondary"
                title="Open Cyted GEO Copilot"
                style={{
                  fontSize: '0.82rem',
                  padding: '7px 13px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  color: '#c7d2fe',
                  gap: '6px',
                }}
              >
                <Sparkles size={14} color="#818cf8" />
                <span>Ask AI</span>
              </button>
            )}

            <button
              onClick={onTriggerAudit}
              disabled={isRunningAudit || brands.length === 0}
              className="btn-primary"
              style={{
                fontSize: '0.82rem',
                padding: '7px 15px',
                opacity: isRunningAudit || brands.length === 0 ? 0.6 : 1,
                cursor: isRunningAudit || brands.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Play size={14} fill="#fff" />
              <span>{isRunningAudit ? 'Running Audit...' : 'Audit AI Visibility'}</span>
            </button>

            {/* User Profile & Sign Out */}
            <div style={{
              marginLeft: '6px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              paddingLeft: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div
                title={user.email || userDisplayName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '4px 10px 4px 4px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userDisplayName}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}>
                    {userDisplayName[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userDisplayName}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                title="Sign out of Cyted"
                className="btn-secondary"
                style={{
                  padding: '7px 11px',
                  fontSize: '0.78rem',
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                  gap: '6px',
                }}
              >
                <LogOut size={14} />
                <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          </>
        ) : (
          /* Unauthenticated Controls */
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Quick OAuth icons */}
            <button
              onClick={() => signInWithGoogle()}
              title="Sign In with Google"
              className="btn-secondary"
              style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            </button>

            <button
              onClick={() => signInWithMicrosoft()}
              title="Sign In with Microsoft"
              className="btn-secondary"
              style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            >
              <svg width="15" height="15" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
            </button>

            <Link
              href="/login"
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '7px 14px', gap: '6px' }}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </Link>

            <Link
              href="/signup"
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '7px 15px', gap: '6px' }}
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
