export type UserRole = 'Admin System' | 'Team Leader' | 'Operator' | 'Petugas Lapangan' | 'Manager' | 'Koordinator';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt?: string;
}

export interface TreeDetail {
  id: string;
  latitude: number | '';
  longitude: number | '';
  isEksekusi: boolean;
  perluPadam: boolean;
  belumIzin: boolean;
  pohonBesar: boolean;
  keterangan?: string;
  namaPohon?: string;
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
  
  // New fields
  inspectionType?: 'Tier 1' | 'Gardu' | 'Tier 2' | 'Dream Mobile';
  temuanKonstruksi?: number;
  temuanGardu?: number;
  
  // Gangguan Fields
  gangguan?: boolean;
  gangguanKeterangan?: string;
  jamKeluar?: string;
  jamMasuk?: string;
  durasi?: string;
  relayBekerja?: string;
  relayArusR?: number;
  relayArusS?: number;
  relayArusT?: number;
  arusIN?: number;
  penyebab?: string;
  kodeGangguan?: string;
  
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
  latitude?: number;
  longitude?: number;
  lokasi?: string;
  namaPohon?: string;
  isMapFinding?: boolean;
  
  treeDetails?: TreeDetail[]; // Detail per pohon
}

export interface DailyKPIStats {
  realisasiKms: number;
  targetKms: number;
  persentase: number;
  tanggal: string;
  targetBulanKms: number;
  persentaseBulan: number;
  realisasiBulanKms: number;
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

  daily?: DailyKPIStats;
}

export interface FilterState {
  tipeData: 'ROW' | 'INSPEKSI' | 'GANGGUAN' | 'GARDU';
}

export interface Penyulang {
  id: string;
  nama: string;
  kode?: string;
  panjangJaringan?: number;
  createdAt?: string;
}

export interface MasterSection {
  id: string;
  namaSection: string;
  penyulang?: string;
  jumlahPelanggan: number;
  keterangan?: string;
  createdAt?: string;
}

export interface PenyulangTarget {
  id: string;
  penyulangId: string;
  penyulangNama: string;
  tahun: number;
  bulanKe: number;
  targetKms: number;
  targetGawang?: number;
  updatedAt?: string;
}

export type ViewTab = 'dashboard' | 'timeline' | 'table' | 'charts' | 'calendar' | 'map' | 'master' | 'target_management' | 'inspection' | 'gangguan' | 'gardu';
