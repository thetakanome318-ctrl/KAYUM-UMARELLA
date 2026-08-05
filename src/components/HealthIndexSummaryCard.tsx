import React, { useMemo } from 'react';
import { ROWRecord, Penyulang } from '../types';
import { getHealthStatus } from './HealthIndexView';
import { 
  HeartPulse, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Flame 
} from 'lucide-react';

interface HealthIndexSummaryCardProps {
  records: ROWRecord[];
  penyulangMaster?: Penyulang[];
  selectedYear?: number | 'ALL';
  selectedMonth?: string;
  isLight?: boolean;
  onNavigateToHealthIndex?: () => void;
}

export const HealthIndexSummaryCard: React.FC<HealthIndexSummaryCardProps> = ({
  records,
  penyulangMaster = [],
  selectedYear = new Date().getFullYear(),
  selectedMonth = 'ALL',
  isLight = false,
  onNavigateToHealthIndex,
}) => {
  // Aggregate Penyulang Health Stats
  const healthStats = useMemo(() => {
    const gangguanRecords = records.filter(r => r.gangguan);

    // Penyulang map
    const penyulangMap = new Map<string, {
      penyulangName: string;
      gangguanCount: number;
    }>();

    // 1. Seed from penyulangMaster
    penyulangMaster.forEach(p => {
      if (!penyulangMap.has(p.nama)) {
        penyulangMap.set(p.nama, {
          penyulangName: p.nama,
          gangguanCount: 0,
        });
      }
    });

    // 2. Seed from records
    gangguanRecords.forEach(r => {
      if (r.penyulang) {
        if (!penyulangMap.has(r.penyulang)) {
          penyulangMap.set(r.penyulang, {
            penyulangName: r.penyulang,
            gangguanCount: 0,
          });
        }
      }
    });

    // 3. Count Gangguan matching year & month
    gangguanRecords.forEach(r => {
      const rYear = r.tahun || (r.tanggal ? new Date(r.tanggal).getFullYear() : null);
      let rMonth = r.bulanKe;
      if (!rMonth && r.tanggal) {
        rMonth = new Date(r.tanggal).getMonth() + 1;
      }

      if (selectedYear !== 'ALL' && rYear !== selectedYear) return;
      if (selectedMonth !== 'ALL' && rMonth !== parseInt(selectedMonth, 10)) return;

      if (r.penyulang) {
        const item = penyulangMap.get(r.penyulang);
        if (item) {
          item.gangguanCount += 1;
        }
      }
    });

    let sempurna = 0;
    let sehat = 0;
    let sakit = 0;
    let kronis = 0;

    penyulangMap.forEach(item => {
      const status = getHealthStatus(item.gangguanCount).status;
      if (status === 'Sempurna') sempurna++;
      else if (status === 'Sehat') sehat++;
      else if (status === 'Sakit') sakit++;
      else if (status === 'Kronis') kronis++;
    });

    const total = penyulangMap.size || 1;

    return {
      total: penyulangMap.size,
      sempurna,
      sehat,
      sakit,
      kronis,
      pctSempurna: Math.round((sempurna / total) * 100),
      pctSehat: Math.round((sehat / total) * 100),
      pctSakit: Math.round((sakit / total) * 100),
      pctKronis: Math.round((kronis / total) * 100),
    };
  }, [records, penyulangMaster, selectedYear, selectedMonth]);

  return (
    <div className={`p-6 rounded-2xl border shadow-lg relative overflow-hidden transition-all duration-300 ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
    }`}>
      {/* Background Accent glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/15 text-rose-500 rounded-xl border border-rose-500/30">
            <HeartPulse className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <span>Status Kesehatan Seluruh Penyulang</span>
              <span className="text-[10px] px-2 py-0.5 bg-rose-500/15 text-rose-400 font-bold rounded-full border border-rose-500/30">
                Health Index
              </span>
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Ringkasan keandalan {healthStats.total} penyulang berdasarkan frekuensi gangguan
            </p>
          </div>
        </div>

        {onNavigateToHealthIndex && (
          <button
            onClick={onNavigateToHealthIndex}
            className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition-all flex items-center space-x-1 cursor-pointer"
          >
            <span>Detail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stacked Progress Bar */}
      <div className="space-y-2 mb-5">
        <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${healthStats.pctSempurna}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Sempurna: ${healthStats.sempurna} penyulang (${healthStats.pctSempurna}%)`}
          />
          <div
            style={{ width: `${healthStats.pctSehat}%` }}
            className="bg-blue-500 h-full transition-all duration-500"
            title={`Sehat: ${healthStats.sehat} penyulang (${healthStats.pctSehat}%)`}
          />
          <div
            style={{ width: `${healthStats.pctSakit}%` }}
            className="bg-amber-500 h-full transition-all duration-500"
            title={`Sakit: ${healthStats.sakit} penyulang (${healthStats.pctSakit}%)`}
          />
          <div
            style={{ width: `${healthStats.pctKronis}%` }}
            className="bg-rose-500 h-full transition-all duration-500"
            title={`Kronis: ${healthStats.kronis} penyulang (${healthStats.pctKronis}%)`}
          />
        </div>
      </div>

      {/* Grid Status Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`p-3 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.02] ${
          isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
        }`}>
          <div>
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span>Sempurna (0)</span>
            </div>
            <div className="text-lg font-black text-emerald-500 mt-0.5">
              {healthStats.sempurna} <span className="text-[10px] font-normal text-slate-400">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.02] ${
          isLight ? 'bg-blue-50/60 border-blue-200' : 'bg-blue-950/20 border-blue-500/30'
        }`}>
          <div>
            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <span>Sehat (1-3)</span>
            </div>
            <div className="text-lg font-black text-blue-500 mt-0.5">
              {healthStats.sehat} <span className="text-[10px] font-normal text-slate-400">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.02] ${
          isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-500/30'
        }`}>
          <div>
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span>Sakit (4-6)</span>
            </div>
            <div className="text-lg font-black text-amber-500 mt-0.5">
              {healthStats.sakit} <span className="text-[10px] font-normal text-slate-400">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.02] ${
          isLight ? 'bg-rose-50/60 border-rose-200' : 'bg-rose-950/20 border-rose-500/30'
        }`}>
          <div>
            <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <span>Kronis (≥7)</span>
            </div>
            <div className="text-lg font-black text-rose-500 mt-0.5">
              {healthStats.kronis} <span className="text-[10px] font-normal text-slate-400">Penyulang</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

