import React, { useState, useEffect, useRef } from 'react';
import { TreePine, Lock, User, KeyRound, AlertCircle, Eye, EyeOff, Zap, RefreshCw, ShieldAlert } from 'lucide-react';
import { getUsersList } from '../utils/userStorage';
import { UserAccount } from '../types';
import bgPlnWorker from '../assets/images/pln_tree_trimming_1785589720078.jpg';

interface LoginScreenProps {
  onLoginSuccess: (user: { username: string; name: string; role: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CAPTCHA State
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateCaptchaCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const refreshCaptcha = () => {
    const newCode = generateCaptchaCode();
    setCaptchaCode(newCode);
    setUserCaptcha('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  // Draw CAPTCHA on Canvas
  useEffect(() => {
    if (canvasRef.current && captchaCode) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dark slate background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Random noise lines
        for (let i = 0; i < 7; i++) {
          ctx.strokeStyle = i % 2 === 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1 + Math.random();
          ctx.beginPath();
          ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.stroke();
        }

        // Random noise dots
        for (let i = 0; i < 35; i++) {
          ctx.fillStyle = `rgba(168, 85, 247, ${0.2 + Math.random() * 0.4})`;
          ctx.beginPath();
          ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw distorted text
        ctx.font = 'bold 22px monospace';
        for (let i = 0; i < captchaCode.length; i++) {
          ctx.save();
          const x = 16 + i * 25;
          const y = 27 + (Math.random() * 4 - 2);
          const angle = (Math.random() - 0.5) * 0.35;
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.fillStyle = i % 2 === 0 ? '#34d399' : '#38bdf8';
          ctx.fillText(captchaCode[i], 0, 0);
          ctx.restore();
        }
      }
    }
  }, [captchaCode]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();
    const trimmedCaptcha = userCaptcha.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Username dan password wajib diisi.');
      return;
    }

    if (!trimmedCaptcha) {
      setError('Harap masukkan kode CAPTCHA keamanan.');
      return;
    }

    // CAPTCHA Check (case-insensitive)
    if (trimmedCaptcha.toUpperCase() !== captchaCode.toUpperCase()) {
      setError('Kode CAPTCHA tidak sesuai. Silakan coba lagi.');
      refreshCaptcha();
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
        setError('Username atau password salah. Silakan periksa kembali.');
        refreshCaptcha();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background PLN Worker Tree Trimming Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgPlnWorker}
          alt="Petugas PLN sedang pemangkasan pohon"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-30 scale-105 filter brightness-90 saturate-110"
        />
        {/* Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-slate-950/90" />
      </div>

      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="max-w-md w-full relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-emerald-400 mb-3 shadow-xl shadow-emerald-500/10 backdrop-blur-md">
            <TreePine className="h-9 w-9" />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <Zap className="w-3 h-3 mr-1 text-emerald-400" />
              Support by the tukimen
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight drop-shadow-md">
            Perang Padam Baguala
          </h1>
          <p className="text-xs text-slate-300 mt-1 drop-shadow">
            Sistem Pemantauan Pemangkasan Pohon &amp; Target KMS Petugas PLN Lapangan
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/85 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
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

            {/* CAPTCHA Security Verification */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verifikasi Keamanan CAPTCHA</span>
                </label>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
                  title="Ganti Kode CAPTCHA"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Acak Kode</span>
                </button>
              </div>

              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Canvas Captcha Box */}
                <div className="col-span-5 bg-slate-950 border border-slate-700/80 rounded-xl p-1 flex items-center justify-center overflow-hidden h-[42px]">
                  <canvas
                    ref={canvasRef}
                    width={140}
                    height={38}
                    className="rounded cursor-pointer select-none"
                    onClick={refreshCaptcha}
                    title="Klik untuk acak gambar CAPTCHA"
                  />
                </div>

                {/* Captcha Input */}
                <div className="col-span-7">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Ketik kode di samping..."
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-700/80 rounded-xl text-emerald-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-mono tracking-wider font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center space-x-2 border border-emerald-400"
            >
              <Lock className="w-4 h-4" />
              <span>Masuk Aplikasi</span>
            </button>
          </form>
        </div>

        {/* Footer info with slogan */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-xs font-black tracking-widest text-emerald-400 uppercase animate-pulse">
            ⚡ Menuju Zero Gangguan Pohon ⚡
          </p>
          <p className="text-[11px] text-slate-500">
            Aplikasi Perang Padam Baguala Support by the tukimen — Pemangkasan ROW &amp; Jaringan 20kV PLN
          </p>
        </div>
      </div>
    </div>
  );
};

