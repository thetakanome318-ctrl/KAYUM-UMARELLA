import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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

export const GangguanFormModal: React.FC<GangguanFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  penyulangList = [],
  sectionList = [],
  initialData = null
}) => {
  const [formData, setFormData] = useState<Partial<ROWRecord>>({
    gangguan: true,
    tanggal: new Date().toISOString().split('T')[0],
    penyulang: '',
    section: '',
    gangguanKeterangan: '',
    penyebab: '',
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
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Filter sections by selected penyulang
  const availableSections = sectionList.filter(s => !formData.penyulang || s.penyulang === formData.penyulang);

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-800 my-auto max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">{initialData?.id ? 'Edit Gangguan Penyulang' : 'Input Gangguan Penyulang'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tanggal</label>
            <input type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nama Penyulang (Master Data)</label>
            <select
              value={formData.penyulang || ''}
              onChange={e => setFormData({...formData, penyulang: e.target.value, section: ''})}
              className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs"
            >
              <option value="">Pilih Penyulang</option>
              {penyulangList.map(p => (
                <option key={p.id} value={p.nama}>{p.nama} {p.kode ? `(${p.kode})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Section Jaringan (Master Data)</label>
            <select
              value={formData.section || ''}
              onChange={e => setFormData({...formData, section: e.target.value})}
              className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs"
            >
              <option value="">Pilih Section</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.namaSection}>{s.namaSection} {s.jumlahPelanggan ? `(${s.jumlahPelanggan} Pelanggan)` : ''}</option>
              ))}
            </select>
            {formData.penyulang && availableSections.length === 0 && (
              <p className="text-[10px] text-amber-400 mt-1">Belum ada master section untuk penyulang ini. Anda dapat mengetik manual atau menambahkannya di Master Data.</p>
            )}
            <input 
              type="text" 
              placeholder="Atau ketik nama section manual..." 
              value={formData.section || ''} 
              onChange={e => setFormData({...formData, section: e.target.value})} 
              className="w-full mt-1.5 bg-slate-800/80 text-white p-2 rounded-lg border border-slate-700 text-xs" 
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Jam Keluar</label>
              <input type="text" placeholder="08:00" value={formData.jamKeluar || ''} onChange={e => setFormData({...formData, jamKeluar: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Jam Masuk</label>
              <input type="text" placeholder="09:30" value={formData.jamMasuk || ''} onChange={e => setFormData({...formData, jamMasuk: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Durasi</label>
              <input type="text" placeholder="1h 30m" value={formData.durasi || ''} onChange={e => setFormData({...formData, durasi: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Relay Bekerja</label>
            <input type="text" placeholder="OCR / GFR" value={formData.relayBekerja || ''} onChange={e => setFormData({...formData, relayBekerja: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Relay Arus R S T (Ampere)</label>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="Arus R" value={formData.relayArusR || ''} onChange={e => setFormData({...formData, relayArusR: Number(e.target.value)})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
              <input type="number" placeholder="Arus S" value={formData.relayArusS || ''} onChange={e => setFormData({...formData, relayArusS: Number(e.target.value)})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
              <input type="number" placeholder="Arus T" value={formData.relayArusT || ''} onChange={e => setFormData({...formData, relayArusT: Number(e.target.value)})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Arus IN</label>
            <input type="number" placeholder="Arus IN" value={formData.arusIN || ''} onChange={e => setFormData({...formData, arusIN: Number(e.target.value)})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Penyebab</label>
            <input type="text" placeholder="Pohon rantas / binatang / petir" value={formData.penyebab || ''} onChange={e => setFormData({...formData, penyebab: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Gardu / Lokasi</label>
            <input type="text" placeholder="Masukkan ID Gardu atau nama" value={formData.kodeGardu || ''} onChange={e => setFormData({...formData, kodeGardu: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Lokasi</label>
            <input type="text" placeholder="Lokasi gangguan" value={formData.lokasi || ''} onChange={e => setFormData({...formData, lokasi: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Kode Gangguan</label>
            <select
              value={formData.kodeGangguan || ''}
              onChange={e => setFormData({...formData, kodeGangguan: e.target.value})}
              className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs"
            >
              <option value="">Pilih Kode Gangguan</option>
              {KODE_PENYEBAB_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.code} - {opt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Keterangan</label>
            <textarea placeholder="Keterangan tambahan" value={formData.gangguanKeterangan || ''} onChange={e => setFormData({...formData, gangguanKeterangan: e.target.value})} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-700 text-xs" />
          </div>
        </div>
        
        <div className="pt-4 mt-2 border-t border-slate-800 flex-shrink-0">
          <button onClick={() => { onSave(formData); onClose(); }} className="w-full bg-emerald-500 text-slate-950 font-bold py-2 rounded-lg hover:bg-emerald-400 transition-colors text-xs">
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

