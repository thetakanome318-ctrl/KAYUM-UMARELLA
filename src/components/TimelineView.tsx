import React, { useState, useMemo, useEffect } from 'react';
import { ROWRecord } from '../types';
import { formatBulan, formatNumber } from '../utils/calculations';
import { TreePine, PowerOff, ShieldAlert, CheckCircle2, Clock, Layers, Ruler, FileText, Trash2 } from 'lucide-react';

interface TimelineViewProps {
  records: ROWRecord[];
  onSelectRecord?: (record: ROWRecord) => void;
  onDeleteRecord?: (id: string) => void;
  isLight?: boolean;
  onFilterChange?: (month: string, year: number | 'ALL') => void;
  currentFilter?: { month: string, year: number | 'ALL' };
  isReadOnly?: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ 
  records, 
  onSelectRecord, 
  onDeleteRecord,
  isLight = false,
  onFilterChange,
  currentFilter,
  isReadOnly = false
}) => {
  const [localYear, setLocalYear] = useState<number | 'ALL'>(currentFilter?.year || 'ALL');
  const [localMonth, setLocalMonth] = useState<string>(currentFilter?.month || 'ALL');

  // Sync with props if provided
  useEffect(() => {
    if (currentFilter) {
      setLocalYear(currentFilter.year);
      setLocalMonth(currentFilter.month);
    }
  }, [currentFilter]);

  // Handle local changes and notify parent if needed
  const handleYearChange = (year: number | 'ALL') => {
    setLocalYear(year);
    if (onFilterChange) onFilterChange(localMonth, year);
  };

  const handleMonthChange = (month: string) => {
    setLocalMonth(month);
    if (onFilterChange) onFilterChange(month, localYear);
  };

  // Unique years and months for selectors
  const { years, months } = useMemo(() => {
    const yrSet = new Set<number>();
    const moSet = new Set<string>();
    
    // Always include some default years
    [2024, 2025, 2026].forEach(y => yrSet.add(y));

    records.forEach((rec) => {
      if (rec.tahun) yrSet.add(rec.tahun);
      if (rec.bulan) moSet.add(rec.bulan);
    });
    
    return {
      years: Array.from(yrSet).sort((a, b) => b - a),
      months: Array.from(moSet).sort((a, b) => b.localeCompare(a))
    };
  }, [records]);

  // Final filtering logic
  const filteredTimelineRecords = useMemo(() => {
    return records.filter((rec) => {
      const yearMatch = localYear === 'ALL' || rec.tahun === localYear;
      const monthMatch = localMonth === 'ALL' || rec.bulan === localMonth;
      return yearMatch && monthMatch;
    });
  }, [records, localYear, localMonth]);

  const handleExportCsv = () => {
    const DELIM = ';';
    const lines = [
      'sep=;',
      `"TIMELINE ROW"`,
      `"Tanggal"${DELIM}"Bulan"${DELIM}"Penyulang"${DELIM}"Section"${DELIM}"Realisasi KMS"${DELIM}"Realisasi Gawang"${DELIM}"Temuan Pohon"${DELIM}"Realisasi Pangkas"${DELIM}"Catatan"`,
      ...filteredTimelineRecords.map(r => `"${r.tanggal || '-'}"${DELIM}"${formatBulan(r.bulan)}"${DELIM}"${r.penyulang || '-'}"${DELIM}"${r.section || '-'}"${DELIM}"${r.realisasiKms || 0}"${DELIM}"${r.realisasiGawang || 0}"${DELIM}"${r.jumlahTemuan || 0}"${DELIM}"${r.realisasiTemuan || 0}"${DELIM}"${r.catatan || '-'}"`)
    ];
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Timeline_ROW_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group filtered records by Month
  const groupedByMonth = filteredTimelineRecords.reduce((acc, rec) => {
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
      <div className={`rounded-xl border p-12 text-center transition-all ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-800' 
          : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
        <h3 className="text-base font-bold">Tidak ada timeline untuk filter ini</h3>
        <p className="text-xs text-slate-400 mt-1">Coba ubah opsi filter penyulang atau bulan di panel atas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Controls Bar */}
      <div className={`p-4 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all duration-300 ${
        isLight 
          ? 'bg-white border-slate-200 shadow-sm text-slate-800' 
          : 'bg-slate-900/90 border-slate-800 text-white shadow-lg'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider">Filter Timeline ROW</h4>
            <p className="text-[10px] text-slate-500 font-medium">Visualisasi histori pemangkasan pohon</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Tahun:</span>
            <select
              value={localYear}
              onChange={(e) => handleYearChange(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="ALL">Semua Tahun</option>
              {years.map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Bulan:</span>
            <select
              value={localMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="ALL">Semua Bulan</option>
              {months.map(mKey => (
                <option key={mKey} value={mKey}>{formatBulan(mKey)}</option>
              ))}
            </select>
            <button
              onClick={handleExportCsv}
              className="ml-2 px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 flex items-center gap-1.5 shadow-md"
            >
              <FileText className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* Timeline main tree */}
      <div className="space-y-8">
        {sortedMonths.map((monthKey) => {
          const monthRecords = groupedByMonth[monthKey];
          
          // Month summary
          const monthRealisasiKms = monthRecords.reduce((sum, r) => sum + r.realisasiKms, 0);
          const monthGawang = monthRecords.reduce((sum, r) => sum + r.realisasiGawang, 0);
          const monthTemuan = monthRecords.reduce((sum, r) => sum + r.jumlahTemuan, 0);
          const monthRealisasiTemuan = monthRecords.reduce((sum, r) => sum + r.realisasiTemuan, 0);
          const monthPctTemuan = monthTemuan > 0 ? (monthRealisasiTemuan / monthTemuan) * 100 : 0;

          return (
            <div key={monthKey} className="relative pl-6 sm:pl-8 border-l-2 border-emerald-500/40 space-y-4">
              
              {/* Timeline Month Pin */}
              <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-md transition-all duration-300 ${
                isLight 
                  ? 'bg-white border-emerald-500 text-emerald-600 shadow-emerald-500/10' 
                  : 'bg-slate-950 border-emerald-400 text-emerald-400'
              }`}>
                <Clock className="w-4 h-4" />
              </div>

              {/* Month Header Banner */}
              <div className={`rounded-xl p-4 shadow-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 ${
                isLight 
                  ? 'bg-emerald-50/70 text-slate-800 border-emerald-100/80 shadow-emerald-50/50' 
                  : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <div>
                  <h3 className={`text-lg font-extrabold flex items-center gap-2 ${
                    isLight ? 'text-emerald-700' : 'text-emerald-400'
                  }`}>
                    <span>{formatBulan(monthKey)}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      isLight 
                        ? 'bg-white text-emerald-800 border-emerald-200' 
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {monthRecords.length} Section Penyulang
                    </span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Realisasi KMS: <strong className={isLight ? 'text-emerald-700' : 'text-emerald-300'}>{formatNumber(monthRealisasiKms, 1)} KMS</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className={`px-3 py-1.5 rounded-lg border ${
                    isLight 
                      ? 'bg-white border-emerald-200/60' 
                      : 'bg-slate-800/80 border-slate-700'
                  }`}>
                    <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>REALISASI GAWANG</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">{formatNumber(monthGawang)} Gawang</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border ${
                    isLight 
                      ? 'bg-white border-emerald-200/60' 
                      : 'bg-slate-800/80 border-slate-700'
                  }`}>
                    <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>TEMUAN POHON</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{monthRealisasiTemuan} / {monthTemuan} ({monthPctTemuan.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>

              {/* Timeline Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthRecords.map((item) => {
                  const pctTemuan = item.jumlahTemuan > 0 ? (item.realisasiTemuan / item.jumlahTemuan) * 100 : 0;
                  const isComplete = pctTemuan >= 100;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectRecord && onSelectRecord(item)}
                      className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between transition-all duration-300 ${
                        isLight 
                          ? 'bg-white border-slate-200 text-slate-800 hover:border-emerald-400 hover:shadow-emerald-500/5' 
                          : 'bg-slate-900 border-slate-800 text-white hover:border-emerald-500/50'
                      }`}
                    >
                      <div>
                        {/* Feeder & Status Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                isLight ? 'text-slate-500' : 'text-slate-400'
                              }`}>
                                {item.penyulang || 'Umum / Non-Penyulang'}
                              </span>
                              {item.tanggal && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                                  isLight ? 'text-slate-500 bg-slate-100' : 'text-slate-400 bg-slate-800'
                                }`}>
                                  {item.tanggal}
                                </span>
                              )}
                            </div>
                            <h4 className={`text-sm font-bold leading-tight mt-0.5 ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}>
                              {item.section}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
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
                            {!isReadOnly && onDeleteRecord && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Apakah Anda ingin menghapus file / data ini?')) {
                                    onDeleteRecord(item.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition active:scale-95 cursor-pointer"
                                title="Hapus Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* KMS Realisasi Card */}
                        <div className={`rounded-lg p-2.5 border my-2 space-y-1.5 ${
                          isLight 
                            ? 'bg-slate-50 border-slate-100' 
                            : 'bg-slate-950/40 border-slate-800/80'
                        }`}>
                          <div className="flex items-center justify-between text-xs">
                            <span className={`flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              <Ruler className="w-3.5 h-3.5 text-emerald-600" /> Realisasi KMS:
                            </span>
                            <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                              {formatNumber(item.realisasiKms, 1)} KMS
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className={`flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              <Layers className="w-3.5 h-3.5 text-cyan-600" /> Realisasi Gawang:
                            </span>
                            <span className="font-bold text-cyan-600 dark:text-cyan-400">
                              {formatNumber(item.realisasiGawang)} Gawang
                            </span>
                          </div>
                        </div>

                        {/* Temuan Pohon Stat */}
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className={`flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            <TreePine className="w-3.5 h-3.5 text-amber-600" /> Temuan Pohon:
                          </span>
                          <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
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
                        <p className={`text-[11px] italic mt-3 pt-2 border-t line-clamp-2 ${
                          isLight ? 'text-slate-500 border-slate-100' : 'text-slate-400 border-slate-800/80'
                        }`}>
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
    </div>
  );
};
