import React, { useMemo } from 'react';
import { ROWRecord } from '../types';
import { AlertTriangle, Trophy, Zap, ShieldAlert } from 'lucide-react';
import { formatBulan } from '../utils/calculations';

interface TopGangguanPenyulangCardProps {
  records: ROWRecord[];
  selectedYear: number | 'ALL';
  selectedMonth: string; // 'ALL' or '01'-'12'
  isLight: boolean;
}

export const TopGangguanPenyulangCard: React.FC<TopGangguanPenyulangCardProps> = ({
  records,
  selectedYear,
  selectedMonth,
  isLight
}) => {
  const topGangguanList = useMemo(() => {
    // Filter records for selected year and month, and where gangguan is true
    const filtered = records.filter(r => {
      const matchYear = selectedYear === 'ALL' || r.tahun === selectedYear;
      const matchMonth = selectedMonth === 'ALL' || r.bulanKe === parseInt(selectedMonth, 10);
      const isGangguan = r.gangguan === true;
      return matchYear && matchMonth && isGangguan;
    });

    // Count frequency per penyulang
    const countsMap: Record<string, number> = {};
    filtered.forEach(r => {
      const p = r.penyulang || 'Tanpa Penyulang';
      countsMap[p] = (countsMap[p] || 0) + 1;
    });

    // Convert to array and sort descending by frequency
    const sorted = Object.entries(countsMap)
      .map(([penyulang, count]) => ({ penyulang, count }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, 3); // Top 3
  }, [records, selectedYear, selectedMonth]);

  const monthLabel = selectedMonth === 'ALL' 
    ? (selectedYear === 'ALL' ? 'Semua Periode' : `Tahun ${selectedYear}`)
    : `${formatBulan(selectedMonth)} ${selectedYear !== 'ALL' ? selectedYear : ''}`;

  const maxCount = topGangguanList.length > 0 ? topGangguanList[0].count : 1;

  return (
    <div className={`p-5 rounded-2xl border shadow-xl transition-all duration-300 ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
    }`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/40">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Top 3 Penyulang Gangguan Tertinggi</h3>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Periode: <span className="font-semibold text-rose-400">{monthLabel}</span>
            </p>
          </div>
        </div>
        <div className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-[10px] font-bold uppercase tracking-wider">
          Prioritas Mitigasi
        </div>
      </div>

      <div className="space-y-3">
        {topGangguanList.length > 0 ? (
          topGangguanList.map((item, index) => {
            const percentage = Math.round((item.count / maxCount) * 100);
            const rankColors = [
              'bg-rose-500 text-slate-950 shadow-rose-500/30',
              'bg-amber-500 text-slate-950 shadow-amber-500/30',
              'bg-indigo-500 text-slate-950 shadow-indigo-500/30'
            ];

            return (
              <div key={item.penyulang} className={`p-3 rounded-xl border transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 hover:border-rose-300' : 'bg-slate-950/60 border-slate-800/80 hover:border-rose-500/40'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ${rankColors[index] || 'bg-slate-700 text-white'}`}>
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold truncate max-w-[180px] sm:max-w-xs">{item.penyulang}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-rose-400">
                    <Zap className="w-3.5 h-3.5 fill-rose-400/20" />
                    <span>{item.count} Gangguan</span>
                  </div>
                </div>

                {/* Progress bar representing relative frequency */}
                <div className="w-full bg-slate-800/30 rounded-full h-1.5 overflow-hidden mt-1">
                  <div 
                    className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.max(percentage, 10)}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500 italic text-xs">
            Tidak ada data gangguan tercatat pada periode ini ({monthLabel}).
          </div>
        )}
      </div>
    </div>
  );
};
