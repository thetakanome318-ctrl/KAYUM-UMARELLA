import React, { useState, useMemo, useEffect } from 'react';
import { GangguanPangkalRecord, Penyulang } from '../types';
import { 
  Zap, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Download, 
  Calendar, 
  AlertTriangle, 
  Building2, 
  Edit, 
  Trash2, 
  X, 
  Activity, 
  ShieldAlert, 
  Layers,
  CheckCircle2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveGangguanPangkalToCloud, deleteGangguanPangkalFromCloud, subscribeGangguanPangkal } from '../lib/firebase';

interface GangguanPangkalViewProps {
  isLight?: boolean;
  penyulangList?: Penyulang[];
  isReadOnly?: boolean;
}

export const KODE_PENYEBAB_OPTIONS = [
  // Kode Internal (I-1 s/d I-4)
  { code: 'I-1', name: 'KOMPONEN JTM', desc: 'Isolator, pin, klem, konektor, dll', color: 'bg-rose-500/10 text-rose-500 border-rose-500/30' },
  { code: 'I-2', name: 'PERALATAN JTM', desc: 'FCO, Recloser, LBS, Arrester, SKTM, dll', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
  { code: 'I-3', name: 'TRAFO DAN LAINNYA', desc: 'Trafo distribusi, cubicle GI, busbar, dll', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' },
  { code: 'I-4', name: 'TIANG', desc: 'Tiang patah, miring, ambruk, atau geser', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },

  // Kode Eksternal (E-1 s/d E-4)
  { code: 'E-1', name: 'POHON', desc: 'Sentuhan / dahan / pohon roboh mengenai jaringan', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  { code: 'E-2', name: 'BENCANA ALAM', desc: 'Petir, banjir, tanah longsor, angin kencang, dll', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' },
  { code: 'E-3', name: 'PEKERJAAN PIHAK III / BINATANG', desc: 'Kegiatan konstruksi, galian, burung, kelelawar, ular', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  { code: 'E-4', name: 'LAYANG-2 / EMBEL-2, DLL', desc: 'Benang/kertas layangan, umbul-umbul, baliho, dll', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
];

const GI_DEFAULT_LIST = [
  'GI PASSO',
  'GIS PASSO',
  'GI SIRIMAU',
  'GI POKA',
  'GI WAYAME',
  'GI AMBON',
  'PLTD HATIVE KECIL',
  'PLTD POKA'
];

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const GangguanPangkalView: React.FC<GangguanPangkalViewProps> = ({
  isLight = false,
  penyulangList = [],
  isReadOnly = false,
}) => {
  const [records, setRecords] = useState<GangguanPangkalRecord[]>([]);

  // Filters
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedGI, setSelectedGI] = useState<string>('ALL');
  const [selectedStatusPenyulang, setSelectedStatusPenyulang] = useState<string>('ALL');
  const [selectedKode, setSelectedKode] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<GangguanPangkalRecord | null>(null);

  const [formData, setFormData] = useState<{
    id: string;
    namaGI: string;
    namaPenyulang: string;
    statusPenyulang: 'Utama' | 'Percabangan';
    tahun: number;
    bulanKe: number;
    jumlahGangguan: number;
    kodePenyebab: string;
    keteranganPenyebab: string;
    tanggal: string;
  }>({
    id: '',
    namaGI: 'GI PASSO',
    namaPenyulang: '',
    statusPenyulang: 'Utama',
    tahun: new Date().getFullYear(),
    bulanKe: new Date().getMonth() + 1,
    jumlahGangguan: 1,
    kodePenyebab: 'I-1',
    keteranganPenyebab: '',
    tanggal: new Date().toISOString().split('T')[0],
  });

  // Subscribe to Firebase real-time data
  useEffect(() => {
    const unsub = subscribeGangguanPangkal(setRecords);
    return () => unsub();
  }, []);

  // Sync Penyulang initial selection
  useEffect(() => {
    if (penyulangList.length > 0 && !formData.namaPenyulang) {
      setFormData(prev => ({ ...prev, namaPenyulang: penyulangList[0].nama }));
    }
  }, [penyulangList]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData({
      id: '',
      namaGI: 'GI PASSO',
      namaPenyulang: penyulangList[0]?.nama || 'LATERI 1',
      statusPenyulang: 'Utama',
      tahun: new Date().getFullYear(),
      bulanKe: new Date().getMonth() + 1,
      jumlahGangguan: 1,
      kodePenyebab: 'I-1',
      keteranganPenyebab: '',
      tanggal: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: GangguanPangkalRecord) => {
    setEditingRecord(rec);
    setFormData({
      id: rec.id,
      namaGI: rec.namaGI || 'GI PASSO',
      namaPenyulang: rec.namaPenyulang || '',
      statusPenyulang: rec.statusPenyulang || 'Utama',
      tahun: rec.tahun || new Date().getFullYear(),
      bulanKe: rec.bulanKe || (new Date().getMonth() + 1),
      jumlahGangguan: rec.jumlahGangguan || 1,
      kodePenyebab: rec.kodePenyebab || 'I-1',
      keteranganPenyebab: rec.keteranganPenyebab || '',
      tanggal: rec.tanggal || new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  // Submit Save
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.namaGI.trim() || !formData.namaPenyulang.trim()) {
      alert('Nama GI dan Nama Penyulang wajib diisi!');
      return;
    }

    const monthStr = `${formData.tahun}-${String(formData.bulanKe).padStart(2, '0')}`;
    const monthName = BULAN_NAMES[formData.bulanKe - 1];

    const recordToSave: GangguanPangkalRecord = {
      id: formData.id || crypto.randomUUID(),
      namaGI: formData.namaGI.trim().toUpperCase(),
      namaPenyulang: formData.namaPenyulang.trim().toUpperCase(),
      statusPenyulang: formData.statusPenyulang,
      bulan: `${monthName} ${formData.tahun}`,
      tahun: Number(formData.tahun),
      bulanKe: Number(formData.bulanKe),
      jumlahGangguan: Number(formData.jumlahGangguan) || 1,
      kodePenyebab: formData.kodePenyebab,
      keteranganPenyebab: formData.keteranganPenyebab.trim(),
      tanggal: formData.tanggal,
      createdAt: editingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveGangguanPangkalToCloud(recordToSave);
    setIsModalOpen(false);
  };

  // Delete Item
  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data gangguan pangkal ini?')) {
      await deleteGangguanPangkalFromCloud(id);
    }
  };

  // Unique List of GIs
  const availableGIs = useMemo(() => {
    const set = new Set<string>(GI_DEFAULT_LIST);
    records.forEach(r => {
      if (r.namaGI) set.add(r.namaGI.toUpperCase());
    });
    return Array.from(set).sort();
  }, [records]);

  // Unique Years
  const availableYears = useMemo(() => {
    const set = new Set<number>([2024, 2025, 2026, 2027]);
    records.forEach(r => {
      if (r.tahun) set.add(r.tahun);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [records]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedYear !== 'ALL' && r.tahun !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && r.bulanKe !== parseInt(selectedMonth, 10)) return false;
      if (selectedGI !== 'ALL' && r.namaGI?.toUpperCase() !== selectedGI.toUpperCase()) return false;
      if (selectedStatusPenyulang !== 'ALL' && (r.statusPenyulang || 'Utama') !== selectedStatusPenyulang) return false;
      if (selectedKode !== 'ALL' && r.kodePenyebab !== selectedKode) return false;

      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchGI = r.namaGI?.toLowerCase().includes(term);
        const matchPenyulang = r.namaPenyulang?.toLowerCase().includes(term);
        const matchStatus = (r.statusPenyulang || 'Utama').toLowerCase().includes(term);
        const matchCode = r.kodePenyebab?.toLowerCase().includes(term);
        const matchKet = r.keteranganPenyebab?.toLowerCase().includes(term);
        if (!matchGI && !matchPenyulang && !matchStatus && !matchCode && !matchKet) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by Year desc, Month desc, Count desc
      if (b.tahun !== a.tahun) return b.tahun - a.tahun;
      if (b.bulanKe !== a.bulanKe) return b.bulanKe - a.bulanKe;
      return b.jumlahGangguan - a.jumlahGangguan;
    });
  }, [records, selectedYear, selectedMonth, selectedGI, selectedStatusPenyulang, selectedKode, searchTerm]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalGangguan = 0;
    const giMap: Record<string, number> = {};
    const penyulangMap: Record<string, number> = {};
    const causeMap: Record<string, number> = {};

    filteredRecords.forEach(r => {
      const count = r.jumlahGangguan || 1;
      totalGangguan += count;

      if (r.namaGI) {
        giMap[r.namaGI] = (giMap[r.namaGI] || 0) + count;
      }
      if (r.namaPenyulang) {
        penyulangMap[r.namaPenyulang] = (penyulangMap[r.namaPenyulang] || 0) + count;
      }
      if (r.kodePenyebab) {
        causeMap[r.kodePenyebab] = (causeMap[r.kodePenyebab] || 0) + count;
      }
    });

    // Highest GI
    let topGI = '-';
    let maxGICount = 0;
    Object.entries(giMap).forEach(([gi, c]) => {
      if (c > maxGICount) {
        maxGICount = c;
        topGI = gi;
      }
    });

    // Highest Penyulang
    let topPenyulang = '-';
    let maxPenyulangCount = 0;
    Object.entries(penyulangMap).forEach(([p, c]) => {
      if (c > maxPenyulangCount) {
        maxPenyulangCount = c;
        topPenyulang = p;
      }
    });

    // Highest Cause Code
    let topCauseCode = '-';
    let maxCauseCount = 0;
    Object.entries(causeMap).forEach(([code, c]) => {
      if (c > maxCauseCount) {
        maxCauseCount = c;
        topCauseCode = code;
      }
    });

    const causeOpt = KODE_PENYEBAB_OPTIONS.find(o => o.code === topCauseCode);
    const topCauseName = causeOpt ? `${causeOpt.code} (${causeOpt.name.split('/')[0].trim()})` : topCauseCode;

    return {
      totalRecords: filteredRecords.length,
      totalGangguan,
      topGI: maxGICount > 0 ? `${topGI} (${maxGICount}x)` : '-',
      topPenyulang: maxPenyulangCount > 0 ? `${topPenyulang} (${maxPenyulangCount}x)` : '-',
      topCause: maxCauseCount > 0 ? `${topCauseName} (${maxCauseCount}x)` : '-',
    };
  }, [filteredRecords]);

  // Export CSV
  const handleExportCsv = () => {
    const DELIM = ';';
    const lines = [
      'sep=;',
      `"MONITORING GANGGUAN PANGKAL (FEEDER HEAD OUTAGES)"`,
      `"Periode: ${selectedMonth === 'ALL' ? 'Semua Bulan' : BULAN_NAMES[parseInt(selectedMonth) - 1]} ${selectedYear === 'ALL' ? 'Semua Tahun' : selectedYear}"`,
      `"No"${DELIM}"Nama GI"${DELIM}"Nama Penyulang"${DELIM}"Status Penyulang"${DELIM}"Bulan/Tahun"${DELIM}"Jumlah Gangguan/Bulan"${DELIM}"Kode Penyebab"${DELIM}"Deskripsi Penyebab"${DELIM}"Tanggal Kejadian"`,
      ...filteredRecords.map((r, idx) => {
        const causeOpt = KODE_PENYEBAB_OPTIONS.find(o => o.code === r.kodePenyebab);
        const causeText = causeOpt ? `${r.kodePenyebab} - ${causeOpt.name}` : r.kodePenyebab;
        return `"${idx + 1}"${DELIM}"${r.namaGI}"${DELIM}"${r.namaPenyulang}"${DELIM}"${r.statusPenyulang || 'Utama'}"${DELIM}"${r.bulan}"${DELIM}"${r.jumlahGangguan}"${DELIM}"${causeText}"${DELIM}"${r.keteranganPenyebab || '-'}"${DELIM}"${r.tanggal || '-'}"`;
      })
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Gangguan_Pangkal_${selectedYear}_${selectedMonth}.csv`;
    link.click();
  };

  // Export PDF
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PLN (PERSERO) — LAPORAN MONITORING GANGGUAN PANGKAL', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${selectedMonth === 'ALL' ? 'Semua Bulan' : BULAN_NAMES[parseInt(selectedMonth) - 1]} ${selectedYear === 'ALL' ? 'Semua Tahun' : selectedYear} | Total Gangguan: ${summaryMetrics.totalGangguan} Kali`, 14, 19);

    const rows = filteredRecords.map((r, idx) => {
      const causeOpt = KODE_PENYEBAB_OPTIONS.find(o => o.code === r.kodePenyebab);
      return [
        idx + 1,
        r.namaGI,
        r.namaPenyulang,
        r.statusPenyulang || 'Utama',
        r.bulan,
        `${r.jumlahGangguan} Kali`,
        causeOpt ? `${r.kodePenyebab}\n(${causeOpt.name})` : r.kodePenyebab,
        r.keteranganPenyebab || '-',
        r.tanggal || '-'
      ];
    });

    autoTable(doc, {
      startY: 34,
      head: [['No', 'Nama GI', 'Nama Penyulang', 'Status', 'Bulan/Tahun', 'Gangguan/Bln', 'Kode Penyebab', 'Keterangan Detail', 'Tanggal']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    doc.save(`Gangguan_Pangkal_${selectedYear}_${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className={`p-6 rounded-2xl border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-rose-500/15 text-rose-500 rounded-xl border border-rose-500/30">
            <Zap className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>Monitoring Gangguan Pangkal</span>
              <span className="text-xs px-2.5 py-0.5 bg-rose-500/20 text-rose-400 font-bold rounded-full border border-rose-500/30 uppercase tracking-wider">
                Feeder Head Outage
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Pencatatan &amp; evaluasi frekuensi trip di Gardu Induk (GI) per penyulang &amp; kode penyebab
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isReadOnly && (
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Input Gangguan Pangkal</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg transition-all flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Gangguan Pangkal</span>
            <Zap className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-500">{summaryMetrics.totalGangguan} <span className="text-xs font-normal text-slate-400">Kali Trip</span></div>
          <div className="text-[10px] text-slate-500 mt-0.5">Dari {summaryMetrics.totalRecords} pencatatan bulanan</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GI Paling Sering Gangguan</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-amber-500 truncate">{summaryMetrics.topGI}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Gardu Induk dengan trip terbanyak</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penyulang Rawan Pangkal</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-black text-blue-500 truncate">{summaryMetrics.topPenyulang}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Frekuensi gangguan teror di pangkal</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penyebab Utama Trip</span>
            <AlertTriangle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-sm font-black text-purple-400 truncate">{summaryMetrics.topCause}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Dominasi kode gangguan</div>
        </div>
      </div>

      {/* Cause Code Legend Banner */}
      <div className={`p-4 rounded-2xl border ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
      }`}>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-rose-500" />
          <span>Panduan Kode Penyebab Gangguan Pangkal:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px]">
          {KODE_PENYEBAB_OPTIONS.map(opt => (
            <div key={opt.code} className={`p-2 rounded-xl border flex flex-col justify-between ${opt.color}`}>
              <span className="font-black text-xs">{opt.code}</span>
              <span className="font-bold truncate mt-0.5 text-[10px]">{opt.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Year Filter */}
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-500">Tahun:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
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
                {BULAN_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>{name}</option>
                ))}
              </select>
            </div>

            {/* GI Filter */}
            <div className="flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-500">Gardu Induk:</span>
              <select
                value={selectedGI}
                onChange={e => setSelectedGI(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border outline-none font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              >
                <option value="ALL">Semua GI</option>
                {availableGIs.map(gi => (
                  <option key={gi} value={gi}>{gi}</option>
                ))}
              </select>
            </div>

            {/* Status Penyulang Filter */}
            <div className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-500">Status Penyulang:</span>
              <select
                value={selectedStatusPenyulang}
                onChange={e => setSelectedStatusPenyulang(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border outline-none font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              >
                <option value="ALL">Semua Status</option>
                <option value="Utama">Utama</option>
                <option value="Percabangan">Percabangan</option>
              </select>
            </div>

            {/* Cause Code Filter */}
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-500">Kode Penyebab:</span>
              <select
                value={selectedKode}
                onChange={e => setSelectedKode(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border outline-none font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              >
                <option value="ALL">Semua Penyebab</option>
                {KODE_PENYEBAB_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.code} - {opt.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari GI, Penyulang, Keterangan..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-rose-500' : 'bg-slate-950 border-slate-700 text-white focus:border-rose-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-lg ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`${isLight ? 'bg-slate-100/80 text-slate-700' : 'bg-slate-950 text-slate-300'}`}>
                <th className="p-3.5 font-bold w-12 text-center">No</th>
                <th className="p-3.5 font-bold">Nama GI</th>
                <th className="p-3.5 font-bold">Nama Penyulang</th>
                <th className="p-3.5 font-bold text-center">Status Penyulang</th>
                <th className="p-3.5 font-bold text-center">Bulan &amp; Tahun</th>
                <th className="p-3.5 font-bold text-center">Jumlah Gangguan</th>
                <th className="p-3.5 font-bold">Kode Penyebab</th>
                <th className="p-3.5 font-bold">Keterangan / Detail</th>
                {!isReadOnly && <th className="p-3.5 font-bold text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                    Belum ada data gangguan pangkal yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, index) => {
                  const causeOpt = KODE_PENYEBAB_OPTIONS.find(o => o.code === item.kodePenyebab);
                  const statusVal = item.statusPenyulang || 'Utama';
                  return (
                    <tr 
                      key={item.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-3.5 text-center font-semibold text-slate-400">{index + 1}</td>
                      <td className="p-3.5 font-extrabold text-amber-500">{item.namaGI}</td>
                      <td className="p-3.5 font-extrabold text-blue-500 text-sm">{item.namaPenyulang}</td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border ${
                          statusVal === 'Utama'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {statusVal}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-300">{item.bulan}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-3 py-1 rounded-full font-black text-xs bg-rose-500/15 text-rose-500 border border-rose-500/30">
                          {item.jumlahGangguan} Kali / Bulan
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-black border ${
                          causeOpt?.color || 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}>
                          <span>{item.kodePenyebab}</span>
                          {causeOpt && <span className="font-normal opacity-80">({causeOpt.name.split('/')[0].trim()})</span>}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="max-w-[220px] truncate text-slate-400" title={item.keteranganPenyebab || '-'}>
                          {item.keteranganPenyebab || '-'}
                        </div>
                        {item.tanggal && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Tgl: {item.tanggal}
                          </div>
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all cursor-pointer"
                              title="Edit Data"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* Form Input Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-5 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <Zap className="w-5 h-5 text-rose-500" />
                <span>{editingRecord ? 'Edit Data Gangguan Pangkal' : 'Input Gangguan Pangkal Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              {/* Nama GI, Nama Penyulang & Status Penyulang */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Nama Gardu Induk (GI) *</label>
                  <input
                    type="text"
                    list="gi-options"
                    required
                    placeholder="Contoh: GI PASSO"
                    value={formData.namaGI}
                    onChange={e => setFormData({ ...formData, namaGI: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-bold uppercase ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <datalist id="gi-options">
                    {availableGIs.map(gi => (
                      <option key={gi} value={gi} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-400">Nama Penyulang *</label>
                  <input
                    type="text"
                    list="penyulang-options"
                    required
                    placeholder="Contoh: LATERI 1"
                    value={formData.namaPenyulang}
                    onChange={e => setFormData({ ...formData, namaPenyulang: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-bold uppercase ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <datalist id="penyulang-options">
                    {penyulangList.map(p => (
                      <option key={p.id} value={p.nama} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-400">Status Penyulang *</label>
                  <select
                    value={formData.statusPenyulang}
                    onChange={e => setFormData({ ...formData, statusPenyulang: e.target.value as 'Utama' | 'Percabangan' })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Utama">Utama</option>
                    <option value="Percabangan">Percabangan</option>
                  </select>
                </div>
              </div>

              {/* Bulan, Tahun & Jumlah Gangguan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Bulan Periode</label>
                  <select
                    value={formData.bulanKe}
                    onChange={e => setFormData({ ...formData, bulanKe: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    {BULAN_NAMES.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-400">Tahun</label>
                  <input
                    type="number"
                    value={formData.tahun}
                    onChange={e => setFormData({ ...formData, tahun: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-400">Jumlah Gangguan / Bln *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.jumlahGangguan}
                    onChange={e => setFormData({ ...formData, jumlahGangguan: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-black text-rose-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                </div>
              </div>

              {/* Kode Penyebab */}
              <div>
                <label className="block font-bold mb-1 text-slate-400">Kode Penyebab Gangguan *</label>
                <select
                  value={formData.kodePenyebab}
                  onChange={e => setFormData({ ...formData, kodePenyebab: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                >
                  {KODE_PENYEBAB_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.code}>
                      {opt.code} — {opt.name} ({opt.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Keterangan Detail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-400">Tanggal Kejadian Utama</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-400">Deskripsi / Detail Penyebab</label>
                  <input
                    type="text"
                    placeholder="Misal: Pohon tumbang dekat lokasi gawang 12"
                    value={formData.keteranganPenyebab}
                    onChange={e => setFormData({ ...formData, keteranganPenyebab: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold rounded-xl bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                >
                  Simpan Data Gangguan Pangkal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
