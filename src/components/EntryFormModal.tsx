import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, TreePine, ShieldAlert, PowerOff, Sparkles, CalendarDays, Compass, QrCode } from 'lucide-react';
import { ROWRecord, Penyulang, MasterSection } from '../types';
import { BULAN_SIMPLE_LIST, YEAR_LIST } from '../data/mockData';
import { QrScanner, parseQrContent } from './QrScanner';

interface EntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: ROWRecord) => void;
  initialData?: ROWRecord | null;
  isReadOnly?: boolean;
  isMapFindingOnly?: boolean;
  penyulangList?: Penyulang[];
  sectionList?: MasterSection[];
  allRecords?: ROWRecord[];
}

export const EntryFormModal: React.FC<EntryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isReadOnly = false,
  isMapFindingOnly = false,
  penyulangList = [],
  sectionList = [],
  allRecords = []
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
    lokasi: '',
    namaPohon: '',
    isMapFinding: false,
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

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
    
      setFormData({
        bulan: `${todayYear}-07`,
        tahun: todayYear,
        bulanKe: 7,
        penyulang: '',
        section: '',
        tanggal: todayStr,
        realisasiKms: 0,
        realisasiGawang: 0,
        jumlahTemuan: isMapFindingOnly ? 1 : 0,
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
        lokasi: '',
        namaPohon: '',
        isMapFinding: isMapFindingOnly,
      });
    }
    setErrorMsg('');
  }, [initialData, isOpen, isMapFindingOnly]);

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
    
      setFormData((prev) => ({ ...prev, tanggal: val }));
    }
  };

  const handleYearChange = (yrVal: number) => {
    const mKe = formData.bulanKe || 7;
    const bStr = `${yrVal}-${String(mKe).padStart(2, '0')}`;
    let newTanggal = formData.tanggal;
    if (formData.tanggal && (formData.tanggal || '').includes('-')) {
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
    if (formData.tanggal && (formData.tanggal || '').includes('-')) {
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

    if (!isMapFindingOnly) {
    } else {

    
      if (!formData.penyulang || formData.penyulang.trim() === '') {
        setErrorMsg('Nama penyulang wajib diisi.');
        return;
      }
      if (!formData.lokasi || formData.lokasi.trim() === '') {
        setErrorMsg('Lokasi pohon wajib diisi.');
        return;
      }
      if (!formData.namaPohon || formData.namaPohon.trim() === '') {
        setErrorMsg('Nama atau jenis pohon wajib diisi.');
        return;
      }
      if (formData.latitude === undefined || isNaN(formData.latitude) || formData.longitude === undefined || isNaN(formData.longitude)) {
        setErrorMsg('Koordinat geografis (Latitude & Longitude) wajib diisi untuk temuan map.');
        return;
      }
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
      targetKms: 0,
      realisasiKms: isMapFindingOnly ? 0 : (Number(formData.realisasiKms) || 0),
      realisasiGawang: isMapFindingOnly ? 0 : (Number(formData.realisasiGawang) || 0),
      jumlahTemuan: isMapFindingOnly ? 1 : (Number(formData.jumlahTemuan) || 0),
      realisasiTemuan: isMapFindingOnly ? 0 : (Number(formData.realisasiTemuan) || 0),
      luarTemuan: isMapFindingOnly ? 0 : (Number(formData.luarTemuan) || 0),
      realisasiLuarTemuan: isMapFindingOnly ? 0 : (Number(formData.realisasiLuarTemuan) || 0),
      
      // Opsional fields
      perluPadam: Boolean(formData.perluPadam),
      jumlahPerluPadam: formData.perluPadam ? Number(formData.jumlahPerluPadam || 0) : 0,
      
      tidakAdaIzin: Boolean(formData.tidakAdaIzin),
      jumlahTidakAdaIzin: formData.tidakAdaIzin ? Number(formData.jumlahTidakAdaIzin || 0) : 0,
      
      pohonBesar: Boolean(formData.pohonBesar),
      jumlahPohonBesar: formData.pohonBesar ? Number(formData.jumlahPohonBesar || 0) : 0,
      
      catatan: formData.catatan || '',
      tanggalUpdate: todayStr,
      latitude: formData.latitude !== undefined && !isNaN(formData.latitude) ? Number(formData.latitude) : undefined,
      longitude: formData.longitude !== undefined && !isNaN(formData.longitude) ? Number(formData.longitude) : undefined,
      lokasi: formData.lokasi?.trim() || '',
      namaPohon: formData.namaPohon?.trim() || '',
      isMapFinding: isMapFindingOnly || !!formData.isMapFinding,
      treeDetails: formData.treeDetails || [],
    };

    onSave(recordToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isReadOnly 
                  ? 'Detail Monitoring ROW (Read-Only)' 
                  : isMapFindingOnly 
                    ? 'Tambah Temuan Map Baru' 
                    : initialData 
                      ? 'Edit Data Monitoring ROW' 
                      : 'Input Form Temuan & Realisasi ROW'}
              </h2>
              <p className="text-xs text-slate-400">
                {isReadOnly 
                  ? 'Melihat detail informasi pangkas pohon & target KMS' 
                  : isMapFindingOnly 
                    ? 'Isi info penyulang, section, lokasi, nama pohon, dan koordinat geografis' 
                    : 'Lengkapi kolom mandatori & opsional pemangkasan pohon penyulang'}
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

        {/* Form Body - Made scrollable internally for pristine mobile experience */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* QR Code Scanner Trigger for mobile-friendly view */}
          {!isReadOnly && (
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-600 rounded-lg shrink-0">
                  <QrCode className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Isi Form via QR Code</h4>
                  <p className="text-[10px] text-slate-500">Pindai QR Code pada tiang atau section untuk isi otomatis.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrScannerOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5 shrink-0"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </button>
            </div>
          )}

          {isQrScannerOpen && (
            <QrScanner
              isLight={true}
              onClose={() => setIsQrScannerOpen(false)}
              onScanSuccess={(text) => {
                const parsed = parseQrContent(text);
                setFormData((prev) => {
                  const updated = { ...prev };
                  
                  if (parsed.penyulang) {
                    const foundP = penyulangList.find(p => p.nama.toLowerCase() === parsed.penyulang?.toLowerCase());
                    updated.penyulang = foundP ? foundP.nama : parsed.penyulang;
                  }
                  
                  if (parsed.section) {
                    const foundS = sectionList.find(s => s.namaSection.toLowerCase() === parsed.section?.toLowerCase());
                    updated.section = foundS ? foundS.namaSection : parsed.section;
                  }

                  if (parsed.kodeGardu) {
                    updated.kodeGardu = parsed.kodeGardu;
                  }
                  if (parsed.kapasitas) {
                    updated.kapasitas = parsed.kapasitas;
                  }

                  return updated;
                });
                setIsQrScannerOpen(false);
              }}
            />
          )}

          <fieldset disabled={isReadOnly} className="space-y-6">
            {isMapFindingOnly ? (
              /* MAP FINDING ONLY FORM FIELDS */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-teal-600" />
                    Input Tambahan Temuan Map
                  </h3>
                  <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded border border-teal-200">
                    Wajib Diisi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Penyulang */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Penyulang <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.penyulang || ''}
                      onChange={(e) => setFormData({ ...formData, penyulang: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
                    >
                      <option value="">Pilih Penyulang</option>
                      {penyulangList.map(p => (
                        <option key={p.id} value={p.nama}>{p.nama}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Section Jaringan (Master Data) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.section || ''}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium mb-1.5"
                    >
                      <option value="">Pilih Section dari Master Data</option>
                      {sectionList.filter(s => !formData.penyulang || s.penyulang === formData.penyulang).map(s => (
                        <option key={s.id} value={s.namaSection}>{s.namaSection} {s.jumlahPelanggan ? `(${s.jumlahPelanggan} Plg)` : ''}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Atau ketik section manual..."
                      value={formData.section || ''}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium"
                    />
                  </div>

                  {/* Tanggal (Date) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Temuan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.tanggal || todayStr}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                {/* Lokasi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi / Alamat Spesifik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Depan Kantor Gubernur, Jl. Pattimura No. 1"
                    value={formData.lokasi || ''}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium"
                  />
                </div>

                {/* Nama Pohon */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama / Jenis Pohon <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pohon Trembesi, Pohon Kelapa..."
                    value={formData.namaPohon || ''}
                    onChange={(e) => setFormData({ ...formData, namaPohon: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 font-medium"
                  />
                </div>

                {/* Koordinat Geografis */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-teal-600" />
                    Koordinat Geografis <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Latitude (Lintang) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Contoh: -3.6934"
                        value={formData.latitude ?? ''}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value !== '' ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Longitude (Bujur) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Contoh: 128.1812"
                        value={formData.longitude ?? ''}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value !== '' ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Kendala (Opsional) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className={`p-2.5 rounded-xl border transition ${formData.perluPadam ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.perluPadam || false}
                        onChange={(e) => setFormData({ ...formData, perluPadam: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-800">Perlu Padam</span>
                    </label>
                  </div>
                  <div className={`p-2.5 rounded-xl border transition ${formData.tidakAdaIzin ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tidakAdaIzin || false}
                        onChange={(e) => setFormData({ ...formData, tidakAdaIzin: e.target.checked })}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-800">Tidak Ada Izin</span>
                    </label>
                  </div>
                  <div className={`p-2.5 rounded-xl border transition ${formData.pohonBesar ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.pohonBesar || false}
                        onChange={(e) => setFormData({ ...formData, pohonBesar: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-800">Pohon Besar</span>
                    </label>
                  </div>
                </div>

                {/* Catatan / Keterangan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan / Informasi Lapangan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Menunggu koordinasi izin dengan Dinas Pertamanan..."
                    value={formData.catatan || ''}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800"
                  />
                </div>
              </div>
            ) : (
              /* ORIGINAL FULL FORM FIELDS */
              <div className="space-y-6">
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

                    {/* Tanggal Monitoring/Realisasi */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                        Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.tanggal || todayStr}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-blue-50/30 border border-blue-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Penyulang */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Penyulang <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.penyulang || ''}
                        onChange={(e) => setFormData({ ...formData, penyulang: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                      >
                        <option value="">Pilih Penyulang</option>
                        {penyulangList.map(p => (
                          <option key={p.id} value={p.nama}>{p.nama}</option>
                        ))}
                      </select>
                    </div>

                    {/* Section Line */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Section Jaringan (Hasil Inspeksi) <span className="text-rose-500">*</span>
                      </label>
                      {formData.penyulang ? (
                        <div className="flex flex-col gap-2">
                          <select
                            value={allRecords.some(r => r.id === formData.id) ? formData.id : 'NEW'}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              if (selectedId === 'NEW') {
                                setFormData(prev => ({ ...prev, id: '', section: '', treeDetails: [], realisasiKms: 0, realisasiGawang: 0, realisasiTemuan: 0 }));
                              
                                const rec = allRecords.find(r => r.id === selectedId);
                                if (rec) {
                                  setFormData({ ...rec, tanggal: todayStr, realisasiKms: rec.realisasiKms || 0, realisasiGawang: rec.realisasiGawang || 0, realisasiTemuan: rec.realisasiTemuan || 0 });
                                }
                              }
                            }}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                          >
                            <option value="NEW">+ Input Section Baru</option>
                            {allRecords.filter(r => r.penyulang === formData.penyulang).map(r => (
                              <option key={r.id} value={r.id}>{r.section} (Temuan: {r.jumlahTemuan})</option>
                            ))}
                          </select>
                          {(!allRecords.some(r => r.id === formData.id)) && (
                            <input
                              type="text"
                              placeholder="Ketik Section Baru..."
                              value={formData.section || ''}
                              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                            />
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Pilih penyulang terlebih dahulu"
                          disabled
                          className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed"
                        />
                      )}
                    </div>
                  </div>

                  {/* Realisasi KMS / Gawang Row */}
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900 border-b border-emerald-200/60 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Form Input Hasil Realisasi Pekerjaan ROW
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Realisasi KMS
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
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Realisasi Gawang
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 15"
                          value={formData.realisasiGawang ?? 0}
                          onChange={(e) => setFormData({ ...formData, realisasiGawang: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-cyan-700 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Temuan & Realisasi Temuan Pohon */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jumlah Temuan Pohon
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.jumlahTemuan ?? 0}
                        onChange={(e) => {
                          const newCount = parseInt(e.target.value, 10) || 0;
                          const newDetails = [...(formData.treeDetails || [])];
                          if (newCount > newDetails.length) {
                            for (let i = newDetails.length; i < newCount; i++) {
                              newDetails.push({
                                id: `tree-${Date.now()}-${i}`,
                                latitude: '',
                                longitude: '',
                                isEksekusi: false,
                                perluPadam: false,
                                belumIzin: false,
                                pohonBesar: false,
                                namaPohon: ''
                              });
                            }
                          } else if (newCount < newDetails.length) {
                            newDetails.length = newCount;
                          }
                          setFormData({ ...formData, jumlahTemuan: newCount, treeDetails: newDetails });
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Realisasi Temuan Pohon
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.realisasiTemuan ?? 0}
                        onChange={(e) => setFormData({ ...formData, realisasiTemuan: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-emerald-800 font-bold"
                      />
                    </div>
                  </div>

                  {/* Form Input Luar Temuan */}
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                        Form Input Luar Temuan (Pohon Di Luar Target ROW)
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
                      </div>
                    </div>
                  </div>

                  {/* Detail Status Per Pohon */}
                  {(formData.treeDetails || []).length > 0 && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                      <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <TreePine className="w-4 h-4 text-emerald-600" />
                        Status Detail Per Pohon
                      </label>
                      <div className="space-y-3">
                        {(formData.treeDetails || []).map((tree, idx) => (
                          <div key={tree.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                            <div className="text-[10px] font-bold text-slate-500 mb-2 border-b pb-1">Pohon #{idx + 1}</div>
                            
                            <div className="mb-2">
                              <label className="block text-[9px] font-semibold text-slate-600 mb-1">Nama/Jenis Pohon</label>
                              <input type="text" placeholder="Contoh: Pohon Mangga" value={tree.namaPohon || ''} onChange={(e) => {
                                const newArr = [...(formData.treeDetails || [])];
                                newArr[idx] = { ...newArr[idx], namaPohon: e.target.value };
                                setFormData({ ...formData, treeDetails: newArr });
                              }} className="w-full px-2 py-1 text-xs bg-slate-50 border rounded-md focus:ring-emerald-500 focus:border-emerald-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div>
                                <label className="block text-[9px] font-semibold text-slate-600 mb-1">Latitude</label>
                                <input type="number" step="any" value={tree.latitude} onChange={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : '';
                                  const newArr = [...(formData.treeDetails || [])];
                                  newArr[idx] = { ...newArr[idx], latitude: val };
                                  setFormData({ ...formData, treeDetails: newArr });
                                }} className="w-full px-2 py-1 text-xs bg-slate-50 border rounded-md" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-semibold text-slate-600 mb-1">Longitude</label>
                                <input type="number" step="any" value={tree.longitude} onChange={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : '';
                                  const newArr = [...(formData.treeDetails || [])];
                                  newArr[idx] = { ...newArr[idx], longitude: val };
                                  setFormData({ ...formData, treeDetails: newArr });
                                }} className="w-full px-2 py-1 text-xs bg-slate-50 border rounded-md" />
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <label className={`flex items-center space-x-1 p-1.5 rounded-md border cursor-pointer transition ${tree.isEksekusi ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                                <input type="checkbox" checked={tree.isEksekusi} onChange={(e) => {
                                  const checked = e.target.checked;
                                  const newArr = [...(formData.treeDetails || [])];
                                  newArr[idx] = { ...newArr[idx], isEksekusi: checked };
                                  const executedCount = newArr.filter(t => t.isEksekusi).length;
                                  setFormData({ ...formData, treeDetails: newArr, realisasiTemuan: executedCount });
                                }} className="w-3 h-3 text-emerald-600 rounded border-slate-300" />
                                <span className="text-[10px] font-bold text-slate-700">Sudah Eksekusi</span>
                              </label>

                              <label className={`flex items-center space-x-1 p-1.5 rounded-md border cursor-pointer transition ${tree.perluPadam ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                                <input type="checkbox" checked={tree.perluPadam} onChange={(e) => {
                                  const newArr = [...(formData.treeDetails || [])];
                                  newArr[idx] = { ...newArr[idx], perluPadam: e.target.checked };
                                  setFormData({ ...formData, treeDetails: newArr });
                                }} className="w-3 h-3 text-amber-600 rounded border-slate-300" />
                                <span className="text-[10px] font-bold text-slate-700">Perlu Padam</span>
                              </label>

                              <label className={`flex items-center space-x-1 p-1.5 rounded-md border cursor-pointer transition ${tree.belumIzin ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                                <input type="checkbox" checked={tree.belumIzin} onChange={(e) => {
                                  const newArr = [...(formData.treeDetails || [])];
                                  newArr[idx] = { ...newArr[idx], belumIzin: e.target.checked };
                                  setFormData({ ...formData, treeDetails: newArr });
                                }} className="w-3 h-3 text-rose-600 rounded border-slate-300" />
                                <span className="text-[10px] font-bold text-slate-700">Belum Izin</span>
                              </label>

                              <label className={`flex items-center space-x-1 p-1.5 rounded-md border cursor-pointer transition ${tree.pohonBesar ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                                <input type="checkbox" checked={tree.pohonBesar} onChange={(e) => {
                                  const newArr = [...(formData.treeDetails || [])];
                                  newArr[idx] = { ...newArr[idx], pohonBesar: e.target.checked };
                                  setFormData({ ...formData, treeDetails: newArr });
                                }} className="w-3 h-3 text-blue-600 rounded border-slate-300" />
                                <span className="text-[10px] font-bold text-slate-700">Pohon Besar</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 2: OPTIONAL FIELDS */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      Kolom Kendala Tambahan (Opsional / Bukan Mandatori)
                    </h3>
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

                    {/* Tidak Ada Izin */}
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

                  {/* Koordinat Geografis */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-emerald-600" />
                      Koordinat Geografis Lokasi (Opsional)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Latitude (Garis Lintang)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="Contoh: -6.1754"
                          value={formData.latitude ?? ''}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value !== '' ? parseFloat(e.target.value) : undefined })}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Longitude (Garis Bujur)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="Contoh: 106.8272"
                          value={formData.longitude ?? ''}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value !== '' ? parseFloat(e.target.value) : undefined })}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Catatan */}
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
              </div>
            )}
          </fieldset>
          </div>

          {/* Form Actions - Fixed Sticky Footer */}
          <div className="flex items-center justify-end space-x-3 p-4 border-t border-slate-200 shrink-0 bg-slate-50 rounded-b-2xl">
            {isReadOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-xl shadow transition border border-sky-300 flex items-center justify-center space-x-1.5"
              >
                <span>Tutup</span>
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
