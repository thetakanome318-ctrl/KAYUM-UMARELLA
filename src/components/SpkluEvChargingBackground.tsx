import React from 'react';
import plnWorkerBg from '../assets/images/pln_worker_bg_1785941893258.jpg';

interface SpkluEvChargingBackgroundProps {
  isLight?: boolean;
}

export const SpkluEvChargingBackground: React.FC<SpkluEvChargingBackgroundProps> = ({ isLight = false }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* PLN Worker on Utility Pole Background Photo with high blur to not distract */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ 
          backgroundImage: `url(${plnWorkerBg})`,
          filter: 'blur(24px) brightness(0.65) contrast(1.1)',
          opacity: isLight ? 0.12 : 0.22
        }}
      />

      {/* Background Ambient Glow */}
      <div className={`absolute inset-0 transition-colors duration-500 ${
        isLight 
          ? 'bg-gradient-to-br from-slate-100/85 via-cyan-50/40 to-amber-50/70' 
          : 'bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950'
      }`} />

      {/* Grid Pattern with subtle grid lines */}
      <div className={`absolute inset-0 [background-size:36px_36px] transition-opacity ${
        isLight
          ? 'bg-[radial-gradient(#059669_1px,transparent_1px)] opacity-[0.04]'
          : 'bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-[0.08]'
      }`} />

      {/* Ambient Pulsing Glow */}
      <div className="absolute top-1/4 right-10 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-transparent blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-600/10 via-blue-500/5 to-transparent blur-3xl" />

      {/* Floating PLN ULP Baguala Worker Badge */}
      <div className={`absolute bottom-5 right-6 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-extrabold tracking-wide shadow-2xl backdrop-blur-md transition-colors ${
        isLight 
          ? 'bg-white/80 border-emerald-500/30 text-emerald-800' 
          : 'bg-slate-900/80 border-emerald-500/30 text-emerald-300'
      }`}>
        <div className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </div>
        <span>PLN ULP BAGUALA • K3 &amp; KEANDALAN JARINGAN</span>
      </div>
    </div>
  );
};
