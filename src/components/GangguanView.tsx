import React, { useMemo, useState, useEffect } from 'react';
import { ROWRecord, Penyulang, MasterSection, GangguanPangkalRecord } from '../types';
import { formatBulan } from '../utils/calculations';
import { Search, Plus, FileText, Edit3, Trash2, Clock, Zap, AlertTriangle } from 'lucide-react';
import { GangguanFormModal } from './GangguanFormModal';
import { GangguanDashboard } from './GangguanDashboard';
import { subscribePenyulang, subscribeMasterSection, saveGangguanPangkalToCloud } from '../lib/firebase';

interface GangguanViewProps {
  records: ROWRecord[];
  isLight?: boolean;
  onSaveRecord?: (record: ROWRecord) => void;
  onDeleteRecord?: (id: string) => void;
  onDeleteMultipleRecords?: (ids: string[]) => void;
  penyulangList?: Penyulang[];
  sectionList?: MasterSection[];
  isReadOnly?: boolean;
}

export const GangguanView: React.FC<GangguanViewProps> = ({ 
  records, 
  isLight = false,
  onSaveRecord,
  onDeleteRecord,
  onDeleteMultipleRecords,
  penyulangList: penyulangProp = [],
  sectionList: sectionProp = [],
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ROWRecord | null>(null);
  const [penyulangList, setPenyulangList] = useState<Penyulang[]>(penyulangProp);
  const [sectionList, setSectionList] = useState<MasterSection[]>(sectionProp);

  useEffect(() => {
    if (penyulangProp && penyulangProp.length > 0) {
      setPenyulangList(penyulangProp);
    } else {
      const unsubP = subscribePenyulang(setPenyulangList);
      return () => unsubP();
    }
  }, [penyulangProp]);

  useEffect(() => {
    if (sectionProp && sectionProp.length > 0) {
      setSectionList(sectionProp);
    } else {
      const unsubS = subscribeMasterSection(setSectionList);
      return () => unsubS();
    }
  }, [sectionProp]);

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => r.gangguan)
      .filter(r => 
        (r.penyulang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.section || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.gangguanKeterangan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.penyebab || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.kodeGangguan || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [records, searchTerm]);

  const handleExportCsv = () => {
    const DELIM = ';';
    const lines = [
      'sep=;',
      `"DATA GANGGUAN PENYULANG"`,
      `"Tanggal"${DELIM}"Penyulang"${DELIM}"Section"${DELIM}"Jam Keluar"${DELIM}"Jam Masuk"${DELIM}"Durasi"${DELIM}"Relay"${DELIM}"Arus R"${DELIM}"Arus S"${DELIM}"Arus T"${DELIM}"Arus IN"${DELIM}"Kode"${DELIM}"Penyebab"${DELIM}"Keterangan"`,
      ...filteredRecords.map(r => `"${r.tanggal || '-'}"${DELIM}"${r.penyulang || '-'}"${DELIM}"${r.section || '-'}"${DELIM}"${r.jamKeluar || '-'}"${DELIM}"${r.jamMasuk || '-'}"${DELIM}"${r.durasi || '-'}"${DELIM}"${r.relayBekerja || '-'}"${DELIM}"${r.relayArusR ?? 0}"${DELIM}"${r.relayArusS ?? 0}"${DELIM}"${r.relayArusT ?? 0}"${DELIM}"${r.arusIN ?? 0}"${DELIM}"${r.kodeGangguan || '-'}"${DELIM}"${r.penyebab || '-'}"${DELIM}"${r.gangguanKeterangan || '-'}"`)
    ];
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Data_Gangguan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasImportedRecords = useMemo(() => {
    return records.some(r => r.gangguan && r.isImported);
  }, [records]);

  const handleDeleteAllImported = () => {
    const importedIds = records.filter(r => r.gangguan && r.isImported).map(r => r.id);
    if (importedIds.length > 0 && onDeleteMultipleRecords) {
      onDeleteMultipleRecords(importedIds);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. DASHBOARD MATRIKS PIE & BAR CHARTS */}
      <GangguanDashboard 
        records={records} 
        isLight={isLight} 
        penyulangList={penyulangList} 
      />

      {/* 2. SEARCH & ACTION CONTROLS */}
      <div className={`p-4 rounded-2xl border flex flex-wrap gap-4 items-center justify-between ${
        isLight ? 'bg-white border-black shadow-sm' : 'bg-black border-white/40 shadow-xl'
      }`}>
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400"/>
          <input 
            type="text" 
            placeholder="Cari penyulang, section, kode gangguan, penyebab..." 
            className={`w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-500 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700 text-white'
            }`} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="px-4 py-2.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-98 transition">
            <FileText className="w-4 h-4" /> Import Excel/CSV
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
                    for (let i = 1; i < lines.length; i++) {
                      const line = lines[i].trim();
                      if (!line) continue;
                      const parts = line.split(';');
                      if (parts.length >= 2) {
                        const tanggal = parts[0]?.replace(/"/g, '').trim() || new Date().toISOString().slice(0, 10);
                        const penyulang = parts[1]?.replace(/"/g, '').trim() || '';
                        const section = parts[2]?.replace(/"/g, '').trim() || '';
                        const jamKeluar = parts[3]?.replace(/"/g, '').trim() || '08:00';
                        const jamMasuk = parts[4]?.replace(/"/g, '').trim() || '09:00';
                        const durasi = parts[5]?.replace(/"/g, '').trim() || '60';
                        const relayBekerja = parts[6]?.replace(/"/g, '').trim() || 'OCR';
                        const kodeGangguan = parts[11]?.replace(/"/g, '').trim() || 'G-01';
                        const penyebab = parts[12]?.replace(/"/g, '').trim() || 'Pohon';
                        const gangguanKeterangan = parts[13]?.replace(/"/g, '').trim() || '';

                        if (penyulang && onSaveRecord) {
                          const rec = {
                            id: `gangguan-${Date.now()}-${i}`,
                            tanggal,
                            penyulang,
                            section,
                            jamKeluar,
                            jamMasuk,
                            durasi,
                            relayBekerja,
                            kodeGangguan,
                            penyebab,
                            gangguanKeterangan,
                            gangguan: true,
                            isSaidiSaifi: false,
                            isImported: true,
                            bulan: 'Juli',
                            tahun: 2026,
                            bulanKe: 7,
                            realisasiKms: 0,
                            realisasiGawang: 0,
                            jumlahTemuan: 0,
                            realisasiTemuan: 0,
                            luarTemuan: 0,
                            realisasiLuarTemuan: 0,
                            perluPadam: false,
                            jumlahPerluPadam: 0,
                            tidakAdaIzin: false,
                            jumlahTidakAdaIzin: 0,
                            pohonBesar: false,
                            jumlahPohonBesar: 0
                          } as unknown as ROWRecord;
                          await onSaveRecord(rec);
                          count++;
                        }
                      }
                    }
                    alert(`Berhasil mengimpor ${count} data Gangguan dari file Excel/CSV!`);
                  } catch (err) {
                    alert('Gagal mengimpor file Gangguan.');
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
          {hasImportedRecords && onDeleteMultipleRecords && !isReadOnly && (
            <button 
              onClick={handleDeleteAllImported} 
              className="px-4 py-2.5 text-xs font-bold bg-rose-700 text-white rounded-xl hover:bg-rose-600 flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-700/20 active:scale-98 transition"
              title="Hapus semua data gangguan hasil impor Excel"
            >
              <Trash2 className="w-4 h-4" /> Hapus Semua Hasil Impor
            </button>
          )}
          <button 
            onClick={handleExportCsv} 
            className="px-4 py-2.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-98 transition"
          >
            <FileText className="w-4 h-4" /> Export CSV / Excel
          </button>
          {!isReadOnly && (
            <button 
              onClick={() => { setEditingRecord(null); setIsModalOpen(true); }} 
              className="px-4 py-2.5 text-xs font-bold bg-rose-500 text-white rounded-xl hover:bg-rose-400 flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-500/20 active:scale-98 transition"
            >
              <Plus className="w-4 h-4" /> Input Gangguan
            </button>
          )}
        </div>
      </div>

      {/* 3. LOG REKAPITULASI TABEL GANGGUAN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-rose-400" />
            <span>Riwayat & Detail Log Gangguan Penyulang</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">{filteredRecords.length} Data Ditemukan</span>
        </div>

        <div className={`rounded-2xl border shadow-xl overflow-hidden ${
          isLight ? 'bg-white border-black' : 'bg-black border-white/40'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${isLight ? 'bg-slate-100 text-black' : 'bg-black text-white'} font-bold border-b border-black`}>
                  <th className="p-3 whitespace-nowrap">Tanggal</th>
                  <th className="p-3 whitespace-nowrap">Penyulang</th>
                  <th className="p-3 whitespace-nowrap">Section</th>
                  <th className="p-3 whitespace-nowrap">Jam Out / In</th>
                  <th className="p-3 whitespace-nowrap">Durasi</th>
                  <th className="p-3 whitespace-nowrap">Relay / Kode</th>
                  <th className="p-3 whitespace-nowrap">Arus (R/S/T/IN)</th>
                  <th className="p-3">Penyebab / Lokasi</th>
                  {!isReadOnly && (onDeleteRecord || onSaveRecord) && <th className="p-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredRecords.map(item => {
                  const unit = (item as any).satuanArus || 'A';
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3 whitespace-nowrap font-mono text-slate-400">{item.tanggal}</td>
                      <td className="p-3 font-bold text-rose-400 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span>{item.penyulang || '-'}</span>
                          {item.isImported && (
                            <span className="px-1 py-0.2 text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-sans tracking-wide">
                              EXCEL
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-medium whitespace-nowrap text-slate-200">{item.section || '-'}</td>
                      <td className="p-3 whitespace-nowrap font-mono text-slate-300">
                        {item.jamKeluar || '-'} / {item.jamMasuk || '-'}
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono font-bold text-emerald-400">
                        {item.durasi || '-'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex flex-col space-y-0.5">
                          <span className="font-semibold text-slate-200">{item.relayBekerja || '-'}</span>
                          {item.kodeGangguan && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-[10px] w-fit font-bold">
                              {item.kodeGangguan}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        R:{item.relayArusR ?? 0} S:{item.relayArusS ?? 0} T:{item.relayArusT ?? 0} IN:{item.arusIN ?? 0} {unit}
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-200">{item.penyebab || '-'}</p>
                        {item.lokasi && <p className="text-[10px] text-slate-400">Lokasi: {item.lokasi}</p>}
                        {item.gangguanKeterangan && <p className="text-[10px] text-slate-400 italic">{item.gangguanKeterangan}</p>}
                      </td>
                      {!isReadOnly && (onDeleteRecord || onSaveRecord) && (
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            {onSaveRecord && (
                              <button
                                onClick={() => {
                                  setEditingRecord(item);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {onDeleteRecord && (
                              <button
                                onClick={() => onDeleteRecord(item.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                      Belum ada data gangguan penyulang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <GangguanFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingRecord(null); }} 
        penyulangList={penyulangList}
        sectionList={sectionList}
        initialData={editingRecord}
        onSave={(data) => { 
          if(onSaveRecord) {
            const newRecord: ROWRecord = {
              id: editingRecord?.id || data.id || crypto.randomUUID(),
              bulan: data.bulan || editingRecord?.bulan || new Date().toISOString().substring(0, 7),
              tahun: data.tahun || editingRecord?.tahun || new Date().getFullYear(),
              bulanKe: data.bulanKe || editingRecord?.bulanKe || new Date().getMonth() + 1,
              section: data.section || 'N/A',
              targetKms: data.targetKms || 0,
              realisasiKms: data.realisasiKms || 0,
              realisasiGawang: data.realisasiGawang || 0,
              jumlahTemuan: data.jumlahTemuan || 0,
              realisasiTemuan: data.realisasiTemuan || 0,
              ...editingRecord,
              ...data,
              gangguan: true
            } as ROWRecord;

            // Connect to Gangguan Pangkal if Penyulang is "Utama"
            if (newRecord.penyulang && !editingRecord) {
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
            setIsModalOpen(false);
            setEditingRecord(null);
          }
        }} 
      />
    </div>
  );
};

