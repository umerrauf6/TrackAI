'use client';

import { JobApplication } from '../types/job';
import JobCard from './JobCard';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface KanbanBoardProps {
  jobs: JobApplication[];
  onCardClick: (job: JobApplication) => void;
  onStatusChange: (jobId: string, newStatus: JobApplication['status']) => void;
  selectedJobIds: string[];
  onToggleSelectJob: (jobId: string, e: React.MouseEvent) => void;
}

const COLUMNS: { id: JobApplication['status']; label: string }[] = [
  { id: 'Bookmarked', label: 'Bookmarked' },
  { id: 'Applied', label: 'Applied' },
  { id: 'Interviewing', label: 'Interviewing' },
  { id: 'Offer', label: 'Offer' },
  { id: 'Rejected', label: 'Rejected' },
];

export default function KanbanBoard({
  jobs,
  onCardClick,
  onStatusChange,
  selectedJobIds,
  onToggleSelectJob,
}: KanbanBoardProps) {
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
      gap: 24,
      minHeight: '70vh',
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
            style={{
              padding: 8,
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: isHovered ? 'rgba(212, 175, 55, 0.03)' : 'transparent',
              border: isHovered ? '1px dashed var(--gold-border)' : '1px solid transparent',
              minWidth: 220,
              transition: 'background 0.2s ease, border-color 0.2s ease'
            }}
          >
            {/* Column Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
              paddingBottom: 4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`status-dot status-${col.id}-dot`} style={{ width: 8, height: 8 }}></span>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'var(--font-header)' }}>{col.label}</h3>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: 12
                }}>
                  {columnJobs.length}
                </span>
              </div>
              
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <MoreHorizontal size={14} />
              </button>
            </div>

            {/* Column Cards Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              flex: 1,
              overflowY: 'auto',
              maxHeight: '65vh',
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
                      isSelected={selectedJobIds.includes(job.id)}
                      selectionModeActive={selectedJobIds.length > 0}
                      onToggleSelect={(e) => onToggleSelectJob(job.id, e)}
                    />
                  </div>
                ))
              ) : (
                <div style={{
                  border: '1px dashed var(--border-color)',
                  borderRadius: 16,
                  padding: '30px 10px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1
                }}>
                  No applications in {col.label}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
