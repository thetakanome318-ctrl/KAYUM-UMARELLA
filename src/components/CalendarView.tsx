import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TreePine,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldAlert,
  FileText,
  Edit2,
  ListFilter,
  CalendarDays
} from 'lucide-react';
import { ROWRecord } from '../types';

interface CalendarViewProps {
  records: ROWRecord[];
  onSelectRecord: (record: ROWRecord) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const CalendarView: React.FC<CalendarViewProps> = ({ records, onSelectRecord }) => {
  // Current month/year view state
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(6); // Default 6 = Juli (0-indexed)
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Helper to format YYYY-MM-DD
  const formatDateString = (year: number, monthZeroIndexed: number, day: number) => {
    const m = String(monthZeroIndexed + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Group records by exact date string (YYYY-MM-DD)
  const recordsByDate: { [dateStr: string]: ROWRecord[] } = {};
  records.forEach((r) => {
    if (r.tanggal) {
      const dStr = r.tanggal.trim();
      if (!recordsByDate[dStr]) recordsByDate[dStr] = [];
      recordsByDate[dStr].push(r);
    }
  });

  const activeDatesList = Object.keys(recordsByDate).sort();

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  // Calendar math
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonthIndex, 1).getDay() + 6) % 7; // Monday = 0

  const prevMonthDays = new Date(currentYear, currentMonthIndex, 0).getDate();

  // Selected date records
  const selectedRecords = selectedDateStr ? recordsByDate[selectedDateStr] || [] : [];

  // Day cell stats calculation
  const getDayStats = (dateStr: string) => {
    const dayRecs = recordsByDate[dateStr] || [];
    if (dayRecs.length === 0) return null;

    const totalSection = dayRecs.filter(r => !r.gangguan && !r.kodeGardu && !r.inspectionType).length;
    const totalInspeksi = dayRecs.filter(r => r.inspectionType).length;
    const totalGangguan = dayRecs.filter(r => r.gangguan).length;
    const totalGardu = dayRecs.filter(r => r.kodeGardu && !r.gangguan).length;

    const totalKms = dayRecs.reduce((acc, r) => acc + (r.realisasiKms || 0), 0);
    const totalTemuan = dayRecs.reduce((acc, r) => acc + (r.jumlahTemuan || 0), 0);
    const totalRealTemuan = dayRecs.reduce((acc, r) => acc + (r.realisasiTemuan || 0), 0);
    const totalGawang = dayRecs.reduce((acc, r) => acc + (r.realisasiGawang || 0), 0);
    const hasPadam = dayRecs.some((r) => r.perluPadam || (r.jumlahPerluPadam && r.jumlahPerluPadam > 0));
    const hasIzin = dayRecs.some((r) => r.tidakAdaIzin || (r.jumlahTidakAdaIzin && r.jumlahTidakAdaIzin > 0));

    return {
      totalSection,
      totalInspeksi,
      totalGangguan,
      totalGardu,
      totalKms,
      totalTemuan,
      totalRealTemuan,
      totalGawang,
      hasPadam,
      hasIzin,
    };
  };

  return (
    <div className="space-y-6">
      {/* Calendar Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Calendar Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Kalender Hasil Monitoring ROW
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Harian 20kV
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pilih tanggal pada kalender untuk melihat detail eksekusi pangkas pohon dan kendala
              </p>
            </div>
          </div>

          {/* Month Year Selector */}
          <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              <select
                value={currentMonthIndex}
                onChange={(e) => setCurrentMonthIndex(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-100 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                {MONTH_NAMES.map((mName, idx) => (
                  <option key={mName} value={idx}>
                    {mName}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              title="Bulan Selanjutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Days Header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-600 py-2.5">
          {DAY_NAMES.map((d) => (
            <div key={d} className="uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50/50">
          {/* Previous Month Filler Days */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
            const dayNum = prevMonthDays - firstDayOfWeek + idx + 1;
            return (
              <div
                key={`prev-${idx}`}
                className="min-h-[90px] p-2 bg-slate-100/40 text-slate-400 opacity-40 select-none text-xs"
              >
                <span className="font-semibold">{dayNum}</span>
              </div>
            );
          })}

          {/* Current Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = formatDateString(currentYear, currentMonthIndex, dayNum);
            const stats = getDayStats(dateStr);
            const isSelected = selectedDateStr === dateStr;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`min-h-[100px] p-2 transition cursor-pointer flex flex-col justify-between relative border-t ${
                  isSelected
                    ? 'bg-purple-50 ring-2 ring-purple-500 z-10 shadow-inner'
                    : stats
                    ? 'bg-white hover:bg-slate-50'
                    : 'bg-white hover:bg-slate-50/60'
                }`}
              >
                {/* Day Header & Badges */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-purple-600 text-white'
                        : stats
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {stats && (
                    <div className="flex flex-col items-end gap-0.5">
                      {stats.totalSection > 0 && (
                        <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {stats.totalSection} ROW
                        </span>
                      )}
                      {stats.totalInspeksi > 0 && (
                        <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          {stats.totalInspeksi} Insp
                        </span>
                      )}
                      {stats.totalGangguan > 0 && (
                        <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          {stats.totalGangguan} Ggn
                        </span>
                      )}
                      {stats.totalGardu > 0 && (
                        <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          {stats.totalGardu} Grd
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Day Cell Results Content */}
                {stats ? (
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Pohon:</span>
                      <span className="font-bold text-emerald-700">
                        {stats.totalRealTemuan}/{stats.totalTemuan}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">KMS:</span>
                      <span className="font-bold text-blue-700">{stats.totalKms.toFixed(1)}</span>
                    </div>

                    {/* Flags / Icons */}
                    <div className="flex items-center space-x-1 pt-1">
                      {stats.hasPadam && (
                        <span className="p-0.5 rounded bg-amber-100 text-amber-700" title="Ada Kendala Padam">
                          <Zap className="w-3 h-3" />
                        </span>
                      )}
                      {stats.hasIzin && (
                        <span className="p-0.5 rounded bg-rose-100 text-rose-700" title="Ada Kendala Izin">
                          <ShieldAlert className="w-3 h-3" />
                        </span>
                      )}
                      <span className="p-0.5 rounded bg-emerald-100 text-emerald-700 ml-auto" title="Realisasi Ada">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-300 italic text-center my-auto">Tidak ada data</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Dates Quick Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-700 shrink-0 flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5 text-purple-600" />
            Tanggal Ada Data:
          </span>
          {activeDatesList.length > 0 ? (
            activeDatesList.map((dStr) => {
              const count = recordsByDate[dStr].length;
              const isSelected = selectedDateStr === dStr;
              return (
                <button
                  key={dStr}
                  onClick={() => {
                    // Auto switch month/year if needed
                    const [y, m] = dStr.split('-').map(Number);
                    setCurrentYear(y);
                    setCurrentMonthIndex(m - 1);
                    setSelectedDateStr(dStr);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:text-purple-700'
                  }`}
                >
                  <span>{dStr}</span>
                  <span className="px-1 py-0.2 rounded-full bg-slate-100 text-slate-800 text-[10px]">
                    {count}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-slate-400 italic">Belum ada rekaman tanggal</span>
          )}
        </div>
      </div>

      {/* Selected Date Detail View Panel */}
      {selectedDateStr && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Hasil Pemangkasan Tanggal: <span className="text-purple-700">{selectedDateStr}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ditemukan {selectedRecords.length} section eksekusi jaringan pada tanggal ini
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDateStr(null)}
              className="text-xs text-slate-500 hover:text-slate-800 underline self-start sm:self-auto"
            >
              Tutup Detail Tanggal
            </button>
          </div>

          {selectedRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedRecords.map((r) => {
                const isComplete = r.jumlahTemuan > 0 && r.realisasiTemuan >= r.jumlahTemuan;
                return (
                  <div
                    key={r.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition space-y-3 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded border border-blue-200 uppercase">
                          Penyulang: {r.penyulang || 'Umum'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{r.section}</h4>
                        <p className="text-[11px] text-slate-500">Periode Bulan: {r.bulan}</p>
                      </div>

                      <button
                        onClick={() => onSelectRecord(r)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-600 rounded-lg transition flex items-center gap-1 shadow-2xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Target/Real KMS</div>
                        <div className="text-xs font-bold text-slate-800">
                          {r.targetKms} / <span className="text-blue-600">{r.realisasiKms} KMS</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Pohon Dipangkas</div>
                        <div className={`text-xs font-bold ${isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {r.realisasiTemuan} / {r.jumlahTemuan} Pohon
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Realisasi Span</div>
                        <div className="text-xs font-bold text-indigo-600">{r.realisasiGawang} Gawang</div>
                      </div>
                    </div>

                    {/* Kendala & Notes */}
                    <div className="space-y-1 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {((r.luarTemuan || 0) > 0 || (r.realisasiLuarTemuan || 0) > 0) && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                            Luar Temuan: {r.realisasiLuarTemuan || 0}/{r.luarTemuan || 0} Pohon
                          </span>
                        )}
                        {r.perluPadam && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-600" />
                            Perlu Pemadaman ({r.jumlahPerluPadam || 1})
                          </span>
                        )}
                        {r.tidakAdaIzin && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            Masalah Izin ({r.jumlahTidakAdaIzin || 1})
                          </span>
                        )}
                        {r.pohonBesar && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <TreePine className="w-3 h-3 text-purple-600" />
                            Pohon Besar ({r.jumlahPohonBesar || 1})
                          </span>
                        )}
                      </div>

                      {r.catatan && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 italic">
                          "{r.catatan}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Tidak ada data rekaman pemangkasan untuk tanggal <span className="font-bold">{selectedDateStr}</span>.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
