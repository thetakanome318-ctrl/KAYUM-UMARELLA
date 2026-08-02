export interface MonthlyTargetItem {
  bulanKey: string; // e.g., '2026-07' (Format Bulan dan Tahun, tanpa tanggal)
  tahun: number;
  bulanKe: number;
  targetKms: number;
  targetGawang: number;
  targetPohon: number;
  workDays: number;
}

const TARGET_STORAGE_KEY = 'row_monthly_targets_v3';

export const DEFAULT_MONTHLY_TARGETS: Record<string, MonthlyTargetItem> = {
  '2026-01': { bulanKey: '2026-01', tahun: 2026, bulanKe: 1, targetKms: 10.0, targetGawang: 60, targetPohon: 80, workDays: 22 },
  '2026-02': { bulanKey: '2026-02', tahun: 2026, bulanKe: 2, targetKms: 12.0, targetGawang: 70, targetPohon: 90, workDays: 22 },
  '2026-03': { bulanKey: '2026-03', tahun: 2026, bulanKe: 3, targetKms: 15.0, targetGawang: 90, targetPohon: 100, workDays: 22 },
  '2026-04': { bulanKey: '2026-04', tahun: 2026, bulanKe: 4, targetKms: 15.0, targetGawang: 90, targetPohon: 100, workDays: 22 },
  '2026-05': { bulanKey: '2026-05', tahun: 2026, bulanKe: 5, targetKms: 18.0, targetGawang: 105, targetPohon: 110, workDays: 22 },
  '2026-06': { bulanKey: '2026-06', tahun: 2026, bulanKe: 6, targetKms: 20.0, targetGawang: 120, targetPohon: 120, workDays: 22 },
  '2026-07': { bulanKey: '2026-07', tahun: 2026, bulanKe: 7, targetKms: 25.0, targetGawang: 150, targetPohon: 150, workDays: 22 },
  '2026-08': { bulanKey: '2026-08', tahun: 2026, bulanKe: 8, targetKms: 20.0, targetGawang: 120, targetPohon: 130, workDays: 22 },
  '2026-09': { bulanKey: '2026-09', tahun: 2026, bulanKe: 9, targetKms: 18.0, targetGawang: 105, targetPohon: 110, workDays: 22 },
  '2026-10': { bulanKey: '2026-10', tahun: 2026, bulanKe: 10, targetKms: 15.0, targetGawang: 90, targetPohon: 100, workDays: 22 },
  '2026-11': { bulanKey: '2026-11', tahun: 2026, bulanKe: 11, targetKms: 12.0, targetGawang: 70, targetPohon: 90, workDays: 22 },
  '2026-12': { bulanKey: '2026-12', tahun: 2026, bulanKe: 12, targetKms: 10.0, targetGawang: 60, targetPohon: 80, workDays: 22 },
};

export function getMonthlyTargetsMap(): Record<string, MonthlyTargetItem> {
  try {
    const raw = localStorage.getItem(TARGET_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_MONTHLY_TARGETS, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error reading monthly targets:', e);
  }
  return { ...DEFAULT_MONTHLY_TARGETS };
}

export function saveMonthlyTargetsMap(targets: Record<string, MonthlyTargetItem>) {
  try {
    localStorage.setItem(TARGET_STORAGE_KEY, JSON.stringify(targets));
  } catch (e) {
    console.error('Error saving monthly targets:', e);
  }
}
