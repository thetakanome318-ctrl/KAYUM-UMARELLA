import React, { useState, useEffect } from 'react';
import { PemeliharaanRecord, Penyulang, MasterSection } from '../types';
import { X, Save, Wrench, Calendar, MapPin, Tag, UserCheck, AlertCircle } from 'lucide-react';

interface PemeliharaanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PemeliharaanRecord) => void;
  initialData?: PemeliharaanRecord | null;
  penyulangList: Penyulang[];
  sectionList: MasterSection[];
}

export const PemeliharaanFormModal: React.FC<PemeliharaanFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  penyulangList,
  sectionList
}) => {
  const [formData, setFormData] = useState<Partial<PemeliharaanRecord>>({
    tanggal: new Date().toISOString().substring(0, 10),
    penyulang: '',
    section: '',
    jenisPemeliharaan: 'Pemeliharaan Rutin',
    peralatan: 'Trafo',
    pelaksana: '',
    status: 'Dalam Proses',
    keterangan: '',
    lokasi: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        tanggal: new Date().toISOString().substring(0, 10),
        penyulang: penyulangList[0]?.nama || '',
        section: '',
        jenisPemeliharaan: 'Pemeliharaan Rutin',
        peralatan: 'Trafo',
        pelaksana: '',
        status: 'Dalam Proses',
        keterangan: '',
        lokasi: ''
      });
    }
  }, [initialData, isOpen, penyulangList]);

  if (!isOpen) return null;

  const filteredSections = sectionList.filter(s => 
    !formData.penyulang || !s.penyulang || s.penyulang === formData.penyulang
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.penyulang) {
      alert('Silakan pilih Penyulang.');
      return;
    }

    const tgl = formData.tanggal || new Date().toISOString().substring(0, 10);
    const bln = tgl.substring(0, 7);
    const thn = parseInt(tgl.substring(0, 4), 10) || new Date().getFullYear();

    const recordToSave: PemeliharaanRecord = {
      id: initialData?.id || crypto.randomUUID(),
      tanggal: tgl,
      bulan: bln,
      tahun: thn,
      penyulang: formData.penyulang,
      section: formData.section || 'N/A',
      jenisPemeliharaan: formData.jenisPemeliharaan || 'Pemeliharaan Rutin',
      peralatan: formData.peralatan || 'Umum',
      pelaksana: formData.pelaksana || 'Tim Teknik',
      status: formData.status || 'Selesai',
      keterangan: formData.keterangan || '',
      lokasi: formData.lokasi || '',
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(recordToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialData ? 'Edit Data Pemeliharaan' : 'Input Data Pemeliharaan'}
              </h3>
              <p className="text-xs text-slate-400">
                Formulir pemeliharaan jaringan & komponen distribusi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Tanggal & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tanggal Pemeliharaan *</span>
              </label>
              <input
                type="date"
                required
                value={formData.tanggal || ''}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Status Pemeliharaan *</span>
              </label>
              <select
                value={formData.status || 'Selesai'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Selesai">Selesai</option>
                <option value="Dalam Proses">Dalam Proses</option>
                <option value="Perlu Follow Up">Perlu Follow Up</option>
              </select>
            </div>
          </div>

          {/* Penyulang (Connected with Master Data) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nama Penyulang (Master Data) *</span>
            </label>
            <select
              required
              value={formData.penyulang || ''}
              onChange={(e) => setFormData({ ...formData, penyulang: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">-- Pilih Penyulang --</option>
              {penyulangList.map((p) => (
                <option key={p.id} value={p.nama}>
                  {p.nama} {p.kode ? `(${p.kode})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Section (Connected with Master Data) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Section / Lokasi (Master Data)</span>
            </label>
            <div className="space-y-2">
              <select
                value={formData.section || ''}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- Pilih dari Master Section (Optional) --</option>
                {filteredSections.map((s) => (
                  <option key={s.id} value={s.namaSection}>
                    {s.namaSection} {s.penyulang ? `[${s.penyulang}]` : ''}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Atau tuliskan section / lokasi manual..."
                value={formData.section || ''}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Jenis Pemeliharaan & Peralatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Jenis Pemeliharaan
              </label>
              <select
                value={formData.jenisPemeliharaan || 'Pemeliharaan Rutin'}
                onChange={(e) => setFormData({ ...formData, jenisPemeliharaan: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Pemeliharaan Rutin">Pemeliharaan Rutin</option>
                <option value="Pemeliharaan Korektif">Pemeliharaan Korektif</option>
                <option value="Pemeliharaan Preventive">Pemeliharaan Preventive</option>
                <option value="Rabas Pohon">Rabas Pohon</option>
                <option value="Penggantian Komponen">Penggantian Komponen</option>
                <option value="Overhaul">Overhaul</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Peralatan / Komponen
              </label>
              <select
                value={formData.peralatan || 'Trafo'}
                onChange={(e) => setFormData({ ...formData, peralatan: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Trafo Distribusi">Trafo Distribusi</option>
                <option value="Recloser">Recloser</option>
                <option value="LBS">LBS (Load Break Switch)</option>
                <option value="Isolator">Isolator</option>
                <option value="Cut Out (FCO)">Cut Out (FCO)</option>
                <option value="Arrester">Arrester</option>
                <option value="Kabel/Penghantar (SUTM)">Kabel/Penghantar (SUTM)</option>
                <option value="Aksesori Jaringan">Aksesori Jaringan</option>
                <option value="Umum">Umum / Lainnya</option>
              </select>
            </div>
          </div>

          {/* Pelaksana / Petugas */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pelaksana / Petugas Lapangan</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Tim Vendor / Tim Teknik Baguala"
              value={formData.pelaksana || ''}
              onChange={(e) => setFormData({ ...formData, pelaksana: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Keterangan / Catatan */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Catatan / Keterangan Pemeliharaan
            </label>
            <textarea
              rows={3}
              placeholder="Keterangan tindakan pemeliharaan yang dilakukan..."
              value={formData.keterangan || ''}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pemeliharaan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
