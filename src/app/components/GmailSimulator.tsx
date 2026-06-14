'use client';

import { motion } from 'framer-motion';
import { X, Send, Inbox, Mail, ArrowRight, CheckSquare, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface MockEmail {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  snippet: string;
  statusLabel: string;
}

const INITIAL_MOCK_EMAILS: MockEmail[] = [
  {
    id: 'email_1',
    senderName: 'Google Careers',
    senderEmail: 'noreply@google.com',
    subject: 'Your application to Google: Software Engineer (L3)',
    snippet: 'Thank you for applying for the Software Engineer (L3) role at Google! We have received...',
    body: 'Thank you for applying for the Software Engineer (L3) role at Google! We have received your application and will review it shortly. The base salary for this position is around $150,000. We will contact you if your profile matches our active requirements.',
    statusLabel: 'Applied'
  },
  {
    id: 'email_2',
    senderName: 'Stripe Recruiting',
    senderEmail: 'recruiting@stripe.com',
    subject: 'Schedule an interview: Frontend Architect at Stripe',
    snippet: 'We were impressed by your background and would love to schedule a phone screen for the...',
    body: 'We were impressed by your background and would love to schedule a phone screen for the Frontend Architect opportunity. The base salary is $160,000. Please select a time using our scheduling assistant link to chat about your experience.',
    statusLabel: 'Interviewing'
  },
  {
    id: 'email_3',
    senderName: 'Figma HR',
    senderEmail: 'careers@figma.com',
    subject: 'Job Offer: Product Designer at Figma',
    snippet: 'We are thrilled to offer you the position of Product Designer at Figma! The starting salary is...',
    body: 'We are thrilled to offer you the position of Product Designer at Figma! The starting salary is $145,000 per year with immediate equity coverage. Please sign the attached offer letter and return it by next Friday.',
    statusLabel: 'Offer'
  },
  {
    id: 'email_4',
    senderName: 'Netflix Careers',
    senderEmail: 'talent@netflix.com',
    subject: 'Your application to Netflix',
    snippet: 'Thank you for taking the time to apply for the Backend Engineer position. Unfortunately...',
    body: 'Thank you for taking the time to apply for the Backend Engineer position. Unfortunately, we have decided not to move forward with your application at this time as we pursue other candidates. We wish you the best in your career search.',
    statusLabel: 'Rejected'
  }
];

interface GmailSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onNewJobSynced: () => Promise<void>;
}

export default function GmailSimulator({ isOpen, onClose, onNewJobSynced }: GmailSimulatorProps) {
  const [emails, setEmails] = useState<MockEmail[]>(INITIAL_MOCK_EMAILS);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSyncEmail = async (email: MockEmail) => {
    setSyncingId(email.id);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/gmail/mock-incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: email.subject,
          sender: `${email.senderName} <${email.senderEmail}>`,
          bodyText: email.body,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync email');
      }

      setSuccessMsg(`Gmail Sync Auto-detected! Added "${data.job.company}" to your Kanban board.`);
      
      // Auto-remove email from simulated inbox after it is successfully synced
      setEmails(prev => prev.filter(e => e.id !== email.id));
      
      await onNewJobSynced();
    } catch (err: any) {
      setErrorMsg(err.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleRemoveEmail = (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
  };

  const handleResetInbox = () => {
    setEmails(INITIAL_MOCK_EMAILS);
    setSuccessMsg('');
    setErrorMsg('');
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-start' }}>
      
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      />

      {/* Simulator Panel */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="glass-panel"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          height: '100%',
          borderRadius: 0,
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '10px 0 40px rgba(0,0,0,0.5)',
          background: 'rgba(10, 11, 18, 0.95)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 30px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(239, 68, 68, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Inbox size={20} color="var(--accent)" />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Gmail Inbox Simulator</h2>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Send mock emails to test the Groq AI parser auto-detector</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-text" 
            style={{ padding: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'white' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Messaging Box alerts */}
        {(successMsg || errorMsg) && (
          <div style={{ padding: '16px 30px 0 30px' }}>
            {successMsg && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#10b981',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{successMsg}</span>
                </div>
                <button
                  onClick={() => setSuccessMsg('')}
                  style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', padding: 2 }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#ef4444',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <X size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
                <button
                  onClick={() => setErrorMsg('')}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: 2 }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Email Inbox list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {emails.length > 0 ? (
            emails.map((email) => {
              const isSyncing = syncingId === email.id;
              return (
                <div
                  key={email.id}
                  className="glass-panel"
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: 'border-color 0.2s'
                  }}
                >
                  {/* Meta details */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{email.senderName}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>&lt;{email.senderEmail}&gt;</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>
                        {email.statusLabel}
                      </span>
                      {/* Dismiss button to remove notification */}
                      <button
                        onClick={() => handleRemoveEmail(email.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, display: 'flex' }}
                        title="Remove email from simulator"
                      >
                        <Trash2 size={13} className="trash-hover" />
                      </button>
                    </div>
                  </div>

                  {/* Subject & body snippet */}
                  <div>
                    <h4 style={{ fontSize: 13, color: 'white', marginBottom: 4 }}>{email.subject}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{email.snippet}</p>
                  </div>

                  {/* Sync Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                    <button
                      onClick={() => handleSyncEmail(email)}
                      disabled={syncingId !== null}
                      className="btn btn-primary"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 11,
                        display: 'flex',
                        gap: 6
                      }}
                    >
                      {isSyncing ? 'AI Parsing...' : (
                        <>
                          <Sparkles size={12} /> Sync to Kanban <ArrowRight size={12} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>All mock notifications cleared!</span>
              <button onClick={handleResetInbox} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>
                Reset Inbox
              </button>
            </div>
          )}
        </div>
      </motion.div>
      <style jsx global>{`
        .trash-hover:hover {
          color: #ef4444 !important;
        }
      `}</style>
    </div>
  );
}
