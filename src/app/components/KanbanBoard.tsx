'use client';

import { JobApplication } from '../types/job';
import JobCard from './JobCard';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface KanbanBoardProps {
  jobs: JobApplication[];
  onCardClick: (job: JobApplication) => void;
  onStatusChange: (jobId: string, newStatus: JobApplication['status']) => void;
}

const COLUMNS: { id: JobApplication['status']; label: string }[] = [
  { id: 'Bookmarked', label: 'Bookmarked' },
  { id: 'Applied', label: 'Applied' },
  { id: 'Interviewing', label: 'Interviewing' },
  { id: 'Offer', label: 'Offer' },
  { id: 'Rejected', label: 'Rejected' },
];

export default function KanbanBoard({ jobs, onCardClick, onStatusChange }: KanbanBoardProps) {
  // Track which column is currently hovered over by a dragged card
  const [activeOverColumn, setActiveOverColumn] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setActiveOverColumn(colId);
  };

  const handleDragLeave = () => {
    setActiveOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: JobApplication['status']) => {
    e.preventDefault();
    setActiveOverColumn(null);
    const jobId = e.dataTransfer.getData('text/plain');
    if (jobId) {
      onStatusChange(jobId, targetStatus);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 16,
      minHeight: '65vh',
      overflowX: 'auto',
      paddingBottom: 20
    }}>
      {COLUMNS.map((col) => {
        const columnJobs = jobs.filter((j) => j.status === col.id);
        const isHovered = activeOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className="glass-panel"
            style={{
              padding: 16,
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: isHovered ? 'rgba(255, 255, 255, 0.05)' : 'var(--bg-card)',
              borderColor: isHovered ? 'var(--accent)' : 'var(--border-color)',
              minWidth: 220,
              transition: 'background 0.2s ease, border-color 0.2s ease'
            }}
          >
            {/* Column Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `2px solid hsla(var(--status-${col.id}), 0.3)`,
              paddingBottom: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`status-dot status-${col.id}-dot`} style={{ width: 10, height: 10 }}></span>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{col.label}</h3>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                background: 'rgba(255,255,255,0.05)',
                padding: '2px 8px',
                borderRadius: 10
              }}>
                {columnJobs.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              flex: 1,
              overflowY: 'auto',
              maxHeight: '60vh',
              minHeight: 120
            }}>
              {columnJobs.length > 0 ? (
                columnJobs.map((job) => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', job.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <JobCard
                      job={job}
                      onCardClick={onCardClick}
                      onStatusChange={onStatusChange}
                    />
                  </div>
                ))
              ) : (
                <div style={{
                  border: '1px dashed var(--border-color)',
                  borderRadius: 10,
                  padding: '20px 10px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1
                }}>
                  No jobs tracking in {col.label}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
