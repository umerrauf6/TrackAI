'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, ArrowLeft, Chrome, Github, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)'
      }}>
        Loading...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  // Handle URL query to show authentication errors
  useEffect(() => {
    const errCode = searchParams.get('error');
    if (errCode) {
      if (errCode === 'google_config_missing') {
        setError('Google OAuth is not configured on the server. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env.local.');
      } else if (errCode === 'github_config_missing') {
        setError('GitHub OAuth is not configured on the server. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to your .env.local.');
      } else if (errCode === 'google_auth_failed' || errCode === 'google_token_exchange_failed') {
        setError('Authentication with Google failed. Please try again.');
      } else if (errCode === 'github_auth_failed' || errCode === 'github_token_exchange_failed') {
        setError('Authentication with GitHub failed. Please try again.');
      } else {
        setError('An authentication error occurred. Please try again.');
      }
    }
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: 20
    }}>
      
      {/* Back to Home Link */}
      <a href="/" style={{
        position: 'absolute',
        top: 24,
        left: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: 500
      }}>
        <ArrowLeft size={16} /> Back to Home
      </a>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: 40,
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 50px rgba(139, 92, 246, 0.05)'
        }}
      >
        {/* Branding header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 16, display: 'inline-block' }}>
            <Logo size={44} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 6 }}>
            Sign In / Sign Up
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Sparkles size={12} color="var(--accent)" /> Access your automated career pipeline
          </p>
        </div>

        {/* Error Alert Box */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#ef4444',
                fontSize: 12,
                overflow: 'hidden',
                lineHeight: 1.4
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OAuth Authentication Button stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Continue with Google */}
          <a
            href="/api/auth/google"
            style={{ textDecoration: 'none' }}
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-secondary w-full"
              style={{
                background: '#ffffff',
                color: '#08090d',
                borderColor: '#ffffff',
                padding: '14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 4px 15px rgba(255, 255, 255, 0.15)'
              }}
            >
              <Chrome size={18} fill="#4285F4" stroke="none" />
              Continue with Google
            </motion.button>
          </a>

          {/* Continue with GitHub */}
          <a
            href="/api/auth/github"
            style={{ textDecoration: 'none' }}
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary btn-glow w-full"
              style={{
                background: '#24292e',
                borderColor: '#3f4448',
                color: '#ffffff',
                padding: '14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)'
              }}
            >
              <Github size={18} />
              Continue with GitHub
            </motion.button>
          </a>

        </div>

        <div style={{ height: 1, background: 'var(--border-color)', margin: '24px 0' }}></div>

        {/* Notice text */}
        <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', lineHeight: 1.4 }}>
          By continuing, you agree to secure authentication. The application will scan and parse only your job application confirmation and update emails.
        </p>

      </motion.div>
    </div>
  );
}
