import React, { useState, useEffect, useMemo } from 'react';
import { Penyulang, MasterSection, ActivityLog } from '../types';
import { 
  subscribePenyulang, 
  savePenyulangToCloud, 
  deletePenyulangFromCloud,
  subscribeMasterSection,
  saveMasterSectionToCloud,
  deleteMasterSectionFromCloud,
  subscribeActivityLogs,
  logActivityToCloud,
  deleteActivityLogFromCloud
} from '../lib/firebase';
import { Plus, Trash2, Save, Search, Database, Layers, Edit, Users, FileText, FileSpreadsheet, History, Clock, Tag } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface MasterDataViewProps {
  isLight: boolean;
  isReadOnly?: boolean;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ isLight, isReadOnly }) => {
  const [activeSubTab, setActiveSubTab] = useState<'penyulang' | 'section' | 'logs'>('penyulang');
  
  // Activity Logs State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [searchQueryLog, setSearchQueryLog] = useState('');
  const [filterLogAction, setFilterLogAction] = useState<string>('ALL');
  const [filterLogTarget, setFilterLogTarget] = useState<string>('ALL');
  
  // Penyulang State
  const [penyulangList, setPenyulangList] = useState<Penyulang[]>([]);
  const [searchQueryPenyulang, setSearchQueryPenyulang] = useState('');
  const [isAddingPenyulang, setIsAddingPenyulang] = useState(false);
  const [editingPenyulang, setEditingPenyulang] = useState<Penyulang | null>(null);
  const [newPenyulang, setNewPenyulang] = useState<{
    nama: string;
    kode: string;
    panjangJaringan: number;
    statusPenyulang: 'Utama' | 'Percabangan';
    namaGI: string;
  }>({
    nama: '',
    kode: '',
    panjangJaringan: 0,
    statusPenyulang: 'Utama',
    namaGI: 'GI PASSO',
  });

  // Master Section State
  const [sectionList, setSectionList] = useState<MasterSection[]>([]);
  const [searchQuerySection, setSearchQuerySection] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [editingSection, setEditingSection] = useState<MasterSection | null>(null);
  const [selectedFeederForModal, setSelectedFeederForModal] = useState<string | null>(null);
  const [newSection, setNewSection] = useState<{
    namaSection: string;
    penyulang: string;
    jumlahPelanggan: number;
    sistemOperasi: 'Loop' | 'Radial';
    keterangan: string;
  }>({
    namaSection: '',
    penyulang: '',
    jumlahPelanggan: 0,
    sistemOperasi: 'Radial',
    keterangan: ''
  });

  const handleExportPenyulangCsv = () => {
    const DELIM = ';';
    const lines = [
      'sep=;',
      `"MASTER DATA PENYULANG ULP BAGUALA"`,
      `"Nama GI"${DELIM}"Nama Penyulang"${DELIM}"Status Penyulang"${DELIM}"Kode / ID"${DELIM}"Panjang Jaringan (KMS)"`,
      ...filteredPenyulang.map(p => `"${p.namaGI || 'GI PASSO'}";"${p.nama}";"${p.statusPenyulang || 'Utama'}";"${p.kode || '-'}";"${p.panjangJaringan || 0}"`)
    ];
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Master_Penyulang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPenyulangPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PLN (PERSERO) — MASTER DATA PENYULANG ULP BAGUALA', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')} | Total: ${filteredPenyulang.length} Penyulang`, 14, 18);

    const rows = filteredPenyulang.map((p, idx) => [
      idx + 1, 
      p.namaGI || 'GI PASSO',
      p.nama, 
      p.statusPenyulang || 'Utama',
      p.kode || '-', 
      `${p.panjangJaringan || 0} KMS`
    ]);
    autoTable(doc, {
      startY: 32,
      head: [['No', 'Nama GI', 'Nama Penyulang', 'Status', 'Kode', 'Panjang Jaringan']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' }
    });
    doc.save(`Master_Penyulang_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportSectionCsv = () => {
    const DELIM = ';';
    const lines = [
      'sep=;',
      `"MASTER DATA SECTION ULP BAGUALA"`,
      `"Nama Section"${DELIM}"Penyulang"${DELIM}"Jumlah Pelanggan"${DELIM}"Sistem Operasi"${DELIM}"Penyulang di-supply"`,
      ...filteredSection.map(s => `"${s.namaSection}";"${s.penyulang || '-'}";"${s.jumlahPelanggan || 0}";"${s.sistemOperasi || 'Radial'}";"${s.keterangan || '-'}"`)
    ];
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Master_Section_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSectionPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PLN (PERSERO) — MASTER DATA SECTION ULP BAGUALA', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')} | Total: ${filteredSection.length} Section`, 14, 18);

    const rows = filteredSection.map((s, idx) => [idx + 1, s.namaSection, s.penyulang || '-', `${s.jumlahPelanggan || 0} plg`, s.sistemOperasi || 'Radial', s.keterangan || '-']);
    autoTable(doc, {
      startY: 32,
      head: [['No', 'Nama Section', 'Penyulang', 'Pelanggan', 'Sistem Operasi', 'Penyulang di-supply']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' }
    });
    doc.save(`Master_Section_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  useEffect(() => {
    const unsubP = subscribePenyulang(setPenyulangList);
    const unsubS = subscribeMasterSection(setSectionList);
    const unsubL = subscribeActivityLogs(setActivityLogs);
    return () => {
      unsubP();
      unsubS();
      unsubL();
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesSearch = 
        (log.user || '').toLowerCase().includes(searchQueryLog.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(searchQueryLog.toLowerCase()) ||
        (log.targetType || '').toLowerCase().includes(searchQueryLog.toLowerCase());
      
      const matchesAction = filterLogAction === 'ALL' || log.action === filterLogAction;
      const matchesTarget = filterLogTarget === 'ALL' || log.targetType === filterLogTarget;

      return matchesSearch && matchesAction && matchesTarget;
    });
  }, [activityLogs, searchQueryLog, filterLogAction, filterLogTarget]);

  const filteredPenyulang = useMemo(() => {
    return penyulangList.filter(p => 
      (p.nama || '').toLowerCase().includes(searchQueryPenyulang.toLowerCase()) || 
      (p.kode || '').toLowerCase().includes(searchQueryPenyulang.toLowerCase())
    ).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [penyulangList, searchQueryPenyulang]);

  const filteredSection = useMemo(() => {
    return sectionList.filter(s => 
      (s.namaSection || '').toLowerCase().includes(searchQuerySection.toLowerCase()) || 
      (s.penyulang || '').toLowerCase().includes(searchQuerySection.toLowerCase()) ||
      (s.keterangan || '').toLowerCase().includes(searchQuerySection.toLowerCase())
    ).sort((a, b) => (a.namaSection || '').localeCompare(b.namaSection || ''));
  }, [sectionList, searchQuerySection]);

  const handleSavePenyulang = async (data: any) => {
    if (!data.nama) return;
    const id = editingPenyulang ? editingPenyulang.id : crypto.randomUUID();
    await savePenyulangToCloud({
      id,
      ...data,
      createdAt: editingPenyulang ? editingPenyulang.createdAt : new Date().toISOString()
    });
    setNewPenyulang({ nama: '', kode: '', panjangJaringan: 0, statusPenyulang: 'Utama', namaGI: 'GI PASSO' });
    setIsAddingPenyulang(false);
    setEditingPenyulang(null);
  };

  const handleDeletePenyulang = async (id: string) => {
    if (window.confirm('Hapus penyulang ini dari master data?')) {
      await deletePenyulangFromCloud(id);
    }
  };

  const handleSaveSection = async (data: typeof newSection) => {
    if (!data.namaSection) return;
    const id = editingSection ? editingSection.id : crypto.randomUUID();
    await saveMasterSectionToCloud({
      id,
      namaSection: data.namaSection,
      penyulang: data.penyulang,
      jumlahPelanggan: Number(data.jumlahPelanggan) || 0,
      sistemOperasi: data.sistemOperasi || 'Radial',
      keterangan: data.keterangan,
      createdAt: editingSection ? editingSection.createdAt : new Date().toISOString()
    });
    setNewSection({ namaSection: '', penyulang: '', jumlahPelanggan: 0, sistemOperasi: 'Radial', keterangan: '' });
    setIsAddingSection(false);
    setEditingSection(null);
  };

  const handleDeleteSection = async (id: string) => {
    if (window.confirm('Hapus section ini dari master data?')) {
      await deleteMasterSectionFromCloud(id);
    }
  };

  const handleDeleteLog = async (log: ActivityLog) => {
    if (window.confirm('Hapus log aktivitas ini? Data yang terkait dengan log ini (jika ada) juga akan ikut terhapus dari sistem.')) {
      await deleteActivityLogFromCloud(log);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sub-tab Navigation */}
      <div className="flex space-x-3 border-b border-slate-800/60 pb-3">
        <button
          onClick={() => setActiveSubTab('penyulang')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'penyulang'
              ? 'bg-indigo-500 text-slate-950 shadow-lg shadow-indigo-500/20'
              : isLight
                ? 'bg-slate-100 text-slate-600 hover:text-slate-900'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Master Penyulang</span>
        </button>

        <button
          onClick={() => setActiveSubTab('section')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'section'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : isLight
                ? 'bg-slate-100 text-slate-600 hover:text-slate-900'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Master Section ({sectionList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'logs'
              ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20'
              : isLight
                ? 'bg-slate-100 text-slate-600 hover:text-slate-900'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Log Aktivitas ({activityLogs.length})</span>
        </button>
      </div>

      {/* MASTER PENYULANG TAB */}
      {activeSubTab === 'penyulang' && (
        <>
          <div className={`backdrop-blur-md p-6 rounded-2xl border shadow-xl transition-all duration-300 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                  <Database className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Master Data Penyulang</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Daftar penyulang dan informasi panjang jaringan (KMS)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                <label className="px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Import Excel/CSV</span>
                  <input
                    type="file"
                    accept=".csv, .txt, .xlsx, .xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (evt) => {
                        try {
                          const text = evt.target?.result as string;
                          const lines = text.split('\n');
                          let count = 0;
                          for (let i = 2; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (!line) continue;
                            const parts = line.split(';');
                            if (parts.length >= 2) {
                              const namaGI = parts[0]?.replace(/"/g, '').trim() || 'GI PASSO';
                              const nama = parts[1]?.replace(/"/g, '').trim() || '';
                              const statusPenyulang = (parts[2]?.replace(/"/g, '').trim() || 'Utama') as 'Utama' | 'Percabangan';
                              const kode = parts[3]?.replace(/"/g, '').trim() || '';
                              const panjangJaringan = parseFloat(parts[4]?.replace(/"/g, '').trim() || '0') || 0;
                              if (nama) {
                                const newP: Penyulang = {
                                  id: `penyulang-${Date.now()}-${i}`,
                                  nama,
                                  kode,
                                  panjangJaringan,
                                  statusPenyulang,
                                  namaGI
                                };
                                await savePenyulangToCloud(newP);
                                count++;
                              }
                            }
                          }
                          alert(`Berhasil mengimpor ${count} data Penyulang!`);
                        } catch (err) {
                          alert('Gagal mengimpor file Penyulang.');
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
                <button
                  onClick={handleExportPenyulangCsv}
                  className="px-3 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handleExportPenyulangPdf}
                  className="px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                {!isReadOnly && (
                  <button
                    onClick={() => {
                      setEditingPenyulang(null);
                      setNewPenyulang({ nama: '', kode: '', panjangJaringan: 0, statusPenyulang: 'Utama', namaGI: 'GI PASSO' });
                      setIsAddingPenyulang(true);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Penyulang Baru</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="p-4 border-b border-slate-800/50 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau kode..."
                  value={searchQueryPenyulang}
                  onChange={(e) => setSearchQueryPenyulang(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:bg-white text-slate-800' 
                      : 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 focus:bg-slate-800 text-white'
                  }`}
                />
              </div>
              <div className="text-xs font-bold text-slate-500">
                TOTAL: {filteredPenyulang.length} PENYULANG
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={isLight ? 'bg-slate-50 text-slate-500' : 'bg-white/5 text-slate-400'}>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Nama GI</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Nama Penyulang</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Kode / ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Panjang Jaringan</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {filteredPenyulang.map((p) => (
                    <tr key={p.id} className="group hover:bg-indigo-500/5 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-amber-500">
                        {p.namaGI || 'GI PASSO'}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const count = sectionList.filter(s => s.penyulang?.toLowerCase() === p.nama.toLowerCase()).length;
                          return (
                            <button
                              onClick={() => setSelectedFeederForModal(p.nama)}
                              className="group/btn flex items-center space-x-2 text-left hover:underline cursor-pointer"
                              title="Klik untuk melihat daftar section"
                            >
                              <span className="font-extrabold text-sm text-blue-500 group-hover/btn:text-blue-400">
                                {p.nama}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                                {count} Section
                              </span>
                            </button>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          (p.statusPenyulang || 'Utama') === 'Utama'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {p.statusPenyulang || 'Utama'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {p.kode || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-500">
                        {p.panjangJaringan || 0} <span className="text-[10px] text-slate-500 font-normal ml-1">KMS</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {!isReadOnly && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingPenyulang(p);
                                  setNewPenyulang({ 
                                    nama: p.nama, 
                                    kode: p.kode || '', 
                                    panjangJaringan: p.panjangJaringan || 0,
                                    statusPenyulang: p.statusPenyulang || 'Utama',
                                    namaGI: p.namaGI || 'GI PASSO'
                                  });
                                  setIsAddingPenyulang(true);
                                }}
                                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeletePenyulang(p.id)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredPenyulang.length === 0 && (
                <div className="p-12 text-center">
                  <Database className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                  <p className="text-sm text-slate-500 italic">Belum ada data penyulang. Tambahkan data baru untuk memulai.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MASTER SECTION TAB */}
      {activeSubTab === 'section' && (
        <>
          <div className={`backdrop-blur-md p-6 rounded-2xl border shadow-xl transition-all duration-300 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Layers className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Master Data Section</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Daftar section dan jumlah pelanggan per section
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportSectionCsv}
                  className="px-3 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={handleExportSectionPdf}
                  className="px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                {!isReadOnly && (
                  <button
                    onClick={() => {
                      setEditingSection(null);
                      setNewSection({ namaSection: '', penyulang: penyulangList[0]?.nama || '', jumlahPelanggan: 0, sistemOperasi: 'Radial', keterangan: '' });
                      setIsAddingSection(true);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Section Baru</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="p-4 border-b border-slate-800/50 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan section, penyulang, atau penyulang di-supply..."
                  value={searchQuerySection}
                  onChange={(e) => setSearchQuerySection(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:bg-white text-slate-800' 
                      : 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 focus:bg-slate-800 text-white'
                  }`}
                />
              </div>
              <div className="text-xs font-bold text-slate-500">
                TOTAL: {filteredSection.length} SECTION
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={isLight ? 'bg-slate-50 text-slate-500' : 'bg-white/5 text-slate-400'}>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Nama Section</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Penyulang</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Jumlah Pelanggan</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Penyulang di-supply</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {filteredSection.map((s) => (
                    <tr key={s.id} className="group hover:bg-emerald-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm">{s.namaSection}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.penyulang ? (
                          <button
                            onClick={() => setSelectedFeederForModal(s.penyulang || null)}
                            className="px-2.5 py-1 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all cursor-pointer"
                            title={`Lihat semua section pada penyulang ${s.penyulang}`}
                          >
                            {s.penyulang}
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-500">
                        <div className="inline-flex items-center space-x-1 bg-emerald-500/10 px-3 py-1 rounded-full text-emerald-400 border border-emerald-500/20">
                          <Users className="w-3.5 h-3.5" />
                          <span>{(s.jumlahPelanggan || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border shrink-0 ${
                            (s.sistemOperasi || 'Radial') === 'Loop'
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            Sistem: {s.sistemOperasi || 'Radial'}
                          </span>
                          <span className="text-slate-300 font-medium">{s.keterangan || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {!isReadOnly && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingSection(s);
                                  setNewSection({ 
                                    namaSection: s.namaSection, 
                                    penyulang: s.penyulang || '', 
                                    jumlahPelanggan: s.jumlahPelanggan || 0,
                                    sistemOperasi: s.sistemOperasi || 'Radial',
                                    keterangan: s.keterangan || ''
                                  });
                                  setIsAddingSection(true);
                                }}
                                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSection(s.id)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredSection.length === 0 && (
                <div className="p-12 text-center">
                  <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                  <p className="text-sm text-slate-500 italic">Belum ada data section. Tambahkan section baru untuk memulai.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* LOG AKTIVITAS TAB */}
      {activeSubTab === 'logs' && (
        <>
          <div className={`backdrop-blur-md p-6 rounded-2xl border shadow-xl transition-all duration-300 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <History className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Log Aktivitas & Audit Trail</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Riwayat perubahan data (siapa yang mengedit/menambah dan kapan) pada setiap record
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500">Aksi:</span>
                  <select
                    value={filterLogAction}
                    onChange={(e) => setFilterLogAction(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="ALL">Semua Aksi</option>
                    <option value="TAMBAH">TAMBAH</option>
                    <option value="EDIT">EDIT</option>
                    <option value="HAPUS">HAPUS</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500">Modul:</span>
                  <select
                    value={filterLogTarget}
                    onChange={(e) => setFilterLogTarget(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="ALL">Semua Modul</option>
                    <option value="Gangguan">Gangguan</option>
                    <option value="Pemeliharaan">Pemeliharaan</option>
                    <option value="ROW">ROW</option>
                    <option value="Inspeksi">Inspeksi</option>
                    <option value="Gangguan Pangkal">Gangguan Pangkal</option>
                    <option value="Penyulang">Penyulang</option>
                    <option value="Section">Section</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="p-4 border-b border-slate-800/50 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan pengguna, rincian, atau target..."
                  value={searchQueryLog}
                  onChange={(e) => setSearchQueryLog(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 focus:border-purple-400 focus:bg-white text-slate-800' 
                      : 'bg-slate-800/50 border-slate-700 focus:border-purple-500 focus:bg-slate-800 text-white'
                  }`}
                />
              </div>
              <div className="text-xs font-bold text-slate-500">
                TOTAL: {filteredLogs.length} LOGS
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={isLight ? 'bg-slate-50 text-slate-500' : 'bg-white/5 text-slate-400'}>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Waktu & Tanggal</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Pengguna / Editor</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Jenis Aksi</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Modul Target</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Rincian Perubahan</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {filteredLogs.map((log) => {
                    const dateObj = new Date(log.timestamp);
                    const formattedDate = isNaN(dateObj.getTime())
                      ? log.timestamp
                      : dateObj.toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        });

                    return (
                      <tr key={log.id} className="group hover:bg-purple-500/5 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono font-medium whitespace-nowrap">
                          <div className="flex items-center space-x-1.5 text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>{formattedDate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-black text-[10px]">
                              {(log.user || 'A')[0].toUpperCase()}
                            </div>
                            <span>{log.user || 'Sistem'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${
                            log.action === 'TAMBAH'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : log.action === 'EDIT'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 inline-flex items-center space-x-1">
                            <Tag className="w-3 h-3 text-purple-400" />
                            <span>{log.targetType}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div className={isLight ? "text-slate-600 font-medium" : "text-slate-300 font-medium"}>{log.details}</div>
                          {log.recordId && (
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              ID: {log.recordId}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {!isReadOnly && (
                            <button
                              onClick={() => handleDeleteLog(log)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Hapus Log & Data Terkait"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredLogs.length === 0 && (
                <div className="p-12 text-center">
                  <History className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                  <p className="text-sm text-slate-500 italic">Belum ada riwayat aktivitas data tercatat.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Penyulang Modal */}
      {isAddingPenyulang && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsAddingPenyulang(false)}
          />
          <div className={`relative w-full max-w-md backdrop-blur-xl rounded-2xl border shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <h3 className="text-lg font-bold mb-4">
              {editingPenyulang ? 'Edit Penyulang' : 'Tambah Penyulang Baru'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Nama Gardu Induk (GI)</label>
                <input
                  type="text"
                  list="gi_list_master"
                  value={newPenyulang.namaGI}
                  onChange={(e) => setNewPenyulang({ ...newPenyulang, namaGI: e.target.value.toUpperCase() })}
                  placeholder="Contoh: GI PASSO"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
                <datalist id="gi_list_master">
                  {GI_DEFAULT_LIST.map(gi => (
                    <option key={gi} value={gi} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Nama Penyulang</label>
                <input
                  autoFocus
                  type="text"
                  value={newPenyulang.nama}
                  onChange={(e) => setNewPenyulang({ ...newPenyulang, nama: e.target.value.toUpperCase() })}
                  placeholder="Contoh: BAGUALA"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Status Penyulang</label>
                <select
                  value={newPenyulang.statusPenyulang}
                  onChange={(e) => setNewPenyulang({ ...newPenyulang, statusPenyulang: e.target.value as 'Utama' | 'Percabangan' })}
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="Utama">Utama</option>
                  <option value="Percabangan">Percabangan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Kode / ID</label>
                <input
                  type="text"
                  value={newPenyulang.kode}
                  onChange={(e) => setNewPenyulang({ ...newPenyulang, kode: e.target.value.toUpperCase() })}
                  placeholder="Contoh: BGL"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Total Panjang Jaringan (KMS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPenyulang.panjangJaringan}
                  onChange={(e) => setNewPenyulang({ ...newPenyulang, panjangJaringan: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsAddingPenyulang(false)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold border ${
                  isLight ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-700 hover:bg-slate-800'
                }`}
              >
                Batal
              </button>
              <button
                onClick={() => handleSavePenyulang(newPenyulang)}
                disabled={!newPenyulang.nama}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      {isAddingSection && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsAddingSection(false)}
          />
          <div className={`relative w-full max-w-md backdrop-blur-xl rounded-2xl border shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <h3 className="text-lg font-bold mb-4">
              {editingSection ? 'Edit Section' : 'Tambah Section Baru'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Nama Section</label>
                <input
                  autoFocus
                  type="text"
                  value={newSection.namaSection}
                  onChange={(e) => setNewSection({ ...newSection, namaSection: e.target.value })}
                  placeholder="Contoh: REC POHON / GH BAGUALA"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Penyulang Terkait</label>
                {penyulangList.length > 0 ? (
                  <select
                    value={newSection.penyulang}
                    onChange={(e) => setNewSection({ ...newSection, penyulang: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="">-- Pilih Penyulang --</option>
                    {penyulangList.map((p) => (
                      <option key={p.id} value={p.nama}>
                        {p.nama} {p.kode ? `(${p.kode})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newSection.penyulang}
                    onChange={(e) => setNewSection({ ...newSection, penyulang: e.target.value })}
                    placeholder="Contoh: BAGUALA"
                    className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Jumlah Pelanggan</label>
                <input
                  type="number"
                  value={newSection.jumlahPelanggan}
                  onChange={(e) => setNewSection({ ...newSection, jumlahPelanggan: parseInt(e.target.value) || 0 })}
                  placeholder="Contoh: 1250"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Sistem Operasi</label>
                <select
                  value={newSection.sistemOperasi || 'Radial'}
                  onChange={(e) => setNewSection({ ...newSection, sistemOperasi: e.target.value as 'Loop' | 'Radial' })}
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="Radial">Radial</option>
                  <option value="Loop">Loop</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Penyulang di-supply</label>
                <select
                  value={newSection.keterangan || ''}
                  onChange={(e) => setNewSection({ ...newSection, keterangan: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="">- Tidak Ada -</option>
                  {penyulangList.map((p) => (
                    <option key={p.id} value={p.nama}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsAddingSection(false)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold border ${
                  isLight ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-700 hover:bg-slate-800'
                }`}
              >
                Batal
              </button>
              <button
                onClick={() => handleSaveSection(newSection)}
                disabled={!newSection.namaSection}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feeder Section Drill-Down Modal */}
      {selectedFeederForModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setSelectedFeederForModal(null)}
          />
          <div className={`relative w-full max-w-2xl backdrop-blur-xl rounded-2xl border shadow-2xl p-6 transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-blue-500 flex items-center gap-2">
                    <span>Daftar Section — Penyulang {selectedFeederForModal}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Rincian seluruh section, jumlah pelanggan, dan sistem operasi pada penyulang ini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeederForModal(null)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>

            {(() => {
              const matchedSections = sectionList.filter(
                s => s.penyulang?.toLowerCase() === selectedFeederForModal.toLowerCase()
              );
              const totalPelanggan = matchedSections.reduce((acc, s) => acc + (s.jumlahPelanggan || 0), 0);

              return (
                <div className="space-y-4">
                  {/* Summary Header Cards */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Total Section</div>
                      <div className="text-xl font-black text-emerald-400 mt-0.5">{matchedSections.length} Section</div>
                    </div>
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Total Pelanggan Terlayani</div>
                      <div className="text-xl font-black text-indigo-400 mt-0.5">{totalPelanggan.toLocaleString('id-ID')} Pelanggan</div>
                    </div>
                  </div>

                  {/* Section List Table */}
                  <div className="max-h-[350px] overflow-y-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-950 text-slate-300'}>
                          <th className="p-3 font-bold w-10 text-center">No</th>
                          <th className="p-3 font-bold">Nama Section</th>
                          <th className="p-3 font-bold text-center">Sistem Operasi</th>
                          <th className="p-3 font-bold text-center">Pelanggan</th>
                          <th className="p-3 font-bold">Penyulang di-supply</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {matchedSections.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-500 italic">
                              Belum ada section terdaftar untuk penyulang ini.
                            </td>
                          </tr>
                        ) : (
                          matchedSections.map((sec, i) => (
                            <tr key={sec.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 text-center text-slate-500 font-mono">{i + 1}</td>
                              <td className="p-3 font-extrabold text-white">{sec.namaSection}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                  (sec.sistemOperasi || 'Radial') === 'Loop'
                                    ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                }`}>
                                  {sec.sistemOperasi || 'Radial'}
                                </span>
                              </td>
                              <td className="p-3 text-center font-bold text-emerald-400">
                                {(sec.jumlahPelanggan || 0).toLocaleString('id-ID')} plg
                              </td>
                              <td className="p-3 text-slate-400 text-[11px] truncate max-w-[180px]">
                                {sec.keterangan || '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {!isReadOnly && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          setNewSection({
                            namaSection: '',
                            penyulang: selectedFeederForModal,
                            jumlahPelanggan: 0,
                            sistemOperasi: 'Radial',
                            keterangan: ''
                          });
                          setSelectedFeederForModal(null);
                          setIsAddingSection(true);
                        }}
                        className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Section ke Penyulang Ini</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

