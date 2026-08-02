import React, { useMemo, useState } from 'react';
import { ROWRecord, Penyulang, MasterSection } from '../types';
import { formatBulan } from '../utils/calculations';
import { Search, Plus, FileText, Edit3, Trash2 } from 'lucide-react';
import { GangguanFormModal } from './GangguanFormModal';

interface GangguanViewProps {
  records: ROWRecord[];
  isLight?: boolean;
  onSaveRecord?: (record: ROWRecord) => void;
  onDeleteRecord?: (id: string) => void;
  penyulangList?: Penyulang[];
  sectionList?: MasterSection[];
  isReadOnly?: boolean;
}

export const GangguanView: React.FC<GangguanViewProps> = ({ 
  records, 
  isLight = false,
  onSaveRecord,
  onDeleteRecord,
  penyulangList = [],
  sectionList = [],
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ROWRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter(r => r.gangguan).sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [records]);

  const handleExportCsv = () => {
    const DELIM = ';';
    const lines = [
      'sep=;',
      `"DATA GANGGUAN PENYULANG"`,
      `"Tanggal"${DELIM}"Section"${DELIM}"Keterangan"${DELIM}"Penyebab"`,
      ...filteredRecords.map(r => `"${r.tanggal || '-'}"${DELIM}"${r.section || '-'}"${DELIM}"${r.gangguanKeterangan || '-'}"${DELIM}"${r.penyebab || '-'}"`)
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

  return (
    <div className="space-y-6">
        <div className={`p-4 rounded-xl border flex flex-wrap gap-4 items-center ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                <input type="text" placeholder="Cari gangguan..." className={`w-full pl-10 pr-3 py-2 text-xs rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={handleExportCsv} className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 flex items-center gap-2 cursor-pointer shadow-md">
                    <FileText className="w-4 h-4" /> Download Excel
                </button>
                {!isReadOnly && (
                  <button onClick={() => { setEditingRecord(null); setIsModalOpen(true); }} className="px-4 py-2 text-xs font-bold bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 flex items-center gap-2 cursor-pointer shadow-md">
                      <Plus className="w-4 h-4" /> Tambah Gangguan
                  </button>
                )}
            </div>
        </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">Daftar Gangguan Penyulang</h2>
        <div className={`rounded-xl border shadow-sm overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <table className="w-full text-left border-collapse text-xs">
                <thead>
                    <tr className={`${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Section</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3">Penyebab</th>
                        {!isReadOnly && (onDeleteRecord || onSaveRecord) && <th className="p-3 text-right">Aksi</th>}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {filteredRecords.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3">{item.tanggal}</td>
                            <td className="p-3">{item.section}</td>
                            <td className="p-3">{item.gangguanKeterangan || '-'}</td>
                            <td className="p-3">{item.penyebab || '-'}</td>
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
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {onDeleteRecord && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Apakah Anda ingin menghapus file / data ini?')) {
                                                        onDeleteRecord(item.id);
                                                    }
                                                }}
                                                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                Belum ada data gangguan penyulang.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
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
            onSaveRecord(newRecord);
            setIsModalOpen(false);
            setEditingRecord(null);
        }
      }} />
    </div>
  );
};
