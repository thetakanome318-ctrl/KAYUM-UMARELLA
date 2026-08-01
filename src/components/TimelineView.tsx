import React from 'react';
import { ROWRecord } from '../types';
import { formatBulan, formatNumber } from '../utils/calculations';
import { TreePine, PowerOff, ShieldAlert, CheckCircle2, Clock, AlertTriangle, Layers, Ruler } from 'lucide-react';

interface TimelineViewProps {
  records: ROWRecord[];
  onSelectRecord?: (record: ROWRecord) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ records, onSelectRecord }) => {
  // Group records by Month
  const groupedByMonth = records.reduce((acc, rec) => {
    const monthKey = rec.bulan;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(rec);
    return acc;
  }, {} as Record<string, ROWRecord[]>);

  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-700">Tidak ada timeline untuk filter ini</h3>
        <p className="text-xs text-slate-500 mt-1">Coba ubah opsi filter penyulang atau bulan di panel atas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedMonths.map((monthKey) => {
        const monthRecords = groupedByMonth[monthKey];
        
        // Month summary
        const monthTargetKms = monthRecords.reduce((sum, r) => sum + r.targetKms, 0);
        const monthRealisasiKms = monthRecords.reduce((sum, r) => sum + r.realisasiKms, 0);
        const monthGawang = monthRecords.reduce((sum, r) => sum + r.realisasiGawang, 0);
        const monthTemuan = monthRecords.reduce((sum, r) => sum + r.jumlahTemuan, 0);
        const monthRealisasiTemuan = monthRecords.reduce((sum, r) => sum + r.realisasiTemuan, 0);
        const monthPctKms = monthTargetKms > 0 ? (monthRealisasiKms / monthTargetKms) * 100 : 0;
        const monthPctTemuan = monthTemuan > 0 ? (monthRealisasiTemuan / monthTemuan) * 100 : 0;

        return (
          <div key={monthKey} className="relative pl-6 sm:pl-8 border-l-2 border-emerald-500/40 space-y-4">
            
            {/* Timeline Month Pin */}
            <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-md">
              <Clock className="w-4 h-4" />
            </div>

            {/* Month Header Banner */}
            <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-emerald-400 flex items-center gap-2">
                  <span>{formatBulan(monthKey)}</span>
                  <span className="text-xs font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {monthRecords.length} Section Penyulang
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target KMS: <strong className="text-slate-200">{formatNumber(monthTargetKms, 1)} KMS</strong> | Realisasi KMS: <strong className="text-emerald-300">{formatNumber(monthRealisasiKms, 1)} KMS ({monthPctKms.toFixed(1)}%)</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
                  <span className="text-slate-400 block text-[10px]">REALISASI GAWANG</span>
                  <span className="font-bold text-cyan-400 text-sm">{formatNumber(monthGawang)} Gawang</span>
                </div>
                <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
                  <span className="text-slate-400 block text-[10px]">TEMUAN POHON</span>
                  <span className="font-bold text-amber-400 text-sm">{monthRealisasiTemuan} / {monthTemuan} ({monthPctTemuan.toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            {/* Timeline Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthRecords.map((item) => {
                const pctKms = item.targetKms > 0 ? (item.realisasiKms / item.targetKms) * 100 : 0;
                const pctTemuan = item.jumlahTemuan > 0 ? (item.realisasiTemuan / item.jumlahTemuan) * 100 : 0;
                const isComplete = pctTemuan >= 100 && pctKms >= 100;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectRecord && onSelectRecord(item)}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Feeder & Status Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              {item.penyulang || 'Umum / Non-Penyulang'}
                            </span>
                            {item.tanggal && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                {item.tanggal}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">
                            {item.section}
                          </h4>
                        </div>
                        {isComplete ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            100% Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 mr-1" />
                            On Progress
                          </span>
                        )}
                      </div>

                      {/* KMS Target & Realisasi Card */}
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 my-2 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 flex items-center gap-1">
                            <Ruler className="w-3.5 h-3.5 text-emerald-600" /> Target vs Realisasi KMS:
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatNumber(item.realisasiKms, 1)} / {formatNumber(item.targetKms, 1)} KMS
                          </span>
                        </div>

                        {/* KMS Progress Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(pctKms, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-600 flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-cyan-600" /> Realisasi Gawang:
                          </span>
                          <span className="font-bold text-cyan-700">
                            {formatNumber(item.realisasiGawang)} Gawang
                          </span>
                        </div>
                      </div>

                      {/* Temuan Pohon Stat */}
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-600 flex items-center gap-1">
                          <TreePine className="w-3.5 h-3.5 text-amber-600" /> Temuan Pohon:
                        </span>
                        <span className="font-bold text-slate-800">
                          {item.realisasiTemuan} dari {item.jumlahTemuan} Pohon ({pctTemuan.toFixed(0)}%)
                        </span>
                      </div>

                      {/* Optional Badges (Tidak Ada Izin, Perlu Padam, Pohon Besar) */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.perluPadam && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <PowerOff className="w-3 h-3 mr-1 text-amber-600" />
                            Perlu Padam {item.jumlahPerluPadam ? `(${item.jumlahPerluPadam})` : ''}
                          </span>
                        )}

                        {item.tidakAdaIzin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="w-3 h-3 mr-1 text-rose-600" />
                            Perlu Izin {item.jumlahTidakAdaIzin ? `(${item.jumlahTidakAdaIzin})` : ''}
                          </span>
                        )}

                        {item.pohonBesar && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <TreePine className="w-3 h-3 mr-1 text-blue-600" />
                            Pohon Besar {item.jumlahPohonBesar ? `(${item.jumlahPohonBesar})` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer note */}
                    {item.catatan && (
                      <p className="text-[11px] text-slate-500 italic mt-3 pt-2 border-t border-slate-100 line-clamp-2">
                        "{item.catatan}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        );
      })}
    </div>
  );
};
