import React, { useMemo, useState, useEffect } from 'react';
import { ROWRecord, Penyulang, MasterSection } from '../types';
import { formatBulan } from '../utils/calculations';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Calculator, 
  FileText, 
  Download, 
  Zap,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Activity,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { subscribeMasterSection } from '../lib/firebase';
import { getThemeContrastClasses, themeStyles } from '../utils/themeHelper';

interface SaidiSaifiViewProps {
  records: ROWRecord[];
  isLight?: boolean;
  onSaveRecord?: (record: ROWRecord) => void;
  onDeleteRecord?: (id: string) => void;
  penyulangList?: Penyulang[];
  sectionList?: MasterSection[];
  isReadOnly?: boolean;
}

const DEFAULT_TARIF_KWH = 1444.70; // Standard Tarif Listrik PLN (Rp/kWh)

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const SaidiSaifiView: React.FC<SaidiSaifiViewProps> = ({ 
  records, 
  isLight = false,
  onSaveRecord,
  onDeleteRecord,
  penyulangList = [],
  sectionList: sectionListProp,
  isReadOnly = false,
}) => {
  const tc = getThemeContrastClasses(isLight);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Partial<ROWRecord> | null>(null);
  const [sectionList, setSectionList] = useState<MasterSection[]>([]);
  const [activeTabSub, setActiveTabSub] = useState<'monitoring' | 'table'>('monitoring');

  useEffect(() => {
    if (sectionListProp && sectionListProp.length > 0) {
      setSectionList(sectionListProp);
    } else {
      const unsub = subscribeMasterSection(setSectionList);
      return () => unsub();
    }
  }, [sectionListProp]);

  // Sync Logic: Auto fill fields based on Penyulang, Section & Tanggal
  useEffect(() => {
    if (isModalOpen && editingData && editingData.penyulang) {
      const selectedPenyulang = editingData.penyulang;
      const selectedSection = editingData.section;

      if (selectedSection && selectedSection !== '') {
        const sec = sectionList.find(s => s.penyulang === selectedPenyulang && s.namaSection === selectedSection);
        if (sec && sec.jumlahPelanggan && (editingData.totalPelanggan === 0 || !editingData.totalPelanggan)) {
          setEditingData(prev => prev ? { ...prev, totalPelanggan: sec.jumlahPelanggan } : null);
        }
      } else {
        const totalPlg = sectionList
          .filter(s => s.penyulang === selectedPenyulang)
          .reduce((sum, s) => sum + (s.jumlahPelanggan || 0), 0);
        
        if (totalPlg > 0 && (editingData.totalPelanggan === 0 || !editingData.totalPelanggan)) {
          setEditingData(prev => prev ? { ...prev, totalPelanggan: totalPlg } : null);
        }
      }
    }
  }, [editingData?.penyulang, editingData?.section, isModalOpen, sectionList]);

  // Filter SAIDI SAIFI & ENS Records
  const filteredRecords = useMemo(() => {
    return records
      .filter(r => r.isSaidiSaifi)
      .filter(r => 
        (r.penyulang || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (r.section || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (r.catatan || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [records, searchTerm]);

  // Aggregated Cumulative Calculations (SAIDI, SAIFI, ENS & Rupiah Loss)
  const statsSummary = useMemo(() => {
    let totalSaidi = 0;
    let totalSaifi = 0;
    let totalEnsKwh = 0;
    let totalTargetEnsKwh = 0;
    let totalRupiahEns = 0;

    filteredRecords.forEach(r => {
      const saidiVal = r.saidiKumulatif ?? ((r.lamaPadamJam || 0) * (r.pelangganPadam || 0) / (r.totalPelanggan || 1));
      const saifiVal = r.saifiKumulatif ?? ((r.pelangganPadam || 0) / (r.totalPelanggan || 1));
      const ensVal = r.ensKwh || 0;
      const tarif = r.tarifRupiahPerKwh || DEFAULT_TARIF_KWH;

      totalSaidi += saidiVal;
      totalSaifi += saifiVal;
      totalEnsKwh += ensVal;
      totalTargetEnsKwh += r.targetEnsKwh || 0;
      totalRupiahEns += (ensVal * tarif);
    });

    return {
      totalSaidi: totalSaidi.toFixed(3),
      totalSaifi: totalSaifi.toFixed(3),
      totalEnsKwh: Math.round(totalEnsKwh),
      totalTargetEnsKwh: Math.round(totalTargetEnsKwh),
      totalRupiahEns: Math.round(totalRupiahEns),
      recordCount: filteredRecords.length
    };
  }, [filteredRecords]);

  // Bar Chart Data: Target vs Realisasi Kumulatif per Bulan / Penyulang
  const barChartData = useMemo(() => {
    const map: { [key: string]: { name: string; saidi: number; saifi: number; ens: number; ensRupiah: number } } = {};

    filteredRecords.forEach(r => {
      const key = r.penyulang || 'Penyulang Umum';
      if (!map[key]) {
        map[key] = { name: key, saidi: 0, saifi: 0, ens: 0, ensRupiah: 0 };
      }
      const saidiVal = r.saidiKumulatif ?? ((r.lamaPadamJam || 0) * (r.pelangganPadam || 0) / (r.totalPelanggan || 1));
      const saifiVal = r.saifiKumulatif ?? ((r.pelangganPadam || 0) / (r.totalPelanggan || 1));
      const ensVal = r.ensKwh || 0;
      const tarif = r.tarifRupiahPerKwh || DEFAULT_TARIF_KWH;

      map[key].saidi += saidiVal;
      map[key].saifi += saifiVal;
      map[key].ens += ensVal;
      map[key].ensRupiah += (ensVal * tarif);
    });

    return Object.values(map).map(item => ({
      ...item,
      saidi: Number(item.saidi.toFixed(3)),
      saifi: Number(item.saifi.toFixed(3)),
      ens: Math.round(item.ens),
      ensJutaRupiah: Number((item.ensRupiah / 1000000).toFixed(2))
    }));
  }, [filteredRecords]);

  // Pie Chart Data: Distribution of ENS Kumulatif (kWh & Rupiah) per Penyulang
  const pieChartData = useMemo(() => {
    const map: { [key: string]: number } = {};

    filteredRecords.forEach(r => {
      const pKey = r.penyulang || 'Lainnya';
      const ensVal = r.ensKwh || 0;
      map[pKey] = (map[pKey] || 0) + ensVal;
    });

    return Object.keys(map).map(key => ({
      name: key,
      value: Math.round(map[key])
    })).filter(item => item.value > 0);
  }, [filteredRecords]);

  // Format currency in IDR
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Export CSV
  const handleExportCsv = () => {
    const DELIM = ';';
    const lines = [
      'sep=;',
      `"DATA SAIDI SAIFI & ENS KUMULATIF PLN ULP BAGUALA"`,
      `"Tanggal"${DELIM}"Penyulang"${DELIM}"Section"${DELIM}"Lama Padam (Jam)"${DELIM}"Plg Padam"${DELIM}"Total Plg"${DELIM}"SAIDI Kumulatif"${DELIM}"SAIFI Kumulatif"${DELIM}"ENS (kWh)"${DELIM}"Tarif (Rp/kWh)"${DELIM}"Kerugian ENS (Rp)"${DELIM}"Catatan"`,
      ...filteredRecords.map(r => {
        const saidi = r.saidiKumulatif ?? ((r.lamaPadamJam || 0) * (r.pelangganPadam || 0) / (r.totalPelanggan || 1));
        const saifi = r.saifiKumulatif ?? ((r.pelangganPadam || 0) / (r.totalPelanggan || 1));
        const ens = r.ensKwh || 0;
        const tarif = r.tarifRupiahPerKwh || DEFAULT_TARIF_KWH;
        const rupiahEns = ens * tarif;
        return `"${r.tanggal || '-'}"${DELIM}"${r.penyulang || '-'}"${DELIM}"${r.section || '-'}"${DELIM}"${r.lamaPadamJam || 0}"${DELIM}"${r.pelangganPadam || 0}"${DELIM}"${r.totalPelanggan || 0}"${DELIM}"${saidi.toFixed(4)}"${DELIM}"${saifi.toFixed(4)}"${DELIM}"${ens}"${DELIM}"${tarif}"${DELIM}"${rupiahEns.toFixed(0)}"${DELIM}"${r.catatan || '-'}"`
      })
    ];
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Monitoring_SAIDI_SAIFI_ENS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 297, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PLN (PERSERO) — LAPORAN MONITORING SAIDI, SAIFI & ENS KUMULATIF', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')} | Total ENS: ${statsSummary.totalEnsKwh.toLocaleString('id-ID')} kWh | Total Kerugian: ${formatRupiah(statsSummary.totalRupiahEns)}`, 14, 19);

    const rows = filteredRecords.map(r => {
      const saidi = r.saidiKumulatif ?? ((r.lamaPadamJam || 0) * (r.pelangganPadam || 0) / (r.totalPelanggan || 1));
      const saifi = r.saifiKumulatif ?? ((r.pelangganPadam || 0) / (r.totalPelanggan || 1));
      const ens = r.ensKwh || 0;
      const tarif = r.tarifRupiahPerKwh || DEFAULT_TARIF_KWH;
      const rupiah = ens * tarif;
      return [
        r.tanggal || '-', 
        r.penyulang || '-', 
        r.section || '-',
        saidi.toFixed(3), 
        saifi.toFixed(3), 
        ens.toLocaleString('id-ID'),
        formatRupiah(rupiah),
        r.catatan || '-'
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Tanggal', 'Penyulang', 'Section', 'SAIDI (Jam/Plg)', 'SAIFI (Kali/Plg)', 'ENS (kWh)', 'Kerugian ENS (Rp)', 'Catatan']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3 }
    });

    doc.save(`Laporan_SAIDI_SAIFI_ENS_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Handle Save Input Record
  const handleSave = () => {
    if (onSaveRecord && editingData) {
      const ensVal = editingData.ensKwh || 0;
      const tarif = editingData.tarifRupiahPerKwh || DEFAULT_TARIF_KWH;
      const calculatedSaidi = (editingData.lamaPadamJam || 0) * (editingData.pelangganPadam || 0) / (editingData.totalPelanggan || 1);
      const calculatedSaifi = (editingData.pelangganPadam || 0) / (editingData.totalPelanggan || 1);

      const dataToSave = {
        id: editingData.id || crypto.randomUUID(),
        bulan: editingData.bulan || new Date().toISOString().substring(0, 7),
        tahun: editingData.tahun || new Date().getFullYear(),
        bulanKe: editingData.bulanKe || new Date().getMonth() + 1,
        section: editingData.section || '-',
        targetKms: 0,
        realisasiKms: 0,
        realisasiGawang: 0,
        jumlahTemuan: 0,
        realisasiTemuan: 0,
        isSaidiSaifi: true,
        saidiKumulatif: editingData.saidiKumulatif !== undefined ? editingData.saidiKumulatif : calculatedSaidi,
        saifiKumulatif: editingData.saifiKumulatif !== undefined ? editingData.saifiKumulatif : calculatedSaifi,
        ensKwh: ensVal,
        targetEnsKwh: editingData.targetEnsKwh || 0,
        tarifRupiahPerKwh: tarif,
        ...editingData
      } as ROWRecord;

      onSaveRecord(dataToSave);
      setIsModalOpen(false);
      setEditingData(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all duration-300 ${tc.cardBg}`}>
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl shadow-lg shadow-emerald-600/30">
            <Calculator className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>Monitoring SAIDI, SAIFI & ENS Kumulatif</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30">
                PLN ULP Baguala
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${tc.textMuted}`}>
              Indeks keandalan (SAIDI & SAIFI), Energi Tidak Tersalurkan (ENS kWh), dan Nilai Kerugian Financial dalam Rupiah.
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub Tab Navigation */}
          <div className="p-1 rounded-xl bg-slate-950/20 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
            <button
              onClick={() => setActiveTabSub('monitoring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabSub === 'monitoring'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Monitoring & Diagram</span>
            </button>
            <button
              onClick={() => setActiveTabSub('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabSub === 'table'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tabel Data</span>
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          {onSaveRecord && !isReadOnly && (
            <button
              onClick={() => {
                const initialPenyulang = penyulangList[0]?.nama || '';
                const initialSecs = sectionList.filter(s => s.penyulang === initialPenyulang);
                const initialTotalPlg = initialSecs.reduce((sum, s) => sum + (s.jumlahPelanggan || 0), 0);
                setEditingData({ 
                  tanggal: new Date().toISOString().split('T')[0],
                  lamaPadamJam: 0,
                  pelangganPadam: 0,
                  totalPelanggan: initialTotalPlg,
                  penyulang: initialPenyulang,
                  section: '',
                  saidiKumulatif: 0,
                  saifiKumulatif: 0,
                  ensKwh: 0,
                  targetEnsKwh: 0,
                  tarifRupiahPerKwh: DEFAULT_TARIF_KWH,
                  catatan: ''
                });
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Input SAIDI/SAIFI & ENS</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 SUMMARY STAT CARDS (Including Rupiah dari ENS Kumulatif) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rupiah dari ENS Kumulatif */}
        <div className={`p-5 rounded-2xl border shadow-lg relative overflow-hidden transition-all hover:scale-[1.01] ${
          isLight ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-400' : 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-emerald-900/90 border-emerald-700/60 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
              Kerugian ENS (Rupiah)
            </span>
            <div className="p-2 rounded-xl bg-white/20 text-white border border-white/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight drop-shadow-sm">
              {formatRupiah(statsSummary.totalRupiahEns)}
            </h3>
            <p className="text-[11px] text-emerald-100/90 mt-1 font-semibold">
              Estimasi Pendapatan Hilang @ Rp {DEFAULT_TARIF_KWH.toLocaleString('id-ID')}/kWh
            </p>
          </div>
        </div>

        {/* Card 2: Total ENS Kumulatif (kWh) */}
        <div className={`p-5 rounded-2xl border shadow-lg relative overflow-hidden transition-all hover:scale-[1.01] ${tc.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${tc.textMuted}`}>
              ENS Kumulatif (kWh)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight text-amber-500">
              {statsSummary.totalEnsKwh.toLocaleString('id-ID')} <span className="text-sm font-bold text-slate-400">kWh</span>
            </h3>
            <p className={`text-[11px] mt-1 ${tc.textMuted}`}>
              Total Energi Listrik Tidak Tersalurkan
            </p>
          </div>
        </div>

        {/* Card 3: SAIDI Kumulatif */}
        <div className={`p-5 rounded-2xl border shadow-lg relative overflow-hidden transition-all hover:scale-[1.01] ${tc.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${tc.textMuted}`}>
              SAIDI Kumulatif
            </span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-500 border border-blue-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight text-blue-500">
              {statsSummary.totalSaidi} <span className="text-sm font-bold text-slate-400">Jam/Plg</span>
            </h3>
            <p className={`text-[11px] mt-1 ${tc.textMuted}`}>
              Rata-rata Durasi Pemadaman Per Pelanggan
            </p>
          </div>
        </div>

        {/* Card 4: SAIFI Kumulatif */}
        <div className={`p-5 rounded-2xl border shadow-lg relative overflow-hidden transition-all hover:scale-[1.01] ${tc.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${tc.textMuted}`}>
              SAIFI Kumulatif
            </span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-500 border border-purple-500/30">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight text-purple-500">
              {statsSummary.totalSaifi} <span className="text-sm font-bold text-slate-400">Kali/Plg</span>
            </h3>
            <p className={`text-[11px] mt-1 ${tc.textMuted}`}>
              Frekuensi Pemadaman Per Pelanggan
            </p>
          </div>
        </div>
      </div>

      {/* MONITORING VIEW WITH BAR CHART & PIE CHART */}
      {activeTabSub === 'monitoring' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* BAR CHART: Target vs Realisasi ENS Kumulatif & SAIDI/SAIFI per Penyulang */}
          <div className={`lg:col-span-2 p-5 rounded-2xl border shadow-lg ${tc.cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  <span>Diagram Bar ENS Kumulatif per Penyulang (kWh & Juta Rp)</span>
                </h3>
                <p className={`text-xs ${tc.textMuted}`}>
                  Perbandingan Energi Tidak Tersalurkan dan Nilai Kerugian Financial
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.chartGrid(isLight)} opacity={0.3} />
                    <XAxis dataKey="name" stroke={themeStyles.chartText(isLight)} fontSize={10} interval={0} angle={-15} textAnchor="end" />
                    <YAxis yAxisId="left" stroke="#10b981" fontSize={11} label={{ value: 'ENS (kWh)', angle: -90, position: 'insideLeft', fill: '#10b981', fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={11} label={{ value: 'Kerugian (Juta Rp)', angle: 90, position: 'insideRight', fill: '#3b82f6', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: themeStyles.chartTooltipBg(isLight), 
                        borderColor: themeStyles.chartTooltipBorder(isLight), 
                        borderRadius: '12px', 
                        fontSize: '12px',
                        color: themeStyles.chartTooltipTextColor(isLight)
                      }}
                      formatter={(val: any, name?: any) => {
                        const strName = String(name || '');
                        if (strName === 'ens') return [`${val.toLocaleString('id-ID')} kWh`, 'ENS (kWh)'];
                        if (strName === 'ensJutaRupiah') return [`Rp ${val} Juta`, 'Kerugian Rp'];
                        return [val, strName];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: isLight ? '#475569' : '#cbd5e1' }} />
                    <Bar yAxisId="left" dataKey="ens" name="ENS Kumulatif (kWh)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar yAxisId="right" dataKey="ensJutaRupiah" name="Kerugian (Juta Rupiah)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={`h-full flex flex-col items-center justify-center space-y-2 ${tc.textMuted}`}>
                  <AlertTriangle className="w-8 h-8 text-amber-500/60" />
                  <p className="text-xs font-semibold">Belum ada data ENS / SAIDI SAIFI yang di-input.</p>
                </div>
              )}
            </div>
          </div>

          {/* PIE CHART: Proporsi ENS Kumulatif per Penyulang */}
          <div className={`p-5 rounded-2xl border shadow-lg flex flex-col justify-between ${tc.cardBg}`}>
            <div>
              <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2 mb-1">
                <PieIcon className="w-5 h-5 text-amber-500" />
                <span>Diagram Pie Kontribusi ENS (kWh)</span>
              </h3>
              <p className={`text-xs mb-3 ${tc.textMuted}`}>
                Persentase penyumbang ENS per Penyulang
              </p>

              <div className="h-56 w-full flex items-center justify-center">
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: themeStyles.chartTooltipBg(isLight), 
                          borderColor: themeStyles.chartTooltipBorder(isLight), 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          color: themeStyles.chartTooltipTextColor(isLight)
                        }}
                        formatter={(val: any) => [`${val.toLocaleString('id-ID')} kWh`, 'ENS']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className={`text-xs font-medium text-center ${tc.textMuted}`}>Belum ada data pie chart.</p>
                )}
              </div>
            </div>

            {/* Custom Pie Chart Legend List */}
            <div className={`space-y-1.5 pt-2 border-t ${tc.divider} max-h-28 overflow-y-auto text-xs`}>
              {pieChartData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-semibold truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{item.value.toLocaleString('id-ID')} kWh</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DATA TABLE SECTION */}
      <div className={`rounded-2xl border overflow-hidden shadow-xl ${tc.cardBg}`}>
        <div className={`p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${tc.divider}`}>
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Cari penyulang, section, atau catatan SAIDI/SAIFI..." 
              className="bg-transparent border-none outline-none text-xs w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs font-bold text-slate-400 shrink-0">
            Total Record: {filteredRecords.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className={`${tc.tableHeaderBg}`}>
                <th className="p-3 font-bold">Tanggal</th>
                <th className="p-3 font-bold">Penyulang</th>
                <th className="p-3 font-bold">Section</th>
                <th className="p-3 font-bold text-center">Tgt SAIDI</th>
                <th className="p-3 font-bold text-center">Real SAIDI</th>
                <th className="p-3 font-bold text-center">Tgt SAIFI</th>
                <th className="p-3 font-bold text-center">Real SAIFI</th>
                <th className="p-3 font-bold text-center">ENS (kWh)</th>
                <th className="p-3 font-bold text-right">Kerugian ENS (Rp)</th>
                <th className="p-3 font-bold">Catatan</th>
                {!isReadOnly && (onDeleteRecord || onSaveRecord) && <th className="p-3 font-bold text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 text-xs font-semibold">
                    Belum ada data SAIDI SAIFI & ENS Kumulatif. Silakan klik tombol "Input SAIDI/SAIFI & ENS".
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const saidi = r.saidiKumulatif ?? ((r.lamaPadamJam || 0) * (r.pelangganPadam || 0) / (r.totalPelanggan || 1));
                  const saifi = r.saifiKumulatif ?? ((r.pelangganPadam || 0) / (r.totalPelanggan || 1));
                  const tgtSaidi = r.targetSaidiKumulatif ?? 0;
                  const tgtSaifi = r.targetSaifiKumulatif ?? 0;
                  const ens = r.ensKwh || 0;
                  const tarif = r.tarifRupiahPerKwh || DEFAULT_TARIF_KWH;
                  const rupiahEns = ens * tarif;

                  return (
                    <tr key={r.id} className={`hover:bg-slate-500/5 transition-all`}>
                      <td className="p-3 font-mono font-bold text-amber-500">{r.tanggal || '-'}</td>
                      <td className="p-3 font-extrabold text-emerald-500">{r.penyulang || '-'}</td>
                      <td className="p-3 text-slate-400">{r.section || '-'}</td>
                      <td className="p-3 text-center font-bold font-mono text-blue-300/80">{tgtSaidi.toFixed(4)}</td>
                      <td className="p-3 text-center font-bold font-mono text-blue-400">{saidi.toFixed(4)}</td>
                      <td className="p-3 text-center font-bold font-mono text-purple-300/80">{tgtSaifi.toFixed(4)}</td>
                      <td className="p-3 text-center font-bold font-mono text-purple-400">{saifi.toFixed(4)}</td>
                      <td className="p-3 text-center font-black font-mono text-amber-400">{ens.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right font-black font-mono text-emerald-400">{formatRupiah(rupiahEns)}</td>
                      <td className="p-3 max-w-xs truncate text-slate-400">{r.catatan || '-'}</td>
                      {!isReadOnly && (onDeleteRecord || onSaveRecord) && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {onSaveRecord && (
                              <button
                                onClick={() => {
                                  setEditingData(r);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition cursor-pointer"
                                title="Edit Record"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteRecord && (
                              <button
                                onClick={() => onDeleteRecord(r.id)}
                                className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition cursor-pointer"
                                title="Hapus Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* INPUT / EDIT MODAL FOR SAIDI, SAIFI & ENS KUMULATIF */}
      {isModalOpen && editingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-xl rounded-2xl p-6 shadow-2xl border space-y-5 overflow-y-auto max-h-[90vh] ${tc.cardBg}`}>
            <div className="flex items-center justify-between border-b pb-4 border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    {editingData.id ? 'Edit Data SAIDI/SAIFI & ENS' : 'Input Data SAIDI, SAIFI & ENS Kumulatif'}
                  </h3>
                  <p className="text-xs text-slate-400">PLN ULP Baguala • Sistem Keandalan 20kV</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingData(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Bulan dan Tahun */}
              <div>
                <label className="block font-bold mb-1 text-slate-300">Bulan *</label>
                <select
                  value={editingData.bulan || 'Juli'}
                  onChange={(e) => setEditingData({ ...editingData, bulan: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Januari">Januari</option>
                  <option value="Februari">Februari</option>
                  <option value="Maret">Maret</option>
                  <option value="April">April</option>
                  <option value="Mei">Mei</option>
                  <option value="Juni">Juni</option>
                  <option value="Juli">Juli</option>
                  <option value="Agustus">Agustus</option>
                  <option value="September">September</option>
                  <option value="Oktober">Oktober</option>
                  <option value="November">November</option>
                  <option value="Desember">Desember</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Tahun *</label>
                <select
                  value={editingData.tahun || new Date().getFullYear()}
                  onChange={(e) => setEditingData({ ...editingData, tahun: parseInt(e.target.value) || new Date().getFullYear() })}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* ENS Kumulatif (kWh) */}
              <div>
                <label className="block font-bold mb-1 text-amber-400">ENS Kumulatif (kWh) *</label>
                <input
                  type="number"
                  placeholder="e.g. 1250"
                  value={editingData.ensKwh ?? ''}
                  onChange={(e) => setEditingData({ ...editingData, ensKwh: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-amber-500/50 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Target SAIDI Kumulatif */}
              <div>
                <label className="block font-bold mb-1 text-blue-300">Target SAIDI Kumulatif (Jam/Plg)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="e.g. 0.200"
                  value={editingData.targetSaidiKumulatif ?? ''}
                  onChange={(e) => setEditingData({ ...editingData, targetSaidiKumulatif: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-blue-500/30 text-blue-100 font-mono focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Realisasi SAIDI Kumulatif */}
              <div>
                <label className="block font-bold mb-1 text-blue-400">Realisasi SAIDI Kumulatif (Jam/Plg)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="e.g. 0.245"
                  value={editingData.saidiKumulatif ?? ''}
                  onChange={(e) => setEditingData({ ...editingData, saidiKumulatif: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-blue-500/50 text-blue-300 font-mono font-bold focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Target SAIFI Kumulatif */}
              <div>
                <label className="block font-bold mb-1 text-purple-300">Target SAIFI Kumulatif (Kali/Plg)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="e.g. 0.050"
                  value={editingData.targetSaifiKumulatif ?? ''}
                  onChange={(e) => setEditingData({ ...editingData, targetSaifiKumulatif: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-purple-500/30 text-purple-100 font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Realisasi SAIFI Kumulatif */}
              <div>
                <label className="block font-bold mb-1 text-purple-400">Realisasi SAIFI Kumulatif (Kali/Plg)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="e.g. 0.085"
                  value={editingData.saifiKumulatif ?? ''}
                  onChange={(e) => setEditingData({ ...editingData, saifiKumulatif: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-purple-500/50 text-purple-300 font-mono font-bold focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Tarif Dasar Listrik (Rp/kWh) */}
              <div>
                <label className="block font-bold mb-1 text-emerald-400">Tarif Listrik (Rp/kWh)</label>
                <input
                  type="number"
                  value={editingData.tarifRupiahPerKwh ?? DEFAULT_TARIF_KWH}
                  onChange={(e) => setEditingData({ ...editingData, tarifRupiahPerKwh: parseFloat(e.target.value) || DEFAULT_TARIF_KWH })}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-emerald-500/50 text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold text-center">
                  Estimasi Kerugian Rupiah Hilang: {formatRupiah((editingData.ensKwh || 0) * (editingData.tarifRupiahPerKwh || DEFAULT_TARIF_KWH))}
                </div>
              </div>

              {/* Catatan */}
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1 text-slate-300">Catatan / Keterangan Operasional</label>
                <textarea
                  rows={2}
                  placeholder="Catatan mengenai keandalan per tahun..."
                  value={editingData.catatan || ''}
                  onChange={(e) => setEditingData({ ...editingData, catatan: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingData(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
