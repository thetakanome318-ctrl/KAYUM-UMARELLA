import React from 'react';
import { TreePine, Plus, Download, RefreshCw, Zap, LogOut, UserCheck, Users, Trash2 } from 'lucide-react';

interface HeaderProps {
  onOpenModal: () => void;
  onResetData: () => void;
  onExportCsv: () => void;
  onDeleteAllData?: () => void;
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
  totalRecordsCount,
  currentUser,
  onLogout,
  onOpenUserModal,
}) => {
  const isAdmin = currentUser?.role === 'Admin System' || currentUser?.username === 'admin';
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
            <TreePine className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-100">
                Perang Pohon Baguala
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Zap className="w-3 h-3 mr-1 text-emerald-400" />
                Support by the tukimen
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden lg:block">
              Sistem Monitoring Pemangkasan Pohon ROW Penyulang Jaringan 20kV
            </p>
          </div>
        </div>

        {/* Action Buttons & User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {currentUser && (
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/80 mr-1">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs font-bold">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-none">
                <div className="text-xs font-semibold text-slate-200 capitalize">{currentUser.name}</div>
                <div className="text-[10px] text-emerald-400 font-medium">{currentUser.role}</div>
              </div>
            </div>
          )}

          {isAdmin && onOpenUserModal && (
            <button
              onClick={onOpenUserModal}
              title="Kelola Pengguna System (Admin)"
              className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition border border-purple-500/30 flex items-center space-x-1"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Kelola User</span>
            </button>
          )}

          {onDeleteAllData && (
            <button
              onClick={onDeleteAllData}
              title="Hapus Semua Data Monitoring"
              className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition border border-rose-500/30 flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden lg:inline">Hapus Semua</span>
            </button>
          )}

          <button
            onClick={onResetData}
            title="Reset Data ke Default Sample"
            className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700 flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Reset Sample</span>
          </button>

          <button
            onClick={onExportCsv}
            title="Export CSV / Excel"
            className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700 flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Export Excel</span>
          </button>

          <button
            onClick={onOpenModal}
            className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition flex items-center space-x-1 border border-emerald-300"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Tambah Data</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Keluar / Logout"
              className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition border border-rose-500/30 flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
