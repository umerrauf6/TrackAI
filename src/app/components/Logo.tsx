import React from 'react';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 32 }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0px 0px 8px rgba(139, 92, 246, 0.35))' }}
    >
      <defs>
        <linearGradient id="logo-grad-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      
      {/* Outer Radar/Orbit Scanning Circle */}
      <circle 
        cx="16" 
        cy="16" 
        r="14" 
        stroke="url(#logo-grad-grad)" 
        strokeWidth="1.5" 
        strokeDasharray="4 3" 
        opacity="0.4" 
      />
      
      {/* Inner subtle glow circle */}
      <circle 
        cx="16" 
        cy="16" 
        r="10" 
        stroke="url(#logo-grad-grad)" 
        strokeWidth="1.2" 
        opacity="0.2" 
      />

      {/* Stylized Futuristic Letter T / Upward Trend hybrid */}
      <path 
        d="M9 7C8.44772 7 8 7.44772 8 8V10.5C8 11.0523 8.44772 11.5 9 11.5H13.5V23C13.5 24.1046 14.3954 25 15.5 25H16.5C17.6046 25 18.5 24.1046 18.5 23V11.5H23C23.5523 11.5 24 11.0523 24 10.5V8C24 7.44772 23.5523 7 23 7H9Z" 
        fill="url(#logo-grad-grad)" 
      />

      {/* AI Spark indicator */}
      <circle 
        cx="23.5" 
        cy="8.5" 
        r="2.5" 
        fill="#10b981" 
      />
      
      {/* Target Crosshair ticks */}
      <line x1="16" y1="0" x2="16" y2="4" stroke="url(#logo-grad-grad)" strokeWidth="1" opacity="0.6" />
      <line x1="16" y1="28" x2="16" y2="32" stroke="url(#logo-grad-grad)" strokeWidth="1" opacity="0.6" />
      <line x1="0" y1="16" x2="4" y2="16" stroke="url(#logo-grad-grad)" strokeWidth="1" opacity="0.6" />
      <line x1="28" y1="16" x2="32" y2="16" stroke="url(#logo-grad-grad)" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
