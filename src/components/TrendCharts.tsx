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
  BarChart,
  LineChart
} from 'recharts';
import { ROWRecord } from '../types';
import { formatBulan } from '../utils/calculations';
import { MonthlyTargetItem } from '../utils/targetStorage';
import { themeStyles } from '../utils/themeHelper';

interface TrendChartsProps {
  records: ROWRecord[];
  monthlyTargetsMap?: Record<string, MonthlyTargetItem>;
  isLight?: boolean;
}

export const TrendCharts: React.FC<TrendChartsProps> = ({ records, monthlyTargetsMap, isLight = false }) => {
  // Aggregate data by month for timeline trend chart
  const monthlyTrendData = useMemo(() => {
    const monthMap: Record<string, {
      bulanKey: string;
      label: string;
      totalTemuan: number;
      realisasiTemuan: number;
      realisasiKms: number;
      realisasiGawang: number;
      persentaseTemuan: number;
    }> = {};

    records.forEach((r) => {
      const key = r.bulan;
      if (!monthMap[key]) {
        monthMap[key] = {
          bulanKey: key,
          label: formatBulan(key),
          totalTemuan: 0,
          realisasiTemuan: 0,
          realisasiKms: 0,
          realisasiGawang: 0,
          persentaseTemuan: 0,
        };
      }
      monthMap[key].totalTemuan += r.jumlahTemuan || 0;
      monthMap[key].realisasiTemuan += r.realisasiTemuan || 0;
      monthMap[key].realisasiKms += r.realisasiKms || 0;
      monthMap[key].realisasiGawang += r.realisasiGawang || 0;
    });

    return Object.values(monthMap)
      .sort((a, b) => a.bulanKey.localeCompare(b.bulanKey))
      .map((item) => ({
        ...item,
        persentaseTemuan: item.totalTemuan > 0 ? Number(((item.realisasiTemuan / item.totalTemuan) * 100).toFixed(1)) : 0,
        realisasiKms: Number(item.realisasiKms.toFixed(1)),
      }));
  }, [records, monthlyTargetsMap]);

  // Aggregate monthly gangguan trend by penyulang or overall monthly gangguan count
  const monthlyGangguanTrendData = useMemo(() => {
    const monthMap: Record<string, {
      bulanKey: string;
      label: string;
      jumlahGangguan: number;
    }> = {};

    records.forEach((r) => {
      if (r.gangguan === true) {
        const key = r.bulan;
        if (!monthMap[key]) {
          monthMap[key] = {
            bulanKey: key,
            label: formatBulan(key),
            jumlahGangguan: 0,
          };
        }
        monthMap[key].jumlahGangguan += 1;
      }
    });

    return Object.values(monthMap).sort((a, b) => a.bulanKey.localeCompare(b.bulanKey));
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
      
      {/* CHART NEW: Tren Kenaikan / Penurunan Jumlah Gangguan Penyulang dari Bulan ke Bulan */}
      <div className={`rounded-xl border p-4 sm:p-5 shadow-sm transition-all ${themeStyles.cardBg(isLight)}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b mb-4 gap-2 ${themeStyles.divider(isLight)}`}>
          <div>
            <h3 className={`text-base font-bold ${themeStyles.textTitle(isLight)}`}>
              Tren Bulanan Jumlah Gangguan Penyulang (Evaluasi Efektivitas ROW)
            </h3>
            <p className={`text-xs ${themeStyles.textSubtitle(isLight)}`}>
              Membandingkan fluktuasi penurunan atau kenaikan frekuensi gangguan dari bulan ke bulan
            </p>
          </div>
          <div className={`flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-lg border ${
            isLight 
              ? 'bg-rose-50 border-rose-100 text-rose-600' 
              : 'bg-rose-950/40 border-rose-900/50 text-rose-400'
          }`}>
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block animate-pulse" />
            <span>Tracking Gangguan Penyulang</span>
          </div>
        </div>

        <div className="h-72 w-full">
          {monthlyGangguanTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyGangguanTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.chartGrid(isLight)} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: themeStyles.chartText(isLight) }} axisLine={{ stroke: themeStyles.chartAxis(isLight) }} />
                <YAxis tick={{ fontSize: 12, fill: themeStyles.chartText(isLight) }} axisLine={{ stroke: themeStyles.chartAxis(isLight) }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: themeStyles.chartTooltipBg(isLight),
                    borderColor: themeStyles.chartTooltipBorder(isLight),
                    borderRadius: '8px',
                    color: themeStyles.chartTooltipTextColor(isLight),
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [`${value} gangguan`, 'Jumlah Gangguan']}
                />
                <Line 
                  type="monotone" 
                  dataKey="jumlahGangguan" 
                  name="Jumlah Gangguan" 
                  stroke="#e11d48" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#e11d48', strokeWidth: 2, stroke: isLight ? '#fff' : '#0f172a' }} 
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-full flex items-center justify-center text-xs ${themeStyles.textMuted(isLight)}`}>
              Tidak ada data gangguan tercatat untuk perbandingan bulanan.
            </div>
          )}
        </div>
      </div>

      {/* CHART 1: Tren Penyelesaian Temuan Dari Waktu ke Waktu */}
      <div className={`rounded-xl border p-4 sm:p-5 shadow-sm transition-all ${themeStyles.cardBg(isLight)}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b mb-4 gap-2 ${themeStyles.divider(isLight)}`}>
          <div>
            <h3 className={`text-base font-bold ${themeStyles.textTitle(isLight)}`}>
              Grafik Tren Penyelesaian Temuan Pohon (Temuan vs Realisasi)
            </h3>
            <p className={`text-xs ${themeStyles.textSubtitle(isLight)}`}>
              Komparasi akumulasi temuan pohon vs realisasi pemangkasan per bulan beserta % persentase penyelesaian
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className={`flex items-center ${themeStyles.textBody(isLight)}`}>
              <span className="w-3 h-3 bg-amber-400 rounded-sm mr-1.5 inline-block" />
              Target Temuan
            </span>
            <span className={`flex items-center ${themeStyles.textBody(isLight)}`}>
              <span className="w-3 h-3 bg-emerald-500 rounded-sm mr-1.5 inline-block" />
              Realisasi Temuan
            </span>
            <span className={`flex items-center ${themeStyles.textBody(isLight)}`}>
              <span className="w-3 h-0.5 bg-blue-600 mr-1.5 inline-block" />
              % Realisasi
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.chartGrid(isLight)} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: themeStyles.chartText(isLight) }} axisLine={{ stroke: themeStyles.chartAxis(isLight) }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: themeStyles.chartText(isLight) }} axisLine={{ stroke: themeStyles.chartAxis(isLight) }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#3b82f6' }} axisLine={{ stroke: '#93c5fd' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: themeStyles.chartTooltipBg(isLight),
                    borderColor: themeStyles.chartTooltipBorder(isLight),
                    borderRadius: '8px',
                    color: themeStyles.chartTooltipTextColor(isLight),
                    fontSize: '12px'
                  }}
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
            <div className={`h-full flex items-center justify-center text-xs ${themeStyles.textMuted(isLight)}`}>
              Tidak ada data temuan untuk filter saat ini.
            </div>
          )}
        </div>
      </div>

      {/* Kendala Lapangan Chart (Perlu Padam, Perlu Izin, Pohon Besar) */}
      <div className={`rounded-xl border p-4 sm:p-5 shadow-sm transition-all ${themeStyles.cardBg(isLight)}`}>
        <div className={`pb-3 border-b mb-4 ${themeStyles.divider(isLight)}`}>
          <h3 className={`text-sm font-bold ${themeStyles.textTitle(isLight)}`}>
            Analisis Kendala Per Penyulang (Izin / Padam / Pohon Besar)
          </h3>
          <p className={`text-xs ${themeStyles.textSubtitle(isLight)}`}>
            Jumlah titik kendala teknis & sosial yang mempengaruhi percepatan pemangkasan
          </p>
        </div>
        <div className="h-60 w-full">
          {penyulangObstacleData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={penyulangObstacleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.chartGrid(isLight)} vertical={false} />
                <XAxis dataKey="penyulang" tick={{ fontSize: 10, fill: themeStyles.chartText(isLight) }} />
                <YAxis tick={{ fontSize: 11, fill: themeStyles.chartText(isLight) }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: themeStyles.chartTooltipBg(isLight),
                    borderColor: themeStyles.chartTooltipBorder(isLight),
                    borderRadius: '8px',
                    color: themeStyles.chartTooltipTextColor(isLight),
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'perluPadam') return [`${value} titik`, 'Perlu Padam'];
                    if (name === 'perluIzin') return [`${value} titik`, 'Perlu Izin'];
                    if (name === 'pohonBesar') return [`${value} pohon`, 'Pohon Besar'];
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: isLight ? '#475569' : '#cbd5e1' }} />
                <Bar dataKey="perluPadam" name="Perlu Padam" fill="#f59e0b" stackId="a" />
                <Bar dataKey="perluIzin" name="Perlu Izin" fill="#e11d48" stackId="a" />
                <Bar dataKey="pohonBesar" name="Pohon Besar" fill="#2563eb" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-full flex items-center justify-center text-xs ${themeStyles.textMuted(isLight)}`}>
              Tidak ada data kendala.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

