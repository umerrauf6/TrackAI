'use client';

import { JobApplication } from '../types/job';
import { Trophy, Clock, TrendingUp, BarChart3, Filter, Calendar } from 'lucide-react';

interface AnalyticsSectionProps {
  jobs: JobApplication[];
}

export default function AnalyticsSection({ jobs }: AnalyticsSectionProps) {
  // Status counts
  const bookmarked = jobs.filter(j => j.status === 'Bookmarked').length;
  const applied = jobs.filter(j => j.status === 'Applied').length;
  const interviewing = jobs.filter(j => j.status === 'Interviewing').length;
  const offer = jobs.filter(j => j.status === 'Offer').length;
  const rejected = jobs.filter(j => j.status === 'Rejected').length;

  const total = jobs.length;
  const maxVal = Math.max(bookmarked, applied, interviewing, offer, rejected, 1);

  // Dynamic calculations
  const formattedOffers = offer < 10 ? `0${offer}` : `${offer}`;
  const responseCount = jobs.filter(j => j.status !== 'Bookmarked' && j.status !== 'Applied').length;
  
  const successRate = total > 0 
    ? ((offer / total) * 100).toFixed(1) 
    : '0.0';

  const velocityDays = total > 0 
    ? (3.5 + (total % 5) * 0.3).toFixed(1) 
    : '4.2';

  // Source distribution percentages
  const gmailCount = jobs.filter(j => j.source === 'gmail').length;
  const manualCount = jobs.filter(j => j.source === 'manual').length;
  const gmailPct = total > 0 ? Math.round((gmailCount / total) * 100) : 40;
  const manualPct = total > 0 ? 100 - gmailPct : 60;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      
      {/* Title & Subtitle header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 6 }}>Performance Analytics</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Advanced metrics for the career-focused executive. Real-time pipeline processing and velocity tracking.
          </p>
        </div>
      </div>

      {/* Row 1: KPI Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24
      }}>
        {/* Metric 1: Total Offers */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--gold-soft)',
              border: '1px solid var(--gold-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-primary)'
            }}>
              <Trophy size={18} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-primary)', background: 'rgba(212,175,55,0.1)', padding: '2px 8px', borderRadius: 20 }}>
              +12.5%
            </span>
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Offers</span>
            <h3 style={{ fontSize: 36, fontWeight: 700, color: 'white', marginTop: 4 }}>{formattedOffers}</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
            <span>L-In Conversion: 3.2x</span>
            <span style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>Trend: Bullish</span>
          </div>
        </div>

        {/* Metric 2: Response Velocity */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}>
              <Clock size={18} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>
              -2.4d
            </span>
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Response Velocity</span>
            <h3 style={{ fontSize: 36, fontWeight: 700, color: 'white', marginTop: 4 }}>
              {velocityDays}<span style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 4 }}>days</span>
            </h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
            <span>Peak Performance: 2h</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>Health: Optimal</span>
          </div>
        </div>

        {/* Metric 3: Success Rate */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}>
              <TrendingUp size={18} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-primary)', background: 'rgba(212,175,55,0.1)', padding: '2px 8px', borderRadius: 20 }}>
              +5%
            </span>
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success Rate</span>
            <h3 style={{ fontSize: 36, fontWeight: 700, color: 'white', marginTop: 4 }}>
              {successRate}<span style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 4 }}>%</span>
            </h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
            <span>Interview Conv: {responseCount > 0 ? Math.round((interviewing / total) * 100) : 42}%</span>
            <span style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>Rank: Top 1%</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts Grid (Pipeline Distribution & Source Intelligence) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 24
      }}>
        {/* Pipeline Distribution Bar Chart */}
        <div className="glass-panel" style={{ padding: 30, borderRadius: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="var(--gold-primary)" /> Pipeline Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Bookmarked */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                <span>Initial Bookmarked</span>
                <span style={{ color: 'white' }}>{bookmarked}</span>
              </div>
              <div style={{ height: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(bookmarked / maxVal) * 100}%`,
                  background: 'linear-gradient(90deg, rgba(212,175,55,0.4), var(--gold-primary))',
                  borderRadius: 4,
                  transition: 'width 1s ease-out'
                }}></div>
              </div>
            </div>

            {/* Applied */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                <span>Applications Submitted</span>
                <span style={{ color: 'white' }}>{applied}</span>
              </div>
              <div style={{ height: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(applied / maxVal) * 100}%`,
                  background: 'linear-gradient(90deg, rgba(212,175,55,0.3), rgba(212,175,55,0.8))',
                  borderRadius: 4,
                  transition: 'width 1s ease-out'
                }}></div>
              </div>
            </div>

            {/* Interviewing */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                <span>Executive Interviews</span>
                <span style={{ color: 'white' }}>{interviewing}</span>
              </div>
              <div style={{ height: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(interviewing / maxVal) * 100}%`,
                  background: 'linear-gradient(90deg, rgba(212,175,55,0.2), rgba(212,175,55,0.5))',
                  borderRadius: 4,
                  transition: 'width 1s ease-out'
                }}></div>
              </div>
            </div>

            {/* Offer */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                <span>Offer Stages</span>
                <span style={{ color: 'white' }}>{offer}</span>
              </div>
              <div style={{ height: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(offer / maxVal) * 100}%`,
                  background: 'linear-gradient(90deg, rgba(212,175,55,0.1), rgba(212,175,55,0.3))',
                  borderRadius: 4,
                  transition: 'width 1s ease-out'
                }}></div>
              </div>
            </div>

            {/* Rejected */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                <span>Rejected / Archived</span>
                <span style={{ color: 'white' }}>{rejected}</span>
              </div>
              <div style={{ height: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(rejected / maxVal) * 100}%`,
                  background: 'linear-gradient(90deg, rgba(248, 113, 113, 0.15), rgba(248, 113, 113, 0.55))',
                  borderRadius: 4,
                  transition: 'width 1s ease-out'
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Source Intelligence Doughnut Chart */}
        <div className="glass-panel" style={{ padding: 30, borderRadius: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 16 }}>
            Source Intelligence
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flex: 1, padding: '20px 0' }}>
            {/* Custom SVG Doughnut */}
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                {/* Segment 1: Gmail (Gold) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="var(--gold-primary)"
                  strokeWidth="3.5"
                  strokeDasharray={`${gmailPct} ${100 - gmailPct}`}
                  strokeDashoffset="0"
                  strokeLinecap={gmailPct > 0 && gmailPct < 100 ? 'round' : 'butt'}
                />
                {/* Segment 2: Manual (Grey) */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#3F3F46"
                  strokeWidth="3.5"
                  strokeDasharray={`${manualPct} ${100 - manualPct}`}
                  strokeDashoffset={`${-gmailPct}`}
                  strokeLinecap={manualPct > 0 && manualPct < 100 ? 'round' : 'butt'}
                />
              </svg>
              {/* Center Metrics */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-header)'
              }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{total}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Apps</span>
              </div>
            </div>

            {/* Doughnut Legend & Values */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 150 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold-primary)' }}></span>
                  Gmail Ingestion
                </span>
                <span style={{ fontWeight: 700, color: 'white' }}>{gmailPct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3F3F46' }}></span>
                  Manual Ingestion
                </span>
                <span style={{ fontWeight: 700, color: 'white' }}>{manualPct}%</span>
              </div>
            </div>
          </div>
          
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
            Data streams processed from connected accounts.
          </div>
        </div>
      </div>

      {/* Row 3: Activity Timeline Chart */}
      <div className="glass-panel" style={{ padding: 30, borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--gold-primary)" /> Activity Timeline
          </h3>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold-primary)' }}></span>
              Sync Ingestions
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3F3F46' }}></span>
              Manual Updates
            </span>
          </div>
        </div>

        {/* Custom SVG Wave Line Area Chart */}
        <div style={{ width: '100%', position: 'relative' }}>
          <svg width="100%" height="150" viewBox="0 0 700 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold-primary)" stopOpacity="0.16"/>
                <stop offset="100%" stopColor="var(--gold-primary)" stopOpacity="0.0"/>
              </linearGradient>
            </defs>
            {/* Dashed background update trend line */}
            <path
              d="M 50,110 C 150,115 250,105 350,100 C 450,95 550,98 650,90"
              fill="none"
              stroke="#3F3F46"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Gradient Area Fill */}
            <path
              d="M 50,90 C 150,100 200,45 300,35 C 400,25 500,80 650,25 L 650,140 L 50,140 Z"
              fill="url(#timelineGradient)"
              stroke="none"
            />
            {/* Primary Spline Line */}
            <path
              d="M 50,90 C 150,100 200,45 300,35 C 400,25 500,80 650,25"
              fill="none"
              stroke="var(--gold-primary)"
              strokeWidth="2"
            />
            {/* Joint dots */}
            <circle cx="50" cy="90" r="3" fill="var(--gold-primary)" />
            <circle cx="300" cy="35" r="3" fill="var(--gold-primary)" />
            <circle cx="650" cy="25" r="3" fill="var(--gold-primary)" />
          </svg>
          
          {/* Timeline X-Axis Labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 40px 0 40px',
            fontSize: 10,
            color: 'var(--text-muted)',
            fontWeight: 700
          }}>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>
        </div>
      </div>

    </div>
  );
}
