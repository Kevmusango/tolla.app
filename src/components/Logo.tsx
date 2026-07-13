import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" /> {/* Emerald 400 */}
          <stop offset="50%" stopColor="#10b981" /> {/* Emerald 500 */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan 500 */}
        </linearGradient>
      </defs>

      {/* Styled Modern Ribbon Loop (Double loop/infinity shape representing connections & referrals) */}
      <path 
        d="M12 8C12 8 9.5 4.5 7 4.5C4.5 4.5 4 7.5 6.5 8C9 8.5 12 8 12 8Z" 
        stroke="url(#logo-gradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
        strokeLinejoin="round" 
      />
      <path 
        d="M12 8C12 8 14.5 4.5 17 4.5C19.5 4.5 20 7.5 17.5 8C15 8.5 12 8 12 8Z" 
        stroke="url(#logo-gradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
        strokeLinejoin="round" 
      />

      {/* Styled Modern Gift Box Lid */}
      <rect 
        x="3" 
        y="8" 
        width="18" 
        height="3" 
        rx="1.5" 
        fill="url(#logo-gradient)" 
      />

      {/* Styled Modern Gift Box Body */}
      <rect 
        x="4.5" 
        y="11" 
        width="15" 
        height="9" 
        rx="2" 
        stroke="url(#logo-gradient)" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />

      {/* Center Ribbon / Node connector split line */}
      <path 
        d="M12 11V20" 
        stroke="url(#logo-gradient)" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      
      {/* Small Glowing Core center dot */}
      <circle 
        cx="12" 
        cy="8" 
        r="1.5" 
        fill="#ffffff" 
        className="animate-pulse" 
      />
    </svg>
  );
};
