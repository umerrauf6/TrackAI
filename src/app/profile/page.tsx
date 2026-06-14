'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, ShieldCheck, ArrowLeft, Trash2, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';

function ProfileContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        router.push('/login');
        return;
      }
      setUser(data.user);
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleDisconnectGmail = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Account? This will stop automatic Gmail synchronization.')) {
      return;
    }

    setDisconnecting(true);
    setError(null);

    try {
      const res = await fetch('/api/gmail/disconnect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to disconnect Gmail');
      }
      
      // Update local state
      setUser((prev: any) => ({
        ...prev,
        googleEmail: null,
        gmailSyncActive: false,
        lastSyncedTime: null
      }));
    } catch (err: any) {
      setError(err.message || 'An error occurred while disconnecting Gmail.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{
            width: 40,
            height: 40,
            border: '4px solid rgba(139, 92, 246, 0.15)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading profile...</span>
        </div>
        <style jsx global>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: 20
    }}>
      {/* Back to Dashboard */}
      <Link href="/dashboard" style={{
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
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 550,
          padding: 40,
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 50px rgba(139, 92, 246, 0.05)'
        }}
      >
        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <Logo size={44} />
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0 }}>Account Settings</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} color="var(--accent)" /> Manage your Track AI profile
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#ef4444',
            fontSize: 13
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Profile details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Section 1: User Info */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.15)', padding: 16, borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> Name</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> Email Address</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user.email}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Gmail Sync Settings */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gmail & AI Integration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.15)', padding: 16, borderRadius: 10, border: '1px solid var(--border-color)' }}>
              
              {user.googleEmail ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} color="#10b981" /> Connection Status</span>
                    <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>ACTIVE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Linked Google Email</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user.googleEmail}</span>
                  </div>
                  {user.lastSyncedTime && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> Last Automated Sync</span>
                      <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                        {new Date(user.lastSyncedTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  <div style={{ height: 1, background: 'var(--border-color)', margin: '8px 0' }}></div>
                  
                  <button
                    onClick={handleDisconnectGmail}
                    disabled={disconnecting}
                    className="btn btn-secondary"
                    style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', width: '100%', display: 'flex', justifyContent: 'center', gap: 8, padding: 10 }}
                  >
                    <Trash2 size={15} />
                    {disconnecting ? 'Disconnecting...' : 'Disconnect Google Account'}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    No Google Account is linked. Connect your Gmail inbox to enable automatic AI parsing of applications.
                  </p>
                  <a
                    href="/api/auth/google"
                    className="btn btn-primary btn-glow"
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, padding: 12, textDecoration: 'none' }}
                  >
                    <Mail size={16} />
                    Connect Google Account
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        Loading Settings...
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
