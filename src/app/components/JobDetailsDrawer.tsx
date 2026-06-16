'use client';

import { motion } from 'framer-motion';
import { JobApplication, ChecklistItem } from '../types/job';
import { X, Trash2, Calendar, Link as LinkIcon, CheckSquare, Plus, Mail, Clock, DollarSign, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

interface JobDetailsDrawerProps {
  job: JobApplication;
  onClose: () => void;
  onUpdateJob: (jobId: string, updates: Partial<JobApplication>) => Promise<void>;
  onDeleteJob: (jobId: string) => Promise<void>;
}

export default function JobDetailsDrawer({
  job,
  onClose,
  onUpdateJob,
  onDeleteJob,
}: JobDetailsDrawerProps) {
  // Input states
  const [notes, setNotes] = useState(job.notes);
  const [salary, setSalary] = useState(job.salary);
  const [url, setUrl] = useState(job.url);
  const [newTaskText, setNewTaskText] = useState('');
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'log'>('summary');
  
  // Save indicators
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync state if job changes
  useEffect(() => {
    setNotes(job.notes);
    setSalary(job.salary);
    setUrl(job.url);
  }, [job]);

  const handleNotesBlur = async () => {
    if (notes === job.notes) return;
    setSavingNotes(true);
    await onUpdateJob(job.id, { notes });
    setSavingNotes(false);
  };

  const handleUpdateMeta = async () => {
    if (salary === job.salary && url === job.url) return;
    await onUpdateJob(job.id, { salary, url });
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    const updatedChecklist = job.checklist.map((t) =>
      t.id === taskId ? { ...t, completed: !currentStatus } : t
    );
    await onUpdateJob(job.id, { checklist: updatedChecklist });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      completed: false,
    };

    const updatedChecklist = [...job.checklist, newTask];
    await onUpdateJob(job.id, { checklist: updatedChecklist });
    setNewTaskText('');
  };

  const handleDeleteTask = async (taskId: string) => {
    const updatedChecklist = job.checklist.filter((t) => t.id !== taskId);
    await onUpdateJob(job.id, { checklist: updatedChecklist });
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to remove your application to ${job.company}?`)) {
      setDeleting(true);
      await onDeleteJob(job.id);
      onClose();
    }
  };

  const tabStyle = (tab: typeof activeTab) => ({
    padding: '12px 0',
    fontSize: 11,
    fontWeight: 700,
    color: activeTab === tab ? '#FAFAFA' : 'var(--text-muted)',
    borderBottom: activeTab === tab ? '2px solid var(--gold-primary)' : '2px solid transparent',
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    transition: 'all 0.2s ease',
    background: 'none',
    border: 'none',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
      
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      />

      {/* Drawer Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="glass-panel"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 550,
          height: '100%',
          borderRadius: 0,
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-15px 0 50px rgba(0,0,0,0.6)',
          background: '#09090b',
        }}
      >
        
        {/* Header Drawer */}
        <div style={{
          padding: '24px 30px 10px 30px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: '#111113'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-primary)',
                fontWeight: 700,
                fontSize: 18,
                fontFamily: 'var(--font-header)'
              }}>
                {job.company[0].toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0, fontFamily: 'var(--font-header)' }}>
                  {job.position}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--gold-primary)', fontWeight: 600, margin: 0 }}>
                  {job.company}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8 }}
                title="Delete application"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={onClose} 
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', color: 'white', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 24, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 8 }}>
            <button style={tabStyle('summary')} onClick={() => setActiveTab('summary')}>Executive Summary</button>
            <button style={tabStyle('actions')} onClick={() => setActiveTab('actions')}>Action Items</button>
            <button style={tabStyle('log')} onClick={() => setActiveTab('log')}>Intelligence Log</button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <>
              {/* Metadata Info Boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#111113', border: '1px solid var(--border-color)', borderRadius: 16, padding: 16 }}>
                  <label style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Package Range</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={14} color="var(--gold-primary)" />
                    <input 
                      type="text" 
                      value={salary} 
                      onChange={(e) => setSalary(e.target.value)} 
                      onBlur={handleUpdateMeta}
                      style={{ padding: 0, background: 'transparent', border: 'none', fontSize: 16, fontWeight: 700, color: 'var(--gold-primary)', fontFamily: 'var(--font-header)' }}
                    />
                  </div>
                </div>
                <div style={{ background: '#111113', border: '1px solid var(--border-color)', borderRadius: 16, padding: 16 }}>
                  <label style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Posting Location URL</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LinkIcon size={14} color="var(--text-secondary)" />
                    <input 
                      type="text" 
                      value={url} 
                      onChange={(e) => setUrl(e.target.value)} 
                      onBlur={handleUpdateMeta}
                      placeholder="No Link Provided"
                      style={{ padding: 0, background: 'transparent', border: 'none', fontSize: 14, fontWeight: 700, color: '#FAFAFA' }}
                    />
                  </div>
                </div>
              </div>

              {/* Notes: Position Profile */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <FileText size={14} /> Position Profile
                </h4>
                <textarea
                  rows={12}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Paste details, logs, or comments here. Autosaved on blur."
                  style={{ resize: 'vertical', lineHeight: 1.6, padding: 16, background: '#111113', border: '1px solid var(--border-color)', borderRadius: 16 }}
                />
                {savingNotes && <span style={{ fontSize: 11, color: 'var(--gold-primary)', marginTop: 4 }}>Saving profile...</span>}
              </div>
            </>
          )}

          {/* TAB 2: ACTION ITEMS */}
          {activeTab === 'actions' && (
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <CheckSquare size={14} /> Preparation Checklist
              </h3>
              
              {/* Task list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {job.checklist.length > 0 ? (
                  job.checklist.map((task) => (
                    <div 
                      key={task.id} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#111113',
                        border: '1px solid var(--border-color)',
                        padding: '12px 16px',
                        borderRadius: 12
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0, cursor: 'pointer', flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id, task.completed)}
                          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--gold-primary)' }}
                        />
                        <span style={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          fontSize: 13
                        }}>
                          {task.text}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No preparation items listed.</p>
                )}
              </div>

              {/* Add task form */}
              <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Insert checklist item..."
                  style={{ padding: '10px 14px', flex: 1, background: '#111113', border: '1px solid var(--border-color)', borderRadius: 12 }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '10px 14px', borderRadius: 12 }}>
                  <Plus size={16} />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: INTELLIGENCE LOG */}
          {activeTab === 'log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Gmail Sync Log metadata (if synced) */}
              {job.source === 'gmail' && job.emailSender && (
                <div style={{ background: 'rgba(212, 175, 55, 0.04)', border: '1px solid rgba(212, 175, 55, 0.15)', borderRadius: 16, padding: 16 }}>
                  <h4 style={{ fontSize: 12, color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Mail size={14} /> Gmail Sync Details
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <strong>Sender:</strong> {job.emailSender}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    AI Sync Reference: {job.gmailMessageId?.split(',')[0]}
                  </p>
                </div>
              )}

              {/* History Timeline */}
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Clock size={14} /> Activity History Log
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderLeft: '1px solid var(--border-color)', marginLeft: 8, paddingLeft: 16 }}>
                  {job.history.map((event) => (
                    <div key={event.id} style={{ position: 'relative' }}>
                      {/* Timeline bullet */}
                      <div style={{
                        position: 'absolute',
                        left: -21,
                        top: 4,
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: `hsl(var(--status-${event.status}))`,
                        border: '2px solid var(--bg-primary)'
                      }}></div>
                      
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {new Date(event.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                        <strong>{event.status}</strong>: {event.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
