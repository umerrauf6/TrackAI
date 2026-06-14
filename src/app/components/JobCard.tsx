'use client';

import { motion } from 'framer-motion';
import { JobApplication } from '../types/job';
import { Mail, Calendar, DollarSign, ChevronLeft, ChevronRight, FileText, CheckSquare } from 'lucide-react';

interface JobCardProps {
  job: JobApplication;
  onCardClick: (job: JobApplication) => void;
  onStatusChange: (jobId: string, newStatus: JobApplication['status']) => void;
}

const statusOrder: JobApplication['status'][] = [
  'Bookmarked',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
];

export default function JobCard({ job, onCardClick, onStatusChange }: JobCardProps) {
  const currentIdx = statusOrder.indexOf(job.status);
  
  // Calculate checklist progress
  const completedTasks = job.checklist.filter(t => t.completed).length;
  const totalTasks = job.checklist.length;

  const handlePrevStatus = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening drawer
    if (currentIdx > 0) {
      onStatusChange(job.id, statusOrder[currentIdx - 1]);
    }
  };

  const handleNextStatus = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening drawer
    if (currentIdx < statusOrder.length - 1) {
      onStatusChange(job.id, statusOrder[currentIdx + 1]);
    }
  };

  return (
    <motion.div
      layoutId={`card-${job.id}`}
      whileHover={{ y: -4, scale: 1.01, boxShadow: '0 12px 24px rgba(0,0,0,0.2)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onCardClick(job)}
      className="glass-panel"
      style={{
        padding: 16,
        borderRadius: 12,
        background: 'rgba(255, 255, 255, 0.02)',
        cursor: 'pointer',
        borderLeft: `4px solid hsl(var(--status-${job.status}))`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
          {job.company}
        </h4>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          color: job.source === 'gmail' ? '#10b981' : 'var(--text-muted)',
          background: 'rgba(255,255,255,0.03)',
          padding: '2px 6px',
          borderRadius: 4,
          border: '1px solid var(--border-color)'
        }}>
          {job.source === 'gmail' ? <Mail size={10} /> : <FileText size={10} />}
          {job.source === 'gmail' ? 'Gmail' : 'Manual'}
        </span>
      </div>

      {/* Position */}
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {job.position}
      </p>

      {/* Details Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 6 }}>
        {/* Salary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <DollarSign size={12} color="var(--text-muted)" />
          <span>{job.salary}</span>
        </div>
        
        {/* Date Applied */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} color="var(--text-muted)" />
          <span>Applied: {new Date(job.dateApplied).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Checklist Progress Bar */}
      {totalTasks > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckSquare size={10} /> Checklist</span>
            <span>{completedTasks}/{totalTasks}</span>
          </div>
          <div style={{ height: 3, width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(completedTasks / totalTasks) * 100}%`,
              background: 'var(--accent)',
              borderRadius: 2
            }}></div>
          </div>
        </div>
      )}

      <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }}></div>

      {/* Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={handlePrevStatus}
          disabled={currentIdx === 0}
          className="btn btn-text"
          style={{ padding: 4, borderRadius: 4, opacity: currentIdx === 0 ? 0.3 : 1 }}
          title="Move back"
        >
          <ChevronLeft size={14} />
        </button>

        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Shift Stage
        </span>

        <button
          onClick={handleNextStatus}
          disabled={currentIdx === statusOrder.length - 1}
          className="btn btn-text"
          style={{ padding: 4, borderRadius: 4, opacity: currentIdx === statusOrder.length - 1 ? 0.3 : 1 }}
          title="Move forward"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}
