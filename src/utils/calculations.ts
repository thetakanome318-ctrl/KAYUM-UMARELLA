import { ROWRecord, KPIStats } from '../types';
import { MonthlyTargetItem } from './targetStorage';

export function calculateKPIStats(
  records: ROWRecord[],
  monthlyTargetsMap?: Record<string, MonthlyTargetItem>,
  currentFilter?: { tahun: number | 'ALL'; bulan: string }
): KPIStats {
  const totalTemuanFromRecords = records.reduce((acc, r) => acc + (r.jumlahTemuan || 0), 0);
  const totalRealisasiTemuan = records.reduce((acc, r) => acc + (r.realisasiTemuan || 0), 0);

  const totalLuarTemuan = records.reduce((acc, r) => acc + (r.luarTemuan || 0), 0);
  const totalRealisasiLuarTemuan = records.reduce((acc, r) => acc + (r.realisasiLuarTemuan || 0), 0);

  const totalTargetKmsFromRecords = records.reduce((acc, r) => acc + (r.targetKms || 0), 0);
  const totalRealisasiKms = records.reduce((acc, r) => acc + (r.realisasiKms || 0), 0);

  // Calculate Target KMS, Target Gawang & Target Pohon from Monthly Targets Map if available
  let computedTargetKms = totalTargetKmsFromRecords;
  let computedTargetPohon = totalTemuanFromRecords;
  let computedTargetGawang = 0;

  if (monthlyTargetsMap) {
    let targetKmsSum = 0;
    let targetPohonSum = 0;
    let targetGawangSum = 0;

    if (currentFilter && currentFilter.bulan !== 'ALL') {
      // Specific Month Filter
      const selYear = currentFilter.tahun !== 'ALL' ? Number(currentFilter.tahun) : 2026;
      let monthStr = currentFilter.bulan;
      if (!monthStr.includes('-')) {
        monthStr = `${selYear}-${monthStr.padStart(2, '0')}`;
      }
      const t = monthlyTargetsMap[monthStr];
      if (t) {
        targetKmsSum = t.targetKms;
        targetGawangSum = t.targetGawang || 0;
        targetPohonSum = t.targetPohon;
      } else {
        targetKmsSum = computedTargetKms;
        targetPohonSum = computedTargetPohon;
      }
    } else {
      // ALL months filter - sum targets for the active year or active records' months
      const relevantYears = currentFilter && currentFilter.tahun !== 'ALL' ? [Number(currentFilter.tahun)] : [2024, 2025, 2026, 2027, 2028, 2029, 2030];
      let matchedCount = 0;

      Object.values(monthlyTargetsMap).forEach((t) => {
        if (relevantYears.includes(t.tahun)) {
          targetKmsSum += t.targetKms;
          targetGawangSum += t.targetGawang || 0;
          targetPohonSum += t.targetPohon;
          matchedCount++;
        }
      });

      if (matchedCount === 0) {
        targetKmsSum = computedTargetKms;
        targetPohonSum = computedTargetPohon;
      }
    }

    if (targetKmsSum > 0) computedTargetKms = targetKmsSum;
    if (targetGawangSum > 0) computedTargetGawang = targetGawangSum;
    if (targetPohonSum > 0 && totalTemuanFromRecords === 0) computedTargetPohon = targetPohonSum;
    else if (totalTemuanFromRecords > 0) computedTargetPohon = Math.max(totalTemuanFromRecords, targetPohonSum);
  }

  const persentaseKms = computedTargetKms > 0 ? (totalRealisasiKms / computedTargetKms) * 100 : 0;
  const persentaseTemuan = computedTargetPohon > 0 ? (totalRealisasiTemuan / computedTargetPohon) * 100 : 0;

  const totalRealisasiGawang = records.reduce((acc, r) => acc + (r.realisasiGawang || 0), 0);
  const persentaseGawang = computedTargetGawang > 0 ? (totalRealisasiGawang / computedTargetGawang) * 100 : 0;

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
    totalTemuan: computedTargetPohon,
    totalRealisasiTemuan,
    persentaseTemuan,
    totalLuarTemuan,
    totalRealisasiLuarTemuan,
    totalTargetKms: computedTargetKms,
    totalRealisasiKms,
    persentaseKms,
    totalTargetGawang: computedTargetGawang,
    totalRealisasiGawang,
    persentaseGawang,
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
