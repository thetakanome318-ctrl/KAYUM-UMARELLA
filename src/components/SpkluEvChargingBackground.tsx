import React from 'react';
import plnWorkerBg from '../assets/images/pln_workers_transformer_1785949632322.jpg';

interface SpkluEvChargingBackgroundProps {
  isLight?: boolean;
}

export const SpkluEvChargingBackground: React.FC<SpkluEvChargingBackgroundProps> = ({ isLight = false }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* PLN Worker on Utility Pole Background Photo */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ 
          backgroundImage: `url(${plnWorkerBg})`,
          filter: isLight ? 'blur(4px) brightness(0.7) contrast(1.1)' : 'blur(8px) brightness(0.3) contrast(1.2)',
          opacity: isLight ? 0.7 : 0.4
        }}
      />

      {/* Background Ambient Glow - High Contrast Overlay */}
      <div className={`absolute inset-0 transition-colors duration-500 ${
        isLight 
          ? 'bg-white/30' 
          : 'bg-black/60'
      }`} />

      {/* Grid Pattern with subtle contrast lines */}
      <div className={`absolute inset-0 [background-size:36px_36px] transition-opacity ${
        isLight
          ? 'bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.06]'
          : 'bg-[radial-gradient(#fff_1px,transparent_1px)] opacity-[0.1]'
      }`} />

      {/* Ambient Pulsing Glow */}
      <div className="absolute top-1/4 right-10 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/10 via-emerald-500/10 to-transparent blur-3xl animate-pulse" />
      
      {/* Floating PLN ULP Baguala Worker Badge */}
      <div className={`absolute bottom-5 right-6 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-extrabold tracking-wide shadow-2xl backdrop-blur-md transition-colors ${
        isLight 
          ? 'bg-white/95 border-black text-black' 
          : 'bg-slate-900/95 border-white/40 text-white'
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
