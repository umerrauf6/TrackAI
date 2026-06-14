'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { JobApplication, UserSession } from '../types/job';
import Header from '../components/Header';
import KanbanBoard from '../components/KanbanBoard';
import AnalyticsSection from '../components/AnalyticsSection';
import AddJobModal from '../components/AddJobModal';
import JobDetailsDrawer from '../components/JobDetailsDrawer';
import GmailSimulator from '../components/GmailSimulator';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react';

export default function Dashboard() {
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
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);

  // Alert banner states
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        router.push('/login');
        return;
      }
      setUser(data.user);
    } catch (error) {
      router.push('/login');
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

  useEffect(() => {
    const init = async () => {
      await fetchSession();
      await fetchJobs();
      setLoading(false);
    };
    init();

    // Check URL parameters for OAuth callbacks
    const errorQuery = searchParams.get('error');
    const gmailConnectedQuery = searchParams.get('gmail_connected');

    if (errorQuery === 'google_config_missing') {
      setBannerError('Google API Credentials not configured in .env. Please configure them or use the Gmail Simulator.');
    } else if (errorQuery === 'google_auth_failed') {
      setBannerError('Gmail OAuth authentication was rejected or failed.');
    } else if (gmailConnectedQuery === 'true') {
      setBannerSuccess('Gmail Account successfully linked! You can now trigger synchronization.');
    }
  }, [searchParams]);

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

      await fetchJobs();
    } catch (error: any) {
      alert(error.message || 'Failed to delete job');
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

  return (
    <div style={{ minHeight: '100vh', padding: '24px 40px', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Dynamic Alerts Container */}
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
              <span>{bannerError}</span>
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
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: 12,
              padding: '12px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#a78bfa',
              fontSize: 13,
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span>{syncResult}</span>
            </div>
            <button onClick={() => setSyncResult(null)} style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main SaaS Dashboard Header Area */}
      <Header
        user={user}
        jobs={jobs}
        onAddJobClick={() => setIsAddModalOpen(true)}
        onOpenSimulatorClick={() => setIsSimulatorOpen(true)}
        onSyncGmailClick={handleSyncGmail}
        syncing={syncing}
      />

      {/* Analytics Graph Metric Details */}
      <AnalyticsSection jobs={jobs} />

      {/* Core Kanban drag-and-drop Board stages */}
      <KanbanBoard
        jobs={jobs}
        onCardClick={(job) => setSelectedJob(job)}
        onStatusChange={handleStatusChange}
      />

      {/* Modals & Slide-out Drawers */}
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

      <AnimatePresence>
        {isSimulatorOpen && (
          <GmailSimulator
            isOpen={isSimulatorOpen}
            onClose={() => setIsSimulatorOpen(false)}
            onNewJobSynced={fetchJobs}
          />
        )}
      </AnimatePresence>

      {/* Global Spinner Style Rule */}
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
