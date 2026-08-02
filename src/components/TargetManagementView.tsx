import React, { useState, useEffect, useMemo } from 'react';
import { 
  subscribeMonthlyTargets, 
  saveMonthlyTargetToCloud 
} from '../lib/firebase';
import { MonthlyTargetItem } from '../utils/targetStorage';
import { Calendar, Target, TrendingUp, Info } from 'lucide-react';
import { formatNumber } from '../utils/calculations';

interface TargetManagementViewProps {
  isLight: boolean;
}

export const TargetManagementView: React.FC<TargetManagementViewProps> = ({ isLight }) => {
  const [targetsMap, setTargetsMap] = useState<Record<string, MonthlyTargetItem>>({});
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const unsub = subscribeMonthlyTargets(setTargetsMap);
    return () => unsub();
  }, []);

  const handleUpdateTarget = async (bulanKe: number, updates: Partial<MonthlyTargetItem>) => {
    const bulanKey = `${selectedYear}-${String(bulanKe).padStart(2, '0')}`;
    const existing = targetsMap[bulanKey];
    
    let targetKms = updates.targetKms !== undefined ? updates.targetKms : (existing ? existing.targetKms : 0);
    let targetGawang = updates.targetGawang !== undefined ? updates.targetGawang : (existing ? existing.targetGawang : 0);
    
    // Auto calculate Gawang based on KMS if targetKms is updated
    if (updates.targetKms !== undefined) {
      targetGawang = targetKms * 20;
    }

    const newTarget: MonthlyTargetItem = {
      bulanKey,
      tahun: selectedYear,
      bulanKe,
      targetKms,
      targetGawang,
      targetPohon: updates.targetPohon !== undefined ? updates.targetPohon : (existing ? existing.targetPohon : 0),
      workDays: updates.workDays !== undefined ? updates.workDays : (existing ? (existing.workDays || 22) : 22),
    };

    await saveMonthlyTargetToCloud(newTarget);
  };

  const months = [
    { id: 1, nama: 'Januari' },
    { id: 2, nama: 'Februari' },
    { id: 3, nama: 'Maret' },
    { id: 4, nama: 'April' },
    { id: 5, nama: 'Mei' },
    { id: 6, nama: 'Juni' },
    { id: 7, nama: 'Juli' },
    { id: 8, nama: 'Agustus' },
    { id: 9, nama: 'September' },
    { id: 10, nama: 'Oktober' },
    { id: 11, nama: 'November' },
    { id: 12, nama: 'Desember' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className={`backdrop-blur-md p-6 rounded-2xl border shadow-xl transition-all duration-300 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Target className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Manajemen Target Unit</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Atur target total unit per bulan dan otomatisasi target harian
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`flex items-center px-4 py-2 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
            }`}>
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent border-none focus:outline-none text-sm font-bold pr-2 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y} className={isLight ? 'text-slate-900' : 'text-white bg-slate-800'}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className={`p-4 rounded-xl border flex gap-3 ${
        isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
      }`}>
        <Info className="w-5 h-5 shrink-0" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold mb-1">Panduan Pengisian Target</p>
          <p>Target harian dihitung secara otomatis berdasarkan jumlah hari kerja yang disesuaikan per bulan. Isikan target total untuk satu bulan penuh, dan sistem akan membaginya untuk pemantauan harian di dashboard.</p>
        </div>
      </div>

      {/* Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {months.map((m) => {
          const bulanKey = `${selectedYear}-${String(m.id).padStart(2, '0')}`;
          const target = targetsMap[bulanKey] || { targetKms: 0, targetGawang: 0, targetPohon: 0, workDays: 22 };
          const workDays = target.workDays || 22;
          const dailyKms = workDays > 0 ? target.targetKms / workDays : 0;
          const dailyGawang = workDays > 0 ? Math.round(target.targetGawang / workDays) : 0;

          return (
            <div key={m.id} className={`p-5 rounded-2xl border shadow-lg transition-all hover:scale-[1.02] duration-300 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black uppercase tracking-widest text-purple-500">{m.nama}</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    defaultValue={workDays}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value) || 22;
                      if (val !== workDays) handleUpdateTarget(m.id, { workDays: val });
                    }}
                    className={`w-12 px-1 text-center text-[10px] font-bold rounded border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                  <span className={`text-[9px] font-bold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>HARI</span>
                </div>
              </div>

              <div className="space-y-6">
                {/* KMS Target */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target KMS (Bulan)</label>
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={target.targetKms}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (val !== target.targetKms) handleUpdateTarget(m.id, { targetKms: val });
                      }}
                      className={`w-full pl-4 pr-12 py-2.5 text-base font-bold rounded-xl border outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 focus:border-purple-400 focus:bg-white text-slate-800' 
                          : 'bg-slate-800/50 border-slate-700 focus:border-purple-500 focus:bg-slate-800 text-white'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500">KMS</span>
                  </div>
                  <div className={`p-2.5 rounded-xl flex items-center justify-between ${isLight ? 'bg-emerald-50' : 'bg-emerald-500/5'}`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Target Harian</span>
                    <span className="text-sm font-black text-emerald-500">{formatNumber(dailyKms, 3)} KMS</span>
                  </div>
                </div>

                {/* Gawang Target */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target Span/Gawang (Bulan)</label>
                    <Target className="w-3 h-3 text-indigo-500" />
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      defaultValue={target.targetGawang}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (val !== target.targetGawang) handleUpdateTarget(m.id, { targetGawang: val });
                      }}
                      className={`w-full pl-4 pr-12 py-2.5 text-base font-bold rounded-xl border outline-none transition-all ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 focus:border-purple-400 focus:bg-white text-slate-800' 
                          : 'bg-slate-800/50 border-slate-700 focus:border-purple-500 focus:bg-slate-800 text-white'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500">SPAN</span>
                  </div>
                  <div className={`p-2.5 rounded-xl flex items-center justify-between ${isLight ? 'bg-indigo-50' : 'bg-indigo-500/5'}`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Target Harian</span>
                    <span className="text-sm font-black text-indigo-500">{formatNumber(dailyGawang, 2)} SPAN</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
