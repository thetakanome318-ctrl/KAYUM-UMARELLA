import React from 'react';
import { FilterState } from '../types';
import { TreePine, ClipboardCheck, ShieldAlert, Wrench, Check } from 'lucide-react';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  totalFilteredCount: number;
  isLight?: boolean;
  counts?: {
    ROW: number;
    INSPEKSI: number;
    GANGGUAN: number;
    PEMELIHARAAN?: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  totalFilteredCount,
  isLight = false,
  counts = { ROW: 0, INSPEKSI: 0, GANGGUAN: 0, PEMELIHARAAN: 0 },
}) => {
  const categories = [
    {
      id: 'ROW' as const,
      label: 'ROW',
      description: 'Pemangkasan & Pengawasan',
      icon: TreePine,
      count: counts.ROW,
      activeBg: isLight 
        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md shadow-emerald-500/10' 
        : 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50',
      inactiveBg: isLight 
        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50' 
        : 'bg-[#0D1322] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60',
      iconBg: 'bg-gradient-to-b from-emerald-500 to-emerald-700 text-white border-t border-emerald-300/40 border-b border-black/40 shadow-md shadow-emerald-900/50',
      badgeBg: 'bg-emerald-500 text-slate-950',
    },
    {
      id: 'INSPEKSI' as const,
      label: 'Inspeksi',
      description: 'Inspeksi Tier 1 & Tier 2',
      icon: ClipboardCheck,
      count: counts.INSPEKSI,
      activeBg: isLight 
        ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-md shadow-sky-500/10' 
        : 'bg-sky-950/40 border-sky-500 text-sky-200 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/50',
      inactiveBg: isLight 
        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50' 
        : 'bg-[#0D1322] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60',
      iconBg: 'bg-gradient-to-b from-sky-500 to-sky-700 text-white border-t border-sky-300/40 border-b border-black/40 shadow-md shadow-sky-900/50',
      badgeBg: 'bg-sky-500 text-slate-950',
    },
    {
      id: 'GANGGUAN' as const,
      label: 'Gangguan',
      description: 'Gangguan Penyulang',
      icon: ShieldAlert,
      count: counts.GANGGUAN,
      activeBg: isLight 
        ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-md shadow-rose-500/10' 
        : 'bg-rose-950/40 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/50',
      inactiveBg: isLight 
        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50/50' 
        : 'bg-[#0D1322] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60',
      iconBg: 'bg-gradient-to-b from-rose-500 to-rose-700 text-white border-t border-rose-300/40 border-b border-black/40 shadow-md shadow-rose-900/50',
      badgeBg: 'bg-rose-500 text-white',
    },
    {
      id: 'PEMELIHARAAN' as const,
      label: 'Pemeliharaan',
      description: 'Pemeliharaan Rutin & Korektif',
      icon: Wrench,
      count: counts.PEMELIHARAAN || 0,
      activeBg: isLight 
        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-md shadow-indigo-500/10' 
        : 'bg-indigo-950/40 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50',
      inactiveBg: isLight 
        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50' 
        : 'bg-[#0D1322] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60',
      iconBg: 'bg-gradient-to-b from-indigo-500 to-indigo-700 text-white border-t border-indigo-300/40 border-b border-black/40 shadow-md shadow-indigo-900/50',
      badgeBg: 'bg-indigo-500 text-white',
    },
  ];

  return (
    <div className={`backdrop-blur-md rounded-2xl p-4 border transition-all duration-300 ${
      isLight 
        ? 'bg-white border-slate-200/80 text-slate-800 shadow-slate-100 shadow-lg' 
        : 'bg-[#0B0F19]/95 border-slate-800 text-white shadow-2xl'
    }`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
          isLight ? 'text-slate-500' : 'text-slate-400'
        }`}>
          <span>PILIH TIPE DATA:</span>
        </label>
        <span className="text-xs font-semibold text-slate-500">
          Menampilkan: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-emerald-400 font-bold'}>{totalFilteredCount}</strong> data
        </span>
      </div>

      {/* 4 Columns for Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = filter.tipeData === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onFilterChange({ ...filter, tipeData: cat.id })}
              className={`relative text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center space-x-3 group ${
                isActive ? cat.activeBg : cat.inactiveBg
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 transform group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-200 ${cat.iconBg}`}>
                <Icon className="w-5 h-5 drop-shadow" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-xs font-bold truncate tracking-tight">{cat.label}</h3>
                  {isActive && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shrink-0 ${cat.badgeBg}`}>
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      AKTIF
                    </span>
                  )}
                </div>
                <p className={`text-[10px] truncate mt-0.5 ${
                  isActive ? (isLight ? 'text-slate-600' : 'text-slate-300') : (isLight ? 'text-slate-400' : 'text-slate-500')
                }`}>
                  {cat.description}
                </p>
                <div className="mt-1.5 flex items-center">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    isActive 
                      ? (isLight ? 'bg-slate-200/80 text-slate-800' : 'bg-white/10 text-white')
                      : (isLight ? 'bg-slate-200/60 text-slate-600' : 'bg-slate-800/80 text-slate-400')
                  }`}>
                    {cat.count} Data
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

