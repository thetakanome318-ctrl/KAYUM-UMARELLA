import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  FileSpreadsheet,
  Sun,
  Moon,
} from 'lucide-react';
import powerLinesBg from '../assets/images/power_lines_bg_1785580144298.jpg';

interface HeaderProps {
  onOpenModal: () => void;
  onResetData: () => void;
  onExportCsv: () => void;
  onOpenPdfModal: () => void;
  onDeleteAllData?: () => void;
  onSaveData?: () => void;
  lastSaveTime?: string | null;
  totalRecordsCount: number;
  currentUser?: { username: string; name: string; role: string } | null;
  onLogout?: () => void;
  onOpenUserModal?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenModal,
  onResetData,
  onExportCsv,
  onOpenPdfModal,
  onDeleteAllData,
  onSaveData,
  lastSaveTime,
  totalRecordsCount,
  currentUser,
  onLogout,
  onOpenUserModal,
  theme,
  onToggleTheme,
}) => {
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [headerTheme, setHeaderTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('header_theme') as 'dark' | 'light') || 'dark';
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentTheme = theme || headerTheme;
  const isLight = currentTheme === 'light';
  const isAdmin = currentUser?.role === 'Admin System' || currentUser?.username === 'admin';

  const toggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const nextTheme = headerTheme === 'dark' ? 'light' : 'dark';
      setHeaderTheme(nextTheme);
      localStorage.setItem('header_theme', nextTheme);
    }
  };

  return (
    <header className={`relative border-b shadow-xl overflow-hidden sticky top-0 z-30 transition-all duration-300 ${
      isLight 
        ? "bg-white text-slate-800 border-slate-200" 
        : "bg-slate-950 text-white border-slate-800"
    }`}>
      {/* Background Image Pekerjaan Listrik di Tiang Listrik */}
      <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none transition-all duration-300 ${
        isLight ? "opacity-[0.05] mix-blend-overlay" : "opacity-25 mix-blend-luminosity"
      }`}>
        <img
          src={powerLinesBg}
          alt="Latar Belakang Pekerjaan Listrik di Tiang PLN"
          className="w-full h-full object-cover object-center scale-105 filter brightness-110 contrast-125"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 transition-all duration-300 ${
          isLight 
            ? "bg-gradient-to-r from-white via-slate-50/90 to-white/85" 
            : "bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950/85"
        }`}></div>
        <div className={`absolute inset-0 transition-all duration-300 ${
          isLight 
            ? "bg-gradient-to-b from-transparent via-slate-100/40 to-white" 
            : "bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950"
        }`}></div>
      </div>

      {/* Grid Pattern Accent overlay */}
      <div className={`absolute inset-0 [background-size:24px_24px] pointer-events-none z-0 transition-all duration-300 ${
        isLight 
          ? "bg-[radial-gradient(#059669_1px,transparent_1px)] opacity-[0.04]" 
          : "bg-[radial-gradient(#38bdf8_1px,transparent_1px)] opacity-10"
      }`}></div>

      {/* Main Header Wrapper */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Row: Brand & System Badge & User Profile */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Info */}
          <div className="flex items-center space-x-3.5">
            <div className={`relative h-11 w-11 rounded-xl flex items-center justify-center shadow-lg shrink-0 transition-all duration-300 ${
              isLight 
                ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-200 shadow-emerald-100' 
                : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-400/40 shadow-emerald-950/50'
            }`}>
              <TreePine className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 flex items-center justify-center">
                <Zap className="w-2 h-2 text-white fill-white scale-75" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2 transition-all ${
                  isLight ? "text-slate-900" : "text-white"
                }`}>
                  <span>Perang Padam Baguala</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    20kV PLN
                  </span>
                </h1>
              </div>

              <div className="flex flex-col text-xs mt-1 transition-all">
                <span className={`font-semibold flex items-center gap-1.5 ${
                  isLight ? "text-emerald-600" : "text-emerald-400"
                }`}>
                  <Activity className="w-3.5 h-3.5" />
                  Sistem Monitoring ROW & Pemangkasan Pohon Jaringan Distribusi
                </span>
                
                <motion.div 
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`italic mt-1 pl-5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide ${
                    isLight ? "text-emerald-600/90" : "text-emerald-300/90"
                  }`}
                >
                  <motion.span 
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shadow shadow-emerald-400"
                  />
                  <motion.span
                    animate={{ letterSpacing: ["0px", "0.5px", "0px"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Support by the tukimen
                  </motion.span>
                </motion.div>
              </div>
            </div>
          </div>

          {/* User Profile & Record Count Indicator */}
          <div className={`flex flex-wrap items-center justify-between md:justify-end gap-2.5 pt-2.5 md:pt-0 border-t md:border-t-0 ${
            isLight ? "border-slate-200" : "border-slate-800/80"
          }`}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Ubah ke Tema ${isLight ? 'Gelap' : 'Terang'}`}
              className={`p-1.5 rounded-lg border transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs active:scale-95 ${
                isLight 
                  ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200' 
                  : 'text-amber-400 bg-slate-900/90 hover:bg-slate-800/85 border-slate-800'
              }`}
            >
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600 fill-indigo-100" />
                  <span className="hidden sm:inline text-[10px] text-slate-700">Gelap</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  <span className="hidden sm:inline text-[10px] text-slate-300">Terang</span>
                </>
              )}
            </button>

            {/* Status Storage Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs shadow-inner transition-all ${
              isLight 
                ? "bg-slate-100/80 border-slate-200 text-slate-700" 
                : "bg-slate-900/90 border-slate-800/80 text-slate-300"
            }`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cloud Active ({totalRecordsCount})</span>
              </span>
              {lastSaveTime && (
                <span className={`hidden sm:inline text-[10px] border-l pl-2 ${
                  isLight ? "text-emerald-600 border-slate-200" : "text-emerald-400 border-slate-700"
                }`}>
                  Sync {lastSaveTime}
                </span>
              )}
            </div>

            {/* User Profile & Actions Bar */}
            {currentUser && (
              <div className="flex items-center gap-2">
                {/* Profile Badge (Elegant & High Quality) */}
                <div className={`flex items-center space-x-2.5 px-3 py-1 border rounded-xl shadow-xs relative overflow-hidden group transition-all ${
                  isLight 
                    ? 'bg-slate-100/90 border-slate-200' 
                    : 'bg-slate-900/95 border-slate-800'
                }`}>
                  {/* Subtle decorative left glow bar */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${isAdmin ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  
                  {/* Elegant Gradient Avatar Ring */}
                  <div className="relative flex items-center justify-center">
                    <span className={`absolute -inset-0.5 rounded-full animate-pulse opacity-30 blur-xs ${
                      isAdmin ? 'bg-amber-400' : 'bg-emerald-400'
                    }`} />
                    <div className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-inner bg-gradient-to-br ${
                      isAdmin 
                        ? 'from-amber-500 to-orange-600 border border-amber-400/30' 
                        : 'from-emerald-500 to-teal-600 border border-emerald-400/30'
                    }`}>
                      {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="text-left leading-tight">
                    <div className={`text-xs font-black tracking-wide capitalize max-w-[80px] truncate sm:max-w-none flex items-center gap-1 ${
                      isLight ? 'text-slate-800' : 'text-slate-100'
                    }`}>
                      {currentUser.name}
                      {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    </div>
                    <div className={`text-[9px] font-extrabold tracking-wider uppercase ${
                      isAdmin ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {currentUser.role}
                    </div>
                  </div>
                </div>

                {/* Manage Users (Admin Only) */}
                {isAdmin && onOpenUserModal && (
                  <button
                    onClick={onOpenUserModal}
                    title="Kelola Pengguna System (Admin)"
                    className={`p-1.5 rounded-lg transition border flex items-center justify-center active:scale-95 ${
                      isLight 
                        ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200' 
                        : 'text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border-purple-500/30'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Logout Button (With confirm modal trigger) */}
                {onLogout && (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    title="Keluar dari Aplikasi"
                    className={`p-1.5 rounded-lg transition border flex items-center justify-center active:scale-95 ${
                      isLight 
                        ? 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200' 
                        : 'text-amber-300 bg-amber-950/30 hover:bg-amber-900/50 border-amber-500/30'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
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

      {/* Elegant Logout Confirmation Dialog (Ya / Tidak) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-100 text-slate-900">
            <div className="flex items-start space-x-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 shrink-0">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold tracking-tight text-slate-900">Konfirmasi Keluar</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin keluar dari sistem Perang Padam Baguala? Anda perlu masuk kembali nanti.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all active:scale-95"
              >
                Tidak
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-2 px-4 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-500 border border-red-700 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

