import { ROWRecord, KPIStats } from '../types';

export function calculateKPIStats(records: ROWRecord[]): KPIStats {
  const totalTemuan = records.reduce((acc, r) => acc + (r.jumlahTemuan || 0), 0);
  const totalRealisasiTemuan = records.reduce((acc, r) => acc + (r.realisasiTemuan || 0), 0);
  const persentaseTemuan = totalTemuan > 0 ? (totalRealisasiTemuan / totalTemuan) * 100 : 0;

  const totalLuarTemuan = records.reduce((acc, r) => acc + (r.luarTemuan || 0), 0);
  const totalRealisasiLuarTemuan = records.reduce((acc, r) => acc + (r.realisasiLuarTemuan || 0), 0);

  const totalTargetKms = records.reduce((acc, r) => acc + (r.targetKms || 0), 0);
  const totalRealisasiKms = records.reduce((acc, r) => acc + (r.realisasiKms || 0), 0);
  const persentaseKms = totalTargetKms > 0 ? (totalRealisasiKms / totalTargetKms) * 100 : 0;

  const totalRealisasiGawang = records.reduce((acc, r) => acc + (r.realisasiGawang || 0), 0);

  const totalPerluPadam = records.reduce((acc, r) => {
    if (r.jumlahPerluPadam !== undefined && r.jumlahPerluPadam > 0) {
      return acc + r.jumlahPerluPadam;
    }
    return acc + (r.perluPadam ? 1 : 0);
  }, 0);

  const totalPerluIzin = records.reduce((acc, r) => {
    if (r.jumlahTidakAdaIzin !== undefined && r.jumlahTidakAdaIzin > 0) {
      return acc + r.jumlahTidakAdaIzin;
    }
    return acc + (r.tidakAdaIzin ? 1 : 0);
  }, 0);

  const totalPohonBesar = records.reduce((acc, r) => {
    if (r.jumlahPohonBesar !== undefined && r.jumlahPohonBesar > 0) {
      return acc + r.jumlahPohonBesar;
    }
    return acc + (r.pohonBesar ? 1 : 0);
  }, 0);

  return {
    totalTemuan,
    totalRealisasiTemuan,
    persentaseTemuan,
    totalLuarTemuan,
    totalRealisasiLuarTemuan,
    totalTargetKms,
    totalRealisasiKms,
    persentaseKms,
    totalRealisasiGawang,
    totalPerluPadam,
    totalPerluIzin,
    totalPohonBesar,
  };
}

export function formatBulan(bulanStr: string): string {
  if (!bulanStr || bulanStr === 'ALL') return 'Semua Bulan';
  const parts = bulanStr.split('-');
  if (parts.length < 2) return bulanStr;
  
  const bulanNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const monthIdx = parseInt(parts[1], 10) - 1;
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${bulanNames[monthIdx]} ${parts[0]}`;
  }
  return bulanStr;
}

export function formatNumber(val: number, decimals: number = 0): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}
