import React from 'react';
import { 
  CheckCircle2, 
  PowerOff, 
  ShieldAlert, 
  TreeDeciduous, 
  Ruler, 
  Layers, 
  TrendingUp, 
  Target
} from 'lucide-react';
import { KPIStats } from '../types';
import { formatNumber } from '../utils/calculations';

interface KPICardsProps {
  stats: KPIStats;
  onOpenTargetModal?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats, onOpenTargetModal }) => {
  return (
    <div className="space-y-4">
      {/* Main KPI Grid - 4 Primary Cards Required */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: JUMLAH TEMUAN */}
        <div id="kpi-card-temuan" className="bg-white/95 backdrop-blur-md rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Jumlah Temuan
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-slate-900">
                {formatNumber(stats.totalRealisasiTemuan)}
              </span>
              <span className="text-sm text-slate-500 font-medium ml-1">
                / {formatNumber(stats.totalTemuan)} Pohon
              </span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {stats.persentaseTemuan.toFixed(1)}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(stats.persentaseTemuan, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {Math.max(0, stats.totalTemuan - stats.totalRealisasiTemuan)} temuan belum dieksekusi
            </p>
            {(stats.totalLuarTemuan || 0) > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-purple-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                  Luar Temuan:
                </span>
                <span className="font-bold text-purple-900">
                  {formatNumber(stats.totalRealisasiLuarTemuan || 0)} / {formatNumber(stats.totalLuarTemuan || 0)} Pohon
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: PERLU PADAM */}
        <div id="kpi-card-padam" className="bg-white/95 backdrop-blur-md rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Perlu Padam
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                Opsional
              </span>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <PowerOff className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatNumber(stats.totalPerluPadam)}
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Butuh Outage Jaringan
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Titik rabas dekat kabel SUTM yang memerlukan pemadaman terencana.
          </p>
        </div>

        {/* CARD 3: PERLU IZIN */}
        <div id="kpi-card-izin" className="bg-white/95 backdrop-blur-md rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Perlu Izin
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                Opsional
              </span>
            </div>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatNumber(stats.totalPerluIzin)}
            </span>
            <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Izin Pemilik/Pemda
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Pohon di pekarangan warga atau area instansi yang butuh sosialisasi.
          </p>
        </div>

        {/* CARD 4: POHON BESAR */}
        <div id="kpi-card-pohon-besar" className="bg-white/95 backdrop-blur-md rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Pohon Besar
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                Opsional
              </span>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TreeDeciduous className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatNumber(stats.totalPohonBesar)}
            </span>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Peralatan Khusus
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Memerlukan mobil tangga (bucket truck), Chainsaw heavy duty / Crane.
          </p>
        </div>

      </div>

      {/* Secondary Performance Banner: TARGET BULANAN KMS & REALISASI GAWANG */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-4 text-white border border-slate-800 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Target vs Realisasi KMS */}
          <div className="flex items-start justify-between space-x-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
                <Ruler className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Target & Realisasi KMS
                </div>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-xl font-bold text-emerald-400">
                    {formatNumber(stats.totalRealisasiKms, 2)} KMS
                  </span>
                  <span className="text-xs text-slate-400">
                    / {formatNumber(stats.totalTargetKms, 2)} KMS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pencapaian: <strong className="text-emerald-300">{stats.persentaseKms.toFixed(1)}%</strong> dari target bulanan
                </p>
              </div>
            </div>

            {onOpenTargetModal && (
              <button
                type="button"
                onClick={onOpenTargetModal}
                className="px-2.5 py-1 text-[11px] font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg border border-purple-400/40 shadow flex items-center space-x-1 shrink-0 transition"
                title="Atur Target Bulanan Manual"
              >
                <Target className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Set Target</span>
              </button>
            )}
          </div>

          {/* Target vs Realisasi Gawang */}
          <div className="flex items-center space-x-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Target &amp; Realisasi Gawang
              </div>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-bold text-cyan-400">
                  {formatNumber(stats.totalRealisasiGawang)}
                </span>
                <span className="text-xs text-slate-400">
                  {stats.totalTargetGawang && stats.totalTargetGawang > 0
                    ? `/ ${formatNumber(stats.totalTargetGawang)} Gawang`
                    : 'Gawang / Span'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {stats.totalTargetGawang && stats.totalTargetGawang > 0 ? (
                  <>
                    Pencapaian: <strong className="text-cyan-300">{(stats.persentaseGawang || 0).toFixed(1)}%</strong> dari target bulanan
                  </>
                ) : (
                  'Panjang bebas sentuhan dahan jaringan SUTM'
                )}
              </p>
            </div>
          </div>

          {/* Efficiency & Rate Status */}
          <div className="flex items-center space-x-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Rasio Bebas Jaringan
              </div>
              <div className="text-xl font-bold text-indigo-300 mt-0.5">
                {stats.totalRealisasiKms > 0 && stats.totalRealisasiGawang > 0
                  ? `${(stats.totalRealisasiGawang / stats.totalRealisasiKms).toFixed(1)} Gawang/KMS`
                  : '0 Gawang/KMS'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Intensitas kerapatan gawang penyulang
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
