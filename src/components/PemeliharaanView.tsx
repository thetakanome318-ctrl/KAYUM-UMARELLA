import React, { useState, useMemo } from 'react';
import { PemeliharaanRecord, Penyulang, MasterSection } from '../types';
import { 
  Wrench, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  ChevronDown,
  Filter,
  Tag
} from 'lucide-react';
import { PemeliharaanFormModal } from './PemeliharaanFormModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PemeliharaanViewProps {
  records: PemeliharaanRecord[];
  isLight: boolean;
  onSaveRecord: (record: PemeliharaanRecord) => void;
  onDeleteRecord: (id: string) => void;
  penyulangList: Penyulang[];
  sectionList: MasterSection[];
  isReadOnly?: boolean;
}

export const PemeliharaanView: React.FC<PemeliharaanViewProps> = ({
  records,
  isLight,
  onSaveRecord,
  onDeleteRecord,
  penyulangList,
  sectionList,
  isReadOnly = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');
  const [selectedPenyulang, setSelectedPenyulang] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PemeliharaanRecord | null>(null);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
        if (selectedJenis !== 'ALL' && r.jenisPemeliharaan !== selectedJenis) return false;
        if (selectedPenyulang !== 'ALL' && r.penyulang !== selectedPenyulang) return false;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchPenyulang = (r.penyulang || '').toLowerCase().includes(q);
          const matchSection = (r.section || '').toLowerCase().includes(q);
          const matchPeralatan = (r.peralatan || '').toLowerCase().includes(q);
          const matchPelaksana = (r.pelaksana || '').toLowerCase().includes(q);
          const matchKeterangan = (r.keterangan || '').toLowerCase().includes(q);
          if (!matchPenyulang && !matchSection && !matchPeralatan && !matchPelaksana && !matchKeterangan) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [records, selectedStatus, selectedJenis, selectedPenyulang, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    let total = records.length;
    let selesai = 0;
    let dalamProses = 0;
    let perluFollowUp = 0;

    records.forEach((r) => {
      if (r.status === 'Selesai') selesai++;
      else if (r.status === 'Dalam Proses') dalamProses++;
      else if (r.status === 'Perlu Follow Up') perluFollowUp++;
    });

    return { total, selesai, dalamProses, perluFollowUp };
  }, [records]);

  const handleExportCsv = () => {
    const DELIM = ';';
    const escapeCsv = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;

    const lines = [
      'sep=;',
      `"LAPORAN MONITORING PEMELIHARAAN JARINGAN DISTRIBUSI ULP BAGUALA"`,
      `"Tanggal Cetak"${DELIM}"${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}"`,
      `"Total Records"${DELIM}"${filteredRecords.length}"`,
      '""',
      [
        'No', 'Tanggal', 'Penyulang', 'Section / Lokasi', 'Jenis Pemeliharaan', 
        'Peralatan/Komponen', 'Pelaksana/Petugas', 'Status', 'Catatan/Keterangan'
      ].map(escapeCsv).join(DELIM),
      ...filteredRecords.map((r, i) => [
        i + 1,
        r.tanggal,
        r.penyulang,
        r.section || '-',
        r.jenisPemeliharaan,
        r.peralatan || '-',
        r.pelaksana || '-',
        r.status,
        r.keterangan || '-'
      ].map(escapeCsv).join(DELIM))
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Monitoring_Pemeliharaan_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    doc.text('PLN (PERSERO) — LAPORAN MONITORING PEMELIHARAAN JARINGAN', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`ULP Baguala — Tanggal: ${new Date().toLocaleDateString('id-ID')} | Total Filtered: ${filteredRecords.length} records`, 14, 20);

    const tableRows = filteredRecords.map((r, idx) => [
      idx + 1,
      r.tanggal,
      r.penyulang,
      r.section || '-',
      r.jenisPemeliharaan,
      r.peralatan || '-',
      r.pelaksana || '-',
      r.status,
      r.keterangan || '-'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['No', 'Tanggal', 'Penyulang', 'Section', 'Jenis Pemeliharaan', 'Peralatan', 'Petugas', 'Status', 'Catatan']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    doc.save(`Laporan_Pemeliharaan_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Action Header */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-500 border border-emerald-500/30">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Monitoring & Input Pemeliharaan</h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Manajemen jadwal, eksekusi pemeliharaan rutin/korektif, dan perbaikan komponen jaringan
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-4 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 flex items-center space-x-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Laporan</span>
          </button>
          {!isReadOnly && (
            <button
              onClick={() => {
                setEditingRecord(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center space-x-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Input Pemeliharaan</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pemeliharaan</span>
            <Wrench className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-black font-mono tracking-tight">{stats.total} <span className="text-xs text-slate-500 font-semibold">Kegiatan</span></p>
        </div>

        <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selesai</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black font-mono tracking-tight text-emerald-500">{stats.selesai} <span className="text-xs text-slate-500 font-semibold">Lokasi</span></p>
        </div>

        <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dalam Proses</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono tracking-tight text-amber-500">{stats.dalamProses} <span className="text-xs text-slate-500 font-semibold">Progres</span></p>
        </div>

        <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perlu Follow Up</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-black font-mono tracking-tight text-rose-500">{stats.perluFollowUp} <span className="text-xs text-slate-500 font-semibold">Tindak Lanjut</span></p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center gap-4 justify-between ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari penyulang, section, peralatan, petugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch">
          {/* Penyulang Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedPenyulang}
              onChange={(e) => setSelectedPenyulang(e.target.value)}
              className={`w-full sm:w-44 pl-3 pr-8 py-2 rounded-xl text-xs border appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="ALL">Semua Penyulang</option>
              {penyulangList.map((p) => (
                <option key={p.id} value={p.nama}>{p.nama}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Jenis Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className={`w-full sm:w-44 pl-3 pr-8 py-2 rounded-xl text-xs border appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="ALL">Semua Jenis</option>
              <option value="Pemeliharaan Rutin">Pemeliharaan Rutin</option>
              <option value="Pemeliharaan Korektif">Pemeliharaan Korektif</option>
              <option value="Pemeliharaan Preventive">Pemeliharaan Preventive</option>
              <option value="Rabas Pohon">Rabas Pohon</option>
              <option value="Penggantian Komponen">Penggantian Komponen</option>
              <option value="Overhaul">Overhaul</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full sm:w-40 pl-3 pr-8 py-2 rounded-xl text-xs border appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="ALL">Semua Status</option>
              <option value="Selesai">Selesai</option>
              <option value="Dalam Proses">Dalam Proses</option>
              <option value="Perlu Follow Up">Perlu Follow Up</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xl ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-bold uppercase tracking-wider ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-950/80 text-slate-300 border-slate-800'
            }`}>
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Penyulang</th>
                <th className="py-3 px-4">Section / Lokasi</th>
                <th className="py-3 px-4">Jenis Pemeliharaan</th>
                <th className="py-3 px-4">Peralatan</th>
                <th className="py-3 px-4">Petugas / Pelaksana</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Keterangan</th>
                {!isReadOnly && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/10">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                    Belum ada data pemeliharaan tercatat. Silakan klik "Input Pemeliharaan" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  let statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                      {r.status}
                    </span>
                  );
                  if (r.status === 'Selesai') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ✓ Selesai
                      </span>
                    );
                  } else if (r.status === 'Dalam Proses') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        ⏳ Dalam Proses
                      </span>
                    );
                  } else if (r.status === 'Perlu Follow Up') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        ⚠ Follow Up
                      </span>
                    );
                  }

                  return (
                    <tr key={r.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-800/40'}`}>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">{r.tanggal}</td>
                      <td className="py-3 px-4 font-bold text-emerald-500">{r.penyulang}</td>
                      <td className="py-3 px-4 font-semibold">{r.section || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium">
                          {r.jenisPemeliharaan}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{r.peralatan || '-'}</td>
                      <td className="py-3 px-4 text-slate-300">{r.pelaksana || '-'}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">{statusBadge}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={r.keterangan}>
                        {r.keterangan || '-'}
                      </td>
                      {!isReadOnly && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => {
                                setEditingRecord(r);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Apakah Anda yakin ingin menghapus record pemeliharaan ini?')) {
                                  onDeleteRecord(r.id);
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
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

      {/* Pemeliharaan Form Modal */}
      <PemeliharaanFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={onSaveRecord}
        initialData={editingRecord}
        penyulangList={penyulangList}
        sectionList={sectionList}
      />
    </div>
  );
};
