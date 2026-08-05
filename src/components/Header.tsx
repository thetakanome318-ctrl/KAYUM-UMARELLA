import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  HardHat,
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
  ShieldAlert,
  Building2,
  HardDriveDownload,
  Cloud,
  Eye,
  FileSpreadsheet,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import powerLinesBg from '../assets/images/power_lines_bg_1785580144298.jpg';
import { getDailySafetyMessage, SAFETY_MESSAGES } from '../data/safetyMessages';
import { HssePlnLogo } from './HssePlnLogo';

interface HeaderProps {
  onOpenModal: () => void;
  onResetData: () => void;
  onExportCsv: () => void;
  onOpenPdfModal: () => void;
  onDeleteAllData?: () => void;
  onSaveData?: () => void;
  lastSaveTime?: string | null;
  totalRecordsCount: number;
  currentUser?: { username: string; name: string; role: string; photo?: string } | null;
  onLogout?: () => void;
  onOpenUserModal?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isReadOnly?: boolean;
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
  isReadOnly,
}) => {
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [headerTheme, setHeaderTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('header_theme') as 'dark' | 'light') || 'dark';
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showStatusPopover, setShowStatusPopover] = useState(false);

  // Daily Safety Message State
  const [safetyDate, setSafetyDate] = useState<Date>(new Date());
  const dailySafetyMessage = getDailySafetyMessage(safetyDate);

  const formattedSafetyDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(safetyDate);

  const isToday = safetyDate.toDateString() === new Date().toDateString();

  const handlePrevSafetyDate = () => {
    const prev = new Date(safetyDate);
    prev.setDate(prev.getDate() - 1);
    setSafetyDate(prev);
  };

  const handleNextSafetyDate = () => {
    const next = new Date(safetyDate);
    next.setDate(next.getDate() + 1);
    setSafetyDate(next);
  };

  const handleResetSafetyDate = () => {
    setSafetyDate(new Date());
  };

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
    <header className={`border-b shadow-2xl sticky top-0 z-[100] transition-all duration-300 ${
      isLight 
        ? "bg-white/95 backdrop-blur-md text-slate-800 border-slate-200/80" 
        : "bg-slate-950/95 backdrop-blur-md text-white border-slate-800/80"
    }`}>
      {/* Background Image Pekerjaan Listrik di Tiang Listrik */}
      <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none transition-all duration-300 ${
        isLight ? "opacity-[0.04] mix-blend-overlay" : "opacity-20 mix-blend-luminosity"
      }`}>
        <img
          src={powerLinesBg}
          alt="Latar Belakang Pekerjaan Listrik di Tiang PLN"
          className="w-full h-full object-cover object-center scale-105 filter brightness-110 contrast-125"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 transition-all duration-300 ${
          isLight 
            ? "bg-gradient-to-r from-white via-slate-50/95 to-white/90" 
            : "bg-gradient-to-r from-slate-950 via-slate-900/95 to-slate-950/90"
        }`}></div>
        <div className={`absolute inset-0 transition-all duration-300 ${
          isLight 
            ? "bg-gradient-to-b from-transparent via-slate-100/30 to-white" 
            : "bg-gradient-to-b from-transparent via-slate-950/30 to-slate-950"
        }`}></div>
      </div>

      {/* Grid Pattern Accent overlay */}
      <div className={`absolute inset-0 [background-size:24px_24px] pointer-events-none z-0 transition-all duration-300 ${
        isLight 
          ? "bg-[radial-gradient(#059669_1px,transparent_1px)] opacity-[0.03]" 
          : "bg-[radial-gradient(#38bdf8_1px,transparent_1px)] opacity-10"
      }`}></div>

      {/* Main Header Wrapper */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Top Row: Brand & System Badge & User Profile */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Brand Info */}
          <div className="flex items-center space-x-3.5">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 transition-all duration-300 cursor-pointer bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 border border-blue-300/40 shadow-blue-500/30"
            >
              <Zap className="h-7 w-7 text-amber-300 fill-amber-300 drop-shadow-md" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 flex items-center justify-center shadow">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
            </motion.div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`text-lg sm:text-xl font-black tracking-tight flex items-center gap-2 transition-all ${
                  isLight ? "text-slate-900" : "text-white"
                }`}>
                  <span className="uppercase text-amber-500 font-extrabold tracking-wide">PERANG PADAM BAGUALA</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30 font-mono font-bold shadow-xs">
                    20kV PLN
                  </span>
                </h1>
              </div>

              <div className="flex flex-col text-xs mt-0.5 transition-all">
                <span className={`font-semibold flex items-center gap-1.5 ${
                  isLight ? "text-slate-600" : "text-slate-300"
                }`}>
                  Monitoring Gangguan dan Pemeliharaan — ULP Baguala
                </span>
              </div>
            </div>
          </div>

          {/* User Profile & Record Count Indicator */}
          <div className={`flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 ${
            isLight ? "border-slate-200" : "border-slate-800/80"
          }`}>
            {/* Interactive Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              title={`Ubah ke Tema ${isLight ? 'Gelap' : 'Terang'}`}
              className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold shadow-xs ${
                isLight 
                  ? 'text-slate-700 bg-slate-100/90 hover:bg-slate-200 border-slate-200' 
                  : 'text-amber-400 bg-slate-900/90 hover:bg-slate-800/85 border-slate-800'
              }`}
            >
              {isLight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600 fill-indigo-100" />
                  <span className="text-[11px] text-slate-700">Gelap</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  <span className="text-[11px] text-slate-300">Terang</span>
                </>
              )}
            </motion.button>

            {/* Interactive Status Storage Badge with Popover toggle */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowStatusPopover(!showStatusPopover)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-xs transition-all cursor-pointer ${
                  isLight 
                    ? "bg-slate-100/90 border-slate-200 text-slate-700 hover:bg-slate-200" 
                    : "bg-slate-900/90 border-slate-800/80 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-bold flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Cloud Active</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md font-mono font-bold text-[10px]">
                    {totalRecordsCount}
                  </span>
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showStatusPopover ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Status Popover dropdown */}
              {showStatusPopover && (
                <div className={`absolute right-0 mt-2 w-64 rounded-2xl p-4 shadow-2xl border z-50 animate-fade-in ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
                }`}>
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/30">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Status Sistem Cloud
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Online</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Database:</span>
                      <span className="font-bold font-mono">{totalRecordsCount} Record</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sinkronisasi:</span>
                      <span className="font-bold text-emerald-500">{lastSaveTime || 'Real-time'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Keamanan:</span>
                      <span className="font-bold text-amber-500">AES-256 / SSL</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Actions Bar */}
            {currentUser && (
              <div className="flex items-center gap-2">
                {/* Profile Badge (Elegant & High Quality) */}
                <div className={`flex items-center space-x-2.5 px-3.5 py-1.5 border rounded-xl shadow-xs relative overflow-hidden transition-all ${
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
                    <div className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-inner bg-gradient-to-br overflow-hidden ${
                      isAdmin 
                        ? 'from-amber-500 to-orange-600 border border-amber-400/30' 
                        : 'from-emerald-500 to-teal-600 border border-emerald-400/30'
                    }`}>
                      {currentUser.photo ? (
                        <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        currentUser.username.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>

                  <div className="text-left leading-tight">
                    <div className={`text-xs font-black tracking-wide capitalize max-w-[90px] truncate sm:max-w-none flex items-center gap-1 ${
                      isLight ? 'text-slate-800' : 'text-slate-100'
                    }`}>
                      {currentUser.name}
                      {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    </div>
                    <div className={`text-[9px] font-black tracking-wider uppercase ${
                      isAdmin ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {currentUser.role}
                    </div>
                  </div>
                </div>

                {/* Manage Users (Admin Only) */}
                {isAdmin && onOpenUserModal && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenUserModal}
                    title="Kelola Pengguna System (Admin)"
                    className={`p-2 rounded-xl transition border flex items-center justify-center shadow-xs ${
                      isLight 
                        ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200' 
                        : 'text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border-purple-500/30'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </motion.button>
                )}

                {/* Logout Button (With confirm modal trigger) */}
                {onLogout && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLogoutConfirm(true)}
                    title="Keluar dari Aplikasi"
                    className={`p-2 rounded-xl transition border flex items-center justify-center shadow-xs ${
                      isLight 
                        ? 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200' 
                        : 'text-amber-300 bg-amber-950/30 hover:bg-amber-900/50 border-amber-500/30'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            )}
          </div>
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


