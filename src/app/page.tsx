'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ArrowRight, Mail, Sparkles, Kanban, CheckSquare, BarChart3, ShieldCheck } from 'lucide-react';
import Logo from './components/Logo';

export default function LandingPage() {
  const router = useRouter();
  
  // GSAP Animation Refs
  const headerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is already logged in
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.push('/dashboard');
        }
      })
      .catch(() => {});

    // GSAP Intro Animations
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Fade-in header and hero items
    tl.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
      .fromTo('.hero-title', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, '-=0.5')
      .fromTo('.hero-desc', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.7')
      .fromTo('.hero-cta', { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, '-=0.5')
      .fromTo(mockupRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, '-=0.5');

    // Quick stagger for features on load
    gsap.fromTo('.feature-card', 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, delay: 0.5 }
    );
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header bar */}
      <header ref={headerRef} className="glass-panel landing-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={32} />
          <span className="brand-font" style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(to right, #D4AF37, #E6C766)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TrackAI</span>
        </div>

        <nav className="flex items-center" style={{ gap: 24 }}>
          <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Features</a>
          <Link href="/login" className="btn btn-primary btn-glow" style={{ padding: '8px 16px', fontSize: 13 }}>
            Sign In / Sign Up
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, width: '90%', maxWidth: 1200, margin: '40px auto 0 auto' }}>
        
        {/* Hero Section */}
        <section ref={heroRef} style={{ textAlign: 'center', padding: '60px 0 40px 0', position: 'relative' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '20px',
            color: 'var(--accent)',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 24
          }}>
            <Sparkles size={14} /> Automate Your Job Application Tracking
          </div>
          
          <h1 className="hero-title" style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 20,
            background: 'linear-gradient(to bottom, #ffffff 60%, #9ca3af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: 900,
            margin: '0 auto 20px auto'
          }}>
            Track Job Applications Automatically.<br />
            Powered by Gmail Sync & AI.
          </h1>
          
          <p className="hero-desc" style={{
            fontSize: 18,
            color: 'var(--text-secondary)',
            maxWidth: 600,
            margin: '0 auto 32px auto',
            lineHeight: 1.6
          }}>
            Connect your Gmail. Our secure AI agent automatically scans application emails, extracts salaries and roles, and builds your tracking board. No manual inputs required.
          </p>

          <div className="hero-cta" style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 60 }}>
            <Link href="/login" className="btn btn-primary btn-glow" style={{ padding: '14px 28px', fontSize: 16, borderRadius: 10 }}>
              Start Tracking Now <ArrowRight size={16} />
            </Link>
            <a href="#features" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: 16, borderRadius: 10 }}>
              See Features
            </a>
          </div>

          {/* Interactive UI Mockup */}
          <div ref={mockupRef} className="glass-panel" style={{
            padding: '24px',
            borderRadius: 20,
            maxWidth: 950,
            margin: '0 auto',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 80px rgba(139, 92, 246, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></div>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>app.trackai.com/dashboard</span>
            </div>
            
            {/* Visual Email to Card Stagger Demo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, textAlign: 'left' }}>
              <div className="glass-panel" style={{ padding: 16, background: 'rgba(0, 0, 0, 0.25)', borderRadius: 10 }}>
                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>INCOMING GMAIL DETECTED</span>
                <h4 style={{ fontSize: 13, margin: '4px 0', color: 'white' }}>Google Careers</h4>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, fontStyle: 'italic' }}>"Thank you for applying to the Software Engineer role..."</p>
                <div style={{ height: 1, background: 'var(--border-color)', margin: '8px 0' }}></div>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Status: Auto-detected applied state</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="glass-panel" style={{ padding: 12, borderRadius: 10, borderLeft: '4px solid hsl(var(--status-applied))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="status-tag status-Applied" style={{ fontSize: 9 }}>Applied</span>
                    <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>Auto-Synced</span>
                  </div>
                  <h4 style={{ fontSize: 13, color: 'white', marginBottom: 2 }}>Google</h4>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Software Engineer</p>
                </div>
                <div className="glass-panel" style={{ padding: 12, borderRadius: 10, opacity: 0.5, borderLeft: '4px solid hsl(var(--status-interviewing))' }}>
                  <span className="status-tag status-Interviewing" style={{ fontSize: 9, marginBottom: 6 }}>Interviewing</span>
                  <h4 style={{ fontSize: 13, color: 'white', marginBottom: 2 }}>Stripe</h4>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Frontend Architect</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" ref={featuresRef} style={{ padding: '80px 0 120px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: 32, marginBottom: 12 }}>Engineered to Automate Your Search</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 650, margin: '0 auto' }}>
              We built features that eliminate the manual admin work of keeping track of job hunting, giving you an edge in preparing for interviews.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <div className="glass-panel feature-card" style={{ padding: 24 }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: 44, height: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: 16 }}>
                <Mail size={22} />
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8, color: 'white' }}>Gmail Synchronization</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                Sync with a single click. We scan relevant subject lines and messages automatically, identifying applications in real-time.
              </p>
            </div>

            <div className="glass-panel feature-card" style={{ padding: 24 }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: 44, height: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: 16 }}>
                <Sparkles size={22} />
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8, color: 'white' }}>Groq AI Parsing</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                Our integrated language model reads complex email threads to extract positions, salary ranges, deadlines, and contacts.
              </p>
            </div>

            <div className="glass-panel feature-card" style={{ padding: 24 }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: 44, height: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: 16 }}>
                <Kanban size={22} />
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8, color: 'white' }}>Kanban Management</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                Organize your pipeline through columns from bookmark to final offers. Smooth layout shifts keep everything clean.
              </p>
            </div>

            <div className="glass-panel feature-card" style={{ padding: 24 }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: 44, height: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: 16 }}>
                <CheckSquare size={22} />
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 8, color: 'white' }}>Dynamic Prep Tasks</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                Status changes auto-generate interview check-lists (e.g. mock screens, recruiter follow-ups) to keep you ready.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass-panel" style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        padding: '24px 0',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 0
      }}>
        <div style={{ width: '90%', maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
          <span>© 2026 TrackAI. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
