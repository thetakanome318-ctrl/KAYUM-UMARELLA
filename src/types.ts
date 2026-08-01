export interface UserAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'Admin System' | 'Supervisor' | 'Operator' | 'Petugas Lapangan';
  createdAt?: string;
}

export interface ROWRecord {
  id: string;
  bulan: string; // e.g., '2026-07' or 'Juli 2026'
  tahun: number; // e.g., 2026
  bulanKe: number; // 1 - 12
  penyulang?: string; // Opsional
  section: string;
  tanggal?: string; // Tanggal eksekusi / temuan (e.g., '2026-07-31')
  
  // Mandatory Target & Realisasi
  targetKms: number; // Target bulanan dalam KMS
  realisasiKms: number; // Realisasi KMS
  realisasiGawang: number; // Realisasi Gawang (span count)
  
  jumlahTemuan: number; // Jumlah temuan pohon
  realisasiTemuan: number; // Realisasi temuan (jumlah pohon yang sudah dipangkas)
  
  // Temuan Pohon Luar Target (Luar Temuan)
  luarTemuan?: number; // Jumlah temuan pohon di luar target/rutin
  realisasiLuarTemuan?: number; // Realisasi pangkas pohon luar temuan
  
  // Optional Fields (Bukan Mandatori)
  perluPadam?: boolean;
  jumlahPerluPadam?: number;
  
  tidakAdaIzin?: boolean;
  jumlahTidakAdaIzin?: number;
  
  pohonBesar?: boolean;
  jumlahPohonBesar?: number;
  
  catatan?: string;
  tanggalUpdate?: string;
}

export interface KPIStats {
  totalTemuan: number;
  totalRealisasiTemuan: number;
  persentaseTemuan: number;
  
  totalLuarTemuan?: number;
  totalRealisasiLuarTemuan?: number;
  
  totalTargetKms: number;
  totalRealisasiKms: number;
  persentaseKms: number;
  
  totalTargetGawang?: number;
  totalRealisasiGawang: number;
  persentaseGawang?: number;
  
  totalPerluPadam: number;
  totalPerluIzin: number;
  totalPohonBesar: number;
}

export interface FilterState {
  penyulang: string; // 'ALL' or specific feeder
  bulan: string; // 'ALL' or '01'-'12' or 'YYYY-MM'
  tahun: number | 'ALL'; // 'ALL' or specific year like 2026, 2027
  search: string;
}

export type ViewTab = 'dashboard' | 'timeline' | 'table' | 'charts' | 'calendar';
