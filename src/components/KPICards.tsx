import React from 'react';
import { 
  CheckCircle2, 
  PowerOff, 
  ShieldAlert, 
  TreeDeciduous, 
  Ruler, 
  Layers, 
  TrendingUp, 
  Database,
  Calendar,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { KPIStats } from '../types';
import { formatNumber } from '../utils/calculations';

interface KPICardsProps {
  stats: KPIStats;
  onOpenTargetModal?: () => void;
  isLight?: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats, onOpenTargetModal, isLight = false }) => {
  const cardBgClass = isLight 
    ? "bg-white/95 backdrop-blur-md border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 text-slate-800" 
    : "bg-slate-900/95 backdrop-blur-md border-slate-800 shadow-xl hover:border-slate-700 text-white";

  const labelClass = isLight ? "text-slate-500" : "text-slate-400";
  const numClass = isLight ? "text-slate-900" : "text-slate-100";
  const subtextClass = isLight ? "text-slate-500" : "text-slate-400";

  return (
    <div className="space-y-4">
      {/* Daily Summary Card */}
      {stats.daily && (
        <div className={`p-5 rounded-2xl border flex flex-col lg:flex-row items-center justify-between gap-6 transition-all duration-500 animate-in fade-in slide-in-from-top-4 ${
          isLight 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm' 
            : 'bg-gradient-to-br from-slate-900 via-blue-900/10 to-slate-900 border-blue-500/30 shadow-xl'
        }`}>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className={`p-3.5 rounded-2xl ${isLight ? 'bg-blue-600 text-white' : 'bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/20'}`}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-500">Monitoring Progress Unit</h3>
              <p className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Update: {new Date(stats.daily.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          
          <div className="flex flex-1 items-center justify-around w-full gap-4 md:gap-8">
            <div className="text-center">
              <p className={`text-[10px] font-bold uppercase tracking-tighter mb-1 ${labelClass}`}>Realisasi Hari Ini</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className={`text-2xl font-black ${numClass}`}>{formatNumber(stats.daily.realisasiKms, 2)}</span>
                <span className="text-[10px] font-bold text-slate-500">KMS</span>
              </div>
            </div>
            
            <div className={`h-10 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-slate-800'} hidden sm:block`} />

            <div className="text-center">
              <p className={`text-[10px] font-bold uppercase tracking-tighter mb-1 ${labelClass}`}>Target Bulanan</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className={`text-2xl font-black ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>{formatNumber(stats.daily.targetBulanKms, 2)}</span>
                <span className="text-[10px] font-bold text-slate-500">KMS</span>
              </div>
            </div>

            <div className={`h-10 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-slate-800'} hidden sm:block`} />

            <div className="text-center min-w-[80px]">
              <p className={`text-[10px] font-bold uppercase tracking-tighter mb-1 ${labelClass}`}>Progress Bulan</p>
              <div className={`text-2xl font-black ${
                stats.daily.persentaseBulan >= 100 ? 'text-emerald-500' : stats.daily.persentaseBulan >= 50 ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {stats.daily.persentaseBulan.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="w-full lg:w-48 max-w-xs shrink-0 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className={labelClass}>PROGRESS UNIT BULANAN</span>
              <span className="text-emerald-500">{formatNumber(stats.daily.realisasiBulanKms, 2)} / {formatNumber(stats.daily.targetBulanKms, 2)} KMS</span>
            </div>
            <div className={`w-full rounded-full h-2 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-950'} border ${isLight ? 'border-slate-300/50' : 'border-slate-800'}`}>
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                  stats.daily.persentaseBulan >= 100 ? 'bg-emerald-500' : stats.daily.persentaseBulan >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(stats.daily.persentaseBulan, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main KPI Grid - 4 Primary Cards Required */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: JUMLAH TEMUAN */}
        <div id="kpi-card-temuan" className={`rounded-xl p-4 border transition-all duration-300 ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${labelClass}`}>
              Jumlah Temuan
            </span>
            <div className={`p-2 rounded-lg ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className={`text-2xl font-extrabold ${numClass}`}>
                {formatNumber(stats.totalRealisasiTemuan)}
              </span>
              <span className={`text-xs font-semibold ml-1 ${labelClass}`}>
                / {formatNumber(stats.totalTemuan)} Pohon
              </span>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {stats.persentaseTemuan.toFixed(1)}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-3">
            <div className={`w-full rounded-full h-2 overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(stats.persentaseTemuan, 100)}%` }}
              />
            </div>
            <p className={`text-[11px] mt-1 ${subtextClass}`}>
              {Math.max(0, stats.totalTemuan - stats.totalRealisasiTemuan)} temuan belum dieksekusi
            </p>
            {(stats.totalLuarTemuan || 0) > 0 && (
              <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[11px] ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
                <span className={`${isLight ? 'text-purple-700' : 'text-purple-400'} font-semibold flex items-center gap-1`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                  Luar Temuan:
                </span>
                <span className={`font-bold ${isLight ? 'text-purple-950' : 'text-purple-300'}`}>
                  {formatNumber(stats.totalRealisasiLuarTemuan || 0)} / {formatNumber(stats.totalLuarTemuan || 0)} Pohon
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: PERLU PADAM */}
        <div id="kpi-card-padam" className={`rounded-xl p-4 border transition-all duration-300 ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className={`text-xs font-semibold uppercase tracking-wider ${labelClass}`}>
                Perlu Padam
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-950 text-slate-400 border border-slate-850'
              }`}>
                Opsional
              </span>
            </div>
            <div className={`p-2 rounded-lg ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <PowerOff className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold ${numClass}`}>
              {formatNumber(stats.totalPerluPadam)}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              isLight 
                ? 'text-amber-700 bg-amber-50 border-amber-200' 
                : 'text-amber-300 bg-amber-500/10 border-amber-500/30'
            }`}>
              Butuh Outage
            </span>
          </div>
          <p className={`text-[11px] mt-3 leading-relaxed ${subtextClass}`}>
            Titik rabas dekat kabel SUTM yang memerlukan pemadaman terencana.
          </p>
        </div>

        {/* CARD 3: PERLU IZIN */}
        <div id="kpi-card-izin" className={`rounded-xl p-4 border transition-all duration-300 ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className={`text-xs font-semibold uppercase tracking-wider ${labelClass}`}>
                Perlu Izin
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-950 text-slate-400 border border-slate-850'
              }`}>
                Opsional
              </span>
            </div>
            <div className={`p-2 rounded-lg ${isLight ? 'bg-rose-50 text-rose-600' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold ${numClass}`}>
              {formatNumber(stats.totalPerluIzin)}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              isLight 
                ? 'text-rose-700 bg-rose-50 border-rose-200' 
                : 'text-rose-300 bg-rose-500/10 border-rose-500/30'
            }`}>
              Sosialisasi
            </span>
          </div>
          <p className={`text-[11px] mt-3 leading-relaxed ${subtextClass}`}>
            Pohon di pekarangan warga atau area instansi yang butuh sosialisasi.
          </p>
        </div>

        {/* CARD 4: POHON BESAR */}
        <div id="kpi-card-pohon-besar" className={`rounded-xl p-4 border transition-all duration-300 ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className={`text-xs font-semibold uppercase tracking-wider ${labelClass}`}>
                Pohon Besar
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                isLight ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-950 text-slate-400 border border-slate-850'
              }`}>
                Opsional
              </span>
            </div>
            <div className={`p-2 rounded-lg ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
              <TreeDeciduous className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold ${numClass}`}>
              {formatNumber(stats.totalPohonBesar)}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              isLight 
                ? 'text-blue-700 bg-blue-50 border-blue-200' 
                : 'text-blue-300 bg-blue-500/10 border-blue-500/30'
            }`}>
              Alat Khusus
            </span>
          </div>
          <p className={`text-[11px] mt-3 leading-relaxed ${subtextClass}`}>
            Memerlukan mobil tangga (bucket truck), Chainsaw heavy duty / Crane.
          </p>
        </div>

      </div>

    </div>
  );
};
