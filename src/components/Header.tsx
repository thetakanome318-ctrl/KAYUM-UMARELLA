import React, { useState } from 'react';
import {
  TreePine,
  Plus,
  Download,
  RefreshCw,
  Zap,
  LogOut,
  Users,
  Trash2,
  Save,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Building2,
  HardDriveDownload,
  Cloud,
  Eye,
} from 'lucide-react';
import powerLinesBg from '../assets/images/power_lines_bg_1785580144298.jpg';

interface HeaderProps {
  onOpenModal: () => void;
  onResetData: () => void;
  onExportCsv: () => void;
  onDeleteAllData?: () => void;
  onSaveData?: () => void;
  lastSaveTime?: string | null;
  totalRecordsCount: number;
  currentUser?: { username: string; name: string; role: string } | null;
  onLogout?: () => void;
  onOpenUserModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenModal,
  onResetData,
  onExportCsv,
  onDeleteAllData,
  onSaveData,
  lastSaveTime,
  totalRecordsCount,
  currentUser,
  onLogout,
  onOpenUserModal,
}) => {
  const [showSaveToast, setShowSaveToast] = useState(false);
  const isAdmin = currentUser?.role === 'Admin System' || currentUser?.username === 'admin';
  const isReadOnly = currentUser?.role === 'Manager' || currentUser?.role === 'Koordinator';
  const canInput = !isReadOnly;

  const handleSaveClick = () => {
    if (onSaveData) {
      onSaveData();
    }
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 3500);
  };

  return (
    <header className="relative bg-slate-950 text-white border-b border-slate-800 shadow-xl overflow-hidden sticky top-0 z-30">
      {/* Background Image Pekerjaan Listrik di Tiang Listrik */}
      <div className="absolute inset-0 z-0 opacity-25 mix-blend-luminosity overflow-hidden pointer-events-none">
        <img
          src={powerLinesBg}
          alt="Latar Belakang Pekerjaan Listrik di Tiang PLN"
          className="w-full h-full object-cover object-center scale-105 filter brightness-110 contrast-125"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950/85"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950"></div>
      </div>

      {/* Grid Pattern Accent overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none z-0"></div>

      {/* Main Header Wrapper */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
        {/* Top Row: Brand & System Badge & User Profile */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Info */}
          <div className="flex items-center space-x-3.5">
            <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50 shrink-0">
              <TreePine className="h-6 w-6 text-emerald-400" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <Zap className="w-2 h-2 text-slate-950 fill-slate-950" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>Perang Pohon Baguala</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    20kV PLN
                  </span>
                </h1>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Sistem Monitoring ROW & Pemangkasan Pohon Jaringan Distribusi
                </span>
                <span className="hidden lg:inline text-slate-500">•</span>
                <span className="hidden lg:inline text-slate-400 italic">
                  Support by the tukimen
                </span>
              </div>
            </div>
          </div>

          {/* User Profile & Record Count Indicator */}
          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
            {/* Status Storage Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-slate-300 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium flex items-center gap-1.5 text-slate-200">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Firestore Active ({totalRecordsCount} Section)</span>
              </span>
              {lastSaveTime && (
                <span className="hidden sm:inline text-[10px] text-emerald-400 border-l border-slate-700 pl-2">
                  Sync {lastSaveTime}
                </span>
              )}
            </div>

            {/* User Profile */}
            {currentUser && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-slate-900/90 rounded-lg border border-slate-800 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left leading-none">
                  <div className="text-xs font-bold text-slate-100 capitalize">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    {currentUser.role}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Pilihan Tombol Aksi Rapih (Organized Button Controls Bar) */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          {/* Kelompok Aksi Utama Data */}
          <div className="flex flex-wrap items-center gap-2">
            {canInput ? (
              <>
                {/* Tombol Simpan Data */}
                <button
                  onClick={handleSaveClick}
                  title="Simpan Data ke LocalStorage & Backup Cadangan"
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-md shadow-blue-950/40 transition-all flex items-center space-x-1.5 border border-blue-400/30 group"
                >
                  <Save className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
                  <span>Simpan Data</span>
                </button>

                {/* Tombol Tambah Data */}
                <button
                  onClick={onOpenModal}
                  className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg shadow-md shadow-emerald-950/50 transition-all flex items-center space-x-1.5 border border-emerald-300 group"
                >
                  <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform" />
                  <span>Tambah Data Baru</span>
                </button>
              </>
            ) : (
              <div className="px-3 py-1.5 text-xs font-bold text-sky-300 bg-sky-950/60 rounded-lg border border-sky-500/40 flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-sky-400 animate-pulse" />
                <span>Status Monitoring (Tidak Bisa Tambah Inputan)</span>
              </div>
            )}

            {/* Tombol Export Excel / CSV */}
            <button
              onClick={onExportCsv}
              title="Download Laporan Format CSV / Excel"
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-lg transition border border-slate-700 flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Excel</span>
            </button>
          </div>

          {/* Kelompok Aksi Sistem & Administrasi */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && onOpenUserModal && (
              <button
                onClick={onOpenUserModal}
                title="Kelola Pengguna System (Admin)"
                className="px-2.5 py-1.5 text-xs font-medium text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 rounded-lg transition border border-purple-500/30 flex items-center space-x-1.5"
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Kelola User</span>
              </button>
            )}

            {canInput && (
              <>
                <button
                  onClick={onResetData}
                  title="Reset Data ke Default Sample"
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition border border-slate-800 flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Reset Sample</span>
                </button>

                {onDeleteAllData && (
                  <button
                    onClick={onDeleteAllData}
                    title="Hapus Semua Data Monitoring"
                    className="px-2.5 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/30 hover:bg-rose-900/50 rounded-lg transition border border-rose-500/30 flex items-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden lg:inline">Hapus Semua</span>
                  </button>
                )}
              </>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                title="Keluar dari Aplikasi"
                className="px-2.5 py-1.5 text-xs font-medium text-amber-200 bg-amber-950/30 hover:bg-amber-900/50 rounded-lg transition border border-amber-500/30 flex items-center space-x-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Toast Notification overlay when Simpan Data is clicked */}
        {showSaveToast && (
          <div className="fixed top-20 right-6 z-50 animate-bounce bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-400 flex items-center space-x-2.5 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <div>
              <p className="text-sm font-extrabold">Data Berhasil Disimpan!</p>
              <p className="text-[11px] font-normal text-emerald-100">
                Seluruh {totalRecordsCount} data monitoring tersimpan aman di browser storage.
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

