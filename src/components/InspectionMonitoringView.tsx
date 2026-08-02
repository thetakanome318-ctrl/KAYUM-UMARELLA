import React, { useState, useMemo } from 'react';
import { ROWRecord } from '../types';
import { formatBulan, formatNumber } from '../utils/calculations';
import { ClipboardCheck, FileText, FileSpreadsheet, Search, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InspectionMonitoringViewProps {
  records: ROWRecord[];
  isLight: boolean;
}

export const InspectionMonitoringView: React.FC<InspectionMonitoringViewProps> = ({ records, isLight }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'Tier 1' | 'Tier 2'>('ALL');

  // Filter only inspection records
  const inspectionRecords = useMemo(() => {
    return records.filter(r => {
      const isIns = r.inspectionType === 'Tier 1' || r.inspectionType === 'Tier 2';
      if (!isIns) return false;
      if (filterType !== 'ALL' && r.inspectionType !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchPenyulang = (r.penyulang || '').toLowerCase().includes(q);
        const matchSection = (r.section || '').toLowerCase().includes(q);
        const matchCatatan = (r.catatan || '').toLowerCase().includes(q);
        if (!matchPenyulang && !matchSection && !matchCatatan) return false;
      }
      return true;
    });
  }, [records, filterType, searchQuery]);

  const stats = useMemo(() => {
    let totalTier1 = 0;
    let totalTier2 = 0;
    let totalKonstruksi = 0;
    let totalTemuanPohon = 0;

    inspectionRecords.forEach(r => {
      if (r.inspectionType === 'Tier 1') totalTier1++;
      if (r.inspectionType === 'Tier 2') totalTier2++;
      totalKonstruksi += Number(r.temuanKonstruksi) || 0;
      totalTemuanPohon += Number(r.jumlahTemuan) || 0;
    });

    return {
      total: inspectionRecords.length,
      totalTier1,
      totalTier2,
      totalKonstruksi,
      totalTemuanPohon
    };
  }, [inspectionRecords]);

  const handleExportCsv = () => {
    const DELIM = ';';
    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };
    const lines = [
      'sep=;',
      `"MONITORING HASIL INSPEKSI JARINGAN ULP BAGUALA"`,
      `"ID"${DELIM}""Bulan"${DELIM}"Tipe Inspeksi"${DELIM}"Penyulang"${DELIM}"Section"${DELIM}"Temuan Konstruksi"${DELIM}"Temuan Pohon"${DELIM}"Tanggal"${DELIM}"Catatan"`,
      ...inspectionRecords.map(r => [
        escapeCsv(r.id),
        escapeCsv(r.bulan),
        escapeCsv(r.inspectionType || 'Tier 1'),
        escapeCsv(r.penyulang || '-'),
        escapeCsv(r.section),
        escapeCsv(r.temuanKonstruksi || 0),
        escapeCsv(r.jumlahTemuan || 0),
        escapeCsv(r.tanggal || '-'),
        escapeCsv(r.catatan || '-')
      ].join(DELIM))
    ];
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Monitoring_Inspeksi_${new Date().toISOString().slice(0, 10)}.csv`);
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

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 297, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PLN (PERSERO) — LAPORAN MONITORING HASIL INSPEKSI JARINGAN', 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ulp Baguala — Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total Record: ${inspectionRecords.length}`, 14, 19);

    const tableRows = inspectionRecords.map((r, index) => [
      index + 1,
      r.bulan || '-',
      r.inspectionType || 'Tier 1',
      r.penyulang || '-',
      r.section || '-',
      `${r.temuanKonstruksi || 0} temuan`,
      `${r.jumlahTemuan || 0} pohon`,
      r.tanggal || '-',
      r.catatan || '-'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['No', 'Bulan', 'Tipe', 'Penyulang', 'Section / Lokasi', 'Temuan Konstruksi', 'Temuan Pohon', 'Tanggal', 'Catatan']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Dokumen ini dihasilkan secara otomatis oleh sistem Perang Padam Baguala.', 14, finalY);

    doc.save(`Monitoring_Hasil_Inspeksi_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Export Actions */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-500 border border-emerald-500/30">
            <ClipboardCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Monitoring Hasil Inspeksi</h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Evaluasi komprehensif temuan inspeksi jaringan Tier 1 & Tier 2 ULP Baguala
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Excel (CSV)</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Inspeksi</span>
            <ClipboardCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{stats.total}</p>
          <p className="text-[11px] text-emerald-500 font-semibold mt-1">Terverifikasi sistem</p>
        </div>

        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inspeksi Tier 1</span>
            <ShieldCheck className="w-5 h-5 text-cyan-500" />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{stats.totalTier1}</p>
          <p className="text-[11px] text-cyan-500 font-semibold mt-1">Jaringan Utama</p>
        </div>

        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temuan Konstruksi</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{stats.totalKonstruksi}</p>
          <p className="text-[11px] text-amber-500 font-semibold mt-1">Titik Perlu Perbaikan</p>
        </div>

        <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temuan Pohon</span>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{stats.totalTemuanPohon}</p>
          <p className="text-[11px] text-purple-500 font-semibold mt-1">Potensi Gangguan ROW</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="relative w-full sm:w-80">
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

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {(['ALL', 'Tier 1', 'Tier 2'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === t 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : isLight 
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t === 'ALL' ? 'Semua Tipe' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Inspection Data Table */}
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
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Penyulang</th>
                <th className="py-3 px-4">Section / Lokasi</th>
                <th className="py-3 px-4 text-center">Temuan Konstruksi</th>
                <th className="py-3 px-4 text-center">Temuan Pohon</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {inspectionRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data monitoring hasil inspeksi yang sesuai.
                  </td>
                </tr>
              ) : (
                inspectionRecords.map((r) => (
                  <tr key={r.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                    <td className="py-3 px-4 font-bold">{formatBulan(r.bulan)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.inspectionType === 'Tier 1' 
                          ? 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/30' 
                          : 'bg-purple-500/15 text-purple-500 border border-purple-500/30'
                      }`}>
                        {r.inspectionType || 'Tier 1'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">{r.penyulang || '-'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-500">{r.section}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-500">
                        {r.temuanKonstruksi || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-500">
                        {r.jumlahTemuan || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{r.tanggal || '-'}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{r.catatan || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
