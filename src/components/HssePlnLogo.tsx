import React from 'react';

interface HssePlnLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const HssePlnLogo: React.FC<HssePlnLogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true 
}) => {
  const sizeClasses = {
    sm: { box: 'w-7 h-7', text: 'text-[9px]', subtext: 'text-[7px]' },
    md: { box: 'w-10 h-10', text: 'text-xs', subtext: 'text-[8px]' },
    lg: { box: 'w-14 h-14', text: 'text-sm', subtext: 'text-[10px]' }
  }[size];

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Authentic HSSE PLN Shield & K3 Gear Emblem */}
      <div className={`relative ${sizeClasses.box} shrink-0 flex items-center justify-center filter drop-shadow-md`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            {/* Outer Shield Gradient */}
            <linearGradient id="hsseShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#15803d" /> {/* Emerald/Green K3 */}
              <stop offset="50%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            {/* Inner Gold Border */}
            <linearGradient id="hsseGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            {/* PLN Spark Red Gradient */}
            <linearGradient id="plnSparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>

          {/* Shield Outer Path */}
          <path
            d="M50 5 L88 20 C88 60 70 85 50 95 C30 85 12 60 12 20 Z"
            fill="url(#hsseShieldGrad)"
            stroke="url(#hsseGoldGrad)"
            strokeWidth="4"
          />

          {/* K3 Gear / Safety Wheel Symbol */}
          <g transform="translate(50, 48) scale(0.65)" opacity="0.9">
            {/* Gear teeth circle */}
            <circle cx="0" cy="0" r="28" fill="none" stroke="#fef08a" strokeWidth="6" strokeDasharray="8 6" />
            {/* White Safety Cross */}
            <path
              d="M-8 -22 H8 V-8 H22 V8 H8 V22 H-8 V8 H-22 V-8 H-8 Z"
              fill="#ffffff"
              stroke="#047857"
              strokeWidth="2"
            />
          </g>

          {/* PLN Lightning Spark Center Overlay */}
          <path
            d="M52 24 L38 52 H48 L44 76 L62 46 H50 Z"
            fill="url(#plnSparkGrad)"
            stroke="#fef08a"
            strokeWidth="1.5"
            className="filter drop-shadow"
          />
        </svg>
      </div>

      {/* HSSE PLN Badge Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-black tracking-wider text-amber-300 uppercase ${sizeClasses.text} flex items-center gap-1 drop-shadow-xs`}>
            <span>HSSE</span>
            <span className="text-white bg-red-600 px-1 py-0.2 rounded text-[80%] font-extrabold border border-red-400">PLN</span>
          </div>
          <div className={`font-bold text-emerald-200 opacity-90 uppercase tracking-tight ${sizeClasses.subtext}`}>
            K3L & Keselamatan Kerja
          </div>
        </div>
      )}
    </div>
  );
};
