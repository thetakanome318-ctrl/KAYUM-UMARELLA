import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  BarChart
} from 'recharts';
import { ROWRecord } from '../types';
import { formatBulan } from '../utils/calculations';

interface TrendChartsProps {
  records: ROWRecord[];
}

export const TrendCharts: React.FC<TrendChartsProps> = ({ records }) => {
  // Aggregate data by month for timeline trend chart
  const monthlyTrendData = useMemo(() => {
    const monthMap: Record<string, {
      bulanKey: string;
      label: string;
      totalTemuan: number;
      realisasiTemuan: number;
      targetKms: number;
      realisasiKms: number;
      realisasiGawang: number;
      persentaseTemuan: number;
      persentaseKms: number;
    }> = {};

    records.forEach((r) => {
      const key = r.bulan;
      if (!monthMap[key]) {
        monthMap[key] = {
          bulanKey: key,
          label: formatBulan(key),
          totalTemuan: 0,
          realisasiTemuan: 0,
          targetKms: 0,
          realisasiKms: 0,
          realisasiGawang: 0,
          persentaseTemuan: 0,
          persentaseKms: 0,
        };
      }
      monthMap[key].totalTemuan += r.jumlahTemuan || 0;
      monthMap[key].realisasiTemuan += r.realisasiTemuan || 0;
      monthMap[key].targetKms += r.targetKms || 0;
      monthMap[key].realisasiKms += r.realisasiKms || 0;
      monthMap[key].realisasiGawang += r.realisasiGawang || 0;
    });

    return Object.values(monthMap)
      .sort((a, b) => a.bulanKey.localeCompare(b.bulanKey))
      .map((item) => ({
        ...item,
        persentaseTemuan: item.totalTemuan > 0 ? Number(((item.realisasiTemuan / item.totalTemuan) * 100).toFixed(1)) : 0,
        persentaseKms: item.targetKms > 0 ? Number(((item.realisasiKms / item.targetKms) * 100).toFixed(1)) : 0,
        targetKms: Number(item.targetKms.toFixed(1)),
        realisasiKms: Number(item.realisasiKms.toFixed(1)),
      }));
  }, [records]);

  // Aggregate data by Penyulang for obstacles breakdown
  const penyulangObstacleData = useMemo(() => {
    const pMap: Record<string, {
      penyulang: string;
      perluPadam: number;
      perluIzin: number;
      pohonBesar: number;
      totalTemuan: number;
      realisasiTemuan: number;
    }> = {};

    records.forEach((r) => {
      const p = r.penyulang || 'Tanpa Penyulang';
      if (!pMap[p]) {
        pMap[p] = {
          penyulang: p.replace('Penyulang ', ''),
          perluPadam: 0,
          perluIzin: 0,
          pohonBesar: 0,
          totalTemuan: 0,
          realisasiTemuan: 0,
        };
      }
      pMap[p].perluPadam += r.jumlahPerluPadam ?? (r.perluPadam ? 1 : 0);
      pMap[p].perluIzin += r.jumlahTidakAdaIzin ?? (r.tidakAdaIzin ? 1 : 0);
      pMap[p].pohonBesar += r.jumlahPohonBesar ?? (r.pohonBesar ? 1 : 0);
      pMap[p].totalTemuan += r.jumlahTemuan || 0;
      pMap[p].realisasiTemuan += r.realisasiTemuan || 0;
    });

    return Object.values(pMap);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* CHART 1: Tren Penyelesaian Temuan Dari Waktu ke Waktu */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Grafik Tren Penyelesaian Temuan Pohon (Temuan vs Realisasi)
            </h3>
            <p className="text-xs text-slate-500">
              Komparasi akumulasi temuan pohon vs realisasi pemangkasan per bulan beserta % persentase penyelesaian
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center text-slate-700">
              <span className="w-3 h-3 bg-amber-400 rounded-sm mr-1.5 inline-block" />
              Target Temuan
            </span>
            <span className="flex items-center text-slate-700">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm mr-1.5 inline-block" />
              Realisasi Temuan
            </span>
            <span className="flex items-center text-slate-700">
              <span className="w-3 h-0.5 bg-blue-600 mr-1.5 inline-block" />
              % Realisasi
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#3b82f6' }} axisLine={{ stroke: '#93c5fd' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any, name: any) => {
                    if (name === 'persentaseTemuan') return [`${value}%`, '% Penyelesaian'];
                    if (name === 'totalTemuan') return [`${value} pohon`, 'Total Temuan'];
                    if (name === 'realisasiTemuan') return [`${value} pohon`, 'Realisasi Pemangkasan'];
                    return [value, name];
                  }}
                />
                <Bar yAxisId="left" dataKey="totalTemuan" name="totalTemuan" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar yAxisId="left" dataKey="realisasiTemuan" name="realisasiTemuan" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                <Line yAxisId="right" type="monotone" dataKey="persentaseTemuan" name="persentaseTemuan" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Tidak ada data temuan untuk filter saat ini.
            </div>
          )}
        </div>
      </div>

      {/* CHART 2: Target KMS Bulanan vs Realisasi KMS & Realisasi Gawang */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* KMS Achievement Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Target Bulanan KMS vs Realisasi KMS
            </h3>
            <p className="text-xs text-slate-500">
              Pengukuran panjang penyulang (KMS) yang telah bebas dari ROW
            </p>
          </div>
          <div className="h-60 w-full">
            {monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis unit=" kms" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'targetKms') return [`${value} KMS`, 'Target KMS'];
                      if (name === 'realisasiKms') return [`${value} KMS`, 'Realisasi KMS'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="targetKms" name="Target KMS" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realisasiKms" name="Realisasi KMS" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Tidak ada data KMS.
              </div>
            )}
          </div>
        </div>

        {/* Kendala Lapangan Chart (Perlu Padam, Perlu Izin, Pohon Besar) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Analisis Kendala Per Penyulang (Izin / Padam / Pohon Besar)
            </h3>
            <p className="text-xs text-slate-500">
              Jumlah titik kendala teknis & sosial yang mempengaruhi percepatan pemangkasan
            </p>
          </div>
          <div className="h-60 w-full">
            {penyulangObstacleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={penyulangObstacleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="penyulang" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'perluPadam') return [`${value} titik`, 'Perlu Padam'];
                      if (name === 'perluIzin') return [`${value} titik`, 'Perlu Izin'];
                      if (name === 'pohonBesar') return [`${value} pohon`, 'Pohon Besar'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="perluPadam" name="Perlu Padam" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="perluIzin" name="Perlu Izin" fill="#e11d48" stackId="a" />
                  <Bar dataKey="pohonBesar" name="Pohon Besar" fill="#2563eb" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Tidak ada data kendala.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
