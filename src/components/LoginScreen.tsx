import React, { useState, useEffect } from 'react';
import { TreePine, Lock, User, KeyRound, ShieldCheck, AlertCircle, Eye, EyeOff, Zap, CheckCircle2 } from 'lucide-react';
import { getUsersList } from '../utils/userStorage';
import { UserAccount } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: { username: string; name: string; role: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [userList, setUserList] = useState<UserAccount[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUserList(getUsersList());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Username dan password wajib diisi.');
      return;
    }

    const currentUsers = getUsersList();
    const foundUser = currentUsers.find(
      (u) => u.username.toLowerCase() === trimmedUser && u.password === trimmedPass
    );

    if (foundUser) {
      onLoginSuccess({
        username: foundUser.username,
        name: foundUser.name,
        role: foundUser.role,
      });
    } else {
      // Fallback for custom entries if password >= 4 chars
      if (trimmedPass.length >= 4) {
        onLoginSuccess({
          username: trimmedUser,
          name: `User (${trimmedUser})`,
          role: 'Petugas Lapangan',
        });
      } else {
        setError('Username atau password salah. Silakan periksa kembali atau pilih akun demo di bawah.');
      }
    }
  };

  const fillDemoAccount = (accUsername: string) => {
    const acc = userList.find((u) => u.username === accUsername);
    if (acc) {
      setUsername(acc.username);
      setPassword(acc.password);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/5">
            <TreePine className="h-9 w-9" />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Zap className="w-3 h-3 mr-1 text-emerald-400" />
              Support by the tukimen
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Perang Pohon Baguala
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Masuk untuk mengakses dashboard pemantauan pangkas pohon dan target KMS
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username / User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center space-x-2 border border-emerald-400"
            >
              <Lock className="w-4 h-4" />
              <span>Masuk Aplikasi</span>
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Akun Demo Cepat
              </span>
              <span className="text-[10px] text-slate-500">Klik untuk isi otomatis</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {userList.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => fillDemoAccount(acc.username)}
                  className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                    username === acc.username
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold capitalize">{acc.username}</span>
                    {username === acc.username && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5 truncate">{acc.password}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-500 mt-4">
          Aplikasi Perang Pohon Baguala Support by the tukimen — Pemangkasan ROW &amp; Jaringan 20kV PLN
        </p>
      </div>
    </div>
  );
};
