import React from 'react';
import { ROWRecord, KPIStats } from '../types';
import { Lightbulb, AlertTriangle, ShieldAlert, PowerOff, TreePine, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatNumber } from '../utils/calculations';

interface AiAdvisorProps {
  records: ROWRecord[];
  stats: KPIStats;
}

interface FeederPendingSummary {
  penyulang: string;
  sisaTemuan: number;
  perluPadam: number;
  perluIzin: number;
  pohonBesar: number;
  kmsGap: number;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ records, stats }) => {
  // Find feeders with highest pending issues
  const pendingByFeeder = records.reduce((acc, r) => {
    const p = r.penyulang || 'Umum / Non-Penyulang';
    if (!acc[p]) {
      acc[p] = {
        penyulang: p,
        sisaTemuan: 0,
        perluPadam: 0,
        perluIzin: 0,
        pohonBesar: 0,
        kmsGap: 0,
      };
    }
    acc[p].sisaTemuan += Math.max(0, r.jumlahTemuan - r.realisasiTemuan);
    acc[p].perluPadam += r.jumlahPerluPadam ?? (r.perluPadam ? 1 : 0);
    acc[p].perluIzin += r.jumlahTidakAdaIzin ?? (r.tidakAdaIzin ? 1 : 0);
    acc[p].pohonBesar += r.jumlahPohonBesar ?? (r.pohonBesar ? 1 : 0);
    acc[p].kmsGap += Math.max(0, r.targetKms - r.realisasiKms);
    return acc;
  }, {} as Record<string, FeederPendingSummary>);

  const sortedFeeders = (Object.values(pendingByFeeder) as FeederPendingSummary[]).sort((a, b) => b.sisaTemuan - a.sisaTemuan);
  const topPriorityFeeder = sortedFeeders[0];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-md space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Rekomendasi Strategis Tim Operasional ROW
            </h3>
            <p className="text-xs text-slate-400">
              Analisis otomatis kendala pemangkasan pohon & percepatan target KMS
            </p>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded">
          Smart Insights
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Insight 1: Prioritas Penyulang */}
        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Feeder Prioritas Rabas</span>
          </div>
          {topPriorityFeeder && topPriorityFeeder.sisaTemuan > 0 ? (
            <div>
              <p className="text-sm font-bold text-white">{topPriorityFeeder.penyulang}</p>
              <p className="text-xs text-slate-300 mt-1">
                Terdapat <strong className="text-amber-300">{topPriorityFeeder.sisaTemuan} temuan pohon</strong> belum dipangkas dengan selisih target <strong className="text-emerald-300">{topPriorityFeeder.kmsGap.toFixed(1)} KMS</strong>.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-300">Seluruh temuan penyulang pada filter saat ini telah diselesaikan 100%.</p>
          )}
        </div>

        {/* Insight 2: Tindakan Izin & Pemadaman */}
        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Kendala Perizinan & Outage</span>
          </div>
          <p className="text-xs text-slate-300">
            Dibutuhkan koordinasi untuk <strong className="text-rose-300">{stats.totalPerluIzin} titik izin</strong> warga/pemda dan <strong className="text-amber-300">{stats.totalPerluPadam} jadwal padam</strong> jaringan SUTM.
          </p>
        </div>

        {/* Insight 3: Kebutuhan Armada & Alat Heavy Duty */}
        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold">
            <TreePine className="w-4 h-4" />
            <span>Kebutuhan Armada Mobil Tangga</span>
          </div>
          <p className="text-xs text-slate-300">
            Teridentifikasi <strong className="text-blue-300">{stats.totalPohonBesar} pohon besar</strong>. Disarankan pengerahan 1 unit bucket truck dan chainsaw heavy-duty.
          </p>
        </div>
      </div>
    </div>
  );
};
