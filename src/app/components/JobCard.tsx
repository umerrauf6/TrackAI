'use client';

import { motion } from 'framer-motion';
import { JobApplication } from '../types/job';
import { Mail, Calendar, DollarSign, ChevronLeft, ChevronRight, FileText, CheckSquare, Check } from 'lucide-react';
import { useState } from 'react';

interface JobCardProps {
  job: JobApplication;
  onCardClick: (job: JobApplication) => void;
  onStatusChange: (jobId: string, newStatus: JobApplication['status']) => void;
  isSelected: boolean;
  selectionModeActive: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
}

const statusOrder: JobApplication['status'][] = [
  'Bookmarked',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
];

export default function JobCard({
  job,
  onCardClick,
  onStatusChange,
  isSelected,
  selectionModeActive,
  onToggleSelect,
}: JobCardProps) {
  const [isHovered, setIsHovered] = useState(false);
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
      whileHover={{ 
        y: -4, 
        scale: 1.01, 
        boxShadow: isSelected 
          ? '0 25px 60px rgba(0, 0, 0, 0.45), 0 0 20px rgba(212, 175, 55, 0.2)' 
          : '0 25px 60px rgba(0, 0, 0, 0.45), 0 0 20px rgba(255, 255, 255, 0.02)' 
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onCardClick(job)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="glass-card"
      style={{
        position: 'relative',
        padding: '20px 24px',
        cursor: 'pointer',
        border: isSelected ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: isSelected ? '0 0 20px rgba(212, 175, 55, 0.15)' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}
    >
      {/* Floating Selection Checkbox */}
      <div 
        onClick={onToggleSelect}
        style={{
          position: 'absolute',
          top: 15,
          left: 16,
          width: 16,
          height: 16,
          borderRadius: 4,
          border: isSelected ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.3)',
          background: isSelected ? 'var(--gold-primary)' : 'rgba(10, 11, 16, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          opacity: selectionModeActive || isHovered || isSelected ? 1 : 0,
          transition: 'opacity 0.2s ease, background-color 0.2s ease'
        }}
      >
        {isSelected && <Check size={10} color="#09090B" strokeWidth={3} />}
      </div>

      {/* Row 1: Logo Icon Box & Suffix Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold-primary)',
          fontWeight: 700,
          fontSize: 14,
          fontFamily: 'var(--font-header)'
        }}>
          {job.company[0].toUpperCase()}
        </div>

        <span style={{
          fontSize: 9,
          fontWeight: 700,
          color: job.source === 'gmail' ? 'var(--gold-primary)' : 'var(--text-secondary)',
          background: job.source === 'gmail' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.03)',
          border: job.source === 'gmail' ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
          padding: '3px 8px',
          borderRadius: 20,
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          {job.source === 'gmail' ? 'Gmail Sync' : 'Manual'}
        </span>
      </div>

      {/* Row 2: Title & Company */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h4 style={{ 
          fontSize: 16, 
          fontWeight: 700, 
          color: 'white', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          paddingLeft: (selectionModeActive || isHovered || isSelected) ? 14 : 0,
          transition: 'padding-left 0.2s ease',
          fontFamily: 'var(--font-header)'
        }}>
          {job.position}
        </h4>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.company}
        </p>
      </div>

      {/* Row 3: Salary & Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginTop: 4 }}>
        <span style={{ 
          color: 'var(--gold-primary)', 
          fontWeight: 700,
          fontSize: 13
        }}>
          {job.salary === 'Not Specified' ? 'Salary: TBD' : job.salary}
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11 }}>
          <Calendar size={12} />
          <span>{new Date(job.dateApplied).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Checklist Progress Bar */}
      {totalTasks > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckSquare size={10} /> Checklist</span>
            <span>{completedTasks}/{totalTasks}</span>
          </div>
          <div style={{ height: 3, width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(completedTasks / totalTasks) * 100}%`,
              background: 'var(--gold-primary)',
              borderRadius: 2
            }}></div>
          </div>
        </div>
      )}

      {/* Column Shift Action Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderTop: '1px solid var(--border-color)',
        paddingTop: 8,
        marginTop: 4,
        opacity: isHovered ? 1 : 0.4,
        transition: 'opacity 0.2s ease'
      }}>
        <button
          onClick={handlePrevStatus}
          disabled={currentIdx === 0}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)', 
            cursor: currentIdx === 0 ? 'default' : 'pointer',
            padding: 4,
            opacity: currentIdx === 0 ? 0.2 : 1
          }}
          title="Move back"
        >
          <ChevronLeft size={14} />
        </button>

        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Move Stage
        </span>

        <button
          onClick={handleNextStatus}
          disabled={currentIdx === statusOrder.length - 1}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)', 
            cursor: currentIdx === statusOrder.length - 1 ? 'default' : 'pointer',
            padding: 4,
            opacity: currentIdx === statusOrder.length - 1 ? 0.2 : 1
          }}
          title="Move forward"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}
