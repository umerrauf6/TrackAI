'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, AlertCircle, CheckCircle2,
  ArrowLeft, Chrome, Github, Sparkles, KeyRound, RefreshCw, Eye, EyeOff
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

type Step = 'choose' | 'signin' | 'signup' | 'otp';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<Step>('choose');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpReason, setOtpReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP boxes
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpCooldown, setOtpCooldown] = useState(0);

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

  // OTP countdown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  function clearMessages() { setError(''); setInfo(''); }

  // ── Sign In ──────────────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.requiresOtp) {
        // OAuth account — redirect to OTP
        setOtpEmail(email);
        setOtpReason(data.message || '');
        await sendOtp(email);
        setStep('otp');
      } else if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Sign Up ──────────────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (data.requiresOtp) {
        setOtpEmail(email);
        setOtpReason('We sent a verification code to your email.');
        setOtpCooldown(60);
        setStep('otp');
      } else {
        setError(data.error || 'Sign up failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── OTP Send ─────────────────────────────────────────────────────
  async function sendOtp(targetEmail: string) {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to send OTP');
    setOtpCooldown(60);
  }

  async function handleResendOtp() {
    clearMessages();
    setLoading(true);
    try {
      await sendOtp(otpEmail);
      setInfo('A new code has been sent to your email.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── OTP Verify ───────────────────────────────────────────────────
  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, code }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid code.');
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  }

  // ── OTP input handlers ────────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => { if (i < 6) newOtp[i] = char; });
    setOtp(newOtp);
    const lastFilled = Math.min(pasted.length, 5);
    otpRefs.current[lastFilled]?.focus();
  }

  // ────────────────────────────────────────────────────────────────
  const cardVariants = {
    enter: { y: 24, opacity: 0 },
    center: { y: 0, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { y: -16, opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 20 }}>
      {/* Back button */}
      <AnimatePresence>
        {step === 'choose' ? (
          <motion.a
            key="home-link"
            href="/"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
          >
            <ArrowLeft size={16} /> Back to Home
          </motion.a>
        ) : (
          <motion.button
            key="back-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { clearMessages(); setStep(step === 'otp' ? mode : 'choose'); }}
            style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          >
            <ArrowLeft size={16} /> Back
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ── STEP: Choose ── */}
        {step === 'choose' && (
          <motion.div key="choose" variants={cardVariants} initial="enter" animate="center" exit="exit"
            className="glass-panel"
            style={{ width: '100%', maxWidth: 440, padding: 40, borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 50px rgba(139,92,246,0.05)' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ marginBottom: 16, display: 'inline-block' }}><Logo size={44} /></div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 6 }}>Welcome to TrackAI</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Sparkles size={12} color="var(--accent)" /> Your automated career pipeline
              </p>
            </div>

            <ErrorAlert error={error} info={info} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Email options */}
              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setMode('signin'); clearMessages(); setStep('signin'); }}
                  style={{ flex: 1, background: 'var(--accent)', border: 'none', color: 'white', padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Mail size={16} /> Sign In
                </motion.button>
                <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setMode('signup'); clearMessages(); setStep('signup'); }}
                  style={{ flex: 1, background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <User size={16} /> Sign Up
                </motion.button>
              </div>

              <Divider label="or continue with" />

              {/* OAuth */}
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

            <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', lineHeight: 1.4, marginTop: 20 }}>
              By continuing, you agree to secure authentication. The app scans only job-related emails.
            </p>
          </motion.div>
        )}

        {/* ── STEP: Sign In ── */}
        {step === 'signin' && (
          <motion.div key="signin" variants={cardVariants} initial="enter" animate="center" exit="exit"
            className="glass-panel"
            style={{ width: '100%', maxWidth: 440, padding: 40, borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ marginBottom: 12, display: 'inline-block' }}><Logo size={36} /></div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>Sign In</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Welcome back! Enter your credentials.</p>
            </div>

            <ErrorAlert error={error} info={info} />

            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <InputField id="signin-email" label="Email" type="email" value={email} onChange={setEmail} icon={<Mail size={16} />} placeholder="you@example.com" />
              <InputField id="signin-password" label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} icon={<Lock size={16} />} placeholder="••••••••"
                suffix={
                  <button type="button" onClick={() => setShowPassword(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                style={{ background: 'var(--accent)', border: 'none', color: 'white', padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </motion.button>
            </form>

            <Divider label="or" />
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
              Don&apos;t have an account?{' '}
              <button onClick={() => { clearMessages(); setMode('signup'); setStep('signup'); }} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                Sign Up
              </button>
            </p>
          </motion.div>
        )}

        {/* ── STEP: Sign Up ── */}
        {step === 'signup' && (
          <motion.div key="signup" variants={cardVariants} initial="enter" animate="center" exit="exit"
            className="glass-panel"
            style={{ width: '100%', maxWidth: 440, padding: 40, borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ marginBottom: 12, display: 'inline-block' }}><Logo size={36} /></div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>Create Account</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Start tracking your career journey.</p>
            </div>

            <ErrorAlert error={error} info={info} />

            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <InputField id="signup-name" label="Full Name" type="text" value={name} onChange={setName} icon={<User size={16} />} placeholder="John Doe" />
              <InputField id="signup-email" label="Email" type="email" value={email} onChange={setEmail} icon={<Mail size={16} />} placeholder="you@example.com" />
              <InputField id="signup-password" label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={setPassword} icon={<Lock size={16} />} placeholder="Min. 6 characters"
                suffix={
                  <button type="button" onClick={() => setShowPassword(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                style={{ background: 'var(--accent)', border: 'none', color: 'white', padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </motion.button>
            </form>

            <Divider label="or" />
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
              Already have an account?{' '}
              <button onClick={() => { clearMessages(); setMode('signin'); setStep('signin'); }} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                Sign In
              </button>
            </p>
          </motion.div>
        )}

        {/* ── STEP: OTP ── */}
        {step === 'otp' && (
          <motion.div key="otp" variants={cardVariants} initial="enter" animate="center" exit="exit"
            className="glass-panel"
            style={{ width: '100%', maxWidth: 440, padding: 40, borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <KeyRound size={24} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>Check Your Email</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                {otpReason || 'We sent a 6-digit code to'}
              </p>
              <p style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600, marginTop: 4 }}>{otpEmail}</p>
            </div>

            <ErrorAlert error={error} info={info} />

            <form onSubmit={handleOtpVerify}>
              {/* 6 OTP boxes */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    id={`otp-box-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    style={{
                      width: 52, height: 60,
                      textAlign: 'center',
                      fontSize: 24, fontWeight: 700,
                      borderRadius: 10,
                      border: `2px solid ${digit ? 'var(--accent)' : 'var(--border-color)'}`,
                      background: digit ? 'rgba(192,132,252,0.08)' : 'var(--glass-bg)',
                      color: 'white',
                      outline: 'none',
                      transition: 'border-color 0.15s, background 0.15s',
                      caretColor: 'var(--accent)',
                    }}
                  />
                ))}
              </div>

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                style={{ width: '100%', background: 'var(--accent)', border: 'none', color: 'white', padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Verifying…' : 'Verify Code'}
              </motion.button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              {otpCooldown > 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Resend code in <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{otpCooldown}s</span>
                </p>
              ) : (
                <button onClick={handleResendOtp} disabled={loading}
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

// ── Shared sub-components ────────────────────────────────────────────────────

function ErrorAlert({ error, info }: { error: string; info: string }) {
  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div key="err" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', fontSize: 13, overflow: 'hidden', lineHeight: 1.4 }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </motion.div>
      )}
      {info && !error && (
        <motion.div key="info" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#22c55e', fontSize: 13, overflow: 'hidden', lineHeight: 1.4 }}
        >
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{info}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
    </div>
  );
}

function InputField({
  id, label, type, value, onChange, icon, placeholder, suffix
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  placeholder: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 14, color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>{icon}</span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            paddingRight: suffix ? 44 : 14,
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            color: 'white',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 14, display: 'flex' }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}
