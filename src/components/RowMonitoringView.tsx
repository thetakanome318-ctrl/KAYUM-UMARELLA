import React, { useState, useMemo } from 'react';
import { ROWRecord, Penyulang } from '../types';
import { formatBulan, formatNumber } from '../utils/calculations';
import { 
  TreePine, 
  FileText, 
  FileSpreadsheet, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  Ruler, 
  Calendar,
  Layers,
  ChevronDown,
  PowerOff,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RowMonitoringViewProps {
  records: ROWRecord[];
  isLight: boolean;
  penyulangList?: Penyulang[];
}

export const RowMonitoringView: React.FC<RowMonitoringViewProps> = ({ 
  records, 
  isLight,
  penyulangList = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPenyulang, setSelectedPenyulang] = useState<string>('ALL');
  const [selectedBulan, setSelectedBulan] = useState<string>('ALL');

  // Filter only ROW records (no disturbances, no Gardu, no Tier 1 or Tier 2 inspections)
  const rowRecords = useMemo(() => {
    return records.filter(r => {
      const isRow = !r.gangguan && r.inspectionType !== 'Gardu' && r.inspectionType !== 'Tier 1' && r.inspectionType !== 'Tier 2';
      if (!isRow) return false;

      if (selectedPenyulang !== 'ALL' && r.penyulang !== selectedPenyulang) return false;
      if (selectedBulan !== 'ALL' && r.bulan !== selectedBulan) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchPenyulang = (r.penyulang || '').toLowerCase().includes(q);
        const matchSection = (r.section || '').toLowerCase().includes(q);
        const matchCatatan = (r.catatan || '').toLowerCase().includes(q);
        if (!matchPenyulang && !matchSection && !matchCatatan) return false;
      }
      return true;
    });
  }, [records, selectedPenyulang, selectedBulan, searchQuery]);

  // Derived list of unique months for the dropdown filter
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    records.forEach(r => {
      const isRow = !r.gangguan && r.inspectionType !== 'Gardu' && r.inspectionType !== 'Tier 1' && r.inspectionType !== 'Tier 2';
      if (isRow && r.bulan) {
        months.add(r.bulan);
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)
  }, [records]);

  // Calculate detailed stats for the filtered records
  const stats = useMemo(() => {
    let totalTargetKms = 0;
    let totalRealisasiKms = 0;
    let totalRealisasiGawang = 0;
    
    let totalTemuan = 0;
    let totalRealisasiTemuan = 0;
    
    let totalLuarTemuan = 0;
    let totalRealisasiLuarTemuan = 0;

    let totalPerluPadam = 0;
    let totalTidakAdaIzin = 0;
    let totalPohonBesar = 0;

    rowRecords.forEach(r => {
      totalTargetKms += Number(r.targetKms) || 0;
      totalRealisasiKms += Number(r.realisasiKms) || 0;
      totalRealisasiGawang += Number(r.realisasiGawang) || 0;
      
      totalTemuan += Number(r.jumlahTemuan) || 0;
      totalRealisasiTemuan += Number(r.realisasiTemuan) || 0;
      
      totalLuarTemuan += Number(r.luarTemuan) || 0;
      totalRealisasiLuarTemuan += Number(r.realisasiLuarTemuan) || 0;

      totalPerluPadam += r.jumlahPerluPadam !== undefined ? r.jumlahPerluPadam : (r.perluPadam ? 1 : 0);
      totalTidakAdaIzin += r.jumlahTidakAdaIzin !== undefined ? r.jumlahTidakAdaIzin : (r.tidakAdaIzin ? 1 : 0);
      totalPohonBesar += r.jumlahPohonBesar !== undefined ? r.jumlahPohonBesar : (r.pohonBesar ? 1 : 0);
    });

    const progressKms = totalTargetKms > 0 ? (totalRealisasiKms / totalTargetKms) * 100 : 0;
    const progressTemuan = totalTemuan > 0 ? (totalRealisasiTemuan / totalTemuan) * 100 : 0;
    const progressLuarTemuan = totalLuarTemuan > 0 ? (totalRealisasiLuarTemuan / totalLuarTemuan) * 100 : 0;

    return {
      totalTargetKms,
      totalRealisasiKms,
      progressKms,
      totalRealisasiGawang,
      totalTemuan,
      totalRealisasiTemuan,
      progressTemuan,
      totalLuarTemuan,
      totalRealisasiLuarTemuan,
      progressLuarTemuan,
      totalPerluPadam,
      totalTidakAdaIzin,
      totalPohonBesar,
      count: rowRecords.length
    };
  }, [rowRecords]);

  const handleExportCsv = () => {
    const DELIM = ';';
    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };
    const lines = [
      'sep=;',
      `"LAPORAN MONITORING REALISASI ROW POHON JARINGAN ULP BAGUALA"`,
      `"Dicetak pada: ${new Date().toLocaleString('id-ID')}"`,
      `"Total Data: ${rowRecords.length}"`,
      `""`,
      `"No"${DELIM}"Bulan"${DELIM}"Penyulang"${DELIM}"Section / Lokasi"${DELIM}"Target KMS"${DELIM}"Realisasi KMS"${DELIM}"Realisasi Gawang"${DELIM}"Temuan Pohon"${DELIM}"Realisasi Pangkas"${DELIM}"Pohon Luar Target"${DELIM}"Realisasi Luar Target"${DELIM}"Perlu Padam"${DELIM}"Belum Izin"${DELIM}"Pohon Besar"${DELIM}"Tanggal Eksekusi"${DELIM}"Catatan"`,
      ...rowRecords.map((r, i) => [
        escapeCsv(i + 1),
        escapeCsv(r.bulan),
        escapeCsv(r.penyulang || '-'),
        escapeCsv(r.section),
        escapeCsv(r.targetKms || 0),
        escapeCsv(r.realisasiKms || 0),
        escapeCsv(r.realisasiGawang || 0),
        escapeCsv(r.jumlahTemuan || 0),
        escapeCsv(r.realisasiTemuan || 0),
        escapeCsv(r.luarTemuan || 0),
        escapeCsv(r.realisasiLuarTemuan || 0),
        escapeCsv(r.jumlahPerluPadam !== undefined ? r.jumlahPerluPadam : (r.perluPadam ? 'Y' : 'N')),
        escapeCsv(r.jumlahTidakAdaIzin !== undefined ? r.jumlahTidakAdaIzin : (r.tidakAdaIzin ? 'Y' : 'N')),
        escapeCsv(r.jumlahPohonBesar !== undefined ? r.jumlahPohonBesar : (r.pohonBesar ? 'Y' : 'N')),
        escapeCsv(r.tanggal || '-'),
        escapeCsv(r.catatan || '-')
      ].join(DELIM))
    ];
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Monitoring_Realisasi_ROW_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Elegant emerald banner for heading
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 297, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PLN (PERSERO) — LAPORAN HASIL MONITORING ROW POHON JARINGAN', 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ulp Baguala — Dicetak: ${new Date().toLocaleString('id-ID')} | Total Filtered Record: ${rowRecords.length}`, 14, 19);

    const tableRows = rowRecords.map((r, index) => [
      index + 1,
      formatBulan(r.bulan),
      r.penyulang || '-',
      r.section || '-',
      `${r.targetKms || 0} KMS`,
      `${r.realisasiKms || 0} KMS`,
      `${r.realisasiGawang || 0} Gawang`,
      `${r.jumlahTemuan || 0} Pohon`,
      `${r.realisasiTemuan || 0} Pohon`,
      `${r.luarTemuan || 0} Pohon`,
      `${r.realisasiLuarTemuan || 0} Pohon`,
      r.tanggal || '-',
      r.catatan || '-'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [[
        'No', 'Bulan', 'Penyulang', 'Section / Lokasi', 'Target KMS', 'Realisasi KMS', 
        'Gawang', 'Temuan Rutin', 'Pangkas Rutin', 'Pohon Luar Target', 'Pangkas Luar Target', 'Tanggal', 'Catatan'
      ]],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 2 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Laporan Realisasi Right of Way (ROW) Pemangkasan Pohon Jaringan ULP Baguala.', 14, finalY);

    doc.save(`Monitoring_Hasil_ROW_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title block with action buttons */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-500 border border-emerald-500/30 animate-pulse">
            <TreePine className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Monitoring Hasil & Realisasi ROW</h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Rekapitulasi target bulanan, realisasi pangkasan gawang, serta pemeliharaan ruang bebas (ROW) pohon
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (CSV)</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-4 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 flex items-center space-x-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: KMS Progress */}
        <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress KMS</span>
            <Ruler className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black font-mono tracking-tight">{formatNumber(stats.totalRealisasiKms, 2)} <span className="text-xs text-slate-500 font-semibold">/ {formatNumber(stats.totalTargetKms, 2)} KMS</span></p>
          <div className="mt-3">
            <div className="flex justify-between items-center text-[10px] font-bold mb-1">
              <span className="text-slate-400">PENCAPAIAN TARGET</span>
              <span className="text-emerald-500">{stats.progressKms.toFixed(1)}%</span>
            </div>
            <div className={`w-full rounded-full h-2 overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
              <div 
                className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(stats.progressKms, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Realisasi Gawang */}
        <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Realisasi Gawang</span>
            <Layers className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-black mt-3 font-mono tracking-tight">{stats.totalRealisasiGawang} <span className="text-xs text-slate-500 font-semibold">Gawang (Span)</span></p>
          <p className="text-[11px] text-indigo-500 font-semibold mt-2.5">Terselesaikan pangkas pohon</p>
        </div>

        {/* Card 3: Temuan Rutin */}
        <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pohon Rutin (Temuan)</span>
            <TreePine className="w-5 h-5 text-cyan-500" />
          </div>
          <p className="text-2xl font-black font-mono tracking-tight">{stats.totalRealisasiTemuan} <span className="text-xs text-slate-500 font-semibold">/ {stats.totalTemuan} Pohon</span></p>
          <div className="mt-3">
            <div className="flex justify-between items-center text-[10px] font-bold mb-1">
              <span className="text-slate-400">RASIO EKSEKUSI</span>
              <span className="text-cyan-500">{stats.progressTemuan.toFixed(1)}%</span>
            </div>
            <div className={`w-full rounded-full h-2 overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
              <div 
                className="h-full rounded-full bg-cyan-500 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(stats.progressTemuan, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Luar Temuan */}
        <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pohon Luar Target</span>
            <CheckCircle2 className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-black font-mono tracking-tight">{stats.totalRealisasiLuarTemuan} <span className="text-xs text-slate-500 font-semibold">/ {stats.totalLuarTemuan} Pohon</span></p>
          <div className="mt-3">
            <div className="flex justify-between items-center text-[10px] font-bold mb-1">
              <span className="text-slate-400">RASIO EKSEKUSI LUAR</span>
              <span className="text-purple-500">{stats.progressLuarTemuan.toFixed(1)}%</span>
            </div>
            <div className={`w-full rounded-full h-2 overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
              <div 
                className="h-full rounded-full bg-purple-500 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(stats.progressLuarTemuan, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mini Badges Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`px-5 py-4 rounded-xl border flex items-center space-x-3.5 ${
          isLight ? 'bg-amber-500/5 border-amber-200/60' : 'bg-amber-500/10 border-amber-500/20'
        }`}>
          <PowerOff className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pohon Perlu Padam</p>
            <p className="text-lg font-black font-mono text-amber-500">{stats.totalPerluPadam} <span className="text-xs text-slate-500 font-semibold">Titik</span></p>
          </div>
        </div>

        <div className={`px-5 py-4 rounded-xl border flex items-center space-x-3.5 ${
          isLight ? 'bg-rose-500/5 border-rose-200/60' : 'bg-rose-500/10 border-rose-500/20'
        }`}>
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pohon Belum Izin (Sosialisasi)</p>
            <p className="text-lg font-black font-mono text-rose-500">{stats.totalTidakAdaIzin} <span className="text-xs text-slate-500 font-semibold">Titik</span></p>
          </div>
        </div>

        <div className={`px-5 py-4 rounded-xl border flex items-center space-x-3.5 ${
          isLight ? 'bg-teal-500/5 border-teal-200/60' : 'bg-teal-500/10 border-teal-500/20'
        }`}>
          <Compass className="w-5 h-5 text-teal-500 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kategori Pohon Besar</p>
            <p className="text-lg font-black font-mono text-teal-500">{stats.totalPohonBesar} <span className="text-xs text-slate-500 font-semibold">Titik</span></p>
          </div>
        </div>
      </div>

      {/* Filter and Searching Header */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center gap-4 justify-between ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800 shadow-xl'
      }`}>
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari penyulang, section, catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch">
          {/* Penyulang Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedPenyulang}
              onChange={(e) => setSelectedPenyulang(e.target.value)}
              className={`w-full sm:w-48 pl-3 pr-8 py-2 rounded-xl text-xs border appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="ALL">Semua Penyulang</option>
              {penyulangList.map(p => (
                <option key={p.id} value={p.nama}>{p.nama}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Bulan Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className={`w-full sm:w-48 pl-3 pr-8 py-2 rounded-xl text-xs border appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="ALL">Semua Bulan / Periode</option>
              {uniqueMonths.map(m => (
                <option key={m} value={m}>{formatBulan(m)}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xl ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-bold uppercase tracking-wider ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-950/80 text-slate-300 border-slate-800'
            }`}>
              <tr>
                <th className="py-3 px-4">Bulan / Periode</th>
                <th className="py-3 px-4">Penyulang</th>
                <th className="py-3 px-4">Section / Lokasi</th>
                <th className="py-3 px-4 text-center">Target (KMS)</th>
                <th className="py-3 px-4 text-center">Realisasi (KMS)</th>
                <th className="py-3 px-4 text-center">Realisasi Gawang</th>
                <th className="py-3 px-4 text-center">Temuan Rutin</th>
                <th className="py-3 px-4 text-center">Realisasi Pangkas</th>
                <th className="py-3 px-4 text-center">Luar Target</th>
                <th className="py-3 px-4 text-center">Realisasi Luar</th>
                <th className="py-3 px-4 text-center">Flags</th>
                <th className="py-3 px-4">Tanggal Eksekusi</th>
                <th className="py-3 px-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/10">
              {rowRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    Tidak ada data hasil monitoring ROW yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                rowRecords.map((r) => {
                  const hasPadam = r.jumlahPerluPadam !== undefined ? r.jumlahPerluPadam > 0 : r.perluPadam;
                  const hasNoIzin = r.jumlahTidakAdaIzin !== undefined ? r.jumlahTidakAdaIzin > 0 : r.tidakAdaIzin;
                  const hasPohonBesar = r.jumlahPohonBesar !== undefined ? r.jumlahPohonBesar > 0 : r.pohonBesar;

                  return (
                    <tr key={r.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-800/40'}`}>
                      <td className="py-3 px-4 font-bold">{formatBulan(r.bulan)}</td>
                      <td className="py-3 px-4 font-semibold">{r.penyulang || '-'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-500">{r.section}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {r.targetKms || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-500">
                        {r.realisasiKms || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {r.realisasiGawang || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {r.jumlahTemuan || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-500 font-bold">
                        {r.realisasiTemuan || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {r.luarTemuan || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-purple-400 font-bold">
                        {r.realisasiLuarTemuan || 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {hasPadam && (
                            <span className="p-1 rounded bg-amber-500/10 text-amber-500" title="Perlu Padam Aliran Listrik">
                              <PowerOff className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {hasNoIzin && (
                            <span className="p-1 rounded bg-rose-500/10 text-rose-500" title="Belum Ada Izin Pemilik Pohon">
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {hasPohonBesar && (
                            <span className="p-1 rounded bg-teal-500/10 text-teal-500" title="Kategori Pohon Besar">
                              <TreePine className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">{r.tanggal || '-'}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={r.catatan}>{r.catatan || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
