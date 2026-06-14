'use client';

import { motion } from 'framer-motion';
import { JobApplication, ChecklistItem } from '../types/job';
import { X, Trash2, Calendar, Link as LinkIcon, Sparkles, CheckSquare, Plus, Mail, Clock, DollarSign } from 'lucide-react';
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
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
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
          boxShadow: '-10px 0 40px rgba(0,0,0,0.5)'
        }}
      >
        
        {/* Header Drawer */}
        <div style={{
          padding: '24px 30px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span className={`status-tag status-${job.status}`}>{job.status}</span>
              {job.source === 'gmail' && (
                <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, color: '#10b981' }}>
                  <Mail size={12} /> Sync Auto-detected
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>{job.company}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{job.position}</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={handleDelete}
              disabled={deleting}
              className="btn btn-text" 
              style={{ color: '#ef4444', padding: 8, borderRadius: '50%' }}
              title="Delete application"
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={onClose} 
              className="btn btn-text" 
              style={{ padding: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'white' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Metadata Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            background: 'rgba(0,0,0,0.2)',
            padding: 16,
            borderRadius: 10,
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <label><DollarSign size={12} style={{ display: 'inline', marginRight: 4 }} /> Salary</label>
              <input 
                type="text" 
                value={salary} 
                onChange={(e) => setSalary(e.target.value)} 
                onBlur={handleUpdateMeta}
                style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)' }}
              />
            </div>
            <div>
              <label><LinkIcon size={12} style={{ display: 'inline', marginRight: 4 }} /> Application URL</label>
              <input 
                type="text" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                onBlur={handleUpdateMeta}
                placeholder="Link to posting"
                style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)' }}
              />
            </div>
          </div>

          {/* Email Info (If Gmail Synced) */}
          {job.source === 'gmail' && job.emailSender && (
            <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 10, padding: 16 }}>
              <h4 style={{ fontSize: 13, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Mail size={14} /> Gmail Sync Log
              </h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong>Sender:</strong> {job.emailSender}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Detected and parsed via Gemini AI parser. Reference ID: {job.gmailMessageId}
              </p>
            </div>
          )}

          {/* Notes Editor */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ marginBottom: 0 }}>Application Notes</label>
              {savingNotes && <span style={{ fontSize: 11, color: 'var(--accent)' }}>Saving...</span>}
            </div>
            <textarea
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Paste job descriptions, recruiter contacts, or interview details here. Autosaver saves changes on click-away."
              style={{ resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* Checklist Section */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CheckSquare size={16} /> Interview Prep Checklist
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
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-color)',
                      padding: '10px 14px',
                      borderRadius: 8
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0, cursor: 'pointer', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id, task.completed)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
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
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', py: 10 }}>No custom tasks yet.</p>
              )}
            </div>

            {/* Add task form */}
            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add preparation task..."
                style={{ padding: '8px 12px', flex: 1 }}
              />
              <button type="submit" className="btn btn-secondary" style={{ padding: '8px 12px' }}>
                <Plus size={16} />
              </button>
            </form>
          </div>

          {/* Timeline History */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Clock size={16} /> Activity Log & History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderLeft: '1px solid var(--border-color)', marginLeft: 8, paddingLeft: 16 }}>
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
                    background: `rgb(var(--status-${event.status}))`,
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
      </motion.div>
    </div>
  );
}
