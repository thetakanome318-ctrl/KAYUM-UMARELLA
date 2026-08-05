import React, { useState, useEffect } from 'react';
import { X, ClipboardCheck, AlertCircle, TreePine, Calendar, QrCode } from 'lucide-react';
import { ROWRecord, Penyulang, MasterSection } from '../types';
import { YEAR_LIST } from '../data/mockData';
import { QrScanner, parseQrContent } from './QrScanner';

interface InspectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: ROWRecord) => void;
  penyulangList?: Penyulang[];
  sectionList?: MasterSection[];
  isLight?: boolean;
}

export const InspectionFormModal: React.FC<InspectionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  penyulangList = [],
  sectionList = [],
  isLight = false
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayYear = new Date().getFullYear();

  const [formData, setFormData] = useState<Partial<ROWRecord>>({
    penyulang: '',
    section: '',
    tanggal: todayStr,
    jumlahTemuan: 0,
    temuanKonstruksi: 0,
    temuanGardu: 0,
    jumlahPerluPadam: 0,
    jumlahTidakAdaIzin: 0,
    jumlahPohonBesar: 0,
    catatan: '',
    inspectionType: undefined,
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        penyulang: '',
        section: '',
        tanggal: todayStr,
        jumlahTemuan: 0,
        temuanKonstruksi: 0,
        temuanGardu: 0,
        jumlahPerluPadam: 0,
        jumlahTidakAdaIzin: 0,
        jumlahPohonBesar: 0,
        catatan: '',
        inspectionType: undefined,
      });
      setErrorMsg('');
    }
  }, [isOpen, todayStr]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.penyulang) {
      setErrorMsg('Penyulang wajib diisi.');
      return;
    }
    if (!formData.section) {
      setErrorMsg('Section wajib diisi.');
      return;
    }
    if (formData.jumlahTemuan === undefined || formData.jumlahTemuan < 0) {
      setErrorMsg('Jumlah pohon temuan tidak valid.');
      return;
    }

    const d = new Date(formData.tanggal || todayStr);
    const yr = d.getFullYear();
    const mKe = d.getMonth() + 1;
    const bStr = `${yr}-${String(mKe).padStart(2, '0')}`;

    const recordToSave: ROWRecord = {
      id: `insp-${Date.now()}`,
      bulan: bStr,
      tahun: yr,
      bulanKe: mKe,
      penyulang: formData.penyulang,
      section: formData.section,
      tanggal: formData.tanggal || todayStr,
      targetKms: 0,
      realisasiKms: 0,
      realisasiGawang: 0,
      jumlahTemuan: Number(formData.jumlahTemuan),
      realisasiTemuan: 0,
      inspectionType: formData.inspectionType as any,
      temuanKonstruksi: Number(formData.temuanKonstruksi || 0),
      temuanGardu: Number(formData.temuanGardu || 0),
      jumlahPerluPadam: Number(formData.jumlahPerluPadam || 0),
      jumlahTidakAdaIzin: Number(formData.jumlahTidakAdaIzin || 0),
      jumlahPohonBesar: Number(formData.jumlahPohonBesar || 0),
      catatan: `[INSPEKSI] ${formData.catatan || ''}`,
      tanggalUpdate: todayStr,
      treeDetails: formData.treeDetails || [],
    };

    // Correcting field name consistency if needed
    if (formData.jumlahPohonBesar) recordToSave.jumlahPohonBesar = Number(formData.jumlahPohonBesar);

    onSave(recordToSave);
    onClose();
  };

  const modalBg = isLight ? 'bg-white' : 'bg-slate-900';
  const textTitle = isLight ? 'text-slate-800' : 'text-slate-100';
  const labelClass = isLight ? 'text-slate-700' : 'text-slate-300';
  const inputClass = isLight 
    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-emerald-500/20 focus:border-emerald-500' 
    : 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-emerald-500/20 focus:border-emerald-500';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${modalBg} rounded-2xl border ${isLight ? 'border-slate-200 shadow-xl' : 'border-slate-800 shadow-2xl'} w-full max-w-md overflow-hidden`}>
        {/* Header */}
        <div className={`p-4 border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${textTitle}`}>Input Temuan Inspeksi</h2>
              <p className="text-[10px] text-slate-500">Catat temuan pohon hasil inspeksi rutin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* QR Code Scanner Trigger for mobile-friendly view */}
          <div className={`border rounded-xl p-3 flex items-center justify-between gap-3 ${
            isLight ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20' : 'bg-slate-900/50 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg shrink-0">
                <QrCode className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Isi Form via QR Code</h4>
                <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pindai QR Code untuk isi otomatis.</p>
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

          {isQrScannerOpen && (
            <QrScanner
              isLight={isLight}
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

                  return updated;
                });
                setIsQrScannerOpen(false);
              }}
            />
          )}

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Tanggal */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>
                Tanggal Inspeksi
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className={`w-full pl-10 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-medium ${inputClass}`}
                />
              </div>
            </div>

            {/* Penyulang */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>
                Penyulang
              </label>
              <select
                value={formData.penyulang}
                onChange={(e) => setFormData({ ...formData, penyulang: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-medium ${inputClass}`}
              >
                <option value="">Pilih Penyulang</option>
                {penyulangList.map((p) => (
                  <option key={p.id} value={p.nama}>{p.nama}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>
                Section Jaringan (Master Data)
              </label>
              <select
                value={formData.section || ''}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-medium mb-1.5 ${inputClass}`}
              >
                <option value="">Pilih Section dari Master Data</option>
                {sectionList.filter(s => !formData.penyulang || s.penyulang === formData.penyulang).map((s) => (
                  <option key={s.id} value={s.namaSection}>{s.namaSection} {s.jumlahPelanggan ? `(${s.jumlahPelanggan} Plg)` : ''}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Atau ketik section manual..."
                value={formData.section || ''}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-medium ${inputClass}`}
              />
            </div>

            {/* Jenis Inspeksi */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>
                Jenis Inspeksi
              </label>
              <select
                value={formData.inspectionType || ''}
                onChange={(e) => setFormData({ ...formData, inspectionType: e.target.value as any })}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-medium ${inputClass}`}
              >
                <option value="">Pilih Jenis Inspeksi</option>
                <option value="Tier 1">Tier 1</option>
                <option value="Gardu">Gardu</option>
                <option value="Tier 2">Tier 2</option>
                <option value="Dream Mobile">Dream Mobile</option>
              </select>
            </div>

            {/* Jumlah Pohon Temuan */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>
                Total Temuan (Pohon)
              </label>
              <div className="relative">
                <TreePine className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.jumlahTemuan === 0 ? '' : formData.jumlahTemuan}
                  onChange={(e) => {
                    const newCount = parseInt(e.target.value) || 0;
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
                  className={`w-full pl-10 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-bold ${inputClass}`}
                />
              </div>
            </div>

            {/* Detail Koordinat Per Pohon */}
            {(formData.treeDetails || []).length > 0 && (
              <div className="space-y-3 mt-4 pt-4 border-t border-slate-500/20">
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>
                  Detail Koordinat Pohon
                </label>
                {(formData.treeDetails || []).map((tree, idx) => (
                  <div key={tree.id} className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-700/50'} space-y-2`}>
                    <div className="text-[10px] font-bold text-slate-500">Pohon #{idx + 1}</div>
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-500 mb-1">Nama / Jenis Pohon</label>
                      <input
                        type="text"
                        placeholder="Contoh: Pohon Mangga, Sengon, Durian"
                        value={tree.namaPohon || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newArr = [...(formData.treeDetails || [])];
                          newArr[idx] = { ...newArr[idx], namaPohon: val };
                          setFormData({ ...formData, treeDetails: newArr });
                        }}
                        className={`w-full px-2 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-1 font-medium ${inputClass}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Latitude"
                        value={tree.latitude}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : '';
                          const newArr = [...(formData.treeDetails || [])];
                          newArr[idx] = { ...newArr[idx], latitude: val };
                          setFormData({ ...formData, treeDetails: newArr });
                        }}
                        className={`w-full px-2 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-1 font-medium ${inputClass}`}
                      />
                      <input
                        type="number"
                        placeholder="Longitude"
                        value={tree.longitude}
                        onChange={(e) => {
                          const val = e.target.value ? parseFloat(e.target.value) : '';
                          const newArr = [...(formData.treeDetails || [])];
                          newArr[idx] = { ...newArr[idx], longitude: val };
                          setFormData({ ...formData, treeDetails: newArr });
                        }}
                        className={`w-full px-2 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-1 font-medium ${inputClass}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Additional Categories Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${labelClass}`}>
                  Butuh Padam
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.jumlahPerluPadam === 0 ? '' : formData.jumlahPerluPadam}
                  onChange={(e) => setFormData({ ...formData, jumlahPerluPadam: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-bold ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${labelClass}`}>
                  Belum Izin
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.jumlahTidakAdaIzin === 0 ? '' : formData.jumlahTidakAdaIzin}
                  onChange={(e) => setFormData({ ...formData, jumlahTidakAdaIzin: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-bold ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${labelClass}`}>
                  Pohon Besar
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.jumlahPohonBesar === 0 ? '' : formData.jumlahPohonBesar}
                  onChange={(e) => setFormData({ ...formData, jumlahPohonBesar: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-bold ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${labelClass}`}>
                  Temuan Konstruksi
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.temuanKonstruksi === 0 ? '' : formData.temuanKonstruksi}
                  onChange={(e) => setFormData({ ...formData, temuanKonstruksi: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-bold ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${labelClass}`}>
                  Temuan Gardu
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.temuanGardu === 0 ? '' : formData.temuanGardu}
                  onChange={(e) => setFormData({ ...formData, temuanGardu: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-bold ${inputClass}`}
                />
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>
                Keterangan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Tambahkan catatan jika ada..."
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 font-medium ${inputClass}`}
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 text-xs font-bold rounded-xl border transition-colors ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Simpan Temuan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
