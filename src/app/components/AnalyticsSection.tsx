'use client';

import { useEffect, useRef } from 'react';
import { JobApplication } from '../types/job';
import gsap from 'gsap';
import { BarChart3, TrendingUp, Award, RefreshCw } from 'lucide-react';

interface AnalyticsSectionProps {
  jobs: JobApplication[];
}

export default function AnalyticsSection({ jobs }: AnalyticsSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Status counters
  const bookmarked = jobs.filter(j => j.status === 'Bookmarked').length;
  const applied = jobs.filter(j => j.status === 'Applied').length;
  const interviewing = jobs.filter(j => j.status === 'Interviewing').length;
  const offer = jobs.filter(j => j.status === 'Offer').length;
  const rejected = jobs.filter(j => j.status === 'Rejected').length;

  const total = jobs.length;
  const maxVal = Math.max(bookmarked, applied, interviewing, offer, rejected, 1);

  // Conversion calculations
  const totalAppliedAndBeyond = jobs.filter(j => j.status !== 'Bookmarked').length;
  const responseCount = jobs.filter(j => j.status !== 'Bookmarked' && j.status !== 'Applied').length;
  const interviewConversion = totalAppliedAndBeyond > 0 
    ? Math.round((interviewing / totalAppliedAndBeyond) * 100) 
    : 0;
  const offerConversion = totalAppliedAndBeyond > 0
    ? Math.round((offer / totalAppliedAndBeyond) * 100)
    : 0;

  useEffect(() => {
    // Circular gauge animation
    const circle = document.querySelector('.gauge-circle') as SVGPathElement;
    if (circle) {
      const length = circle.getTotalLength();
      circle.style.strokeDasharray = `${length}`;
      const percentage = interviewConversion / 100;
      const offset = length * (1 - percentage);
      
      gsap.fromTo(
        circle,
        { strokeDashoffset: length },
        { strokeDashoffset: offset, duration: 1.5, ease: 'power3.out' }
      );
    }
  }, [jobs, interviewConversion]);

  return (
    <div ref={containerRef} className="glass-panel" style={{
      padding: 24,
      borderRadius: 16,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 30,
      marginBottom: 30
    }}>
      
      {/* Chart 1: Stage Distribution */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <BarChart3 size={18} color="var(--accent)" /> Stage Distribution
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Bookmarked */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Bookmarked</span>
              <span style={{ fontWeight: 600, color: 'white' }}>{bookmarked}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(bookmarked / maxVal) * 100}%`, 
                  background: 'hsl(var(--status-bookmarked))', 
                  borderRadius: 4,
                  transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              ></div>
            </div>
          </div>

          {/* Applied */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Applied</span>
              <span style={{ fontWeight: 600, color: 'white' }}>{applied}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(applied / maxVal) * 100}%`, 
                  background: 'hsl(var(--status-applied))', 
                  borderRadius: 4,
                  transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              ></div>
            </div>
          </div>

          {/* Interviewing */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Interviewing</span>
              <span style={{ fontWeight: 600, color: 'white' }}>{interviewing}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(interviewing / maxVal) * 100}%`, 
                  background: 'hsl(var(--status-interviewing))', 
                  borderRadius: 4,
                  transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              ></div>
            </div>
          </div>

          {/* Offer */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Offer</span>
              <span style={{ fontWeight: 600, color: 'white' }}>{offer}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(offer / maxVal) * 100}%`, 
                  background: 'hsl(var(--status-offer))', 
                  borderRadius: 4,
                  transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              ></div>
            </div>
          </div>

          {/* Rejected */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Rejected</span>
              <span style={{ fontWeight: 600, color: 'white' }}>{rejected}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(rejected / maxVal) * 100}%`, 
                  background: 'hsl(var(--status-rejected))', 
                  borderRadius: 4,
                  transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart 2: Pipeline Conversion Rates */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <TrendingUp size={18} color="#10b981" /> Funnel Conversion Rates
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 30, justifyContent: 'center', flex: 1 }}>
          {/* Circular Gauge */}
          <div style={{ position: 'relative', width: 110, height: 110 }}>
            <svg width="100%" height="100%" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="3.5"
              />
              {/* Animated foreground path */}
              <path
                className="gauge-circle"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--accent)"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{interviewConversion}%</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Interviews</span>
            </div>
          </div>

          {/* Stats Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Applied to Interview Rate</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginTop: 2 }}>
                {interviewConversion}% conversion
              </p>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Offer Acceptance Rate</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginTop: 2 }}>
                {offerConversion}% final offers
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer info text */}
        <div style={{
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: 8,
          fontSize: 11,
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          Response Metrics are evaluated from applications that advanced from Bookmarked stage.
        </div>
      </div>

    </div>
  );
}
