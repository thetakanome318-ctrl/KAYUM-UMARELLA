import React, { useMemo, useState } from 'react';
import { ROWRecord, Penyulang, MasterSection } from '../types';
import { formatBulan } from '../utils/calculations';
import { Search, Plus } from 'lucide-react';
import { GangguanFormModal } from './GangguanFormModal';

interface GangguanViewProps {
  records: ROWRecord[];
  isLight?: boolean;
  onSaveRecord?: (record: ROWRecord) => void;
  penyulangList?: Penyulang[];
  sectionList?: MasterSection[];
}

export const GangguanView: React.FC<GangguanViewProps> = ({ 
  records, 
  isLight = false,
  onSaveRecord,
  penyulangList = [],
  sectionList = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    return records.filter(r => r.gangguan).sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [records]);

  return (
    <div className="space-y-6">
        <div className={`p-4 rounded-xl border flex flex-wrap gap-4 items-center ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                <input type="text" placeholder="Cari gangguan..." className={`w-full pl-10 pr-3 py-2 text-xs rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-xs font-bold bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Tambah Gangguan
            </button>
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
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {filteredRecords.map(item => (
                        <tr key={item.id}>
                            <td className="p-3">{item.tanggal}</td>
                            <td className="p-3">{item.section}</td>
                            <td className="p-3">{item.gangguanKeterangan || '-'}</td>
                            <td className="p-3">{item.penyebab || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      <GangguanFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        penyulangList={penyulangList}
        sectionList={sectionList}
        onSave={(data) => { 
        if(onSaveRecord) {
            const newRecord: ROWRecord = {
                id: data.id || crypto.randomUUID(),
                bulan: data.bulan || new Date().toISOString().substring(0, 7),
                tahun: data.tahun || new Date().getFullYear(),
                bulanKe: data.bulanKe || new Date().getMonth() + 1,
                section: data.section || 'N/A',
                targetKms: data.targetKms || 0,
                realisasiKms: data.realisasiKms || 0,
                realisasiGawang: data.realisasiGawang || 0,
                jumlahTemuan: data.jumlahTemuan || 0,
                realisasiTemuan: data.realisasiTemuan || 0,
                ...data
            } as ROWRecord;
            onSaveRecord(newRecord);
        }
      }} />
    </div>
  );
}
