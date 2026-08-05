import React, { useState, useMemo } from 'react';
import { ROWRecord, Penyulang } from '../types';
import { KODE_PENYEBAB_OPTIONS } from './GangguanPangkalView';
import { formatBulan } from '../utils/calculations';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { BarChart3, PieChart as PieIcon, Table, Zap, Calendar, Filter, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';
import { getThemeContrastClasses, themeStyles } from '../utils/themeHelper';

interface GangguanDashboardProps {
  records: ROWRecord[];
  isLight?: boolean;
  penyulangList?: Penyulang[];
}

const BULAN_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

const CHART_COLORS = [
  '#f43f5e', // rose-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#3b82f6', // blue-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
  '#eab308'  // yellow-500
];

export const GangguanDashboard: React.FC<GangguanDashboardProps> = ({
  records,
  isLight = false,
  penyulangList = []
}) => {
  const tc = getThemeContrastClasses(isLight);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('Semua');
  const [selectedPenyulang, setSelectedPenyulang] = useState<string>('Semua');

  // Available Years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    records.filter(r => r.gangguan).forEach(r => {
      if (r.tahun) yearsSet.add(r.tahun.toString());
      if (r.tanggal && r.tanggal.length >= 4) {
        yearsSet.add(r.tanggal.substring(0, 4));
      }
    });
    if (yearsSet.size === 0) yearsSet.add(currentYear.toString());
    return Array.from(yearsSet).sort().reverse();
  }, [records, currentYear]);

  // Filtered Gangguan Records
  const filteredGangguan = useMemo(() => {
    return records.filter(r => {
      if (!r.gangguan) return false;

      // Filter Year
      const recYear = r.tahun?.toString() || (r.tanggal ? r.tanggal.substring(0, 4) : '');
      if (selectedYear !== 'Semua' && recYear !== selectedYear) return false;

      // Filter Month
      if (selectedMonth !== 'Semua') {
        let recMonthNum = r.bulanKe;
        if (!recMonthNum && r.tanggal && r.tanggal.length >= 7) {
          recMonthNum = parseInt(r.tanggal.substring(5, 7), 10);
        }
        if (recMonthNum !== parseInt(selectedMonth, 10)) return false;
      }

      // Filter Penyulang
      if (selectedPenyulang !== 'Semua' && r.penyulang !== selectedPenyulang) {
        return false;
      }

      return true;
    });
  }, [records, selectedYear, selectedMonth, selectedPenyulang]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    const total = filteredGangguan.length;

    // Breakdown per Kode Gangguan
    const codeCounts: Record<string, number> = {};
    const penyulangCounts: Record<string, number> = {};
    let totalDurasiMins = 0;

    filteredGangguan.forEach(r => {
      const code = r.kodeGangguan || 'Lainnya';
      codeCounts[code] = (codeCounts[code] || 0) + 1;

      const p = r.penyulang || 'Tanpa Penyulang';
      penyulangCounts[p] = (penyulangCounts[p] || 0) + 1;

      // Try parse durasi
      if (r.durasi) {
        const dStr = r.durasi.toLowerCase();
        let mins = 0;
        if (dStr.includes('j')) {
          const parts = dStr.split('j');
          mins += parseInt(parts[0], 10) * 60;
          if (parts[1] && parts[1].includes('m')) {
            mins += parseInt(parts[1].replace('m', ''), 10) || 0;
          }
        } else if (dStr.includes('m')) {
          mins += parseInt(dStr.replace('m', ''), 10) || 0;
        }
        totalDurasiMins += isNaN(mins) ? 0 : mins;
      }
    });

    // Find Most Frequent Code
    let topCode = '-';
    let maxCodeVal = 0;
    Object.entries(codeCounts).forEach(([cd, cnt]) => {
      if (cnt > maxCodeVal) {
        maxCodeVal = cnt;
        topCode = cd;
      }
    });

    // Code Name
    const codeObj = KODE_PENYEBAB_OPTIONS.find(o => o.code === topCode);
    const topCodeLabel = codeObj ? `${topCode} (${codeObj.name})` : topCode;

    // Find Most Frequent Penyulang
    let topPenyulang = '-';
    let maxPenyulangVal = 0;
    Object.entries(penyulangCounts).forEach(([p, cnt]) => {
      if (cnt > maxPenyulangVal) {
        maxPenyulangVal = cnt;
        topPenyulang = p;
      }
    });

    // Format total duration
    const durHours = Math.floor(totalDurasiMins / 60);
    const durMins = totalDurasiMins % 60;
    const formattedDurasi = durHours > 0 ? `${durHours} Jam ${durMins} Min` : `${durMins} Menit`;

    return {
      total,
      topCodeLabel,
      maxCodeVal,
      topPenyulang,
      maxPenyulangVal,
      formattedDurasi
    };
  }, [filteredGangguan]);

  // Data for PIE CHART (Per Jenis / Kode Gangguan)
  const pieChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredGangguan.forEach(r => {
      const cd = r.kodeGangguan || 'Uncoded';
      counts[cd] = (counts[cd] || 0) + 1;
    });

    return Object.entries(counts).map(([code, value]) => {
      const opt = KODE_PENYEBAB_OPTIONS.find(o => o.code === code);
      const name = opt ? `${code} - ${opt.name}` : code;
      return {
        code,
        name,
        value
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredGangguan]);

  // Data for BAR CHART (Per Bulan)
  const barMonthlyData = useMemo(() => {
    const monthlyCounts = Array(12).fill(0);

    filteredGangguan.forEach(r => {
      let mKe = r.bulanKe;
      if (!mKe && r.tanggal && r.tanggal.length >= 7) {
        mKe = parseInt(r.tanggal.substring(5, 7), 10);
      }
      if (mKe && mKe >= 1 && mKe <= 12) {
        monthlyCounts[mKe - 1] += 1;
      }
    });

    return BULAN_LABELS.map((label, idx) => ({
      bulan: label,
      jumlah: monthlyCounts[idx]
    }));
  }, [filteredGangguan]);

  // MATRIKS DATA (Kode Gangguan vs Bulan)
  const matrixData = useMemo(() => {
    // Unique Kode Gangguan
    const codeSet = new Set<string>();
    filteredGangguan.forEach(r => {
      if (r.kodeGangguan) codeSet.add(r.kodeGangguan);
    });

    // Include standard codes if empty
    if (codeSet.size === 0) {
      KODE_PENYEBAB_OPTIONS.slice(0, 5).forEach(o => codeSet.add(o.code));
    }

    const codeList = Array.from(codeSet).sort();

    const rows = codeList.map(code => {
      const opt = KODE_PENYEBAB_OPTIONS.find(o => o.code === code);
      const months = Array(12).fill(0);
      let totalRow = 0;

      filteredGangguan.forEach(r => {
        if ((r.kodeGangguan || 'Uncoded') === code) {
          let mKe = r.bulanKe;
          if (!mKe && r.tanggal && r.tanggal.length >= 7) {
            mKe = parseInt(r.tanggal.substring(5, 7), 10);
          }
          if (mKe && mKe >= 1 && mKe <= 12) {
            months[mKe - 1] += 1;
            totalRow += 1;
          }
        }
      });

      return {
        code,
        name: opt ? opt.name : 'Lainnya',
        months,
        totalRow
      };
    });

    // Column Totals
    const colTotals = Array(12).fill(0);
    let grandTotal = 0;

    rows.forEach(r => {
      r.months.forEach((cnt, idx) => {
        colTotals[idx] += cnt;
      });
      grandTotal += r.totalRow;
    });

    return {
      rows,
      colTotals,
      grandTotal
    };
  }, [filteredGangguan]);

  return (
    <div className="space-y-6">
      {/* FILTER BAR & SCADA STATUS HEADER */}
      <div className={`p-5 rounded-2xl border transition-all ${tc.cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 shadow-lg shadow-rose-500/5">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-tight flex items-center gap-2 ${tc.textTitle}`}>
                DASHBOARD MATRIKS GANGGUAN PENYULANG
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Live SCADA
                </span>
              </h2>
              <p className={`text-xs ${tc.textMuted}`}>Analisis frekuensi, jenis kode gangguan, dan matriks distribusi bulanan</p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs ${tc.inputBg}`}>
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Tahun:</span>
              <select 
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer text-inherit"
              >
                <option value="Semua" className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>Semua Tahun</option>
                {availableYears.map(y => (
                  <option key={y} value={y} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>{y}</option>
                ))}
              </select>
            </div>

            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs ${tc.inputBg}`}>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Bulan:</span>
              <select 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer text-inherit"
              >
                <option value="Semua" className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>Semua Bulan</option>
                {BULAN_LABELS.map((b, idx) => (
                  <option key={idx + 1} value={(idx + 1).toString()} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>
                    {b} (Bulan {idx + 1})
                  </option>
                ))}
              </select>
            </div>

            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs ${tc.inputBg}`}>
              <Zap className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Penyulang:</span>
              <select 
                value={selectedPenyulang} 
                onChange={e => setSelectedPenyulang(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer max-w-[140px] truncate text-inherit"
              >
                <option value="Semua" className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>Semua Penyulang</option>
                {penyulangList.map(p => (
                  <option key={p.id} value={p.nama} className={isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-white'}>{p.nama}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Total Gangguan */}
        <div className={`p-4 rounded-2xl border relative overflow-hidden transition-all ${tc.cardBg}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Gangguan</span>
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-black font-mono ${tc.textTitle}`}>{kpiData.total} <span className="text-xs font-sans text-rose-500 font-normal">Kali Trip</span></div>
          <p className={`text-[11px] mt-1 ${tc.textMuted}`}>Periode: {selectedMonth === 'Semua' ? '1 Tahun' : BULAN_LABELS[parseInt(selectedMonth, 10)-1]} {selectedYear}</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Card 2: Kode Paling Dominan */}
        <div className={`p-4 rounded-2xl border relative overflow-hidden transition-all ${tc.cardBg}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kode Dominan</span>
            <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <PieIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base font-bold text-cyan-500 truncate" title={kpiData.topCodeLabel}>{kpiData.topCodeLabel}</div>
          <p className={`text-[11px] mt-1 ${tc.textMuted}`}>Frekuensi: <span className={`font-bold ${tc.textTitle}`}>{kpiData.maxCodeVal}</span> Kejadian</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Card 3: Penyulang Tersering */}
        <div className={`p-4 rounded-2xl border relative overflow-hidden transition-all ${tc.cardBg}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Penyulang Rawan</span>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg font-bold text-amber-500 truncate" title={kpiData.topPenyulang}>{kpiData.topPenyulang}</div>
          <p className={`text-[11px] mt-1 ${tc.textMuted}`}>Total Trip: <span className={`font-bold ${tc.textTitle}`}>{kpiData.maxPenyulangVal}</span> Kali</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PIE CHART: Jenis / Kode Gangguan */}
        <div className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col justify-between transition-all ${tc.cardBg}`}>
          <div className={`flex justify-between items-center pb-3 border-b mb-3 ${tc.divider}`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center space-x-2 ${tc.textTitle}`}>
                <PieIcon className="w-4 h-4 text-rose-400" />
                <span>Proporsi Jenis Kode Gangguan</span>
              </h3>
              <p className={`text-[11px] ${tc.textMuted}`}>Persentase kontribusi penyebab padam</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Pie Diagram
            </span>
          </div>

          <div className="h-64 w-full my-auto">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke={themeStyles.chartCellStroke(isLight)} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: themeStyles.chartTooltipBg(isLight), 
                      borderColor: themeStyles.chartTooltipBorder(isLight), 
                      borderRadius: '12px', 
                      color: themeStyles.chartTooltipTextColor(isLight), 
                      fontSize: '11px' 
                    }}
                    formatter={(val: any, name: any, item: any) => [`${val} Kejadian (${((val/kpiData.total)*100).toFixed(1)}%)`, item.payload.name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-full flex items-center justify-center text-xs italic ${tc.textMuted}`}>
                Belum ada data gangguan pada filter ini.
              </div>
            )}
          </div>

          {/* Pie Legend List */}
          {pieChartData.length > 0 && (
            <div className={`pt-3 border-t grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 text-[11px] ${tc.divider}`}>
              {pieChartData.map((item, idx) => (
                <div key={item.code} className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className={`font-mono text-[10px] shrink-0 font-bold ${tc.textBody}`}>{item.code}:</span>
                  <span className={`truncate ${tc.textMuted}`}>{item.value}x</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BAR CHART: Total Gangguan Per Bulan */}
        <div className={`lg:col-span-7 p-5 rounded-2xl border flex flex-col justify-between transition-all ${tc.cardBg}`}>
          <div className={`flex justify-between items-center pb-3 border-b mb-3 ${tc.divider}`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center space-x-2 ${tc.textTitle}`}>
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Tren Frekuensi Gangguan Per Bulan ({selectedYear})</span>
              </h3>
              <p className={`text-[11px] ${tc.textMuted}`}>Jumlah kejadian trip dari Januari s/d Desember</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Bar Chart
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.chartGrid(isLight)} vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: themeStyles.chartText(isLight) }} axisLine={{ stroke: themeStyles.chartGrid(isLight) }} />
                <YAxis tick={{ fontSize: 11, fill: themeStyles.chartText(isLight) }} axisLine={{ stroke: themeStyles.chartGrid(isLight) }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: themeStyles.chartTooltipBg(isLight), 
                    borderColor: themeStyles.chartTooltipBorder(isLight), 
                    borderRadius: '12px', 
                    color: themeStyles.chartTooltipTextColor(isLight), 
                    fontSize: '11px' 
                  }}
                  formatter={(val: any) => [`${val} Kejadian`, 'Total Gangguan']}
                />
                <Bar dataKey="jumlah" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={22}>
                  {barMonthlyData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.jumlah > 0 ? '#06b6d4' : (isLight ? '#f1f5f9' : '#1e293b')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MATRIKS TABEL (CROSS-TABULATION TABLE) */}
      <div className={`p-5 rounded-2xl border transition-all ${tc.cardBg}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b mb-4 gap-2 ${tc.divider}`}>
          <div>
            <h3 className={`text-base font-bold flex items-center space-x-2 ${tc.textTitle}`}>
              <Table className="w-5 h-5 text-indigo-500" />
              <span>MATRIKS DISTRIBUSI GANGGUAN PER KODE & BULAN</span>
            </h3>
            <p className={`text-xs ${tc.textMuted}`}>Rekapitulasi silang frekuensi kejadian berdasarkan kode gangguan per bulan dalam setahun</p>
          </div>
          <div className={`flex items-center space-x-2 text-xs font-mono font-bold px-3 py-1 rounded-xl border ${
            isLight ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-indigo-400 bg-indigo-950/60 border-indigo-500/30'
          }`}>
            <span>TOTAL KESELURUHAN: {matrixData.grandTotal} KEJADIAN</span>
          </div>
        </div>

        {/* Matrix Cross-Tabulation Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`font-bold border-b ${tc.divider} ${tc.tableHeaderBg}`}>
                <th className={`p-3 min-w-[140px] text-left ${tc.textTitle}`}>Kode Gangguan</th>
                <th className={`p-3 min-w-[160px] text-left ${tc.textTitle}`}>Keterangan Jenis</th>
                {BULAN_LABELS.map((b, i) => (
                  <th key={i} className={`p-2 text-center w-12 font-mono text-[11px] ${tc.textMuted}`}>{b}</th>
                ))}
                <th className={`p-3 text-center min-w-[70px] font-mono text-indigo-500 ${isLight ? 'bg-indigo-50/50' : 'bg-indigo-950/40'}`}>TOTAL</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-slate-300 ${tc.divider}`}>
              {matrixData.rows.map((row) => (
                <tr key={row.code} className={`transition-colors ${tc.hoverBg}`}>
                  <td className="p-3 font-mono font-bold text-cyan-500 whitespace-nowrap">
                    {row.code}
                  </td>
                  <td className={`p-3 font-medium whitespace-nowrap text-[11px] ${tc.textBody}`}>
                    {row.name}
                  </td>
                  {row.months.map((val, mIdx) => (
                    <td key={mIdx} className="p-2 text-center font-mono">
                      {val > 0 ? (
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                          val >= 5 
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                            : val >= 2 
                              ? (isLight ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40')
                              : (isLight ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30')
                        }`}>
                          {val}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  ))}
                  <td className={`p-3 text-center font-mono font-bold ${isLight ? 'text-indigo-700 bg-indigo-50/30' : 'text-white bg-indigo-950/30'}`}>
                    {row.totalRow > 0 ? (
                      <span className={`px-2 py-1 rounded-md font-black ${isLight ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500 text-slate-950'}`}>
                        {row.totalRow}
                      </span>
                    ) : (
                      '0'
                    )}
                  </td>
                </tr>
              ))}

              {/* Column Totals Row */}
              <tr className={`font-bold border-t-2 ${tc.divider} ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'}`}>
                <td colSpan={2} className={`p-3 text-right uppercase tracking-wider text-[11px] ${tc.textMuted}`}>
                  TOTAL PER BULAN:
                </td>
                {matrixData.colTotals.map((colVal, cIdx) => (
                  <td key={cIdx} className="p-2 text-center font-mono text-cyan-500 font-black">
                    {colVal > 0 ? colVal : '-'}
                  </td>
                ))}
                <td className={`p-3 text-center font-mono text-emerald-500 font-black text-sm ${isLight ? 'bg-emerald-50/50' : 'bg-slate-900'}`}>
                  {matrixData.grandTotal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
