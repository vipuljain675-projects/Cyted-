'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setErrorMsg(errorDescription || error);
          return;
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setErrorMsg(exchangeError.message);
            return;
          }
        }

        // Verify session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/');
        } else {
          // If no session yet, wait briefly for Supabase listener or redirect
          setTimeout(() => {
            router.replace('/');
          }, 1000);
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setErrorMsg(err.message || 'Authentication failed');
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15), rgba(7, 9, 14, 0.96) 70%)',
      padding: '24px',
    }}>
      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '36px',
        borderRadius: '20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        <div style={{
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

        {errorMsg ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#f87171',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}>
              <AlertCircle size={20} />
              <span>Authentication Error</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {errorMsg}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              Return to Login
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={20} className="animate-spin" color="#818cf8" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                Securing Your Session...
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Verifying your identity with Cyted GEO Engine. Redirecting you to your workspace.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="animate-spin" color="#818cf8" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
