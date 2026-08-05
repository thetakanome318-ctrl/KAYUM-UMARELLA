import React, { useState, useEffect } from 'react';
import { X, Clock, Zap } from 'lucide-react';
import { ROWRecord, Penyulang, MasterSection } from '../types';
import { KODE_PENYEBAB_OPTIONS } from './GangguanPangkalView';

interface GangguanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ROWRecord>) => void;
  penyulangList?: Penyulang[];
  sectionList?: MasterSection[];
  initialData?: Partial<ROWRecord> | null;
}

// Calculate duration in hours & minutes from Jam Keluar and Jam Masuk
const calculateDuration = (jamKeluarStr: string, jamMasukStr: string): string => {
  if (!jamKeluarStr || !jamMasukStr) return '';
  const cleanK = jamKeluarStr.replace('.', ':').trim();
  const cleanM = jamMasukStr.replace('.', ':').trim();
  const kParts = cleanK.split(':');
  const mParts = cleanM.split(':');
  if (kParts.length >= 2 && mParts.length >= 2) {
    const kH = parseInt(kParts[0], 10);
    const kM = parseInt(kParts[1], 10);
    const mH = parseInt(mParts[0], 10);
    const mM = parseInt(mParts[1], 10);
    if (!isNaN(kH) && !isNaN(kM) && !isNaN(mH) && !isNaN(mM)) {
      let startMins = kH * 60 + kM;
      let endMins = mH * 60 + mM;
      let diff = endMins - startMins;
      if (diff < 0) diff += 24 * 60; // Overnight
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      if (hours > 0 && mins > 0) return `${hours}j ${mins}m`;
      if (hours > 0) return `${hours}j`;
      return `${mins}m`;
    }
  }
  return '';
};

export const GangguanFormModal: React.FC<GangguanFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  penyulangList = [],
  sectionList = [],
  initialData = null
}) => {
  const [formData, setFormData] = useState<Partial<ROWRecord> & { satuanArus?: 'A' | 'kA' }>({
    gangguan: true,
    tanggal: new Date().toISOString().split('T')[0],
    penyulang: '',
    section: '',
    gangguanKeterangan: '',
    penyebab: '',
    satuanArus: 'A'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        gangguan: true,
        tanggal: initialData.tanggal || new Date().toISOString().split('T')[0],
        penyulang: initialData.penyulang || '',
        section: initialData.section || '',
        gangguanKeterangan: initialData.gangguanKeterangan || '',
        penyebab: initialData.penyebab || '',
        satuanArus: (initialData as any).satuanArus || 'A',
        ...initialData
      });
    } else {
      setFormData({
        gangguan: true,
        tanggal: new Date().toISOString().split('T')[0],
        penyulang: '',
        section: '',
        gangguanKeterangan: '',
        penyebab: '',
        satuanArus: 'A'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Filter sections by selected penyulang
  const availableSections = sectionList.filter(s => !formData.penyulang || s.penyulang === formData.penyulang);

  const handleJamChange = (field: 'jamKeluar' | 'jamMasuk', val: string) => {
    const updated = { ...formData, [field]: val };
    const computed = calculateDuration(updated.jamKeluar || '', updated.jamMasuk || '');
    if (computed) {
      updated.durasi = computed;
    }
    setFormData(updated);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-800 my-auto max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-4 flex-shrink-0 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{initialData?.id ? 'Edit Gangguan Penyulang' : 'Input Gangguan Penyulang'}</h2>
              <p className="text-[11px] text-slate-400">Pencatatan gangguan trip & pemadaman penyulang</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Tanggal Gangguan *</label>
            <input type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Nama Penyulang (Master Data) *</label>
            <select
              value={formData.penyulang || ''}
              onChange={e => setFormData({...formData, penyulang: e.target.value, section: ''})}
              className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">-- Pilih Penyulang --</option>
              {penyulangList.map(p => (
                <option key={p.id} value={p.nama}>{p.nama} {p.kode ? `(${p.kode})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Section Jaringan (Master Data)</label>
            <select
              value={formData.section || ''}
              onChange={e => setFormData({...formData, section: e.target.value})}
              className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">-- Pilih Section --</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.namaSection}>{s.namaSection} {s.jumlahPelanggan ? `(${s.jumlahPelanggan} Pelanggan)` : ''}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Atau ketik nama section manual..." 
              value={formData.section || ''} 
              onChange={e => setFormData({...formData, section: e.target.value})} 
              className="w-full mt-1.5 bg-slate-800/80 text-white p-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          {/* Jam Keluar, Jam Masuk, Durasi (Otomatis Terhitung) */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Jam Keluar</label>
              <input 
                type="text" 
                placeholder="08:00" 
                value={formData.jamKeluar || ''} 
                onChange={e => handleJamChange('jamKeluar', e.target.value)} 
                className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 font-mono text-center focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Jam Masuk</label>
              <input 
                type="text" 
                placeholder="09:30" 
                value={formData.jamMasuk || ''} 
                onChange={e => handleJamChange('jamMasuk', e.target.value)} 
                className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 font-mono text-center focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-emerald-400 mb-1 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Durasi Auto</span>
              </label>
              <input 
                type="text" 
                placeholder="1j 30m" 
                value={formData.durasi || ''} 
                onChange={e => setFormData({...formData, durasi: e.target.value})} 
                className="w-full bg-slate-800 text-emerald-400 font-bold p-2 rounded-lg border border-emerald-500/30 font-mono text-center focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Relay Bekerja</label>
            <input type="text" placeholder="OCR / GFR / RECLOSER" value={formData.relayBekerja || ''} onChange={e => setFormData({...formData, relayBekerja: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Arus Input (Bisa 0) & Satuan Ampere / kA */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-slate-300">Relay Arus R S T</label>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400">Satuan Arus:</span>
                <select
                  value={formData.satuanArus || 'A'}
                  onChange={e => setFormData({ ...formData, satuanArus: e.target.value as 'A' | 'kA' })}
                  className="bg-indigo-950/80 text-indigo-300 font-bold text-[10px] px-2 py-0.5 rounded-md border border-indigo-500/40 focus:outline-none cursor-pointer"
                >
                  <option value="A">Ampere (A)</option>
                  <option value="kA">Kilo Ampere (kA)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input 
                type="number" 
                step="any" 
                placeholder="Arus R (0)" 
                value={formData.relayArusR ?? ''} 
                onChange={e => setFormData({...formData, relayArusR: e.target.value === '' ? undefined : Number(e.target.value)})} 
                className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              />
              <input 
                type="number" 
                step="any" 
                placeholder="Arus S (0)" 
                value={formData.relayArusS ?? ''} 
                onChange={e => setFormData({...formData, relayArusS: e.target.value === '' ? undefined : Number(e.target.value)})} 
                className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              />
              <input 
                type="number" 
                step="any" 
                placeholder="Arus T (0)" 
                value={formData.relayArusT ?? ''} 
                onChange={e => setFormData({...formData, relayArusT: e.target.value === '' ? undefined : Number(e.target.value)})} 
                className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Arus IN ({formData.satuanArus || 'A'})</label>
            <input 
              type="number" 
              step="any" 
              placeholder="Arus IN (Bisa 0)" 
              value={formData.arusIN ?? ''} 
              onChange={e => setFormData({...formData, arusIN: e.target.value === '' ? undefined : Number(e.target.value)})} 
              className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Penyebab Gangguan</label>
            <input type="text" placeholder="Pohon rantas / hewan / petir / komponen rusak" value={formData.penyebab || ''} onChange={e => setFormData({...formData, penyebab: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Kode Gangguan</label>
            <select
              value={formData.kodeGangguan || ''}
              onChange={e => setFormData({...formData, kodeGangguan: e.target.value})}
              className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">-- Pilih Kode Gangguan --</option>
              {KODE_PENYEBAB_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.code} - {opt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Detail Lokasi Gangguan</label>
            <input type="text" placeholder="e.g. Tiang BG-45 s/d BG-52 Jl. Latuharhary" value={formData.lokasi || ''} onChange={e => setFormData({...formData, lokasi: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Catatan / Keterangan</label>
            <textarea rows={2} placeholder="Keterangan tindakan penanganan gangguan..." value={formData.gangguanKeterangan || ''} onChange={e => setFormData({...formData, gangguanKeterangan: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
        </div>
        
        <div className="pt-4 mt-2 border-t border-slate-800 flex-shrink-0">
          <button 
            onClick={() => { onSave(formData); onClose(); }} 
            className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-2.5 rounded-xl transition-all text-xs shadow-lg shadow-rose-500/20 cursor-pointer active:scale-98"
          >
            Simpan Data Gangguan
          </button>
        </div>
      </div>
    </div>
  );
};


