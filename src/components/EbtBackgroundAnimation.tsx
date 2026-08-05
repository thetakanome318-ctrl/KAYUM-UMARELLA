import React from 'react';

export const EbtBackgroundAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Dark Ambient EBT Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/80" />

      {/* Grid Pattern with subtle cyan/green energy lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-15" />

      {/* EBT Sun / Solar Energy Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-amber-400/20 via-emerald-500/10 to-transparent blur-3xl animate-pulse" />

      {/* SVG Canvas for EBT Landscape & Animated Elements */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1400 800">
        <defs>
          <linearGradient id="solarPanelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="energyBeam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="hillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#064e3b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Rolling Hills Silhouette */}
        <path
          d="M 0 650 Q 350 550 700 620 T 1400 600 L 1400 800 L 0 800 Z"
          fill="url(#hillGrad)"
        />

        {/* Solar Panel Farm Silhouette */}
        <g transform="translate(150, 560)">
          {/* Solar Array 1 */}
          <polygon points="0,60 80,40 180,60 100,85" fill="url(#solarPanelGrad)" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="40" y1="50" x2="140" y2="72" stroke="#bae6fd" strokeWidth="1" strokeDasharray="4 2" />
          <line x1="90" y1="40" x2="90" y2="73" stroke="#bae6fd" strokeWidth="1" strokeDasharray="4 2" />

          {/* Solar Array 2 */}
          <polygon points="120,80 200,60 300,80 220,105" fill="url(#solarPanelGrad)" stroke="#38bdf8" strokeWidth="1.5" />
          <line x1="160" y1="70" x2="260" y2="92" stroke="#bae6fd" strokeWidth="1" strokeDasharray="4 2" />
        </g>

        {/* Animated Wind Turbines (EBT Wind Power) */}
        {/* Turbine 1 */}
        <g transform="translate(900, 420)">
          {/* Tower */}
          <polygon points="-4,180 4,180 2,0 -2,0" fill="#94a3b8" />
          {/* Nacelle Center */}
          <circle cx="0" cy="0" r="7" fill="#f8fafc" />
          {/* Animated Rotating Blades */}
          <g className="animate-spin" style={{ transformOrigin: '0px 0px', animationDuration: '6s' }}>
            {/* Blade 1 */}
            <path d="M0 0 L-4 -70 Q0 -80 4 -70 Z" fill="#e2e8f0" opacity="0.9" />
            {/* Blade 2 */}
            <path d="M0 0 L-4 -70 Q0 -80 4 -70 Z" fill="#e2e8f0" opacity="0.9" transform="rotate(120)" />
            {/* Blade 3 */}
            <path d="M0 0 L-4 -70 Q0 -80 4 -70 Z" fill="#e2e8f0" opacity="0.9" transform="rotate(240)" />
          </g>
        </g>

        {/* Turbine 2 (Smaller background) */}
        <g transform="translate(1120, 460) scale(0.75)">
          <polygon points="-4,180 4,180 2,0 -2,0" fill="#64748b" />
          <circle cx="0" cy="0" r="7" fill="#e2e8f0" />
          <g className="animate-spin" style={{ transformOrigin: '0px 0px', animationDuration: '4.5s' }}>
            <path d="M0 0 L-4 -70 Q0 -80 4 -70 Z" fill="#cbd5e1" transform="rotate(0)" />
            <path d="M0 0 L-4 -70 Q0 -80 4 -70 Z" fill="#cbd5e1" transform="rotate(120)" />
            <path d="M0 0 L-4 -70 Q0 -80 4 -70 Z" fill="#cbd5e1" transform="rotate(240)" />
          </g>
        </g>

        {/* Turbine 3 (Left Hill) */}
        <g transform="translate(480, 480) scale(0.85)">
          <polygon points="-4,180 4,180 2,0 -2,0" fill="#64748b" />
          <circle cx="0" cy="0" r="7" fill="#e2e8f0" />
          <g className="animate-spin" style={{ transformOrigin: '0px 0px', animationDuration: '5s' }}>
            <path d="M0 0 L-4 -70 Q0 -80 4 -70 Z" fill="#e2e8f0" transform="rotate(0)" />
            <path d="M0 0 L-4 -70 Q0 -80 4 -70 Z" fill="#e2e8f0" transform="rotate(120)" />
            <path d="M0 0 L-4 -70 Q0 -80 4 -70 Z" fill="#e2e8f0" transform="rotate(240)" />
          </g>
        </g>

        {/* Clean Energy Grid Flow Beams (Animated Energy Particles) */}
        <path
          d="M 280 620 C 450 580, 700 680, 900 420"
          fill="none"
          stroke="url(#energyBeam)"
          strokeWidth="3"
          strokeDasharray="12 12"
          className="animate-pulse"
        />

        <path
          d="M 900 420 C 1050 350, 1200 450, 1350 380"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="8 8"
          opacity="0.8"
        />
      </svg>

      {/* Floating Green Hydro & Clean Energy Ambient Particles */}
      <div className="absolute bottom-10 left-1/4 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
      <div className="absolute bottom-20 right-1/3 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-60" />
      <div className="absolute top-1/3 left-1/2 w-4 h-4 rounded-full bg-teal-300 blur-xs animate-pulse opacity-50" />

      {/* EBT Title Watermark Badge */}
      <div className="absolute bottom-4 left-6 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>EBT (Energi Baru Terbarukan) • Clean Grid PLN</span>
      </div>
    </div>
  );
};
