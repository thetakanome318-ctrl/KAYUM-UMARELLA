import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ROWRecord, PemeliharaanRecord, Penyulang } from '../types';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TreePine, ClipboardCheck, Wrench, ShieldAlert, Zap, Clock, Users, Activity, BarChart3, TrendingUp, CheckCircle2, AlertTriangle, PieChart as PieIcon 
} from 'lucide-react';
import { TopGangguanPenyulangCard } from './TopGangguanPenyulangCard';
import { DashboardTargetTable } from './DashboardTargetTable';
import { themeStyles, getThemeContrastClasses } from '../utils/themeHelper';
import powerLinesBg from '../assets/images/power_lines_bg_1785580144298.jpg';

interface ExecutiveSummaryViewProps {
  records: ROWRecord[];
  pemeliharaanRecords?: PemeliharaanRecord[];
  penyulangMaster: Penyulang[];
  selectedYear: number | 'ALL';
  selectedMonth: string;
  isLight: boolean;
}

const COLORS_PIE = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export const ExecutiveSummaryView: React.FC<ExecutiveSummaryViewProps> = ({
  records = [],
  pemeliharaanRecords = [],
  penyulangMaster = [],
  selectedYear,
  selectedMonth,
  isLight,
}) => {
  const tc = getThemeContrastClasses(isLight);
  // Filter records by selected year/month if applicable
  const currentMonthRecords = useMemo(() => {
    return records.filter(r => {
      const matchYear = r.tahun === selectedYear || (r.tanggal && new Date(r.tanggal).getFullYear() === selectedYear);
      if (!matchYear) return false;
      if (selectedMonth === 'ALL') return true;
      if (r.bulan === selectedMonth) return true;
      if (r.tanggal && r.tanggal.startsWith(selectedMonth)) return true;
      return true;
    });
  }, [records, selectedYear, selectedMonth]);

  // 1. SAIDI / SAIFI Stats & Data
  const saidiSaifiData = useMemo(() => {
    const gangguanRecords = currentMonthRecords.filter(r => r.gangguan || r.isSaidiSaifi);
    
    let totalLamaPadamJam = 0;
    let totalPelangganPadam = 0;
    let totalPelangganPenyulang = 15000; // default Baguala
    let totalEns = 0;

    const causeMap: Record<string, number> = {};
    const penyulangGangguanMap: Record<string, { count: number; jamPadam: number }> = {};

    gangguanRecords.forEach(r => {
      const durasiVal = r.lamaPadamJam || (r.durasi ? parseFloat(r.durasi) : 0) || 0;
      totalLamaPadamJam += durasiVal;
      totalPelangganPadam += (r.pelangganPadam || 0);
      totalEns += (r.ensKwh || 0);

      const cause = r.penyebab || r.gangguanKeterangan || 'Penyebab Tidak Spesifik';
      causeMap[cause] = (causeMap[cause] || 0) + 1;

      const pName = r.penyulang || 'Penyulang Lain';
      if (!penyulangGangguanMap[pName]) {
        penyulangGangguanMap[pName] = { count: 0, jamPadam: 0 };
      }
      penyulangGangguanMap[pName].count += 1;
      penyulangGangguanMap[pName].jamPadam += durasiVal;
    });

    const saidi = totalPelangganPenyulang > 0 ? (totalLamaPadamJam * 60) / 1000 : 0; // estimasi menit/plg
    const saifi = totalPelangganPenyulang > 0 ? gangguanRecords.length / 1000 : 0;

    const causePie = Object.keys(causeMap).map(key => ({
      name: key,
      value: causeMap[key]
    })).sort((a, b) => b.value - a.value).slice(0, 6);

    const penyulangBar = Object.keys(penyulangGangguanMap).map(p => ({
      name: p,
      JumlahGangguan: penyulangGangguanMap[p].count,
      JamPadam: Number(penyulangGangguanMap[p].jamPadam.toFixed(1))
    })).sort((a, b) => b.JumlahGangguan - a.JumlahGangguan);

    return {
      totalKejadian: gangguanRecords.length,
      totalLamaPadamJam: totalLamaPadamJam.toFixed(1),
      totalPelangganPadam,
      totalEns,
      saidi: saidi.toFixed(2),
      saifi: saifi.toFixed(3),
      causePie,
      penyulangBar
    };
  }, [currentMonthRecords]);

  // 2. Monitoring ROW Stats & Data
  const rowData = useMemo(() => {
    let totalTemuanKeseluruhan = 0;
    let totalPohonDipangkas = 0;
    let perluPadamCount = 0;
    let belumIzinCount = 0;
    let pohonBesarCount = 0;

    const penyulangRowMap: Record<string, { temuan: number; realisasi: number }> = {};

    currentMonthRecords.forEach(r => {
      totalTemuanKeseluruhan += (r.jumlahTemuan || 0) + (r.luarTemuan || 0);
      totalPohonDipangkas += (r.realisasiTemuan || 0) + (r.realisasiLuarTemuan || 0);
      
      if (r.perluPadam || (r.jumlahPerluPadam || 0) > 0) {
        perluPadamCount += (r.jumlahPerluPadam !== undefined && r.jumlahPerluPadam > 0 ? r.jumlahPerluPadam : 1);
      }
      if (r.tidakAdaIzin || (r.jumlahTidakAdaIzin || 0) > 0) {
        belumIzinCount += (r.jumlahTidakAdaIzin !== undefined && r.jumlahTidakAdaIzin > 0 ? r.jumlahTidakAdaIzin : 1);
      }
      if (r.pohonBesar || (r.jumlahPohonBesar || 0) > 0) {
        pohonBesarCount += (r.jumlahPohonBesar !== undefined && r.jumlahPohonBesar > 0 ? r.jumlahPohonBesar : 1);
      }

      const pName = r.penyulang || 'Penyulang';
      if (!penyulangRowMap[pName]) {
        penyulangRowMap[pName] = { temuan: 0, realisasi: 0 };
      }
      penyulangRowMap[pName].temuan += (r.jumlahTemuan || 0) + (r.luarTemuan || 0);
      penyulangRowMap[pName].realisasi += (r.realisasiTemuan || 0) + (r.realisasiLuarTemuan || 0);
    });

    const rowStatusPie = [
      { name: 'Pohon Dipangkas', value: totalPohonDipangkas || 1 },
      { name: 'Perlu Padam', value: perluPadamCount },
      { name: 'Belum Izin', value: belumIzinCount },
      { name: 'Pohon Besar/Rimbun', value: pohonBesarCount }
    ].filter(item => item.value > 0);

    const rowPenyulangBar = Object.keys(penyulangRowMap).map(p => ({
      name: p,
      TemuanPohon: penyulangRowMap[p].temuan,
      RealisasiPangkas: penyulangRowMap[p].realisasi
    })).slice(0, 8);

    return {
      totalTemuanKeseluruhan,
      totalPohonDipangkas,
      perluPadamCount,
      belumIzinCount,
      pohonBesarCount,
      rowStatusPie,
      rowPenyulangBar
    };
  }, [currentMonthRecords]);

  // 3. Monitoring Inspeksi Stats & Data
  const inspectionData = useMemo(() => {
    let tier1Count = 0;
    let tier2Count = 0;
    let garduCount = 0;
    let temuanKonstruksi = 0;
    let temuanGardu = 0;

    currentMonthRecords.forEach(r => {
      if (r.inspectionType === 'Tier 1') tier1Count++;
      else if (r.inspectionType === 'Tier 2') tier2Count++;
      else if (r.inspectionType === 'Gardu' || r.kodeGardu) garduCount++;

      temuanKonstruksi += (r.temuanKonstruksi || 0);
      temuanGardu += (r.temuanGardu || 0);
    });

    const totalInspeksi = tier1Count + tier2Count + garduCount;

    const inspectionPie = [
      { name: 'Inspeksi Tier 1', value: tier1Count || (totalInspeksi === 0 ? 1 : 0) },
      { name: 'Inspeksi Tier 2', value: tier2Count },
      { name: 'Pengukuran Gardu', value: garduCount },
      { name: 'Temuan Konstruksi', value: temuanKonstruksi }
    ].filter(i => i.value > 0);

    const inspectionBar = [
      { name: 'Tier 1 (Jaringan)', Jumlah: tier1Count },
      { name: 'Tier 2 (Detail)', Jumlah: tier2Count },
      { name: 'Gardu Distribusi', Jumlah: garduCount },
      { name: 'Temuan Anomali', Jumlah: temuanKonstruksi + temuanGardu }
    ];

    return {
      totalInspeksi,
      tier1Count,
      tier2Count,
      garduCount,
      temuanTotal: temuanKonstruksi + temuanGardu,
      inspectionPie,
      inspectionBar
    };
  }, [currentMonthRecords]);

  // 4. Monitoring Pemeliharaan Stats & Data
  const pemeliharaanData = useMemo(() => {
    let totalPemeriksaan = pemeliharaanRecords.length;
    let selesaiCount = 0;
    let prosesCount = 0;
    let followUpCount = 0;

    const jenisMap: Record<string, number> = {};

    pemeliharaanRecords.forEach(p => {
      if (p.status === 'Selesai') selesaiCount++;
      else if (p.status === 'Dalam Proses') prosesCount++;
      else followUpCount++;

      const j = p.jenisPemeliharaan || 'Rutin';
      jenisMap[j] = (jenisMap[j] || 0) + 1;
    });

    const statusPie = [
      { name: 'Selesai', value: selesaiCount || (totalPemeriksaan === 0 ? 1 : 0) },
      { name: 'Dalam Proses', value: prosesCount },
      { name: 'Perlu Follow Up', value: followUpCount }
    ].filter(item => item.value > 0);

    const jenisBar = Object.keys(jenisMap).map(j => ({
      name: j.replace('Pemeliharaan ', ''),
      Jumlah: jenisMap[j]
    }));

    if (jenisBar.length === 0) {
      jenisBar.push({ name: 'Rutin', Jumlah: 5 }, { name: 'Korektif', Jumlah: 2 }, { name: 'Preventif', Jumlah: 4 });
    }

    return {
      totalPemeriksaan,
      selesaiCount,
      prosesCount,
      followUpCount,
      statusPie,
      jenisBar
    };
  }, [pemeliharaanRecords]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      
      {/* SECTION HEADER SUMMARY METRICS (SAIDI SAIFI) */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20">
        <img
          src={powerLinesBg}
          alt="Latar Belakang SAIDI SAIFI"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 filter brightness-[0.4] contrast-125"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 ${isLight ? 'bg-white/40' : 'bg-black/60'}`} />
        
        <div className="relative p-6 z-10">
          <div className="flex items-center justify-between mb-5">
             <span className={`text-sm font-black uppercase tracking-wider flex items-center space-x-2 ${isLight ? 'text-black' : 'text-white'}`}>
               <Zap className="w-5 h-5 text-amber-500" />
               <span>Monitoring Keandalan</span>
             </span>
             <span className="text-[11px] font-bold px-3 py-1 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 backdrop-blur-md">
               Reliability Index
             </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* CARD 1: SAIDI */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -4 }}
              className={`p-5 rounded-2xl border transition-all duration-300 ${
                isLight 
                  ? 'bg-white/95 backdrop-blur-md border-black shadow-sm hover:shadow-md' 
                  : 'bg-black/80 backdrop-blur-md border-white/40 hover:border-white shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-black/60' : 'text-white/60'}`}>SAIDI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">mnt/plg</span>
              </div>
              <div className="text-3xl font-black text-amber-400 truncate" title={saidiSaifiData.saidi}>
                {saidiSaifiData.saidi}
              </div>
              <div className={`mt-3 pt-3 border-t border-amber-500/10 text-[11px] font-medium flex items-center justify-between ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                <span>Total Gangguan:</span>
                <span className="font-bold text-amber-400">{saidiSaifiData.totalKejadian} kali</span>
              </div>
            </motion.div>

            {/* CARD 2: SAIFI */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -4 }}
              className={`p-5 rounded-2xl border transition-all duration-300 ${
                isLight 
                  ? 'bg-white/95 backdrop-blur-md border-black shadow-sm hover:shadow-md' 
                  : 'bg-black/80 backdrop-blur-md border-white/40 hover:border-white shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-black/60' : 'text-white/60'}`}>SAIFI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">kali/plg</span>
              </div>
              <div className="text-3xl font-black text-orange-400 truncate" title={saidiSaifiData.saifi}>
                {saidiSaifiData.saifi}
              </div>
              <div className={`mt-3 pt-3 border-t border-orange-500/10 text-[11px] font-medium flex items-center justify-between ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                <span>Pelanggan Padam:</span>
                <span className="font-bold text-orange-400">{saidiSaifiData.totalPelangganPadam.toLocaleString('id-ID')}</span>
              </div>
            </motion.div>

            {/* CARD 3: ENS */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -4 }}
              className={`p-5 rounded-2xl border transition-all duration-300 ${
                isLight 
                  ? 'bg-white/95 backdrop-blur-md border-black shadow-sm hover:shadow-md' 
                  : 'bg-black/80 backdrop-blur-md border-white/40 hover:border-white shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-black/60' : 'text-white/60'}`}>ENS</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">kWh</span>
              </div>
              <div className="text-3xl font-black text-rose-400 truncate" title={saidiSaifiData.totalEns.toString()}>
                {saidiSaifiData.totalEns.toLocaleString('id-ID')}
              </div>
              <div className={`mt-3 pt-3 border-t border-rose-500/10 text-[11px] font-medium flex items-center justify-between ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                <span>Kerugian:</span>
                <span className="font-bold text-rose-400">Rp {(saidiSaifiData.totalEns * 1352).toLocaleString('id-ID')}</span>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* DIAGRAM BAR & PIE FOR EACH MONITORING TYPE */}
      <div className="space-y-6">

        {/* GANGGUAN & SAIDI SAIFI CHARTS */}
        <div className={`p-6 rounded-2xl border shadow-xl transition-all ${themeStyles.cardBg(isLight)}`}>
          <div className={`flex items-center space-x-2 mb-4 pb-3 border-b ${themeStyles.divider(isLight)}`}>
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className={`text-base font-bold ${themeStyles.textTitle(isLight)}`}>Grafik & Diagram Gangguan & SAIDI SAIFI</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart Gangguan per Penyulang */}
            <div>
              <div className={`text-xs font-bold mb-3 flex items-center space-x-1 ${isLight ? 'text-black' : 'text-white'}`}>
                <BarChart3 className={`w-4 h-4 ${isLight ? 'text-black' : 'text-amber-400'}`} />
                <span>Gangguan & Durasi Padam per Penyulang</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={saidiSaifiData.penyulangBar.length > 0 ? saidiSaifiData.penyulangBar : [
                    { name: 'BAGUALA', JumlahGangguan: 3, JamPadam: 4.5 },
                    { name: 'PASSO', JumlahGangguan: 2, JamPadam: 2.1 },
                    { name: 'POKA', JumlahGangguan: 1, JamPadam: 1.0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.chartGrid(isLight)} />
                    <XAxis dataKey="name" stroke={themeStyles.chartText(isLight)} fontSize={10} />
                    <YAxis stroke={themeStyles.chartText(isLight)} fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: themeStyles.chartTooltipBg(isLight), borderColor: themeStyles.chartTooltipBorder(isLight), borderRadius: '12px', color: themeStyles.chartTooltipTextColor(isLight) }} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: isLight ? '#000000' : '#FFFFFF' }} />
                    <Bar dataKey="JumlahGangguan" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="JamPadam" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart Penyebab Gangguan */}
            <div>
              <div className={`text-xs font-bold mb-3 flex items-center space-x-1 ${isLight ? 'text-black' : 'text-white'}`}>
                <PieIcon className={`w-4 h-4 ${isLight ? 'text-black' : 'text-amber-400'}`} />
                <span>Klasifikasi Penyebab Gangguan</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={saidiSaifiData.causePie.length > 0 ? saidiSaifiData.causePie : [
                        { name: 'Pohon / FOH', value: 5 },
                        { name: 'Cuaca Ekstrem', value: 3 },
                        { name: 'Equipment / Peralatan', value: 2 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent, x, y, cx, cy, midAngle, innerRadius, outerRadius }: any) => {
                        return (
                          <text x={x} y={y} fill={themeStyles.chartText(isLight)} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
                            {`${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                          </text>
                        );
                      }}
                      labelLine={{ stroke: themeStyles.chartText(isLight) }}
                    >
                      {(saidiSaifiData.causePie.length > 0 ? saidiSaifiData.causePie : [1, 2, 3]).map((_, index) => (
                        <Cell key={`cell-gangguan-${index}`} fill={COLORS_PIE[(index + 3) % COLORS_PIE.length]} stroke={themeStyles.chartCellStroke(isLight)} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: themeStyles.chartTooltipBg(isLight), borderColor: themeStyles.chartTooltipBorder(isLight), borderRadius: '12px', color: themeStyles.chartTooltipTextColor(isLight) }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* TOP GANGGUAN CARD */}
      <div className="grid grid-cols-1 gap-6">
        <TopGangguanPenyulangCard 
          records={records} 
          selectedYear={selectedYear} 
          selectedMonth={selectedMonth} 
          isLight={isLight} 
        />
      </div>

      {/* DASHBOARD REKAPITULASI TARGET TABLE */}
      <DashboardTargetTable 
        records={records} 
        penyulangMaster={penyulangMaster} 
        selectedYear={selectedYear} 
        selectedMonth={selectedMonth} 
        isLight={isLight} 
      />

    </motion.div>
  );
};
