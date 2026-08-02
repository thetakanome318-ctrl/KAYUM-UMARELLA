import React, { useMemo, useState, useEffect } from 'react';
import { ROWRecord, Penyulang, MasterSection } from '../types';
import { formatBulan } from '../utils/calculations';
import { Search, Plus, Trash2, Edit3, Save, Calculator, FileText, Download, Clock } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { subscribeMasterSection } from '../lib/firebase';

interface SaidiSaifiViewProps {
  records: ROWRecord[];
  isLight?: boolean;
  onSaveRecord?: (record: ROWRecord) => void;
  onDeleteRecord?: (id: string) => void;
  penyulangList?: Penyulang[];
  isReadOnly?: boolean;
}

export const SaidiSaifiView: React.FC<SaidiSaifiViewProps> = ({ 
  records, 
  isLight = false,
  onSaveRecord,
  onDeleteRecord,
  penyulangList = [],
  isReadOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Partial<ROWRecord> | null>(null);
  const [sectionList, setSectionList] = useState<MasterSection[]>([]);

  useEffect(() => {
    const unsub = subscribeMasterSection(setSectionList);
    return () => unsub();
  }, []);

  // Sync Logic: Auto-fill fields based on Penyulang & Tanggal
  useEffect(() => {
    if (isModalOpen && editingData && editingData.penyulang && editingData.tanggal) {
      const selectedPenyulang = editingData.penyulang;
      const selectedDate = editingData.tanggal;
      const selectedTime = editingData.jamPadam || '';

      // 1. Auto-fill Total Pelanggan (Sum of sections for this penyulang)
      const totalPlg = sectionList
        .filter(s => s.penyulang === selectedPenyulang)
        .reduce((sum, s) => sum + (s.jumlahPelanggan || 0), 0);
      
      if (totalPlg > 0 && editingData.totalPelanggan === 0) {
        setEditingData(prev => prev ? { ...prev, totalPelanggan: totalPlg } : null);
      }

      // 2. Auto-fill Lama Padam & Pelanggan Padam from Gangguan records if match found
      // We look for records that are 'gangguan' and match penyulang, tanggal, and jamKeluar (as jamPadam)
      const match = records.find(r => 
        r.gangguan && 
        r.penyulang === selectedPenyulang && 
        r.tanggal === selectedDate &&
        (selectedTime === '' || r.jamKeluar === selectedTime)
      );

      if (match) {
        setEditingData(prev => {
          if (!prev) return null;
          // Only update if currently 0 to avoid overwriting manual changes if intended
          const updates: Partial<ROWRecord> = {};
          
          if (prev.lamaPadamJam === 0) {
            // Convert duration string "HH:mm" to hours if possible
            if (match.durasi && match.durasi.includes(':')) {
              const [h, m] = match.durasi.split(':').map(Number);
              updates.lamaPadamJam = h + (m / 60);
            }
          }
          
          if (prev.pelangganPadam === 0 && match.pelangganPadam) {
            updates.pelangganPadam = match.pelangganPadam;
          }

          if (prev.jamPadam === '' || !prev.jamPadam) {
            updates.jamPadam = match.jamKeluar;
          }

          if (Object.keys(updates).length > 0) {
            return { ...prev, ...updates };
          }
          return prev;
        });
      }
    }
  }, [editingData?.penyulang, editingData?.tanggal, editingData?.jamPadam, isModalOpen, sectionList, records]);

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => r.isSaidiSaifi)
      .filter(r => (r.penyulang || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.catatan || '').toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [records, searchTerm]);

  // Handle Export CSV
  const handleExportCsv = () => {
    const DELIM = ';';
    const lines = [
      'sep=;',
      `"DATA PERHITUNGAN SAIDI SAIFI"`,
      `"Tanggal"${DELIM}"Penyulang"${DELIM}"Lama Padam (Jam)"${DELIM}"Pelanggan Padam"${DELIM}"Total Pelanggan"${DELIM}"SAIDI (Jam/Plg)"${DELIM}"SAIFI (Kali/Plg)"${DELIM}"Catatan"`,
      ...filteredRecords.map(r => {
        const saidi = (r.lamaPadamJam || 0) * (r.pelangganPadam || 0) / (r.totalPelanggan || 1);
        const saifi = (r.pelangganPadam || 0) / (r.totalPelanggan || 1);
        return `"${r.tanggal || '-'}"${DELIM}"${r.penyulang || '-'}"${DELIM}"${r.lamaPadamJam || 0}"${DELIM}"${r.pelangganPadam || 0}"${DELIM}"${r.totalPelanggan || 0}"${DELIM}"${saidi.toFixed(4)}"${DELIM}"${saifi.toFixed(4)}"${DELIM}"${r.catatan || '-'}"`
      })
    ];
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Saidi_Saifi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 297, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PLN (PERSERO) — LAPORAN SAIDI SAIFI', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')} | Total: ${filteredRecords.length} Data`, 14, 19);

    const rows = filteredRecords.map(r => {
      const saidi = (r.lamaPadamJam || 0) * (r.pelangganPadam || 0) / (r.totalPelanggan || 1);
      const saifi = (r.pelangganPadam || 0) / (r.totalPelanggan || 1);
      return [
        r.tanggal || '-', 
        r.penyulang || '-', 
        r.lamaPadamJam || 0, 
        r.pelangganPadam || 0, 
        r.totalPelanggan || 0, 
        saidi.toFixed(4), 
        saifi.toFixed(4), 
        r.catatan || '-'
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Tanggal', 'Penyulang', 'Lama Padam (Jam)', 'Plg Padam', 'Total Plg', 'SAIDI', 'SAIFI', 'Catatan']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3 }
    });

    doc.save(`Saidi_Saifi_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleSave = () => {
    if (onSaveRecord && editingData) {
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
        ...editingData
      } as ROWRecord;
      onSaveRecord(dataToSave);
      setIsModalOpen(false);
      setEditingData(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-500/20 text-blue-500 rounded-2xl border border-blue-500/30">
            <Calculator className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Perhitungan SAIDI & SAIFI</h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Kalkulator dan riwayat indeks keandalan sistem distribusi (SAIDI & SAIFI)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
          {onSaveRecord && (
            <button
              onClick={() => {
                setEditingData({ 
                  tanggal: new Date().toISOString().split('T')[0],
                  lamaPadamJam: 0,
                  pelangganPadam: 0,
                  totalPelanggan: 0,
                  penyulang: penyulangList[0]?.nama || '',
                  catatan: ''
                });
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className={`rounded-xl border overflow-hidden shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
        <div className={`p-4 border-b flex items-center gap-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari penyulang atau catatan..." 
            className="bg-transparent border-none outline-none text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className={`${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
                <th className="p-3 font-bold">Tanggal</th>
                <th className="p-3 font-bold">Penyulang</th>
                <th className="p-3 font-bold text-center">Lama Padam (Jam)</th>
                <th className="p-3 font-bold text-center">Pelanggan Padam</th>
                <th className="p-3 font-bold text-center">Total Pelanggan</th>
                <th className="p-3 font-bold text-center">SAIDI (Jam/Plg)</th>
                <th className="p-3 font-bold text-center">SAIFI (Kali/Plg)</th>
                <th className="p-3 font-bold">Catatan</th>
                <th className="p-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500 italic">
                    Belum ada data perhitungan SAIDI SAIFI
                  </td>
                </tr>
              ) : (
                filteredRecords.map(item => {
                  const saidi = (item.lamaPadamJam || 0) * (item.pelangganPadam || 0) / (item.totalPelanggan || 1);
                  const saifi = (item.pelangganPadam || 0) / (item.totalPelanggan || 1);
                  return (
                    <tr key={item.id} className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}`}>
                      <td className="p-3">
                        <div className="font-medium">{item.tanggal}</div>
                        {item.jamPadam && <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-2.5 h-2.5" /> {item.jamPadam}</div>}
                      </td>
                      <td className="p-3 font-semibold">{item.penyulang}</td>
                      <td className="p-3 text-center">{item.lamaPadamJam}</td>
                      <td className="p-3 text-center">{item.pelangganPadam?.toLocaleString()}</td>
                      <td className="p-3 text-center">{item.totalPelanggan?.toLocaleString()}</td>
                      <td className="p-3 text-center font-bold text-blue-500">{saidi.toFixed(4)}</td>
                      <td className="p-3 text-center font-bold text-emerald-500">{saifi.toFixed(4)}</td>
                      <td className="p-3 truncate max-w-[150px]">{item.catatan || '-'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {onSaveRecord && (
                            <button
                              onClick={() => {
                                setEditingData(item);
                                setIsModalOpen(true);
                              }}
                              className={`p-1.5 rounded hover:bg-blue-500/20 text-blue-500 transition-colors`}
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteRecord && (
                            <button
                              onClick={() => {
                                if(window.confirm('Hapus data ini?')) {
                                  onDeleteRecord(item.id);
                                }
                              }}
                              className={`p-1.5 rounded hover:bg-rose-500/20 text-rose-500 transition-colors`}
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input */}
      {isModalOpen && editingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${
              isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-900/50'
            }`}>
              <h3 className="text-lg font-bold">
                {editingData.id ? 'Edit Data SAIDI SAIFI' : 'Input Data SAIDI SAIFI'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Tanggal Kejadian</label>
                  <input
                    type="date"
                    value={editingData.tanggal || ''}
                    onChange={e => setEditingData({...editingData, tanggal: e.target.value})}
                    className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Jam Padam</label>
                  <input
                    type="time"
                    value={editingData.jamPadam || ''}
                    onChange={e => setEditingData({...editingData, jamPadam: e.target.value})}
                    className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Penyulang</label>
                  <select
                    value={editingData.penyulang || ''}
                    onChange={e => setEditingData({...editingData, penyulang: e.target.value})}
                    className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    <option value="">Pilih Penyulang</option>
                    {penyulangList.map(p => (
                      <option key={p.id} value={p.nama}>{p.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Lama Padam (Jam)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingData.lamaPadamJam || ''}
                    onChange={e => setEditingData({...editingData, lamaPadamJam: parseFloat(e.target.value) || 0})}
                    className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Pelanggan Padam</label>
                  <input
                    type="number"
                    min="0"
                    value={editingData.pelangganPadam || ''}
                    onChange={e => setEditingData({...editingData, pelangganPadam: parseInt(e.target.value) || 0})}
                    className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Total Pelanggan</label>
                  <input
                    type="number"
                    min="1"
                    value={editingData.totalPelanggan || ''}
                    onChange={e => setEditingData({...editingData, totalPelanggan: parseInt(e.target.value) || 0})}
                    className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Live Calculation Preview */}
              <div className={`p-4 rounded-xl flex items-center justify-around mt-4 ${
                isLight ? 'bg-blue-50 text-blue-900' : 'bg-blue-900/30 text-blue-100'
              }`}>
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Estimasi SAIDI</div>
                  <div className="text-lg font-black font-mono">
                    {(((editingData.lamaPadamJam || 0) * (editingData.pelangganPadam || 0)) / (editingData.totalPelanggan || 1)).toFixed(4)}
                  </div>
                </div>
                <div className="w-px h-10 bg-blue-500/30"></div>
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Estimasi SAIFI</div>
                  <div className="text-lg font-black font-mono">
                    {((editingData.pelangganPadam || 0) / (editingData.totalPelanggan || 1)).toFixed(4)}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Catatan</label>
                <textarea
                  value={editingData.catatan || ''}
                  onChange={e => setEditingData({...editingData, catatan: e.target.value})}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none resize-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                  placeholder="Keterangan kejadian / gangguan..."
                />
              </div>
            </div>

            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${
              isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-900/50'
            }`}>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-2"
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
