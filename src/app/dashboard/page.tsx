'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { JobApplication, UserSession } from '../types/job';
import KanbanBoard from '../components/KanbanBoard';
import AnalyticsSection from '../components/AnalyticsSection';
import Logo from '../components/Logo';
import AddJobModal from '../components/AddJobModal';
import JobDetailsDrawer from '../components/JobDetailsDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, CheckCircle, RefreshCw, X, Trash2, Search, 
  LayoutGrid, Award, Archive, Bell, Mail, Plus, Zap, LogOut, 
  TrendingUp, MessageSquare, ShieldCheck, Menu
} from 'lucide-react';

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)'
      }}>
        Loading your dashboard...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // User & Job states
  const [user, setUser] = useState<UserSession | null>(null);
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Overlay toggles
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);

  // Selection states
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Navigation & Search states
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Alert banner states
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        router.push('/');
        return null;
      }
      setUser(data.user);
      return data.user;
    } catch (error) {
      router.push('/');
      return null;
    }
  };

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

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (res.ok) {
        setJobs(data.jobs || []);
        
        // Keep active drawer job state updated
        if (selectedJob) {
          const freshJob = (data.jobs as JobApplication[]).find(j => j.id === selectedJob.id);
          if (freshJob) {
            setSelectedJob(freshJob);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load job applications:', error);
    }
  };

  const triggerBackgroundSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        if (data.jobsFound > 0) {
          await fetchJobs();
          setSyncResult(`Auto-Sync: Found and parsed ${data.jobsFound} new job applications.`);
        }
      } else {
        setBannerError(data.error || 'Background auto-sync failed.');
      }
    } catch (error: any) {
      console.error('Background auto-sync failed:', error);
      setBannerError(error.message || 'Background auto-sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const loggedUser = await fetchSession();
      await fetchJobs();
      setLoading(false);

      if (loggedUser && loggedUser.gmailSyncActive) {
        triggerBackgroundSync();
      }
    };
    init();

    // Check URL parameters for OAuth callbacks
    const errorQuery = searchParams.get('error');
    const gmailConnectedQuery = searchParams.get('gmail_connected');

    if (errorQuery === 'google_config_missing') {
      setBannerError('Google API Credentials not configured in .env. Please configure them.');
    } else if (errorQuery === 'google_auth_failed') {
      setBannerError('Gmail OAuth authentication was rejected or failed.');
    } else if (errorQuery === 'google_gmail_scope_missing') {
      setBannerError('Gmail Sync was not enabled because the Gmail access permission was not granted. Please reconnect Gmail and ensure the Gmail access checkbox is checked.');
    } else    if (gmailConnectedQuery === 'true') {
      setBannerSuccess('Gmail Account successfully linked! You can now trigger synchronization.');
    }
  }, [searchParams]);

  // Auto-dismiss success and sync result notifications after 5 seconds
  useEffect(() => {
    if (bannerSuccess) {
      const timer = setTimeout(() => {
        setBannerSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [bannerSuccess]);

  useEffect(() => {
    if (syncResult) {
      const timer = setTimeout(() => {
        setSyncResult(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [syncResult]);

  // Synchronize real Gmail API
  const handleSyncGmail = async () => {
    setSyncing(true);
    setSyncResult(null);
    setBannerError(null);
    setBannerSuccess(null);

    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync Gmail');
      }

      await fetchJobs();
      setSyncResult(`Gmail Sync complete! Found and parsed ${data.jobsFound} new job applications.`);
    } catch (error: any) {
      setBannerError(error.message || 'An error occurred during synchronization.');
    } finally {
      setSyncing(false);
    }
  };

  // Add a manual job application
  const handleAddJob = async (jobData: any) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create job');
      }

      await fetchJobs();
    } catch (error: any) {
      alert(error.message || 'Failed to add job application');
    }
  };

  // Update a job application (status, notes, checklists, etc.)
  const handleUpdateJob = async (jobId: string, updates: Partial<JobApplication>) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update job');
      }

      await fetchJobs();
    } catch (error: any) {
      alert(error.message || 'Failed to save updates');
    }
  };

  // Delete a job application
  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete job');
      }

      setSelectedJobIds((prev) => prev.filter(id => id !== jobId));
      await fetchJobs();
    } catch (error: any) {
      alert(error.message || 'Failed to delete job');
    }
  };

  const handleToggleSelectJob = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJobIds((prev) => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleDeleteMultipleJobs = async () => {
    if (selectedJobIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedJobIds.length} selected job applications?`)) {
      return;
    }

    setBulkDeleting(true);
    try {
      await Promise.all(
        selectedJobIds.map(async (jobId) => {
          const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
          if (!res.ok) {
            console.error(`Failed to delete job: ${jobId}`);
          }
        })
      );
      
      setSelectedJobIds([]);
      setBannerSuccess(`Successfully deleted the selected job applications.`);
      await fetchJobs();
    } catch (error) {
      setBannerError('An error occurred during bulk deletion.');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Drag and Drop status handler
  const handleStatusChange = async (jobId: string, newStatus: JobApplication['status']) => {
    await handleUpdateJob(jobId, { status: newStatus });
  };

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" style={{
            width: 40,
            height: 40,
            border: '4px solid rgba(139, 92, 246, 0.15)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading your dashboard...</span>
        </div>
        <style jsx global>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const filteredJobs = jobs.filter(j => 
    j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      
      {/* Background spotlights */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 95
          }}
        ></div>
      )}

      {/* Left Sidebar */}
      <div className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div>
          {/* Brand Logo & Name */}
          <div className="sidebar-brand">
            <h2 className="brand-font" style={{ fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'white' }}>
              <Logo size={20} />
              <span style={{ background: 'linear-gradient(to right, #D4AF37, #E6C766)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TrackAI</span>
            </h2>
            <span style={{ fontSize: 9, color: 'var(--gold-primary)', fontWeight: 700, letterSpacing: '0.08em', marginTop: 4, display: 'block' }}>
              PLATINUM MEMBER
            </span>
          </div>

          {/* Menu Items */}
          <div className="sidebar-menu">
            <div 
              className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
            >
              <TrendingUp size={16} />
              Overview
            </div>
            <div 
              className={`sidebar-item ${activeTab === 'pipeline' ? 'active' : ''}`}
              onClick={() => { setActiveTab('pipeline'); setMobileSidebarOpen(false); }}
            >
              <LayoutGrid size={16} />
              Pipeline
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeTab === 'pipeline' ? (
            <button className="btn btn-primary w-full" onClick={() => setIsAddModalOpen(true)} style={{ borderRadius: 12, justifyContent: 'center' }}>
              <Plus size={16} /> New Application
            </button>
          ) : null}

          {activeTab === 'pipeline' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Cloud Synced
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Content Pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Navbar */}
        <div className="top-bar">
          <div className="top-bar-left">
            {/* Hamburger Button for mobile */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="mobile-sidebar-toggle"
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px 8px 4px 0',
                alignItems: 'center'
              }}
            >
              <Menu size={20} />
            </button>

            {activeTab === 'pipeline' && (
              <div className="top-bar-search">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search TrackAI pipeline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            
            {/* Sync actions directly in top-bar */}
            <button 
              onClick={handleSyncGmail}
              disabled={syncing}
              style={{
                background: 'none',
                border: 'none',
                color: syncing ? 'var(--gold-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {syncing && <RefreshCw size={12} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />}
              Global Sync
            </button>
          </div>

          <div className="top-bar-right">
            <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <Bell size={18} />
            </button>

            <div style={{ width: 1, height: 20, background: 'var(--border-color)' }}></div>

            {/* Profile Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user.name}</span>
                <span style={{ fontSize: 9, color: 'var(--gold-primary)', fontWeight: 700, letterSpacing: '0.05em' }}>PLATINUM MEMBER</span>
              </div>
              <Link href="/profile" style={{ textDecoration: 'none' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--gold-soft)',
                  border: '1px solid var(--gold-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary)',
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                disabled={loggingOut}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Dynamic Content Area */}
        <div className="dashboard-content-area" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          
          {/* Dynamic Alerts */}
          <AnimatePresence>
            {bannerError && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -20 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -20 }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 12,
                  padding: '12px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#ef4444',
                  fontSize: 13,
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>
                    {bannerError.includes('reconnect') || bannerError.includes('permission') || bannerError.includes('denied') ? (
                      <>
                        {bannerError}{' '}
                        <a href="/api/auth/google" style={{ color: 'var(--gold-primary)', fontWeight: 600, textDecoration: 'underline', marginLeft: 6 }}>
                          Reconnect Gmail Now
                        </a>
                      </>
                    ) : (
                      bannerError
                    )}
                  </span>
                </div>
                <button onClick={() => setBannerError(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </motion.div>
            )}

            {bannerSuccess && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -20 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -20 }}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 12,
                  padding: '12px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#10b981',
                  fontSize: 13,
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{bannerSuccess}</span>
                </div>
                <button onClick={() => setBannerSuccess(null)} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </motion.div>
            )}

            {syncResult && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -20 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -20 }}
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: 12,
                  padding: '12px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'var(--gold-primary)',
                  fontSize: 13,
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{syncResult}</span>
                </div>
                <button onClick={() => setSyncResult(null)} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conditional Overview (Analytics) vs Pipeline (Kanban) View */}
          {activeTab === 'overview' ? (
            <AnalyticsSection jobs={jobs} />
          ) : (
            <KanbanBoard
              jobs={filteredJobs}
              onCardClick={(job) => setSelectedJob(job)}
              onStatusChange={handleStatusChange}
              selectedJobIds={selectedJobIds}
              onToggleSelectJob={handleToggleSelectJob}
            />
          )}
        </div>
      </div>

      {/* Modals & Drawers */}
      <AddJobModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddJob={handleAddJob}
      />

      <AnimatePresence>
        {selectedJob && (
          <JobDetailsDrawer
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
          />
        )}
      </AnimatePresence>



      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedJobIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              position: 'fixed',
              bottom: 30,
              left: '50%',
              zIndex: 90,
              padding: '12px 24px',
              borderRadius: 30,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 30px rgba(212, 175, 55, 0.2)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              background: 'rgba(10, 11, 16, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700
              }}>
                {selectedJobIds.length}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                job{selectedJobIds.length > 1 ? 's' : ''} selected
              </span>
            </div>

            <div style={{ height: 20, width: 1, background: 'var(--border-color)' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setSelectedJobIds([])}
                className="btn btn-text"
                style={{ fontSize: 12, padding: '6px 12px', color: 'var(--text-secondary)' }}
                disabled={bulkDeleting}
              >
                Clear
              </button>
              
              <button
                onClick={handleDeleteMultipleJobs}
                className="btn btn-primary"
                disabled={bulkDeleting}
                style={{
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)',
                  fontSize: 12,
                  padding: '6px 14px',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'white'
                }}
              >
                <Trash2 size={13} />
                {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Global Spinner Style Rule */}
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
