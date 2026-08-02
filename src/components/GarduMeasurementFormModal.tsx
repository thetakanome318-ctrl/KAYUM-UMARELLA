import React, { useState, useEffect } from 'react';
import { X, ClipboardCheck, AlertCircle, Zap, Calendar } from 'lucide-react';
import { ROWRecord, Penyulang, MasterSection } from '../types';

interface GarduMeasurementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: ROWRecord) => void;
  penyulangList?: Penyulang[];
  sectionList?: MasterSection[];
  isLight?: boolean;
}

export const GarduMeasurementFormModal: React.FC<GarduMeasurementFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  penyulangList = [],
  sectionList = [],
  isLight = false
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<ROWRecord>>({
    penyulang: '',
    section: '',
    tanggal: todayStr,
    temuanGardu: 0,
    catatan: '',
    inspectionType: 'Gardu',
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        penyulang: '',
        section: '',
        tanggal: todayStr,
        temuanGardu: 0,
        catatan: '',
        inspectionType: 'Gardu',
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

    const d = new Date(formData.tanggal || todayStr);
    const yr = d.getFullYear();
    const mKe = d.getMonth() + 1;
    const bStr = `${yr}-${String(mKe).padStart(2, '0')}`;

    const recordToSave: ROWRecord = {
      id: `gardu-${Date.now()}`,
      bulan: bStr,
      tahun: yr,
      bulanKe: mKe,
      penyulang: formData.penyulang,
      section: formData.section,
      tanggal: formData.tanggal || todayStr,
      targetKms: 0,
      realisasiKms: 0,
      realisasiGawang: 0,
      jumlahTemuan: 0,
      realisasiTemuan: 0,
      inspectionType: 'Gardu',
      temuanGardu: Number(formData.temuanGardu || 0),
      catatan: `[GARDU] ${formData.catatan || ''}`,
      tanggalUpdate: todayStr,
    };

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
        <div className={`p-4 border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${textTitle}`}>Pengukuran Gardu</h2>
              <p className="text-[10px] text-slate-500">Input hasil pengukuran gardu</p>
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

          <div className="space-y-4">
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Tanggal</label>
              <input type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} className={`w-full px-3 py-2 text-xs rounded-xl border ${inputClass}`} />
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Penyulang</label>
              <select value={formData.penyulang} onChange={(e) => setFormData({ ...formData, penyulang: e.target.value })} className={`w-full px-3 py-2 text-xs rounded-xl border ${inputClass}`}>
                <option value="">Pilih Penyulang</option>
                {penyulangList.map((p) => <option key={p.id} value={p.nama}>{p.nama}</option>)}
              </select>
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Section Jaringan (Master Data)</label>
              <select
                value={formData.section || ''}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-xl border mb-1.5 ${inputClass}`}
              >
                <option value="">Pilih Section dari Master Data</option>
                {sectionList.filter(s => !formData.penyulang || s.penyulang === formData.penyulang).map((s) => (
                  <option key={s.id} value={s.namaSection}>{s.namaSection} {s.jumlahPelanggan ? `(${s.jumlahPelanggan} Plg)` : ''}</option>
                ))}
              </select>
              <input type="text" placeholder="Atau ketik section manual..." value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className={`w-full px-3 py-2 text-xs rounded-xl border ${inputClass}`} />
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Jumlah Temuan Gardu</label>
              <input type="number" min="0" value={formData.temuanGardu} onChange={(e) => setFormData({ ...formData, temuanGardu: parseInt(e.target.value) || 0 })} className={`w-full px-3 py-2 text-xs rounded-xl border ${inputClass}`} />
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Catatan</label>
              <textarea rows={2} value={formData.catatan} onChange={(e) => setFormData({ ...formData, catatan: e.target.value })} className={`w-full px-3 py-2 text-xs rounded-xl border ${inputClass}`} />
            </div>
          </div>

          <button type="submit" className="w-full py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl">Simpan</button>
        </form>
      </div>
    </div>
  );
};
