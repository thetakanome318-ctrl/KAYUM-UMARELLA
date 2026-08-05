import React, { useState, useMemo, useEffect } from 'react';
import { ROWRecord, Penyulang } from '../types';
import { 
  HeartPulse, 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Activity, 
  Calendar,
  Layers,
  Plus,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { subscribePenyulang, savePenyulangToCloud, saveGangguanPangkalToCloud } from '../lib/firebase';
import { GangguanPangkalRecord } from '../types';
import { GangguanFormModal } from './GangguanFormModal';

interface HealthIndexViewProps {
  records: ROWRecord[];
  isLight?: boolean;
  penyulangList?: Penyulang[];
  isReadOnly?: boolean;
  onSaveRecord?: (record: Partial<ROWRecord>) => void;
  onDeleteRecord?: (id: string) => void;
}

export interface HealthStatusConfig {
  status: 'Sempurna' | 'Sehat' | 'Sakit' | 'Kronis';
  color: 'emerald' | 'blue' | 'amber' | 'rose';
  badgeClass: string;
  cardBorder: string;
  textClass: string;
  dotBg: string;
  bgLight: string;
  bgDark: string;
}

export function getHealthStatus(count: number): HealthStatusConfig {
  if (count === 0) {
    return {
      status: 'Sempurna',
      color: 'emerald',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      cardBorder: 'border-emerald-500/40',
      textClass: 'text-emerald-500',
      dotBg: 'bg-emerald-500',
      bgLight: 'bg-emerald-50',
      bgDark: 'bg-emerald-950/30',
    };
  } else if (count >= 1 && count <= 3) {
    return {
      status: 'Sehat',
      color: 'blue',
      badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      cardBorder: 'border-blue-500/40',
      textClass: 'text-blue-500',
      dotBg: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      bgDark: 'bg-blue-950/30',
    };
  } else if (count >= 4 && count <= 6) {
    return {
      status: 'Sakit',
      color: 'amber',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      cardBorder: 'border-amber-500/40',
      textClass: 'text-amber-500',
      dotBg: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      bgDark: 'bg-amber-950/30',
    };
  } else {
    // 7 or more
    return {
      status: 'Kronis',
      color: 'rose',
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      cardBorder: 'border-rose-500/40',
      textClass: 'text-rose-500',
      dotBg: 'bg-rose-500',
      bgLight: 'bg-rose-50',
      bgDark: 'bg-rose-950/30',
    };
  }
}

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const HealthIndexView: React.FC<HealthIndexViewProps> = ({
  records,
  isLight = false,
  penyulangList: penyulangProp = [],
  isReadOnly = false,
  onSaveRecord,
  onDeleteRecord,
}) => {
  const [penyulangList, setPenyulangList] = useState<Penyulang[]>(penyulangProp);

  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // '1' - '12' or 'ALL'
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL'); // 'ALL', 'Sempurna', 'Sehat', 'Sakit', 'Kronis'
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state for Gangguan & Penyulang
  const [isGangguanModalOpen, setIsGangguanModalOpen] = useState<boolean>(false);
  const [gangguanInitialData, setGangguanInitialData] = useState<Partial<ROWRecord> | null>(null);

  const [isAddPenyulangModal, setIsAddPenyulangModal] = useState<boolean>(false);
  const [penyulangFormName, setPenyulangFormName] = useState<string>('');

  useEffect(() => {
    if (penyulangProp && penyulangProp.length > 0) {
      setPenyulangList(penyulangProp);
    } else {
      const unsub = subscribePenyulang(setPenyulangList);
      return () => unsub();
    }
  }, [penyulangProp]);

  // Handler to add new Penyulang
  const handleSavePenyulang = async () => {
    if (!penyulangFormName.trim()) {
      alert('Nama penyulang tidak boleh kosong!');
      return;
    }

    const name = penyulangFormName.trim();
    const existing = penyulangList.find(p => p.nama.toLowerCase() === name.toLowerCase());
    if (existing) {
      alert('Penyulang dengan nama ini sudah ada!');
      return;
    }

    await savePenyulangToCloud({
      id: crypto.randomUUID(),
      nama: name,
      kode: name.slice(0, 3).toUpperCase(),
      panjangJaringan: 0,
      createdAt: new Date().toISOString(),
    });

    setIsAddPenyulangModal(false);
    setPenyulangFormName('');
  };

  // Quick Open Gangguan Form Modal for a penyulang
  const handleQuickAddGangguan = (penyulangName: string) => {
    setGangguanInitialData({
      penyulang: penyulangName,
      tanggal: new Date().toISOString().split('T')[0],
      gangguan: true,
    });
    setIsGangguanModalOpen(true);
  };

  // Available Years from Records
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    records.forEach(r => {
      if (r.tahun) years.add(r.tahun);
      if (r.tanggal) {
        const y = new Date(r.tanggal).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [records]);

  // Filtered Gangguan Records
  const gangguanRecords = useMemo(() => {
    return records.filter(r => r.gangguan);
  }, [records]);

  // Aggregate Data strictly by Penyulang
  const aggregatedPenyulangData = useMemo(() => {
    const penyulangMap = new Map<string, {
      penyulangName: string;
      gangguanCount: number;
      gangguanList: ROWRecord[];
    }>();

    // 1. Seed from Penyulang Master
    penyulangList.forEach(p => {
      if (!penyulangMap.has(p.nama)) {
        penyulangMap.set(p.nama, {
          penyulangName: p.nama,
          gangguanCount: 0,
          gangguanList: [],
        });
      }
    });

    // 2. Also seed any Penyulang found in gangguanRecords
    gangguanRecords.forEach(r => {
      if (r.penyulang) {
        if (!penyulangMap.has(r.penyulang)) {
          penyulangMap.set(r.penyulang, {
            penyulangName: r.penyulang,
            gangguanCount: 0,
            gangguanList: [],
          });
        }
      }
    });

    // 3. Count Gangguan matching Filter (Year & Month)
    gangguanRecords.forEach(r => {
      const rYear = r.tahun || (r.tanggal ? new Date(r.tanggal).getFullYear() : null);
      let rMonth = r.bulanKe;
      if (!rMonth && r.tanggal) {
        rMonth = new Date(r.tanggal).getMonth() + 1;
      }

      // Check Year Match
      if (selectedYear !== 'ALL' && rYear !== selectedYear) {
        return;
      }

      // Check Month Match
      if (selectedMonth !== 'ALL' && rMonth !== parseInt(selectedMonth, 10)) {
        return;
      }

      if (r.penyulang) {
        const item = penyulangMap.get(r.penyulang);
        if (item) {
          item.gangguanCount += 1;
          item.gangguanList.push(r);
        }
      }
    });

    // Convert map to array with health status & affected sections
    let result = Array.from(penyulangMap.values()).map(item => {
      const health = getHealthStatus(item.gangguanCount);
      
      // Calculate sections that actually had gangguan
      const secMap = new Map<string, number>();
      item.gangguanList.forEach(r => {
        if (r.section && r.section.trim()) {
          const secName = r.section.trim();
          secMap.set(secName, (secMap.get(secName) || 0) + 1);
        }
      });

      const affectedSections = Array.from(secMap.entries()).map(([section, count]) => ({
        section,
        count
      })).sort((a, b) => b.count - a.count);

      return {
        ...item,
        health,
        affectedSections,
      };
    });

    // Apply Health Status Filter
    if (selectedStatus !== 'ALL') {
      result = result.filter(item => item.health.status === selectedStatus);
    }

    // Apply Search Term Filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.penyulangName.toLowerCase().includes(term)
      );
    }

    // Sort by Gangguan Count descending, then penyulang name
    return result.sort((a, b) => b.gangguanCount - a.gangguanCount || a.penyulangName.localeCompare(b.penyulangName));
  }, [penyulangList, gangguanRecords, selectedYear, selectedMonth, selectedStatus, searchTerm]);

  // Overall Health Summary Stats
  const summaryStats = useMemo(() => {
    let sempurna = 0;
    let sehat = 0;
    let sakit = 0;
    let kronis = 0;

    aggregatedPenyulangData.forEach(item => {
      if (item.health.status === 'Sempurna') sempurna++;
      else if (item.health.status === 'Sehat') sehat++;
      else if (item.health.status === 'Sakit') sakit++;
      else if (item.health.status === 'Kronis') kronis++;
    });

    return {
      total: aggregatedPenyulangData.length,
      sempurna,
      sehat,
      sakit,
      kronis,
    };
  }, [aggregatedPenyulangData]);

  // Export CSV
  const handleExportCsv = () => {
    const DELIM = ';';
    const lines = [
      'sep=;',
      `"MONITORING HEALTH INDEX PENYULANG"`,
      `"Periode: ${selectedMonth === 'ALL' ? 'Semua Bulan' : BULAN_NAMES[parseInt(selectedMonth) - 1]} ${selectedYear === 'ALL' ? 'Semua Tahun' : selectedYear}"`,
      `"No"${DELIM}"Nama Penyulang"${DELIM}"Frekuensi Gangguan"${DELIM}"Health Index Status"${DELIM}"Section Terkena Gangguan"`,
      ...aggregatedPenyulangData.map((item, idx) => {
        const secStr = item.affectedSections.length > 0 
          ? item.affectedSections.map(s => `${s.section} (${s.count}x)`).join(', ')
          : 'Nihil Padam / Safe';
        return `"${idx + 1}"${DELIM}"${item.penyulangName}"${DELIM}"${item.gangguanCount}"${DELIM}"${item.health.status}"${DELIM}"${secStr}"`;
      })
    ];

    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Health_Index_Penyulang_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PLN (PERSERO) — LAPORAN HEALTH INDEX PENYULANG', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const periodeText = `Periode: ${selectedMonth === 'ALL' ? 'Semua Bulan' : BULAN_NAMES[parseInt(selectedMonth) - 1]} ${selectedYear === 'ALL' ? 'Semua Tahun' : selectedYear} | Total: ${aggregatedPenyulangData.length} Penyulang`;
    doc.text(periodeText, 14, 19);

    const rows = aggregatedPenyulangData.map((item, idx) => {
      const secStr = item.affectedSections.length > 0 
        ? item.affectedSections.map(s => `${s.section} (${s.count}x)`).join(', ')
        : 'Nihil Padam';
      return [
        idx + 1,
        item.penyulangName,
        `${item.gangguanCount} kali`,
        item.health.status.toUpperCase(),
        secStr
      ];
    });

    autoTable(doc, {
      startY: 34,
      head: [['No', 'Nama Penyulang', 'Frekuensi Gangguan', 'Health Index Status', 'Section Terkena Gangguan']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    doc.save(`Health_Index_Penyulang_${selectedYear}_${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-rose-500/20 text-rose-500 rounded-2xl border border-rose-500/30 animate-pulse">
            <HeartPulse className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>Monitoring Health Index Penyulang</span>
              <span className="text-xs px-2.5 py-0.5 bg-rose-500/20 text-rose-400 font-bold rounded-full border border-rose-500/30 uppercase tracking-wider">
                Sistem Keandalan
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Indeks kesehatan penyulang berdasarkan frekuensi gangguan per bulan &amp; tahun
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isReadOnly && (
            <button
              onClick={() => setIsAddPenyulangModal(true)}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Penyulang</span>
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Rules Indicator / Legend Banner */}
      <div className={`p-4 rounded-2xl border ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Kriteria Klasifikasi Health Index Penyulang:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/50"></div>
            <div>
              <div className="font-bold text-emerald-500 dark:text-emerald-400">Sempurna (0 Gangguan)</div>
              <div className="text-[10px] text-slate-400">Kondisi ideal, tanpa padam</div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0 shadow-sm shadow-blue-500/50"></div>
            <div>
              <div className="font-bold text-blue-500 dark:text-blue-400">Sehat (1 - 3 Gangguan)</div>
              <div className="text-[10px] text-slate-400">Kondisi terkendali</div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0 shadow-sm shadow-amber-500/50"></div>
            <div>
              <div className="font-bold text-amber-500 dark:text-amber-400">Sakit (4 - 6 Gangguan)</div>
              <div className="text-[10px] text-slate-400">Perlu perhatian / pemeliharaan</div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0 shadow-sm shadow-rose-500/50"></div>
            <div>
              <div className="font-bold text-rose-500 dark:text-rose-400">Kronis (≥ 7 Gangguan)</div>
              <div className="text-[10px] text-slate-400">Prioritas pemangkasan / pemeliharaan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Penyulang</div>
          <div className="text-2xl font-black mt-1 text-slate-800 dark:text-white">{summaryStats.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Penyulang terpantau</div>
        </div>

        <button 
          onClick={() => setSelectedStatus(selectedStatus === 'Sempurna' ? 'ALL' : 'Sempurna')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Sempurna'
              ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500'
              : isLight ? 'bg-white border-slate-200 hover:border-emerald-300' : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center justify-between">
            <span>Sempurna</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <div className="text-2xl font-black mt-1 text-emerald-500">{summaryStats.sempurna}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">0 Gangguan</div>
        </button>

        <button 
          onClick={() => setSelectedStatus(selectedStatus === 'Sehat' ? 'ALL' : 'Sehat')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Sehat'
              ? 'ring-2 ring-blue-500 bg-blue-500/10 border-blue-500'
              : isLight ? 'bg-white border-slate-200 hover:border-blue-300' : 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50'
          }`}
        >
          <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center justify-between">
            <span>Sehat</span>
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </div>
          <div className="text-2xl font-black mt-1 text-blue-500">{summaryStats.sehat}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">1 - 3 Gangguan</div>
        </button>

        <button 
          onClick={() => setSelectedStatus(selectedStatus === 'Sakit' ? 'ALL' : 'Sakit')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Sakit'
              ? 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500'
              : isLight ? 'bg-white border-slate-200 hover:border-amber-300' : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50'
          }`}
        >
          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center justify-between">
            <span>Sakit</span>
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          </div>
          <div className="text-2xl font-black mt-1 text-amber-500">{summaryStats.sakit}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">4 - 6 Gangguan</div>
        </button>

        <button 
          onClick={() => setSelectedStatus(selectedStatus === 'Kronis' ? 'ALL' : 'Kronis')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'Kronis'
              ? 'ring-2 ring-rose-500 bg-rose-500/10 border-rose-500'
              : isLight ? 'bg-white border-slate-200 hover:border-rose-300' : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50'
          }`}
        >
          <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center justify-between">
            <span>Kronis</span>
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
          </div>
          <div className="text-2xl font-black mt-1 text-rose-500">{summaryStats.kronis}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">≥ 7 Gangguan</div>
        </button>
      </div>

      {/* Filters Bar */}
      <div className={`p-4 rounded-2xl border flex flex-wrap gap-3 items-center justify-between ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Year Filter */}
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Tahun:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
              className={`px-3 py-1.5 rounded-xl border outline-none font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            >
              <option value="ALL">Semua Tahun</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-500">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border outline-none font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            >
              <option value="ALL">Semua Bulan</option>
              {BULAN_NAMES.map((m, idx) => (
                <option key={idx + 1} value={(idx + 1).toString()}>{m}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border outline-none font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            >
              <option value="ALL">Semua Status</option>
              <option value="Sempurna">Sempurna (0)</option>
              <option value="Sehat">Sehat (1-3)</option>
              <option value="Sakit">Sakit (4-6)</option>
              <option value="Kronis">Kronis (≥7)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama penyulang..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
            }`}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className={`${isLight ? 'bg-slate-100/80 text-slate-700' : 'bg-slate-950 text-slate-300'}`}>
                <th className="p-3.5 font-bold w-12 text-center">No</th>
                <th className="p-3.5 font-bold">Nama Penyulang</th>
                <th className="p-3.5 font-bold text-center">Frekuensi Gangguan</th>
                <th className="p-3.5 font-bold text-center">Health Index Status</th>
                <th className="p-3.5 font-bold">Section Terkena Gangguan</th>
                <th className="p-3.5 font-bold">Gangguan Terakhir</th>
                {!isReadOnly && <th className="p-3.5 font-bold text-center w-28">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {aggregatedPenyulangData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                    Tidak ada data penyulang yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                aggregatedPenyulangData.map((item, index) => {
                  const lastGangguan = item.gangguanList[0];
                  return (
                    <tr 
                      key={`${item.penyulangName}__${index}`}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-3.5 text-center font-semibold text-slate-400">{index + 1}</td>
                      <td className="p-3.5 font-extrabold text-blue-500 text-sm">{item.penyulangName}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-3 py-1 rounded-full font-black text-xs ${
                          item.gangguanCount === 0 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : item.gangguanCount <= 3 
                              ? 'bg-blue-500/10 text-blue-500'
                              : item.gangguanCount <= 6
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {item.gangguanCount} Kali Padam
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-black border ${item.health.badgeClass}`}>
                          <span className={`w-2 h-2 rounded-full ${item.health.dotBg}`}></span>
                          <span>{item.health.status}</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        {item.affectedSections && item.affectedSections.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                            {item.affectedSections.map(sec => (
                              <span 
                                key={sec.section}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                title={`Section ${sec.section} padam ${sec.count} kali`}
                              >
                                <Zap className="w-3 h-3 text-rose-400 shrink-0" />
                                <span>{sec.section}</span>
                                <span className="ml-0.5 px-1 bg-rose-500/25 text-rose-300 rounded text-[9px] font-black">
                                  {sec.count}x
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px] flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
                            <span>Nihil Section Gangguan</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {lastGangguan ? (
                          <div className="text-[11px] space-y-0.5">
                            <div className="font-semibold text-slate-400">{lastGangguan.tanggal || '-'}</div>
                            <div className="text-slate-500 truncate max-w-[240px]">
                              {lastGangguan.gangguanKeterangan || lastGangguan.penyebab || 'Ada data gangguan'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-emerald-500/80 font-medium text-[11px] flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Sempurna / Nihil Padam</span>
                          </span>
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleQuickAddGangguan(item.penyulangName)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg transition-all flex items-center justify-center space-x-1 mx-auto cursor-pointer"
                            title="Input Gangguan Penyulang"
                          >
                            <Zap className="w-3 h-3" />
                            <span>+ Gangguan</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Penyulang Modal */}
      {isAddPenyulangModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <h3 className="text-base font-extrabold flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-500" />
              <span>Tambah Nama Penyulang Baru</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-400">Nama Penyulang</label>
                <input
                  type="text"
                  placeholder="Contoh: LATERI 1, WAIHERU 2"
                  value={penyulangFormName}
                  onChange={e => setPenyulangFormName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsAddPenyulangModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSavePenyulang}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all cursor-pointer"
              >
                Simpan Penyulang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gangguan Form Modal */}
      {isGangguanModalOpen && (
        <GangguanFormModal
          isOpen={isGangguanModalOpen}
          onClose={() => setIsGangguanModalOpen(false)}
          onSave={(recordData) => {
            if (onSaveRecord) {
              const newRecord = {
                ...recordData,
                id: gangguanInitialData?.id || recordData.id || crypto.randomUUID()
              } as ROWRecord;

              if (newRecord.penyulang && !gangguanInitialData) {
                const matchedPenyulang = penyulangList.find(p => p.nama === newRecord.penyulang);
                if (matchedPenyulang && matchedPenyulang.statusPenyulang === 'Utama') {
                  const BULAN_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                  const mKe = newRecord.bulanKe || new Date().getMonth() + 1;
                  const mName = BULAN_NAMES[mKe - 1];
                  const yyyy = newRecord.tahun || new Date().getFullYear();
                  
                  const pangkalData: GangguanPangkalRecord = {
                    id: crypto.randomUUID(),
                    namaGI: matchedPenyulang.namaGI || 'GI PASSO',
                    namaPenyulang: matchedPenyulang.nama,
                    statusPenyulang: 'Utama',
                    bulan: `${mName} ${yyyy}`,
                    tahun: yyyy,
                    bulanKe: mKe,
                    jumlahGangguan: 1,
                    kodePenyebab: newRecord.kodeGangguan || 'I-1',
                    keteranganPenyebab: newRecord.gangguanKeterangan || newRecord.penyebab,
                    tanggal: newRecord.tanggal
                  };
                  
                  saveGangguanPangkalToCloud(pangkalData).catch(e => console.error('Failed to auto-create Gangguan Pangkal:', e));
                }
              }

              onSaveRecord(newRecord);
            }
            setIsGangguanModalOpen(false);
          }}
          initialData={gangguanInitialData || undefined}
          penyulangList={penyulangList}
        />
      )}
    </div>
  );
};

