import React, { useState, useRef, useEffect } from 'react';
import { ViewTab } from '../types';
import {
  LayoutDashboard,
  HeartPulse,
  ShieldAlert,
  BarChart3,
  MapIcon,
  Database,
  Zap,
  Bot,
  ChevronDown,
} from 'lucide-react';

interface HorizontalNavProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  isLight?: boolean;
  gangguanCount?: number;
  penyulangCount?: number;
  isReadOnly?: boolean;
  onOpenAddModal?: () => void;
  onOpenInspectionModal?: () => void;
  onOpenPemeliharaanModal?: () => void;
  onOpenGangguanPangkalModal?: () => void;
  onOpenAiAssistant?: () => void;
}

export const HorizontalNav: React.FC<HorizontalNavProps> = ({
  activeTab,
  setActiveTab,
  isLight = false,
  gangguanCount = 0,
  penyulangCount = 8,
  isReadOnly = false,
  onOpenAddModal,
  onOpenInspectionModal,
  onOpenPemeliharaanModal,
  onOpenGangguanPangkalModal,
  onOpenAiAssistant,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'gangguan' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isGangguanActive = ['health_index', 'gangguan', 'gangguan_pangkal', 'saidi_saifi'].includes(activeTab);


  return (
    <div ref={containerRef} className={`w-full rounded-2xl border p-3 backdrop-blur-md shadow-xl transition-all duration-300 relative z-[60] ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/50' 
        : 'bg-[#0B0F19]/95 border-slate-800 text-white shadow-black/80'
    }`}>
      {/* Multi-line Wrapped Navigation Container (NO Horizontal Scrolling) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Navigation Categories & Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* 1. Ringkasan Eksekutif */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setOpenDropdown(null);
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
              activeTab === 'dashboard'
                ? isLight
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400/60 shadow-md shadow-blue-500/40'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border-transparent'
            }`}
          >
            <div className="p-1 rounded-lg bg-gradient-to-b from-blue-500 to-indigo-700 text-white border-t border-white/30 shadow-xs">
              <LayoutDashboard className="w-3.5 h-3.5" />
            </div>
            <span>Ringkasan Eksekutif</span>
          </button>

          {/* 2. Menu Gangguan (Dropdown: Status Penyulang, Catatan Gangguan, Gangguan Pangkal, SAIDI/SAIFI) */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'gangguan' ? null : 'gangguan')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
                isGangguanActive
                  ? isLight
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/30'
                    : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white border-rose-400/60 shadow-md shadow-rose-500/40'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border-transparent'
              }`}
            >
              <div className="p-1 rounded-lg bg-gradient-to-b from-red-500 to-rose-800 text-white border-t border-white/30 shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <span>Gangguan</span>
              {gangguanCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-black">
                  {gangguanCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'gangguan' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'gangguan' && (
              <div className={`absolute top-full left-0 mt-2 w-60 rounded-2xl border shadow-2xl p-2 z-[100] animate-in zoom-in-95 duration-150 ${
                isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
              }`}>
                <div className="text-[10px] font-black uppercase text-slate-400 px-3 py-1 tracking-wider">
                  Modul Gangguan & Index
                </div>
                
                <button
                  onClick={() => { setActiveTab('health_index'); setOpenDropdown(null); }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'health_index' ? 'bg-rose-500/20 text-rose-400 font-extrabold' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  <span>Status Penyulang ({penyulangCount})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('gangguan'); setOpenDropdown(null); }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'gangguan' ? 'bg-red-500/20 text-red-400 font-extrabold' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>Catatan Gangguan</span>
                  {gangguanCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">
                      {gangguanCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('gangguan_pangkal'); setOpenDropdown(null); }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'gangguan_pangkal' ? 'bg-amber-500/20 text-amber-400 font-extrabold' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Gangguan Pangkal (GI)</span>
                </button>

                <button
                  onClick={() => { setActiveTab('saidi_saifi'); setOpenDropdown(null); }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'saidi_saifi' ? 'bg-blue-500/20 text-blue-400 font-extrabold' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span>Laporan SAIDI / SAIFI</span>
                </button>
              </div>
            )}
          </div>



          {/* Standalone Peta Sebaran Button for direct access */}
          <button
            onClick={() => {
              setActiveTab('map');
              setOpenDropdown(null);
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
              activeTab === 'map'
                ? isLight
                  ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-500/30'
                  : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-400/60 shadow-md shadow-teal-500/40'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border-transparent'
            }`}
          >
            <div className="p-1 rounded-lg bg-gradient-to-b from-teal-500 to-emerald-800 text-white border-t border-white/30 shadow-xs">
              <MapIcon className="w-3.5 h-3.5" />
            </div>
            <span>Peta Sebaran</span>
          </button>

          {/* 6. Master Data */}
          <button
            onClick={() => {
              setActiveTab('master');
              setOpenDropdown(null);
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
              activeTab === 'master'
                ? isLight
                  ? 'bg-slate-800 text-white border-slate-700 shadow-md'
                  : 'bg-gradient-to-r from-slate-700 to-slate-900 text-white border-slate-600 shadow-md'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border-transparent'
            }`}
          >
            <div className="p-1 rounded-lg bg-gradient-to-b from-slate-600 to-slate-900 text-white border-t border-white/30 shadow-xs">
              <Database className="w-3.5 h-3.5" />
            </div>
            <span>Master Data</span>
          </button>

          {/* 6b. SLD (Single Line Diagram Visio) */}
          <button
            onClick={() => {
              setActiveTab('sld');
              setOpenDropdown(null);
            }}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
              activeTab === 'sld'
                ? isLight
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/30'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-400/60 shadow-md shadow-amber-500/40'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border-transparent'
            }`}
            title="Single Line Diagram (SLD) Import Visio"
          >
            <div className="p-1 rounded-lg bg-gradient-to-b from-amber-500 to-orange-700 text-white border-t border-white/30 shadow-xs">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span>SLD Visio</span>
          </button>

          {/* 7. AI Protection Analyst */}
          {onOpenAiAssistant && (
            <button
              onClick={() => {
                onOpenAiAssistant();
                setOpenDropdown(null);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
                isLight 
                  ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100' 
                  : 'bg-purple-950/60 text-purple-200 border-purple-500/40 hover:bg-purple-900/80'
              }`}
            >
              <div className="p-1 rounded-lg bg-gradient-to-b from-purple-500 to-indigo-700 text-white border-t border-white/30 shadow-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span>AI Protection Analyst</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 font-mono text-[9px] font-extrabold uppercase border border-purple-400/30">
                Gemini
              </span>
            </button>
          )}

        </div>



      </div>
    </div>
  );
};
