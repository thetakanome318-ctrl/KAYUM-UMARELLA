import React from 'react';
import { ROWRecord } from '../types';
import { formatBulan, formatNumber } from '../utils/calculations';
import { Edit3, Trash2, PowerOff, ShieldAlert, TreePine, Eye } from 'lucide-react';

interface DataTableProps {
  records: ROWRecord[];
  onEditRecord: (record: ROWRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteAllRecords?: () => void;
  isReadOnly?: boolean;
  isLight?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  records,
  onEditRecord,
  onDeleteRecord,
  onDeleteAllRecords,
  isReadOnly = false,
  isLight = false,
}) => {
  if (records.length === 0) {
    return (
      <div className={`rounded-xl border p-12 text-center transition-all ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-800 shadow-xs' 
          : 'bg-slate-900 border-slate-800 text-slate-300 shadow-lg'
      }`}>
        <p className="text-sm font-semibold">Tidak ada data temuan ROW yang cocok.</p>
        <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Tambah Data Form" untuk menambahkan data baru.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${
      isLight 
        ? 'bg-white border-slate-200 text-slate-800 shadow-xs' 
        : 'bg-slate-900 border-slate-800 text-slate-300 shadow-lg'
    }`}>
      {/* Table Header Bar */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between transition-colors duration-300 ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
      }`}>
        <span className="text-xs font-bold">
          Menampilkan <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{records.length} Baris</span> Data Section ROW
        </span>

        {onDeleteAllRecords && (
          <button
            onClick={onDeleteAllRecords}
            className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition flex items-center space-x-1 cursor-pointer active:scale-95"
            title="Hapus Seluruh Data Pada Tabel"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Hapus Semua Data</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${
              isLight ? 'bg-slate-100 text-slate-700 border-b border-slate-200' : 'bg-slate-950 text-slate-200'
            }`}>
              <th className="py-3 px-3">Bulan</th>
              <th className="py-3 px-3">Penyulang</th>
              <th className="py-3 px-3">Section</th>
              <th className="py-3 px-3 text-right">Target KMS</th>
              <th className="py-3 px-3 text-right">Realisasi KMS</th>
              <th className="py-3 px-3 text-right">Realisasi Gawang</th>
              <th className="py-3 px-3 text-center">Realisasi / Temuan</th>
              <th className="py-3 px-3 text-center text-purple-600 dark:text-purple-300">Luar Temuan</th>
              <th className="py-3 px-3">Kendala (Opsional)</th>
              <th className="py-3 px-3">Catatan</th>
              <th className="py-3 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className={`divide-y text-xs transition-colors duration-300 ${isLight ? 'divide-slate-100 text-slate-800' : 'divide-slate-800/80 text-slate-300'}`}>
            {records.map((r, idx) => {
              const pctKms = r.targetKms > 0 ? (r.realisasiKms / r.targetKms) * 100 : 0;
              const pctTemuan = r.jumlahTemuan > 0 ? (r.realisasiTemuan / r.jumlahTemuan) * 100 : 0;

              return (
                <tr
                  key={r.id}
                  className={`transition-colors duration-300 hover:bg-emerald-500/5 ${
                    isLight 
                      ? (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50') 
                      : (idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/60')
                  }`}
                >
                  {/* Bulan & Tahun */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>{formatBulan(r.bulan)}</div>
                  </td>

                  {/* Penyulang */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {r.penyulang ? (
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{r.penyulang}</span>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-normal italic">Umum / Non-Penyulang</span>
                    )}
                  </td>

                  {/* Section */}
                  <td className={`py-3 px-3 font-semibold max-w-[200px] truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`} title={r.section}>
                    {r.section}
                  </td>

                  {/* Target KMS */}
                  <td className={`py-3 px-3 text-right font-medium whitespace-nowrap ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {formatNumber(r.targetKms, 2)} KMS
                  </td>

                  {/* Realisasi KMS */}
                  <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    {formatNumber(r.realisasiKms, 2)} KMS
                    <span className="block text-[10px] font-semibold">
                      ({pctKms.toFixed(0)}%)
                    </span>
                  </td>

                  {/* Realisasi Gawang */}
                  <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                    {formatNumber(r.realisasiGawang)} Gawang
                  </td>

                  {/* Realisasi / Temuan */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className={`font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {r.realisasiTemuan}
                    </span>
                    <span className="text-slate-400 font-normal"> / {r.jumlahTemuan}</span>
                    <div className={`mt-1 w-16 mx-auto rounded-full h-1.5 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-950'}`}>
                      <div
                        className={`h-1.5 rounded-full ${pctTemuan >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(pctTemuan, 100)}%` }}
                      />
                    </div>
                  </td>

                  {/* Luar Temuan (Insidental) */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {(r.luarTemuan || 0) > 0 || (r.realisasiLuarTemuan || 0) > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className={`font-bold ${isLight ? 'text-purple-800' : 'text-purple-300'}`}>
                          {r.realisasiLuarTemuan || 0} / {r.luarTemuan || 0}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${
                          isLight ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-purple-950/40 text-purple-300 border-purple-500/30'
                        }`}>
                          Luar Target
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-normal italic">-</span>
                    )}
                  </td>

                  {/* Kendala Badges (Opsional) */}
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {r.perluPadam && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200" title="Perlu Padam">
                          <PowerOff className="w-2.5 h-2.5 mr-1 text-amber-600" />
                          Padam {r.jumlahPerluPadam ? `(${r.jumlahPerluPadam})` : ''}
                        </span>
                      )}

                      {r.tidakAdaIzin && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-800 border border-rose-200" title="Perlu Izin">
                          <ShieldAlert className="w-2.5 h-2.5 mr-1 text-rose-600" />
                          Izin {r.jumlahTidakAdaIzin ? `(${r.jumlahTidakAdaIzin})` : ''}
                        </span>
                      )}

                      {r.pohonBesar && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200" title="Pohon Besar">
                          <TreePine className="w-2.5 h-2.5 mr-1 text-blue-600" />
                          P.Besar {r.jumlahPohonBesar ? `(${r.jumlahPohonBesar})` : ''}
                        </span>
                      )}

                      {!r.perluPadam && !r.tidakAdaIzin && !r.pohonBesar && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Lancar (Tanpa Kendala)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Catatan */}
                  <td className="py-3 px-3 text-slate-500 max-w-[180px] truncate font-medium" title={r.catatan || ''}>
                    {r.catatan || '-'}
                  </td>

                  {/* Aksi */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      {isReadOnly ? (
                        <button
                          onClick={() => onEditRecord(r)}
                          title="Lihat Detail Temuan"
                          className="px-2 py-1 text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-sky-600" />
                          <span>Detail</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onEditRecord(r)}
                            title="Edit Record"
                            className={`p-1.5 rounded transition cursor-pointer ${
                              isLight 
                                ? 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50' 
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            title="Hapus Record"
                            className={`p-1.5 rounded transition cursor-pointer ${
                              isLight 
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                                : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
