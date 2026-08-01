import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, TreePine, ShieldAlert, PowerOff, Sparkles, CalendarDays } from 'lucide-react';
import { ROWRecord } from '../types';
import { BULAN_SIMPLE_LIST, YEAR_LIST } from '../data/mockData';

interface EntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: ROWRecord) => void;
  initialData?: ROWRecord | null;
}

export const EntryFormModal: React.FC<EntryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayYear = new Date().getFullYear();

  const [formData, setFormData] = useState<Partial<ROWRecord>>({
    bulan: `${todayYear}-07`,
    tahun: todayYear,
    bulanKe: 7,
    penyulang: '',
    section: '',
    tanggal: todayStr,
    targetKms: 10,
    realisasiKms: 0,
    realisasiGawang: 0,
    jumlahTemuan: 0,
    realisasiTemuan: 0,
    luarTemuan: 0,
    realisasiLuarTemuan: 0,
    perluPadam: false,
    jumlahPerluPadam: 0,
    tidakAdaIzin: false,
    jumlahTidakAdaIzin: 0,
    pohonBesar: false,
    jumlahPohonBesar: 0,
    catatan: '',
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      const yr = initialData.tahun || (initialData.tanggal ? new Date(initialData.tanggal).getFullYear() : todayYear);
      const bKe = initialData.bulanKe || (initialData.bulan ? parseInt(initialData.bulan.split('-')[1], 10) : 7) || 7;
      setFormData({
        ...initialData,
        tahun: yr,
        bulanKe: bKe,
        bulan: initialData.bulan || `${yr}-${String(bKe).padStart(2, '0')}`,
        tanggal: initialData.tanggal || initialData.tanggalUpdate || todayStr,
      });
    } else {
      setFormData({
        bulan: `${todayYear}-07`,
        tahun: todayYear,
        bulanKe: 7,
        penyulang: '',
        section: '',
        tanggal: todayStr,
        targetKms: 10,
        realisasiKms: 0,
        realisasiGawang: 0,
        jumlahTemuan: 0,
        realisasiTemuan: 0,
        luarTemuan: 0,
        realisasiLuarTemuan: 0,
        perluPadam: false,
        jumlahPerluPadam: 0,
        tidakAdaIzin: false,
        jumlahTidakAdaIzin: 0,
        pohonBesar: false,
        jumlahPohonBesar: 0,
        catatan: '',
      });
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Handle Date Change -> Sync year and month
  const handleDateChange = (val: string) => {
    if (!val) {
      setFormData((prev) => ({ ...prev, tanggal: '' }));
      return;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const yr = d.getFullYear();
      const mKe = d.getMonth() + 1;
      const bStr = `${yr}-${String(mKe).padStart(2, '0')}`;
      setFormData((prev) => ({
        ...prev,
        tanggal: val,
        tahun: yr,
        bulanKe: mKe,
        bulan: bStr,
      }));
    } else {
      setFormData((prev) => ({ ...prev, tanggal: val }));
    }
  };

  const handleYearChange = (yrVal: number) => {
    const mKe = formData.bulanKe || 7;
    const bStr = `${yrVal}-${String(mKe).padStart(2, '0')}`;
    let newTanggal = formData.tanggal;
    if (formData.tanggal && formData.tanggal.includes('-')) {
      const parts = formData.tanggal.split('-');
      parts[0] = String(yrVal);
      newTanggal = parts.join('-');
    }
    setFormData((prev) => ({
      ...prev,
      tahun: yrVal,
      bulan: bStr,
      tanggal: newTanggal,
    }));
  };

  const handleMonthChange = (mKe: number) => {
    const yr = formData.tahun || todayYear;
    const bStr = `${yr}-${String(mKe).padStart(2, '0')}`;
    let newTanggal = formData.tanggal;
    if (formData.tanggal && formData.tanggal.includes('-')) {
      const parts = formData.tanggal.split('-');
      parts[1] = String(mKe).padStart(2, '0');
      newTanggal = parts.join('-');
    }
    setFormData((prev) => ({
      ...prev,
      bulanKe: mKe,
      bulan: bStr,
      tanggal: newTanggal,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for Mandatory Fields
    if (!formData.section || formData.section.trim() === '') {
      setErrorMsg('Section jaringan wajib diisi (contoh: Section GMB-01).');
      return;
    }

    if (formData.targetKms === undefined || formData.targetKms < 0) {
      setErrorMsg('Target KMS wajib diisi dan harus bernilai positif.');
      return;
    }

    if (formData.jumlahTemuan === undefined || formData.jumlahTemuan < 0) {
      setErrorMsg('Jumlah Temuan wajib diisi.');
      return;
    }

    const yr = Number(formData.tahun) || (formData.tanggal ? new Date(formData.tanggal).getFullYear() : todayYear);
    const bKe = Number(formData.bulanKe) || (formData.bulan ? parseInt(formData.bulan.split('-')[1], 10) : 7) || 7;
    const bStr = `${yr}-${String(bKe).padStart(2, '0')}`;

    const recordToSave: ROWRecord = {
      id: formData.id || `row-${Date.now()}`,
      bulan: bStr,
      tahun: yr,
      bulanKe: bKe,
      penyulang: formData.penyulang ? formData.penyulang.trim() : undefined,
      section: formData.section.trim(),
      tanggal: formData.tanggal || todayStr,
      targetKms: Number(formData.targetKms) || 0,
      realisasiKms: Number(formData.realisasiKms) || 0,
      realisasiGawang: Number(formData.realisasiGawang) || 0,
      jumlahTemuan: Number(formData.jumlahTemuan) || 0,
      realisasiTemuan: Number(formData.realisasiTemuan) || 0,
      luarTemuan: Number(formData.luarTemuan) || 0,
      realisasiLuarTemuan: Number(formData.realisasiLuarTemuan) || 0,
      
      // Opsional fields
      perluPadam: Boolean(formData.perluPadam),
      jumlahPerluPadam: formData.perluPadam ? Number(formData.jumlahPerluPadam || 0) : 0,
      
      tidakAdaIzin: Boolean(formData.tidakAdaIzin),
      jumlahTidakAdaIzin: formData.tidakAdaIzin ? Number(formData.jumlahTidakAdaIzin || 0) : 0,
      
      pohonBesar: Boolean(formData.pohonBesar),
      jumlahPohonBesar: formData.pohonBesar ? Number(formData.jumlahPohonBesar || 0) : 0,
      
      catatan: formData.catatan || '',
      tanggalUpdate: todayStr,
    };

    onSave(recordToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {initialData ? 'Edit Data Monitoring ROW' : 'Input Form Temuan & Realisasi ROW'}
              </h2>
              <p className="text-xs text-slate-400">
                Lengkapi kolom mandatori & opsional pemangkasan pohon penyulang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: MANDATORI FIELDS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Kolom Utama (Mandatori)
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                Wajib Diisi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tahun Monitoring */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
                  Tahun <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.tahun || todayYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-purple-50/50 border border-purple-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold text-purple-900"
                >
                  {YEAR_LIST.map((y) => (
                    <option key={y} value={y}>
                      Tahun {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulan Monitoring */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                  Bulan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.bulanKe || 7}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                >
                  {BULAN_SIMPLE_LIST.map((b) => (
                    <option key={b.value} value={b.monthKe}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Penyulang (Manual Input) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Penyulang <span className="text-slate-400 font-normal">(Isi Manual / Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Isi manual nama penyulang..."
                  value={formData.penyulang || ''}
                  onChange={(e) => setFormData({ ...formData, penyulang: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              {/* Section Line */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Jaringan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Section GMB-05 (Juanda - Istana)"
                  value={formData.section || ''}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>
            </div>

            {/* Realisasi KMS / Gawang Row (Target KMS diatur manual di Dashboard) */}
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 border-b border-emerald-200/60 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Form Input Hasil Realisasi Pekerjaan ROW
                </span>
                <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">
                  Target Bulanan Diatur di Dashboard
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Realisasi KMS <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 2.5"
                    value={formData.realisasiKms ?? 0}
                    onChange={(e) => setFormData({ ...formData, realisasiKms: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-emerald-700 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">KMS panjang lintasan terealisasi</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Realisasi Gawang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 15"
                    value={formData.realisasiGawang ?? 0}
                    onChange={(e) => setFormData({ ...formData, realisasiGawang: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-cyan-700 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Jumlah gawang (span) bebas dahan</span>
                </div>
              </div>
            </div>

            {/* Temuan & Realisasi Temuan Pohon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Temuan Pohon <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.jumlahTemuan ?? 0}
                  onChange={(e) => setFormData({ ...formData, jumlahTemuan: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Total titik pohon ditemukan</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Realisasi Temuan Pohon <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.realisasiTemuan ?? 0}
                  onChange={(e) => setFormData({ ...formData, realisasiTemuan: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-emerald-800 font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Pohon selesai dipangkas</span>
              </div>
            </div>

            {/* Form Input Luar Temuan (Temuan Di Luar Target / Insidental) */}
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  Form Input Luar Temuan (Pohon Di Luar Target ROW)
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded border border-purple-200">
                  Temuan Tambahan / Insidental
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Pohon Luar Temuan
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.luarTemuan ?? 0}
                    onChange={(e) => setFormData({ ...formData, luarTemuan: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Insidental di luar jadwal rutin</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Realisasi Pangkas Luar Temuan
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.realisasiLuarTemuan ?? 0}
                    onChange={(e) => setFormData({ ...formData, realisasiLuarTemuan: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-purple-700 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Jumlah yang berhasil dipangkas</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: OPTIONAL FIELDS (Bukan Mandatori) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Kolom Kendala Tambahan (Opsional / Bukan Mandatori)
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                Opsional
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Perlu Padam */}
              <div className={`p-3 rounded-xl border transition ${formData.perluPadam ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                <label className="flex items-center space-x-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={formData.perluPadam || false}
                    onChange={(e) => setFormData({ ...formData, perluPadam: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <PowerOff className="w-3 h-3 text-amber-600" /> Perlu Padam
                  </span>
                </label>
                {formData.perluPadam && (
                  <input
                    type="number"
                    min="1"
                    placeholder="Jumlah titik"
                    value={formData.jumlahPerluPadam || ''}
                    onChange={(e) => setFormData({ ...formData, jumlahPerluPadam: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded focus:outline-none text-slate-900"
                  />
                )}
              </div>

              {/* Tidak Ada Izin / Perlu Izin */}
              <div className={`p-3 rounded-xl border transition ${formData.tidakAdaIzin ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                <label className="flex items-center space-x-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={formData.tidakAdaIzin || false}
                    onChange={(e) => setFormData({ ...formData, tidakAdaIzin: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-600" /> Tidak Ada Izin
                  </span>
                </label>
                {formData.tidakAdaIzin && (
                  <input
                    type="number"
                    min="1"
                    placeholder="Jumlah titik"
                    value={formData.jumlahTidakAdaIzin || ''}
                    onChange={(e) => setFormData({ ...formData, jumlahTidakAdaIzin: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2 py-1 text-xs bg-white border border-rose-300 rounded focus:outline-none text-slate-900"
                  />
                )}
              </div>

              {/* Pohon Besar */}
              <div className={`p-3 rounded-xl border transition ${formData.pohonBesar ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                <label className="flex items-center space-x-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={formData.pohonBesar || false}
                    onChange={(e) => setFormData({ ...formData, pohonBesar: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <TreePine className="w-3 h-3 text-blue-600" /> Pohon Besar
                  </span>
                </label>
                {formData.pohonBesar && (
                  <input
                    type="number"
                    min="1"
                    placeholder="Jumlah pohon"
                    value={formData.jumlahPohonBesar || ''}
                    onChange={(e) => setFormData({ ...formData, jumlahPohonBesar: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2 py-1 text-xs bg-white border border-blue-300 rounded focus:outline-none text-slate-900"
                  />
                )}
              </div>
            </div>

            {/* Catatan / Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Informasi Lapangan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Menunggu koordinasi izin dengan Dinas Pertamanan atau jadwal padam Sabtu malam..."
                value={formData.catatan || ''}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow transition border border-emerald-300 flex items-center space-x-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Simpan Data Monitoring</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
