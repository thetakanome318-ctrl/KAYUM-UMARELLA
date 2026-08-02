import React, { useMemo, useState } from 'react';
import { ROWRecord } from '../types';
import { formatBulan } from '../utils/calculations';
import { Search, Zap, Plus, Edit3, Trash2, Calendar, Activity, BarChart2, LayoutGrid, List } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GarduMeasurementViewProps {
  records: ROWRecord[];
  isLight?: boolean;
  onOpenAddModal?: () => void;
  onEditRecord?: (record: ROWRecord) => void;
  onDeleteRecord?: (id: string) => void;
}

export const GarduMeasurementView: React.FC<GarduMeasurementViewProps> = ({ 
  records, 
  isLight = false,
  onOpenAddModal,
  onEditRecord,
  onDeleteRecord
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => r.inspectionType === 'Gardu')
      .filter(r => 
        (r.section || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.penyulang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.lokasi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.catatan || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [records, searchTerm]);

  // Aggregate stats
  const totalPengukuran = filteredRecords.length;
  const totalTemuanGardu = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + (r.temuanGardu || 0), 0);
  }, [filteredRecords]);

  const uniquePenyulangCount = useMemo(() => {
    const set = new Set(filteredRecords.map(r => r.penyulang).filter(Boolean));
    return set.size;
  }, [filteredRecords]);

  // Aggregated data for chart
  const chartData = useMemo(() => {
    const data = filteredRecords.reduce((acc, rec) => {
      const p = rec.penyulang || 'Lainnya';
      if (!acc[p]) acc[p] = { name: p, temuan: 0, pengukuran: 0 };
      acc[p].temuan += (rec.temuanGardu || 0);
      acc[p].pengukuran += 1;
      return acc;
    }, {} as Record<string, { name: string; temuan: number; pengukuran: number }>);
    return Object.values(data);
  }, [filteredRecords]);

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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner & Add Button */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
            <Zap className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Data &amp; Riwayat Pengukuran Gardu</h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Rekapitulasi pengukuran beban, tegangan, dan temuan fisik gardu distribusi
            </p>
          </div>
        </div>

        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Pengukuran Gardu</span>
          </button>
        )}
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border flex items-center space-x-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pengukuran</span>
            <div className="text-xl font-black">{totalPengukuran} <span className="text-xs font-normal text-slate-500">kali</span></div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center space-x-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Temuan Gardu</span>
            <div className="text-xl font-black text-emerald-500">{totalTemuanGardu} <span className="text-xs font-normal text-slate-500">temuan</span></div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center space-x-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penyulang Terlibat</span>
            <div className="text-xl font-black">{uniquePenyulangCount} <span className="text-xs font-normal text-slate-500">penyulang</span></div>
          </div>
        </div>
      </div>

      {/* Filter and View Toggle Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
          <input 
            type="text" 
            placeholder="Cari section, penyulang, atau lokasi gardu..." 
            className={`w-full pl-10 pr-3 py-2 text-xs rounded-xl border transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 focus:bg-white text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'grid'
                ? 'bg-purple-500 text-slate-950 shadow-md'
                : isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Kartu</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'table'
                ? 'bg-purple-500 text-slate-950 shadow-md'
                : isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Tabel</span>
          </button>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className={`p-5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-400">
            <BarChart2 className="w-4 h-4 text-purple-500" />
            <span>Ringkasan Temuan Gardu per Penyulang</span>
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#334155'} />
                <XAxis dataKey="name" stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} />
                <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: isLight ? '#ffffff' : '#1e293b', borderColor: isLight ? '#e2e8f0' : '#475569', borderRadius: '12px' }} />
                <Bar dataKey="temuan" name="Temuan Gardu" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* View Mode: Table */}
      {viewMode === 'table' && (
        <div className={`rounded-2xl border overflow-hidden shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-600 text-[10px] uppercase font-bold' : 'bg-slate-800/80 text-slate-300 text-[10px] uppercase font-bold'}>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Section / Gardu</th>
                  <th className="p-3.5">Penyulang</th>
                  <th className="p-3.5 text-center">Jumlah Temuan Gardu</th>
                  <th className="p-3.5">Lokasi</th>
                  <th className="p-3.5">Catatan</th>
                  {(onEditRecord || onDeleteRecord) && <th className="p-3.5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20 text-xs">
                {filteredRecords.map(item => (
                  <tr key={item.id} className="hover:bg-purple-500/5 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] whitespace-nowrap">{item.tanggal || '-'}</td>
                    <td className="p-3.5 font-bold">{item.section}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.penyulang || '-'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/20">
                        {item.temuanGardu || 0}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{item.lokasi || '-'}</td>
                    <td className="p-3.5 text-slate-400 italic max-w-xs truncate">{item.catatan || '-'}</td>
                    {(onEditRecord || onDeleteRecord) && (
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {onEditRecord && (
                            <button
                              onClick={() => onEditRecord(item)}
                              className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteRecord && (
                            <button
                              onClick={() => onDeleteRecord(item.id)}
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
              </tbody>
            </table>

            {filteredRecords.length === 0 && (
              <div className="p-12 text-center text-slate-500 italic text-xs">
                Belum ada data pengukuran gardu. Silakan tambahkan data pengukuran gardu baru.
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Mode: Grid (History Cards) */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {sortedMonths.map(monthKey => (
            <div key={monthKey} className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-800/40 pb-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {formatBulan(monthKey)} ({groupedByMonth[monthKey].length} Data)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedByMonth[monthKey].map(item => (
                  <div key={item.id} className={`rounded-2xl border p-4 shadow-sm hover:border-purple-500/40 transition-all ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-500 font-mono">{item.tanggal}</span>
                        {onEditRecord && (
                          <button
                            onClick={() => onEditRecord(item)}
                            className="p-1 text-slate-400 hover:text-indigo-400 rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteRecord && (
                          <button
                            onClick={() => onDeleteRecord(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold mb-1 text-purple-300">{item.section}</h4>
                    <div className="text-xs space-y-1.5 text-slate-400">
                      <div className="flex justify-between items-center pt-1">
                        <span>Penyulang:</span>
                        <span className="font-semibold text-slate-200">{item.penyulang || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Jumlah Temuan Gardu:</span>
                        <span className="text-emerald-400 font-black text-sm">{item.temuanGardu || 0}</span>
                      </div>
                      {item.lokasi && (
                        <div className="flex justify-between items-center">
                          <span>Lokasi:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[150px]">{item.lokasi}</span>
                        </div>
                      )}
                      {item.catatan && (
                        <p className="mt-2 pt-2 border-t border-slate-800 text-[10px] italic text-slate-400">
                          "{item.catatan}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredRecords.length === 0 && (
            <div className={`p-12 text-center rounded-2xl border italic text-xs text-slate-500 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              Belum ada data pengukuran gardu. Silakan klik "Tambah Pengukuran Gardu" untuk menambahkan data.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
