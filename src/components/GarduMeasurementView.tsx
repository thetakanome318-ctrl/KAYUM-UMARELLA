import React, { useMemo, useState } from 'react';
import { ROWRecord } from '../types';
import { formatBulan } from '../utils/calculations';
import { Search, Zap, Plus, Edit3, Trash2, Calendar, Activity, BarChart2, LayoutGrid, List, Filter, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GarduMeasurementViewProps {
  records: ROWRecord[];
  isLight?: boolean;
  onOpenAddModal?: () => void;
  onEditRecord?: (record: ROWRecord) => void;
  onDeleteRecord?: (id: string) => void;
  isReadOnly?: boolean;
}

export const GarduMeasurementView: React.FC<GarduMeasurementViewProps> = ({ 
  records, 
  isLight = false,
  onOpenAddModal,
  onEditRecord,
  onDeleteRecord,
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedPenyulangForChart, setSelectedPenyulangForChart] = useState<string>('ALL');

  const garduRecords = useMemo(() => {
    return records.filter(r => r.inspectionType === 'Gardu');
  }, [records]);

  // Unique list of penyulang for chart filter
  const penyulangList = useMemo(() => {
    const set = new Set(garduRecords.map(r => r.penyulang).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [garduRecords]);

  const filteredRecords = useMemo(() => {
    return garduRecords
      .filter(r => 
        (r.section || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.penyulang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.kodeGardu || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.lokasi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.catatan || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
  }, [garduRecords, searchTerm]);

  // Aggregate stats
  const totalPengukuran = filteredRecords.length;
  const uniquePenyulangCount = useMemo(() => {
    const set = new Set(filteredRecords.map(r => r.penyulang).filter(Boolean));
    return set.size;
  }, [filteredRecords]);

  const calculateMetrics = (item: ROWRecord) => {
    const r = item.arusR || 0;
    const s = item.arusS || 0;
    const t = item.arusT || 0;
    const iAvg = (r + s + t) / 3;

    const kvaMatch = String(item.kapasitas || '').match(/[\d.]+/);
    const kva = kvaMatch ? parseFloat(kvaMatch[0]) : 0;
    const iNom = kva > 0 ? (kva * 1000) / (Math.sqrt(3) * 400) : 0;
    const persenBeban = iNom > 0 ? (iAvg / iNom) * 100 : 0;

    const maxDev = Math.max(Math.abs(r - iAvg), Math.abs(s - iAvg), Math.abs(t - iAvg));
    const bebanTidakSeimbang = iAvg > 0 ? (maxDev / iAvg) * 100 : 0;

    return {
      iAvg,
      persenBeban,
      bebanTidakSeimbang
    };
  };

  const handleExportCsv = () => {
    const DELIM = ';';
    const lines = [
      'sep=;',
      `"DATA PENGUKURAN BEBAN GARDU DISTRIBUSI"`,
      `"Kode Gardu"${DELIM}"Penyulang"${DELIM}"Kapasitas"${DELIM}"Tanggal"${DELIM}"Jam"${DELIM}"R (A)"${DELIM}"S (A)"${DELIM}"T (A)"${DELIM}"N (A)"${DELIM}"Persen Beban"${DELIM}"Beban Tidak Seimbang"`,
      ...filteredRecords.map(r => {
        const { persenBeban, bebanTidakSeimbang } = calculateMetrics(r);
        return `"${r.kodeGardu || '-'}"${DELIM}"${r.penyulang || '-'}"${DELIM}"${r.kapasitas || '-'}"${DELIM}"${r.tanggal || '-'}"${DELIM}"${r.jamUkur || '-'}"${DELIM}"${r.arusR || 0}"${DELIM}"${r.arusS || 0}"${DELIM}"${r.arusT || 0}"${DELIM}"${r.arusIN || 0}"${DELIM}"${persenBeban.toFixed(2)}%"${DELIM}"${bebanTidakSeimbang.toFixed(2)}%"`;
      })
    ];
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Data_Pengukuran_Gardu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Data for imbalance chart
  const imbalanceChartData = useMemo(() => {
    let list = garduRecords;
    if (selectedPenyulangForChart !== 'ALL') {
      list = list.filter(r => r.penyulang === selectedPenyulangForChart);
    }

    return list.map(item => {
      const { bebanTidakSeimbang, persenBeban } = calculateMetrics(item);
      const label = item.kodeGardu || item.section || 'Gardu';
      return {
        name: label,
        penyulang: item.penyulang || 'Lainnya',
        bebanTidakSeimbang: parseFloat(bebanTidakSeimbang.toFixed(1)),
        persenBeban: parseFloat(persenBeban.toFixed(1)),
        tanggal: item.tanggal || '-'
      };
    }).sort((a, b) => b.bebanTidakSeimbang - a.bebanTidakSeimbang); // highest imbalance first for priority
  }, [garduRecords, selectedPenyulangForChart]);

  // Group by Month for grid view
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
              Rekapitulasi pengukuran beban arus RST, persentase beban gardu, dan beban tidak seimbang
            </p>
          </div>
        </div>

        {onOpenAddModal && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 flex items-center gap-2 cursor-pointer shadow-md shrink-0"
            >
              <FileText className="w-4 h-4" /> Download Excel
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Pengukuran Gardu</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border flex items-center space-x-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pengukuran Gardu</span>
            <div className="text-xl font-black">{totalPengukuran} <span className="text-xs font-normal text-slate-500">kali</span></div>
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

      {/* Imbalance Chart Comparison Section */}
      <div className={`p-5 rounded-2xl border space-y-4 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-300">
              <BarChart2 className="w-4 h-4 text-rose-500" />
              <span>Grafik Perbandingan % Ketidakseimbangan Beban Antar Gardu</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Identifikasi prioritas perbaikan berdasarkan tingkat ketidakseimbangan arus tertinggi</p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPenyulangForChart}
              onChange={(e) => setSelectedPenyulangForChart(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
              }`}
            >
              <option value="ALL">Semua Penyulang</option>
              {penyulangList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {imbalanceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={imbalanceChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#334155'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isLight ? '#64748b' : '#94a3b8'} 
                  fontSize={10} 
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} fontSize={10} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: isLight ? '#ffffff' : '#1e293b', borderColor: isLight ? '#e2e8f0' : '#475569', borderRadius: '12px' }}
                  formatter={(val: any) => [`${val}%`, '% Beban Tak Seimbang']}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.name} (${item.penyulang}) - ${item.tanggal}` : label;
                  }}
                />
                <Bar dataKey="bebanTidakSeimbang" name="% Beban Tak Seimbang" radius={[6, 6, 0, 0]}>
                  {imbalanceChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.bebanTidakSeimbang > 15 ? '#f43f5e' : entry.bebanTidakSeimbang > 10 ? '#f59e0b' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
              Tidak ada data pengukuran gardu untuk penyulang ini.
            </div>
          )}
        </div>
        <div className="flex items-center justify-center space-x-6 text-[10px] text-slate-400 pt-1">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Normal (&le; 10%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Perhatian (10% - 15%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Prioritas Perbaikan (&gt; 15%)</span>
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
            placeholder="Cari kode gardu, section, penyulang, atau lokasi..." 
            className={`w-full pl-10 pr-3 py-2 text-xs rounded-xl border transition-all ${
              isLight ? 'bg-slate-50 border-slate-200 focus:bg-white text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
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
        </div>
      </div>

      {/* View Mode: Table */}
      {viewMode === 'table' && (
        <div className={`rounded-2xl border overflow-hidden shadow-xl ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={isLight ? 'bg-slate-100 text-slate-600 text-[10px] uppercase font-bold' : 'bg-slate-800/80 text-slate-300 text-[10px] uppercase font-bold'}>
                  <th className="p-3 whitespace-nowrap">Tanggal</th>
                  <th className="p-3 whitespace-nowrap">Kode / Gardu</th>
                  <th className="p-3 whitespace-nowrap">Penyulang / Section</th>
                  <th className="p-3 whitespace-nowrap">Kapasitas</th>
                  <th className="p-3 whitespace-nowrap text-center">Arus RST (A)</th>
                  <th className="p-3 whitespace-nowrap text-center font-bold text-amber-400">% Beban Gardu</th>
                  <th className="p-3 whitespace-nowrap text-center font-bold text-rose-400">Beban Tak Seimbang (%)</th>
                  <th className="p-3 whitespace-nowrap text-center">Fasa Netral (V)</th>
                  <th className="p-3 whitespace-nowrap text-center">Fasa-Fasa (V)</th>
                  <th className="p-3 whitespace-nowrap text-center">Lin 1 (R, S, T)</th>
                  <th className="p-3 whitespace-nowrap text-center">Lin 2 (R, S, T)</th>
                  <th className="p-3 whitespace-nowrap text-center">Lin 3 (R, S, T)</th>
                  <th className="p-3 whitespace-nowrap text-center">Lin 4 (R, S, T)</th>
                  {!isReadOnly && (onEditRecord || onDeleteRecord) && <th className="p-3 text-right whitespace-nowrap">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {filteredRecords.map(item => {
                  const metrics = calculateMetrics(item);
                  return (
                    <tr key={item.id} className="hover:bg-purple-500/5 transition-colors">
                      <td className="p-3 font-mono text-[11px] whitespace-nowrap">{item.tanggal || '-'}</td>
                      <td className="p-3 font-bold text-purple-400 whitespace-nowrap">{item.kodeGardu || '-'}</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold">{item.section}</div>
                        <div className="text-[10px] text-slate-400">{item.penyulang || '-'}</div>
                      </td>
                      <td className="p-3 font-mono whitespace-nowrap">{item.kapasitas || '-'}</td>
                      <td className="p-3 font-mono text-[11px] text-center whitespace-nowrap">
                        R:{item.arusR ?? '-'} | S:{item.arusS ?? '-'} | T:{item.arusT ?? '-'}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-center whitespace-nowrap font-bold text-amber-400">
                        {metrics.persenBeban > 0 ? `${metrics.persenBeban.toFixed(1)}%` : '-'}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-center whitespace-nowrap font-bold text-rose-400">
                        {metrics.bebanTidakSeimbang > 0 ? `${metrics.bebanTidakSeimbang.toFixed(1)}%` : '-'}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-center whitespace-nowrap">
                        RN:{item.teganganRN ?? '-'} | SN:{item.teganganSN ?? '-'} | TN:{item.teganganTN ?? '-'}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-center whitespace-nowrap text-cyan-400">
                        RS:{item.teganganRS ?? '-'} | ST:{item.teganganST ?? '-'} | TR:{item.teganganTR ?? '-'}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-center whitespace-nowrap">
                        {item.lin1R !== undefined || item.lin1S !== undefined || item.lin1T !== undefined 
                          ? `${item.lin1R ?? '-'}/${item.lin1S ?? '-'}/${item.lin1T ?? '-'}` 
                          : '-'}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-center whitespace-nowrap">
                        {item.lin2R !== undefined || item.lin2S !== undefined || item.lin2T !== undefined 
                          ? `${item.lin2R ?? '-'}/${item.lin2S ?? '-'}/${item.lin2T ?? '-'}` 
                          : '-'}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-center whitespace-nowrap">
                        {item.lin3R !== undefined || item.lin3S !== undefined || item.lin3T !== undefined 
                          ? `${item.lin3R ?? '-'}/${item.lin3S ?? '-'}/${item.lin3T ?? '-'}` 
                          : '-'}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-center whitespace-nowrap">
                        {item.lin4R !== undefined || item.lin4S !== undefined || item.lin4T !== undefined 
                          ? `${item.lin4R ?? '-'}/${item.lin4S ?? '-'}/${item.lin4T ?? '-'}` 
                          : '-'}
                      </td>
                      {!isReadOnly && (onEditRecord || onDeleteRecord) && (
                        <td className="p-3 text-right whitespace-nowrap">
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
                  );
                })}
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
                {groupedByMonth[monthKey].map(item => {
                  const metrics = calculateMetrics(item);
                  return (
                    <div key={item.id} className={`rounded-2xl border p-4 shadow-sm hover:border-purple-500/40 transition-all ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-purple-300">{item.kodeGardu || item.section}</h4>
                            <span className="text-[10px] text-slate-400">{item.penyulang || '-'} • {item.tanggal}</span>
                          </div>
                        </div>
                        {!isReadOnly && (
                          <div className="flex items-center space-x-1">
                            {onEditRecord && (
                              <button onClick={() => onEditRecord(item)} className="p-1 text-slate-400 hover:text-indigo-400 rounded">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteRecord && (
                              <button onClick={() => onDeleteRecord(item.id)} className="p-1 text-slate-400 hover:text-rose-400 rounded">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-xs space-y-1.5 mt-3 pt-3 border-t border-slate-800/60 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Section:</span>
                          <span className="font-medium">{item.section}</span>
                        </div>
                        {item.kapasitas && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Kapasitas:</span>
                            <span className="font-medium font-mono text-amber-400">{item.kapasitas}</span>
                          </div>
                        )}
                        <div className="flex justify-between p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <span className="text-amber-300 font-bold">% Beban Gardu:</span>
                          <span className="font-mono font-bold text-amber-400">{metrics.persenBeban > 0 ? `${metrics.persenBeban.toFixed(1)}%` : '-'}</span>
                        </div>
                        <div className="flex justify-between p-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20">
                          <span className="text-rose-300 font-bold">Beban Tak Seimbang:</span>
                          <span className="font-mono font-bold text-rose-400">{metrics.bebanTidakSeimbang > 0 ? `${metrics.bebanTidakSeimbang.toFixed(1)}%` : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Arus (R, S, T):</span>
                          <span className="font-mono font-semibold">R:{item.arusR ?? '-'} S:{item.arusS ?? '-'} T:{item.arusT ?? '-'} A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Teg. Netral (RN,SN,TN):</span>
                          <span className="font-mono font-semibold">RN:{item.teganganRN ?? '-'} SN:{item.teganganSN ?? '-'} TN:{item.teganganTN ?? '-'} V</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Teg. Fasa (RS,ST,TR):</span>
                          <span className="font-mono text-cyan-400">RS:{item.teganganRS ?? '-'} ST:{item.teganganST ?? '-'} TR:{item.teganganTR ?? '-'} V</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-800/40 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pengukuran Per Lin (RST):</span>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px]">
                            <div>Lin 1: {item.lin1R ?? '-'}/{item.lin1S ?? '-'}/{item.lin1T ?? '-'}</div>
                            <div>Lin 2: {item.lin2R ?? '-'}/{item.lin2S ?? '-'}/{item.lin2T ?? '-'}</div>
                            <div>Lin 3: {item.lin3R ?? '-'}/{item.lin3S ?? '-'}/{item.lin3T ?? '-'}</div>
                            <div>Lin 4: {item.lin4R ?? '-'}/{item.lin4S ?? '-'}/{item.lin4T ?? '-'}</div>
                          </div>
                        </div>
                        {item.catatan && (
                          <p className="mt-2 text-[10px] italic text-slate-400 border-t border-slate-800/30 pt-1">
                            "{item.catatan}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
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
