import React, { useState } from 'react';
import { X, UserPlus, Shield, User, KeyRound, Trash2, CheckCircle2, AlertCircle, Eye, EyeOff, Users, RefreshCw } from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { getUsersList, addUser, deleteUser, resetUsersToDefault } from '../utils/userStorage';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string; name: string; role: string };
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [users, setUsers] = useState<UserAccount[]>(() => getUsersList());
  const [isAdding, setIsAdding] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  // Form states for new user
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Operator');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const refreshList = () => {
    setUsers(getUsersList());
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const res = addUser({
      username: newUsername,
      name: newName,
      password: newPassword,
      role: newRole,
    });

    if (res.success) {
      setNotification({ type: 'success', message: res.message });
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      setNewRole('Operator');
      setIsAdding(false);
      refreshList();
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (user.username === currentUser.username) {
      setNotification({ type: 'error', message: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.' });
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus user "${user.name}" (${user.username})?`)) {
      const res = deleteUser(user.id);
      if (res.success) {
        setNotification({ type: 'success', message: res.message });
        refreshList();
      } else {
        setNotification({ type: 'error', message: res.message });
      }
    }
  };

  const handleResetUsers = () => {
    if (window.confirm('Reset daftar pengguna ke akun default bawaan (admin, manager, koordinator, teamleader, operator)?')) {
      resetUsersToDefault();
      refreshList();
      setNotification({ type: 'success', message: 'Daftar pengguna berhasil di-reset ke default.' });
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Admin System':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Manager':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'Koordinator':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'Team Leader':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center">
                Manajemen Pengguna &amp; Akun System
                <span className="ml-2 px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-semibold">
                  Admin Exclusive
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kelola hak akses, buat akun petugas baru, dan atur kata sandi login
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {notification && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          )}

          {/* Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">
                Total Akun Terdaftar: <span className="text-emerald-400">{users.length} User</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Logged in as: <span className="text-purple-300 font-semibold">{currentUser.name}</span> ({currentUser.role})
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleResetUsers}
                title="Reset Akun ke Default"
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center space-x-1 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Default</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAdding(!isAdding);
                  setNotification(null);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center space-x-1.5 transition ${
                  isAdding
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{isAdding ? 'Batal Tambah' : 'Tambah User Baru'}</span>
              </button>
            </div>
          </div>

          {/* Form Create New User */}
          {isAdding && (
            <form onSubmit={handleAddUserSubmit} className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-4 shadow-inner">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
                <Shield className="w-4 h-4" />
                <span>Form Pendaftaran User Baru</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username / ID Login <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. petugas_row"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Lengkap Petugas <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Budi Santoso"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kata Sandi (Password) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. pass1234"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Role / Jabatan Akses <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Operator">Operator (Input &amp; Edit Data)</option>
                    <option value="Petugas Lapangan">Petugas Lapangan (Input &amp; Form)</option>
                    <option value="Team Leader">Team Leader (Akses Input &amp; Monitoring)</option>
                    <option value="Manager">Manager (Status Monitoring - Read Only)</option>
                    <option value="Koordinator">Koordinator (Status Monitoring - Read Only)</option>
                    <option value="Admin System">Admin System (Akses Penuh + User Admin)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-lg transition border border-emerald-400"
                >
                  Simpan User Baru
                </button>
              </div>
            </form>
          )}

          {/* User List Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
              Daftar Pengguna Sistem Active
            </div>

            <div className="divide-y divide-slate-800/80">
              {users.map((u) => {
                const isShowingPass = !!showPasswords[u.id];
                const isCurrent = u.username === currentUser.username;

                return (
                  <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/50 transition">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-100 truncate">{u.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Anda (Aktif)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-400">
                          <span className="font-mono text-emerald-400">@{u.username}</span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getRoleBadgeClass(u.role)}`}>
                            {u.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 ml-2">
                      {/* Password Field Toggle */}
                      <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-[11px]">
                        <span className="font-mono text-slate-300">
                          {isShowingPass ? u.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="text-slate-500 hover:text-slate-300 transition"
                          title="Tampilkan / Sembunyikan Password"
                        >
                          {isShowingPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Delete Button */}
                      {u.username !== 'admin' && !isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          title="Hapus User Ini"
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/30 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>Sistem Keamanan Akun Multi-User PLN 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
