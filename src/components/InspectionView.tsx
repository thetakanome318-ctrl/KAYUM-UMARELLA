import React, { useMemo, useState } from 'react';
import { ROWRecord } from '../types';
import { formatBulan } from '../utils/calculations';
import { Search, Calendar, ChevronDown, FileText, Trash2 } from 'lucide-react';

interface InspectionViewProps {
  records: ROWRecord[];
  isLight?: boolean;
  onDeleteRecord?: (id: string) => void;
  isReadOnly?: boolean;
}

export const InspectionView: React.FC<InspectionViewProps> = ({ 
  records, 
  isLight = false,
  onDeleteRecord,
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'ROW' | 'Inspeksi' | 'Gangguan'>('All');
  const [filterYear, setFilterYear] = useState('Semua');
  const [filterMonth, setFilterMonth] = useState('Semua Bulan');

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
        const matchesSearch = r.section?.toLowerCase()?.includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || (filterType === 'Inspeksi' && r.inspectionType) || (filterType === 'ROW' && !r.inspectionType);
        return matchesSearch && matchesType;
    }).sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [records, searchTerm, filterType, filterYear, filterMonth]);

  const handleExportCsv = () => {
    const DELIM = ';';
    const lines = [
      'sep=;',
      `"TIMELINE INSPEKSI / ROW"`,
      `"Tanggal"${DELIM}"Tipe"${DELIM}"Penyulang"${DELIM}"Section"${DELIM}"Temuan Konstruksi"${DELIM}"Jumlah Temuan Pohon"${DELIM}"Realisasi Pangkas"${DELIM}"Catatan"`,
      ...filteredRecords.map(r => `"${r.tanggal || '-'}"${DELIM}"${r.inspectionType ? r.inspectionType : 'ROW'}"${DELIM}"${r.penyulang || '-'}"${DELIM}"${r.section || '-'}"${DELIM}"${r.temuanKonstruksi || 0}"${DELIM}"${r.jumlahTemuan || 0}"${DELIM}"${r.realisasiTemuan || 0}"${DELIM}"${r.catatan || '-'}"`)
    ];
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Timeline_Inspeksi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group by Month
  const groupedByMonth = useMemo(() => {
    return filteredRecords.reduce((acc, rec) => {
        const monthKey = rec.bulan || 'Tanpa Bulan';
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(rec);
        return acc;
    }, {} as Record<string, ROWRecord[]>);
  }, [filteredRecords]);
  
  const sortedMonths = Object.keys(groupedByMonth).sort((a,b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
        <div className={`p-4 rounded-xl border flex flex-wrap gap-4 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                <input type="text" placeholder="Cari section..." className={`w-full pl-10 pr-3 py-2 text-xs rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            </div>
            <select className={`px-3 py-2 text-xs rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`} value={filterType} onChange={e => setFilterType(e.target.value as any)}>
                <option value="All">Semua</option>
                <option value="ROW">ROW</option>
                <option value="Inspeksi">Inspeksi</option>
            </select>
            <select className={`px-3 py-2 text-xs rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                <option value="Semua">Semua Tahun</option>
            </select>
             <select className={`px-3 py-2 text-xs rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'}`} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                <option value="Semua Bulan">Semua Bulan</option>
            </select>
            <div className="flex gap-2">
                <button className="px-4 py-2 text-xs font-bold bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400">Cari</button>
                <button onClick={handleExportCsv} className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Excel
                </button>
            </div>
        </div>

      {/* Timeline View */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold">Timeline</h2>
        {sortedMonths.map(monthKey => (
            <div key={monthKey} className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider">{formatBulan(monthKey)}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedByMonth[monthKey].map(item => (
                        <div key={item.id} className={`rounded-xl border p-4 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase ${item.inspectionType ? 'text-emerald-500' : 'text-blue-500'}`}>{item.inspectionType || 'ROW'}</span>
                                <div className="flex items-center gap-1.5 text-[10px]">
                                    <span>{item.tanggal}</span>
                                    {!isReadOnly && onDeleteRecord && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Apakah Anda ingin menghapus file / data ini?')) {
                                                    onDeleteRecord(item.id);
                                                }
                                            }}
                                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition active:scale-95 cursor-pointer"
                                            title="Hapus"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <h4 className="text-sm font-bold mb-2">{item.section}</h4>
                            {item.inspectionType && (
                                <div className="text-xs space-y-1">
                                    <p>Temuan Konstruksi: {item.temuanKonstruksi || 0}</p>
                                    <p>Temuan Gardu: {item.temuanGardu || 0}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Tabel</h2>
        <div className={`rounded-xl border shadow-sm overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <table className="w-full text-left border-collapse text-xs">
                <thead>
                    <tr className={`${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Section</th>
                        <th className="p-3">Jenis</th>
                        <th className="p-3">T. Konstruksi</th>
                        <th className="p-3">T. Gardu</th>
                        {!isReadOnly && onDeleteRecord && <th className="p-3 text-right">Aksi</th>}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {filteredRecords.map(item => (
                        <tr key={item.id}>
                            <td className="p-3">{item.tanggal}</td>
                            <td className="p-3">{item.section}</td>
                            <td className="p-3">{item.inspectionType || 'ROW'}</td>
                            <td className="p-3">{item.temuanKonstruksi || 0}</td>
                            <td className="p-3">{item.temuanGardu || 0}</td>
                            {!isReadOnly && onDeleteRecord && (
                                <td className="p-3 text-right">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Apakah Anda ingin menghapus file / data ini?')) {
                                                onDeleteRecord(item.id);
                                            }
                                        }}
                                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition active:scale-95 cursor-pointer"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
