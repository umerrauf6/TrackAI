'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { JobApplication, UserSession } from '../types/job';
import { LogOut, Mail, RefreshCw, BarChart2, Plus, Zap, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import Logo from './Logo';

interface HeaderProps {
  user: UserSession;
  jobs: JobApplication[];
  onAddJobClick: () => void;
  onOpenSimulatorClick: () => void;
  onSyncGmailClick: () => Promise<void>;
  syncing: boolean;
}

export default function Header({
  user,
  jobs,
  onAddJobClick,
  onOpenSimulatorClick,
  onSyncGmailClick,
  syncing,
}: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  // Metrics Calculations
  const totalApplications = jobs.length;
  
  // Response rate calculation: applications that moved beyond 'Bookmarked' or 'Applied'
  const responsesCount = jobs.filter(
    j => j.status !== 'Bookmarked' && j.status !== 'Applied'
  ).length;
  
  // Calculate percentage of applications that received a response
  const activeApplications = jobs.filter(j => j.status !== 'Bookmarked').length;
  const responseRate = activeApplications > 0
    ? Math.round((responsesCount / activeApplications) * 100)
    : 0;

  const activeInterviews = jobs.filter(j => j.status === 'Interviewing').length;
  const activeOffers = jobs.filter(j => j.status === 'Offer').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 30 }}>
      {/* Top Navbar */}
      <div className="glass-panel nav-container">
        {/* Brand */}
        <div className="nav-brand">
          <Logo size={28} />
          <span className="brand-font" style={{ fontSize: 18, fontWeight: 800, background: 'linear-gradient(to right, #D4AF37, #E6C766)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TrackAI</span>
          <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '2px 6px', color: 'var(--text-secondary)' }}>SaaS Pro</span>
        </div>

        {/* Sync & CTA Actions */}
        <div className="nav-actions">
          {/* Gmail Connection Status */}
          {user.googleEmail ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 30,
              padding: '6px 14px',
              fontSize: 12,
              color: '#10b981'
            }}>
              <CheckCircle2 size={13} />
              <span>{user.googleEmail}</span>
              <button 
                onClick={onSyncGmailClick}
                disabled={syncing}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#10b981',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  animation: syncing ? 'spin 1.5s linear infinite' : 'none'
                }}
              >
                <RefreshCw size={13} />
              </button>
            </div>
          ) : (
            <a href="/api/auth/google" className="btn btn-secondary" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={13} /> Connect Gmail
            </a>
          )}

          {/* Sandbox Inbox Simulator */}
          <button onClick={onOpenSimulatorClick} className="btn btn-secondary" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--accent)' }}>
            <Zap size={13} color="var(--accent)" /> Gmail Simulator
          </button>

          {/* Manual Add Job Card */}
          <button onClick={onAddJobClick} className="btn btn-primary btn-glow" style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Job
          </button>
        </div>

        <div className="nav-divider"></div>

        {/* User profile logout dropdown */}
        <div className="nav-profile">
          <Link href="/profile" className="profile-link">
            <span className="profile-name" style={{ fontSize: 13, fontWeight: 600, color: 'white', transition: 'color 0.2s ease' }}>{user.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>User Dashboard</span>
          </Link>
          <button 
            onClick={handleLogout} 
            disabled={loggingOut}
            className="btn btn-text" 
            style={{ padding: 6, borderRadius: '50%', color: 'var(--text-secondary)' }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
      }}>
        {/* Card 1 */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Applications</span>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginTop: 4 }}>{totalApplications}</h3>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Scoped to active workspace</span>
        </div>

        {/* Card 2 */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Response Rate</span>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: 'hsl(var(--status-offer))', marginTop: 4 }}>{responseRate}%</h3>
          <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${responseRate}%`, background: 'hsl(var(--status-offer))' }}></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Active Interviews</span>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: 'hsl(var(--status-interviewing))', marginTop: 4 }}>{activeInterviews}</h3>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Requiring preparation</span>
        </div>

        {/* Card 4 */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Offers Secured</span>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>{activeOffers}</h3>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Mock subscription target: 1+</span>
        </div>
      </div>
    </div>
  );
}
