import React from 'react';
import { ROWRecord } from '../types';
import { formatBulan, formatNumber } from '../utils/calculations';
import { Edit3, Trash2, PowerOff, ShieldAlert, TreePine, CheckCircle2 } from 'lucide-react';

interface DataTableProps {
  records: ROWRecord[];
  onEditRecord: (record: ROWRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteAllRecords?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  records,
  onEditRecord,
  onDeleteRecord,
  onDeleteAllRecords,
}) => {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-sm font-semibold text-slate-600">Tidak ada data temuan ROW yang cocok.</p>
        <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Tambah Data Form" untuk menambahkan data baru.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Bar */}
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">
          Menampilkan <span className="text-emerald-600">{records.length} Baris</span> Data Section ROW
        </span>

        {onDeleteAllRecords && (
          <button
            onClick={onDeleteAllRecords}
            className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition flex items-center space-x-1"
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
            <tr className="bg-slate-900 text-slate-200 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-3">Bulan</th>
              <th className="py-3 px-3">Penyulang</th>
              <th className="py-3 px-3">Section</th>
              <th className="py-3 px-3 text-right">Target KMS</th>
              <th className="py-3 px-3 text-right">Realisasi KMS</th>
              <th className="py-3 px-3 text-right">Realisasi Gawang</th>
              <th className="py-3 px-3 text-center">Realisasi / Temuan</th>
              <th className="py-3 px-3 text-center text-purple-300">Luar Temuan</th>
              <th className="py-3 px-3">Kendala (Opsional)</th>
              <th className="py-3 px-3">Catatan</th>
              <th className="py-3 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {records.map((r, idx) => {
              const pctKms = r.targetKms > 0 ? (r.realisasiKms / r.targetKms) * 100 : 0;
              const pctTemuan = r.jumlahTemuan > 0 ? (r.realisasiTemuan / r.jumlahTemuan) * 100 : 0;

              return (
                <tr
                  key={r.id}
                  className={`hover:bg-slate-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                >
                  {/* Bulan & Tahun */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{formatBulan(r.bulan)}</div>
                  </td>

                  {/* Penyulang */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {r.penyulang ? (
                      <span className="font-bold text-slate-900">{r.penyulang}</span>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-normal italic">Umum / Non-Penyulang</span>
                    )}
                  </td>

                  {/* Section */}
                  <td className="py-3 px-3 font-medium text-slate-800 max-w-[200px] truncate" title={r.section}>
                    {r.section}
                  </td>

                  {/* Target KMS */}
                  <td className="py-3 px-3 text-right font-medium text-slate-600 whitespace-nowrap">
                    {formatNumber(r.targetKms, 2)} KMS
                  </td>

                  {/* Realisasi KMS */}
                  <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                    {formatNumber(r.realisasiKms, 2)} KMS
                    <span className="block text-[10px] text-emerald-600 font-normal">
                      ({pctKms.toFixed(0)}%)
                    </span>
                  </td>

                  {/* Realisasi Gawang */}
                  <td className="py-3 px-3 text-right font-bold text-cyan-700 whitespace-nowrap">
                    {formatNumber(r.realisasiGawang)} Gawang
                  </td>

                  {/* Realisasi / Temuan */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="font-bold text-slate-900">
                      {r.realisasiTemuan}
                    </span>
                    <span className="text-slate-400 font-normal"> / {r.jumlahTemuan}</span>
                    <div className="mt-1 w-16 mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden">
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
                        <span className="font-bold text-purple-700">
                          {r.realisasiLuarTemuan || 0} / {r.luarTemuan || 0}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 font-semibold">
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
                  <td className="py-3 px-3 text-slate-500 max-w-[180px] truncate" title={r.catatan || ''}>
                    {r.catatan || '-'}
                  </td>

                  {/* Aksi */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onEditRecord(r)}
                        title="Edit Record"
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        title="Hapus Record"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
