import React, { useMemo, useState } from 'react';
import { ROWRecord, PenyulangTarget, Penyulang } from '../types';
import { Search, ArrowUpDown, Filter, Download } from 'lucide-react';

interface DashboardTargetTableProps {
  records: ROWRecord[];
  penyulangMaster: Penyulang[];
  selectedYear: number | 'ALL';
  selectedMonth: string; // 'ALL' or '01'-'12'
  isLight: boolean;
  onExportPdf?: () => void;
}

export const DashboardTargetTable: React.FC<DashboardTargetTableProps> = ({ 
  records, 
  penyulangMaster,
  selectedYear,
  selectedMonth,
  isLight,
  onExportPdf
}) => {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const tableData = useMemo(() => {
    // 1. Get unique feeders from master or records
    const feeders = penyulangMaster.length > 0 
      ? penyulangMaster 
      : Array.from(new Set(records.map(r => r.penyulang).filter(Boolean))).map(name => ({ id: name!, nama: name! }));

    return feeders.map(feeder => {
      // 2. Filter records for this feeder, year, month
      const feederRecords = records.filter(r => {
        const matchFeeder = r.penyulang === feeder.nama;
        const matchYear = selectedYear === 'ALL' || r.tahun === selectedYear;
        const matchMonth = selectedMonth === 'ALL' || r.bulanKe === parseInt(selectedMonth, 10);
        return matchFeeder && matchYear && matchMonth;
      });

      const realisasiKms = feederRecords.reduce((sum, r) => sum + (r.realisasiKms || 0), 0);
      const realisasiGawang = feederRecords.reduce((sum, r) => sum + (r.realisasiGawang || 0), 0);
      
      const totalTemuan = feederRecords.reduce((sum, r) => sum + (r.jumlahTemuan || 0), 0);
      const totalRealisasiTemuan = feederRecords.reduce((sum, r) => sum + (r.realisasiTemuan || 0), 0);
      const totalLuarTemuan = feederRecords.reduce((sum, r) => sum + (r.luarTemuan || 0), 0);
      
      const totalPerluPadam = feederRecords.reduce((sum, r) => sum + (r.jumlahPerluPadam || 0), 0);
      const totalPerluIzin = feederRecords.reduce((sum, r) => sum + (r.jumlahTidakAdaIzin || 0), 0);
      const totalPohonBesar = feederRecords.reduce((sum, r) => sum + (r.jumlahPohonBesar || 0), 0);

      const rasioBebasJaringan = totalTemuan > 0 ? (totalRealisasiTemuan / totalTemuan) * 100 : 100;

      const jumlahGangguan = feederRecords.filter(r => r.gangguan).length;

      return {
        nama: feeder.nama,
        realisasiKms,
        realisasiGawang,
        rasioBebasJaringan,
        totalTemuan,
        totalRealisasiTemuan,
        totalLuarTemuan,
        totalPerluPadam,
        totalPerluIzin,
        totalPohonBesar,
        count: jumlahGangguan
      };
    });
  }, [records, penyulangMaster, selectedYear, selectedMonth]);

  const sortedData = useMemo(() => {
    let items = tableData.filter(item => 
      (item.nama || '').toLowerCase().includes(search.toLowerCase())
    );

    if (sortConfig) {
      items.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [tableData, search, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className={`backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${
      isLight ? 'bg-white border-black text-black' : 'bg-black border-white/40 text-white'
    }`}>
      <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${isLight ? 'border-black' : 'border-white/20'}`}>
        <div>
          <h3 className="text-lg font-bold tracking-tight">Tabel Monitoring & Status Penyulang</h3>
          <p className={`text-xs ${isLight ? 'text-black/60' : 'text-slate-400'}`}>
            Data rekapitulasi temuan dan rekap gangguan per penyulang
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition-all flex items-center space-x-1.5 border border-rose-400/30 cursor-pointer shrink-0"
              title="Export PDF Ringkasan KPI & Target Table"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari penyulang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-10 pr-4 py-2 text-xs rounded-xl border transition-all ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 focus:bg-white text-slate-800' 
                  : 'bg-slate-800/50 border-slate-700 focus:bg-slate-800 text-white'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className={`border-b ${isLight ? 'bg-slate-100 border-black' : 'bg-black border-white/20'}`}>
              <th className={`px-6 py-4 font-bold cursor-pointer ${isLight ? 'text-black' : 'text-white'} hover:text-amber-500`} onClick={() => requestSort('nama')}>
                <div className="flex items-center space-x-2">
                   <span>Penyulang</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className={`px-6 py-4 font-bold text-center cursor-pointer ${isLight ? 'text-black' : 'text-white'} hover:text-amber-500`} onClick={() => requestSort('count')}>
                <div className="flex items-center justify-center space-x-2">
                  <span>Jumlah Gangguan</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {sortedData.map((item, idx) => (
              <tr key={idx} className={`group transition-colors ${
                isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'
              }`}>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1">
                    <div className="font-bold text-sm">{item.nama}</div>
                    <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      ID: {penyulangMaster.find(p => p.nama === item.nama)?.kode || 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center font-bold">
                  {item.count} <span className="text-[10px] font-normal text-slate-500">Gangguan</span>
                </td>
              </tr>
            ))}

            {sortedData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic font-medium">
                  Tidak ada data tersedia untuk periode ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
