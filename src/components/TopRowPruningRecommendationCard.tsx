import React, { useMemo } from 'react';
import { ROWRecord } from '../types';
import { Sparkles, Zap, TreePine, AlertOctagon, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { formatBulan } from '../utils/calculations';

interface TopRowPruningRecommendationCardProps {
  records: ROWRecord[];
  selectedYear: number | 'ALL';
  selectedMonth: string; // 'ALL' or '01'-'12'
  isLight: boolean;
}

export const TopRowPruningRecommendationCard: React.FC<TopRowPruningRecommendationCardProps> = ({
  records,
  selectedYear,
  selectedMonth,
  isLight
}) => {
  // Automated analysis & scoring per penyulang
  const recommendations = useMemo(() => {
    // Filter records for selected year and month
    const filtered = records.filter(r => {
      const matchYear = selectedYear === 'ALL' || r.tahun === selectedYear;
      const matchMonth = selectedMonth === 'ALL' || r.bulanKe === parseInt(selectedMonth, 10);
      return matchYear && matchMonth;
    });

    const penyulangMap: Record<string, {
      penyulang: string;
      gangguanCount: number;
      pohonBesarCount: number;
      perluPadamCount: number;
      belumIzinCount: number;
      totalTemuan: number;
      realisasiTemuan: number;
      score: number;
    }> = {};

    filtered.forEach(r => {
      const p = r.penyulang || 'Tanpa Penyulang';
      if (!penyulangMap[p]) {
        penyulangMap[p] = {
          penyulang: p,
          gangguanCount: 0,
          pohonBesarCount: 0,
          perluPadamCount: 0,
          belumIzinCount: 0,
          totalTemuan: 0,
          realisasiTemuan: 0,
          score: 0
        };
      }

      if (r.gangguan === true) {
        penyulangMap[p].gangguanCount += 1;
      }

      penyulangMap[p].totalTemuan += (r.jumlahTemuan || 0);
      penyulangMap[p].realisasiTemuan += (r.realisasiTemuan || 0);

      if (r.pohonBesar) penyulangMap[p].pohonBesarCount += (r.jumlahPohonBesar || 1);
      if (r.perluPadam) penyulangMap[p].perluPadamCount += (r.jumlahPerluPadam || 1);
      if (r.tidakAdaIzin) penyulangMap[p].belumIzinCount += (r.jumlahTidakAdaIzin || 1);

      // Inspect treeDetails if available
      if (r.treeDetails && Array.isArray(r.treeDetails)) {
        r.treeDetails.forEach(t => {
          if (t.pohonBesar) penyulangMap[p].pohonBesarCount += 1;
          if (t.perluPadam) penyulangMap[p].perluPadamCount += 1;
          if (t.belumIzin) penyulangMap[p].belumIzinCount += 1;
        });
      }
    });

    // Calculate priority score:
    // Score = (gangguanCount * 15) + (pohonBesarCount * 8) + (perluPadamCount * 6) + (belumIzinCount * 4) + ((totalTemuan - realisasiTemuan) * 2)
    const scoredList = Object.values(penyulangMap).map(item => {
      const unpruned = Math.max(0, item.totalTemuan - item.realisasiTemuan);
      const score = (item.gangguanCount * 15) + 
                    (item.pohonBesarCount * 8) + 
                    (item.perluPadamCount * 6) + 
                    (item.belumIzinCount * 4) + 
                    (unpruned * 2);
      return {
        ...item,
        score
      };
    });

    return scoredList
      .filter(item => item.score > 0 || item.gangguanCount > 0 || item.pohonBesarCount > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [records, selectedYear, selectedMonth]);

  const monthLabel = selectedMonth === 'ALL' 
    ? (selectedYear === 'ALL' ? 'Semua Periode' : `Tahun ${selectedYear}`)
    : `${formatBulan(selectedMonth)} ${selectedYear !== 'ALL' ? selectedYear : ''}`;

  return (
    <div className={`p-5 rounded-2xl border shadow-xl transition-all duration-300 ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-slate-800/40 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Rekomendasi Otomatis: Top 3 Prioritas Pangkas ROW</h3>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Analisis cerdas berdasarkan frekuensi gangguan &amp; status pohon besar • Periode: <span className="font-semibold text-indigo-400">{monthLabel}</span>
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 self-start sm:self-auto">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>AI Priority Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.length > 0 ? (
          recommendations.map((item, index) => {
            const rankBadges = [
              'bg-rose-500 text-slate-950 border-rose-400 shadow-rose-500/20',
              'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20',
              'bg-indigo-500 text-white border-indigo-400 shadow-indigo-500/20'
            ];

            return (
              <div key={item.penyulang} className={`p-4 rounded-xl border relative flex flex-col justify-between transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 hover:border-indigo-300' : 'bg-slate-950/70 border-slate-800/80 hover:border-indigo-500/40'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-sm ${rankBadges[index] || 'bg-slate-700 text-white'}`}>
                      Prioritas #{index + 1}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-md">
                      Skor: {item.score}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-100 mb-2 truncate" title={item.penyulang}>
                    {item.penyulang}
                  </h4>

                  <div className="space-y-1.5 text-[11px] text-slate-300 mb-4 pt-2 border-t border-slate-800/40">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-rose-400" />
                        <span>Gangguan:</span>
                      </span>
                      <span className="font-mono font-bold text-rose-400">{item.gangguanCount} kali</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <TreePine className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pohon Besar:</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-400">{item.pohonBesarCount} pohon</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                        <span>Perlu Padam/Izin:</span>
                      </span>
                      <span className="font-mono font-semibold text-amber-400">{item.perluPadamCount + item.belumIzinCount} titik</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/50 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Rekomendasi Aksi:</span>
                  <span className="font-bold text-indigo-300">
                    {item.gangguanCount > 0 ? 'Eksekusi Segera & Padam' : 'Jadwalkan Pangkas Rutin'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 p-8 text-center text-slate-500 italic text-xs">
            Tidak ada data gangguan atau pohon besar yang signifikan pada periode ini ({monthLabel}) untuk menghasilkan rekomendasi prioritas.
          </div>
        )}
      </div>
    </div>
  );
};
