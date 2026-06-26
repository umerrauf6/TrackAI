'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, AlertCircle, CheckCircle2, ArrowLeft,
  Chrome, Github, Sparkles, KeyRound, RefreshCw, Send
} from 'lucide-react';
import Logo from '../components/Logo';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

type Step = 'email' | 'otp';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  // OTP boxes
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState(0);

  // Handle OAuth error query params
  useEffect(() => {
    const errCode = searchParams.get('error');
    if (!errCode) return;
    const msgs: Record<string, string> = {
      google_config_missing: 'Google OAuth is not configured on the server.',
      github_config_missing: 'GitHub OAuth is not configured on the server.',
      google_auth_failed: 'Authentication with Google failed. Please try again.',
      github_auth_failed: 'Authentication with GitHub failed. Please try again.',
      google_token_exchange_failed: 'Authentication with Google failed. Please try again.',
      github_token_exchange_failed: 'Authentication with GitHub failed. Please try again.',
    };
    setError(msgs[errCode] || 'An authentication error occurred. Please try again.');
  }, [searchParams]);

  // Countdown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function clearMessages() { setError(''); setInfo(''); }

  // ── Step 1: Send OTP ──────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpMessage(data.message || 'Check your email for a 6-digit code.');
        setCooldown(60);
        setStep('otp');
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      } else {
        setError(data.error || 'Failed to send code. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP ────────────────────────────────────────────────────
  async function handleResend() {
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setInfo('A new code has been sent to your email.');
        setCooldown(60);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } else {
        setError(data.error || 'Failed to resend code.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid or expired code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // ── OTP box handlers ──────────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => { if (i < 6) newOtp[i] = char; });
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  // ─────────────────────────────────────────────────────────────────
  const cardVariants = {
    enter:  { y: 28, opacity: 0 },
    center: { y: 0,  opacity: 1, transition: { duration: 0.38, ease: 'easeOut' } },
    exit:   { y: -16, opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 20 }}>

      {/* Back button */}
      <AnimatePresence>
        {step === 'email' ? (
          <motion.a key="home" href="/" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Home
          </motion.a>
        ) : (
          <motion.button key="back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { clearMessages(); setOtp(['', '', '', '', '', '']); setStep('email'); }}
            style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">

        {/* ── STEP: Email Entry ── */}
        {step === 'email' && (
          <motion.div key="email-step" variants={cardVariants} initial="enter" animate="center" exit="exit"
            className="glass-panel"
            style={{ width: '100%', maxWidth: 440, padding: 40, borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 50px rgba(139,92,246,0.06)' }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ marginBottom: 16, display: 'inline-block' }}><Logo size={44} /></div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 6 }}>Sign In to TrackAI</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Sparkles size={12} color="var(--accent)" /> No password needed — we'll email you a code
              </p>
            </div>

            <ErrorAlert error={error} info={info} />

            {/* Email form */}
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label htmlFor="email-input" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px', background: 'var(--glass-bg)',
                      border: '1px solid var(--border-color)', borderRadius: 8, color: 'white',
                      fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
                  />
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                style={{
                  background: 'var(--accent)', border: 'none', color: 'white',
                  padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
                }}
              >
                <Send size={16} />
                {loading ? 'Sending Code…' : 'Send Sign-In Code'}
              </motion.button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>or sign in with</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>

            {/* OAuth */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="/api/auth/google" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', background: '#ffffff', color: '#08090d', border: 'none', padding: '13px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 15px rgba(255,255,255,0.15)' }}
                >
                  <Chrome size={18} fill="#4285F4" stroke="none" /> Continue with Google
                </motion.button>
              </a>
              <a href="/api/auth/github" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', background: '#24292e', color: '#fff', border: '1px solid #3f4448', padding: '13px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  <Github size={18} /> Continue with GitHub
                </motion.button>
              </a>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', lineHeight: 1.5, marginTop: 20 }}>
              New here? Just enter your email — we'll create your account automatically.
            </p>
          </motion.div>
        )}

        {/* ── STEP: OTP Verification ── */}
        {step === 'otp' && (
          <motion.div key="otp-step" variants={cardVariants} initial="enter" animate="center" exit="exit"
            className="glass-panel"
            style={{ width: '100%', maxWidth: 440, padding: 40, borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
          >
            {/* Icon + Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}
              >
                <KeyRound size={26} color="var(--accent)" />
              </motion.div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 6 }}>Check Your Email</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>
                {otpMessage}
              </p>
              <p style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600 }}>{email}</p>
            </div>

            <ErrorAlert error={error} info={info} />

            {/* OTP boxes */}
            <form onSubmit={handleVerify}>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
                {otp.map((digit, i) => (
                  <motion.input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.05 * i, duration: 0.25 }}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    style={{
                      width: 52, height: 62,
                      textAlign: 'center',
                      fontSize: 26, fontWeight: 700,
                      borderRadius: 10,
                      border: `2px solid ${digit ? 'var(--accent)' : 'var(--border-color)'}`,
                      background: digit ? 'rgba(192,132,252,0.08)' : 'rgba(255,255,255,0.03)',
                      color: 'white',
                      outline: 'none',
                      transition: 'border-color 0.15s, background 0.15s',
                      caretColor: 'var(--accent)',
                      boxShadow: digit ? '0 0 12px rgba(192,132,252,0.2)' : 'none',
                    }}
                  />
                ))}
              </div>

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                style={{
                  width: '100%', background: 'var(--accent)', border: 'none', color: 'white',
                  padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
                }}
              >
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </motion.button>
            </form>

            {/* Resend */}
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              {cooldown > 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Resend code in <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{cooldown}s</span>
                </p>
              ) : (
                <button onClick={handleResend} disabled={loading}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={14} /> Resend Code
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────

function ErrorAlert({ error, info }: { error: string; info: string }) {
  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div key="err"
          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', fontSize: 13, overflow: 'hidden', lineHeight: 1.4 }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </motion.div>
      )}
      {info && !error && (
        <motion.div key="info"
          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#22c55e', fontSize: 13, overflow: 'hidden', lineHeight: 1.4 }}
        >
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{info}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
