import React, { useState } from 'react';
import { X, Target, CalendarDays, CheckCircle2, Save, RefreshCw, BarChart2 } from 'lucide-react';
import { MonthlyTargetItem, getMonthlyTargetsMap, saveMonthlyTargetsMap, DEFAULT_MONTHLY_TARGETS } from '../utils/targetStorage';
import { BULAN_SIMPLE_LIST, YEAR_LIST } from '../data/mockData';

interface TargetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTargetsUpdated: () => void;
  selectedYear: number | 'ALL';
}

export const TargetManagerModal: React.FC<TargetManagerModalProps> = ({
  isOpen,
  onClose,
  onTargetsUpdated,
  selectedYear,
}) => {
  const activeYear = selectedYear === 'ALL' ? 2026 : Number(selectedYear);
  const [currentYear, setCurrentYear] = useState<number>(activeYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [targetsMap, setTargetsMap] = useState<Record<string, MonthlyTargetItem>>(() => getMonthlyTargetsMap());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTargetChange = (bulanKe: number, field: 'targetKms' | 'targetGawang' | 'targetPohon', value: number) => {
    const bulanKey = `${currentYear}-${String(bulanKe).padStart(2, '0')}`;
    setTargetsMap((prev) => {
      const existing = prev[bulanKey] || {
        bulanKey,
        tahun: currentYear,
        bulanKe,
        targetKms: 0,
        targetGawang: 0,
        targetPohon: 0,
      };
      return {
        ...prev,
        [bulanKey]: {
          ...existing,
          [field]: Math.max(0, value),
        },
      };
    });
  };

  const handleSaveAll = () => {
    saveMonthlyTargetsMap(targetsMap);
    onTargetsUpdated();
    setToastMsg(`Target bulanan tahun ${currentYear} berhasil diperbarui!`);
    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 1200);
  };

  const handleResetDefault = () => {
    if (window.confirm(`Reset target bulanan ke nilai standar PLN?`)) {
      setTargetsMap({ ...DEFAULT_MONTHLY_TARGETS });
      saveMonthlyTargetsMap(DEFAULT_MONTHLY_TARGETS);
      onTargetsUpdated();
      setToastMsg('Target bulanan di-reset ke nilai default.');
      setTimeout(() => setToastMsg(null), 2000);
    }
  };

  const displayedMonths = selectedMonth === 'ALL'
    ? BULAN_SIMPLE_LIST
    : BULAN_SIMPLE_LIST.filter((b) => b.value === selectedMonth);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Kelola Target Bulanan (KMS &amp; Gawang)
                <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-bold">
                  Bulan &amp; Tahun
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Target kerja diisi per <span className="text-purple-300 font-semibold">Bulan &amp; Tahun</span> (tanpa tanggal). Digunakan untuk pemantauan hasil realisasi KMS &amp; Gawang.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {toastMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Month & Year Selectors Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-4">
              {/* Year Selector */}
              <div className="flex items-center space-x-2.5">
                <CalendarDays className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pilih Tahun
                  </label>
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(Number(e.target.value))}
                    className="mt-0.5 px-3 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                  >
                    {YEAR_LIST.map((y) => (
                      <option key={y} value={y}>
                        Tahun {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Month Selector */}
              <div className="flex items-center space-x-2.5 border-l border-slate-800 pl-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pilih Bulan
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="mt-0.5 px-3 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">Semua Bulan (12 Bulan)</option>
                    {BULAN_SIMPLE_LIST.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetDefault}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Standar PLN</span>
              </button>
            </div>
          </div>

          {/* Monthly Targets Grid Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span>Bulan &amp; Tahun Target</span>
              <div className="flex items-center space-x-12 pr-2">
                <span className="w-24 text-center">Target KMS</span>
                <span className="w-24 text-center">Target Gawang</span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-[380px] overflow-y-auto">
              {displayedMonths.map((b) => {
                const bKey = `${currentYear}-${String(b.monthKe).padStart(2, '0')}`;
                const tItem = targetsMap[bKey] || {
                  bulanKey: bKey,
                  tahun: currentYear,
                  bulanKe: b.monthKe,
                  targetKms: 10,
                  targetGawang: 60,
                  targetPohon: 100,
                };

                return (
                  <div
                    key={b.value}
                    className="px-4 py-3 flex items-center justify-between hover:bg-slate-900/60 transition gap-4"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {b.monthKe}
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        {b.label} {currentYear}
                      </span>
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* Target KMS Input */}
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={tItem.targetKms}
                          onChange={(e) =>
                            handleTargetChange(b.monthKe, 'targetKms', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-2.5 py-1 text-xs font-bold text-emerald-400 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-400 text-right"
                        />
                        <span className="text-[11px] text-slate-400 font-semibold">KMS</span>
                      </div>

                      {/* Target Gawang Input */}
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={tItem.targetGawang || 0}
                          onChange={(e) =>
                            handleTargetChange(b.monthKe, 'targetGawang', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-20 px-2.5 py-1 text-xs font-bold text-cyan-400 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-400 text-right"
                        />
                        <span className="text-[11px] text-slate-400 font-semibold">Gawang</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Perubahan target otomatis memperbarui persentase KPI pada Dashboard &amp; Tren.
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSaveAll}
              className="px-4 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition border border-purple-400/30 shadow-lg flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Target Manual</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
