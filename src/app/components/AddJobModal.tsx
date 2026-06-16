'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { JobApplication } from '../types/job';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (jobData: {
    company: string;
    position: string;
    salary: string;
    status: JobApplication['status'];
    url: string;
    notes: string;
    dateApplied: string;
  }) => Promise<void>;
}

export default function AddJobModal({ isOpen, onClose, onAddJob }: AddJobModalProps) {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState<JobApplication['status']>('Applied');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [dateApplied, setDateApplied] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !position.trim()) return;

    setLoading(true);
    try {
      await onAddJob({
        company: company.trim(),
        position: position.trim(),
        salary: salary.trim() || 'Not Specified',
        status,
        url: url.trim(),
        notes: notes.trim(),
        dateApplied
      });
      
      // Reset form on success
      setCompany('');
      setPosition('');
      setSalary('');
      setStatus('Applied');
      setUrl('');
      setNotes('');
      setDateApplied(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (error) {
      console.error('Failed to add job application:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
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

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="glass-panel add-job-modal-card"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 500,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 32,
              borderRadius: 18,
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Track New Application</h3>
              <button 
                onClick={onClose} 
                className="btn btn-text" 
                style={{ padding: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label>Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div>
                <label>Job Title / Position *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Engineer"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>

              <div className="form-grid-2col">
                <div>
                  <label>Status / Stage</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as JobApplication['status'])}
                  >
                    <option value="Bookmarked">Bookmarked</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label>Date Applied</label>
                  <input
                    type="date"
                    value={dateApplied}
                    onChange={(e) => setDateApplied(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2col">
                <div>
                  <label>Salary (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. $120k/yr"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                  />
                </div>
                <div>
                  <label>Job Posting URL</label>
                  <input
                    type="url"
                    placeholder="e.g. https://careers.stripe.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label>Initial Notes / Description</label>
                <textarea
                  rows={4}
                  placeholder="Paste details, deadlines, or interviewer names here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-glow"
                style={{ width: '100%', padding: 12, borderRadius: 8, fontSize: 15, display: 'flex', gap: 8, marginTop: 8 }}
              >
                {loading ? 'Adding...' : (
                  <>
                    <Save size={16} /> Track Application
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
