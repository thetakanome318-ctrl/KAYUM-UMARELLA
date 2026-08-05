import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Zap, QrCode } from 'lucide-react';
import { ROWRecord, Penyulang, MasterSection } from '../types';
import { QrScanner, parseQrContent } from './QrScanner';

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
    kodeGardu: '',
    kapasitas: '',
    arusR: undefined,
    arusS: undefined,
    arusT: undefined,
    teganganRN: undefined,
    teganganSN: undefined,
    teganganTN: undefined,
    teganganRS: undefined,
    teganganST: undefined,
    teganganTR: undefined,
    lin1R: undefined,
    lin1S: undefined,
    lin1T: undefined,
    lin2R: undefined,
    lin2S: undefined,
    lin2T: undefined,
    lin3R: undefined,
    lin3S: undefined,
    lin3T: undefined,
    lin4R: undefined,
    lin4S: undefined,
    lin4T: undefined,
    catatan: '',
    inspectionType: 'Gardu',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        penyulang: '',
        section: '',
        tanggal: todayStr,
        kodeGardu: '',
        kapasitas: '',
        arusR: undefined,
        arusS: undefined,
        arusT: undefined,
        teganganRN: undefined,
        teganganSN: undefined,
        teganganTN: undefined,
        teganganRS: undefined,
        teganganST: undefined,
        teganganTR: undefined,
        lin1R: undefined,
        lin1S: undefined,
        lin1T: undefined,
        lin2R: undefined,
        lin2S: undefined,
        lin2T: undefined,
        lin3R: undefined,
        lin3S: undefined,
        lin3T: undefined,
        lin4R: undefined,
        lin4S: undefined,
        lin4T: undefined,
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
      kodeGardu: formData.kodeGardu || '',
      kapasitas: formData.kapasitas || '',
      arusR: formData.arusR !== undefined ? Number(formData.arusR) : undefined,
      arusS: formData.arusS !== undefined ? Number(formData.arusS) : undefined,
      arusT: formData.arusT !== undefined ? Number(formData.arusT) : undefined,
      teganganRN: formData.teganganRN !== undefined ? Number(formData.teganganRN) : undefined,
      teganganSN: formData.teganganSN !== undefined ? Number(formData.teganganSN) : undefined,
      teganganTN: formData.teganganTN !== undefined ? Number(formData.teganganTN) : undefined,
      teganganRS: formData.teganganRS !== undefined ? Number(formData.teganganRS) : undefined,
      teganganST: formData.teganganST !== undefined ? Number(formData.teganganST) : undefined,
      teganganTR: formData.teganganTR !== undefined ? Number(formData.teganganTR) : undefined,
      lin1R: formData.lin1R !== undefined ? Number(formData.lin1R) : undefined,
      lin1S: formData.lin1S !== undefined ? Number(formData.lin1S) : undefined,
      lin1T: formData.lin1T !== undefined ? Number(formData.lin1T) : undefined,
      lin2R: formData.lin2R !== undefined ? Number(formData.lin2R) : undefined,
      lin2S: formData.lin2S !== undefined ? Number(formData.lin2S) : undefined,
      lin2T: formData.lin2T !== undefined ? Number(formData.lin2T) : undefined,
      lin3R: formData.lin3R !== undefined ? Number(formData.lin3R) : undefined,
      lin3S: formData.lin3S !== undefined ? Number(formData.lin3S) : undefined,
      lin3T: formData.lin3T !== undefined ? Number(formData.lin3T) : undefined,
      lin4R: formData.lin4R !== undefined ? Number(formData.lin4R) : undefined,
      lin4S: formData.lin4S !== undefined ? Number(formData.lin4S) : undefined,
      lin4T: formData.lin4T !== undefined ? Number(formData.lin4T) : undefined,
      targetKms: 0,
      realisasiKms: 0,
      realisasiGawang: 0,
      jumlahTemuan: 0,
      realisasiTemuan: 0,
      inspectionType: 'Gardu',
      catatan: formData.catatan || '',
      tanggalUpdate: todayStr,
    };

    onSave(recordToSave);
    onClose();
  };

  const modalBg = isLight ? 'bg-white' : 'bg-slate-900';
  const textTitle = isLight ? 'text-slate-800' : 'text-slate-100';
  const labelClass = isLight ? 'text-slate-700' : 'text-slate-300';
  const inputClass = isLight 
    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs' 
    : 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className={`${modalBg} rounded-2xl border ${isLight ? 'border-slate-200 shadow-xl' : 'border-slate-800 shadow-2xl'} w-full max-w-xl my-auto max-h-[90vh] flex flex-col`}>
        <div className={`p-4 border-b ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} flex items-center justify-between shrink-0`}>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${textTitle}`}>Pengukuran Beban & Tegangan Gardu</h2>
              <p className="text-[10px] text-slate-500">Input parameter lengkap gardu distribusi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
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

          <div className="space-y-4">
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Tanggal</label>
              <input type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Nama Penyulang</label>
              <select value={formData.penyulang} onChange={(e) => setFormData({ ...formData, penyulang: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`}>
                <option value="">Pilih Penyulang</option>
                {penyulangList.map((p) => <option key={p.id} value={p.nama}>{p.nama}</option>)}
              </select>
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Section Jaringan / Lokasi</label>
              <select
                value={formData.section || ''}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border mb-1.5 ${inputClass}`}
              >
                <option value="">Pilih Section dari Master Data</option>
                {sectionList.filter(s => !formData.penyulang || s.penyulang === formData.penyulang).map((s) => (
                  <option key={s.id} value={s.namaSection}>{s.namaSection} {s.jumlahPelanggan ? `(${s.jumlahPelanggan} Plg)` : ''}</option>
                ))}
              </select>
              <input type="text" placeholder="Atau ketik section manual..." value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Kode Gardu</label>
                <input type="text" placeholder="Contoh: GD-001" value={formData.kodeGardu || ''} onChange={(e) => setFormData({ ...formData, kodeGardu: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
              </div>
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Kapasitas (kVA)</label>
                <input type="text" placeholder="Contoh: 160 kVA" value={formData.kapasitas || ''} onChange={(e) => setFormData({ ...formData, kapasitas: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
              </div>
            </div>

            {/* Arus RST */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Pengukuran Total RST Arus (Ampere)</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 mb-0.5 block">Arus R (A)</span>
                  <input type="number" step="0.1" placeholder="0.0" value={formData.arusR ?? ''} onChange={(e) => setFormData({ ...formData, arusR: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 mb-0.5 block">Arus S (A)</span>
                  <input type="number" step="0.1" placeholder="0.0" value={formData.arusS ?? ''} onChange={(e) => setFormData({ ...formData, arusS: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 mb-0.5 block">Arus T (A)</span>
                  <input type="number" step="0.1" placeholder="0.0" value={formData.arusT ?? ''} onChange={(e) => setFormData({ ...formData, arusT: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
                </div>
              </div>
            </div>

            {/* Tegangan Fasa Netral (RN, SN, TN) */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Tegangan Fasa Netral (RN, SN, TN / Volt)</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 mb-0.5 block">RN (V)</span>
                  <input type="number" step="0.1" placeholder="220" value={formData.teganganRN ?? ''} onChange={(e) => setFormData({ ...formData, teganganRN: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 mb-0.5 block">SN (V)</span>
                  <input type="number" step="0.1" placeholder="220" value={formData.teganganSN ?? ''} onChange={(e) => setFormData({ ...formData, teganganSN: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 mb-0.5 block">TN (V)</span>
                  <input type="number" step="0.1" placeholder="220" value={formData.teganganTN ?? ''} onChange={(e) => setFormData({ ...formData, teganganTN: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
                </div>
              </div>
            </div>

            {/* Tegangan Fasa-Fasa (RS, ST, TR) */}
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Tegangan Fasa-Fasa (RS, ST, TR / Volt)</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 mb-0.5 block">RS (V)</span>
                  <input type="number" step="0.1" placeholder="380" value={formData.teganganRS ?? ''} onChange={(e) => setFormData({ ...formData, teganganRS: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 mb-0.5 block">ST (V)</span>
                  <input type="number" step="0.1" placeholder="380" value={formData.teganganST ?? ''} onChange={(e) => setFormData({ ...formData, teganganST: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 mb-0.5 block">TR (V)</span>
                  <input type="number" step="0.1" placeholder="380" value={formData.teganganTR ?? ''} onChange={(e) => setFormData({ ...formData, teganganTR: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
                </div>
              </div>
            </div>

            {/* Pengukuran Lin 1, 2, 3, 4 dengan RST */}
            <div className="space-y-3">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${labelClass}`}>Pengukuran Per Lin (RST)</label>
              
              {/* Lin 1 */}
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
                <span className="text-[11px] font-bold text-indigo-400 block">Lin 1</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 1 - R (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin1R ?? ''} onChange={(e) => setFormData({ ...formData, lin1R: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 1 - S (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin1S ?? ''} onChange={(e) => setFormData({ ...formData, lin1S: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 1 - T (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin1T ?? ''} onChange={(e) => setFormData({ ...formData, lin1T: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                </div>
              </div>

              {/* Lin 2 */}
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
                <span className="text-[11px] font-bold text-indigo-400 block">Lin 2</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 2 - R (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin2R ?? ''} onChange={(e) => setFormData({ ...formData, lin2R: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 2 - S (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin2S ?? ''} onChange={(e) => setFormData({ ...formData, lin2S: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 2 - T (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin2T ?? ''} onChange={(e) => setFormData({ ...formData, lin2T: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                </div>
              </div>

              {/* Lin 3 */}
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
                <span className="text-[11px] font-bold text-indigo-400 block">Lin 3</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 3 - R (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin3R ?? ''} onChange={(e) => setFormData({ ...formData, lin3R: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 3 - S (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin3S ?? ''} onChange={(e) => setFormData({ ...formData, lin3S: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 3 - T (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin3T ?? ''} onChange={(e) => setFormData({ ...formData, lin3T: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                </div>
              </div>

              {/* Lin 4 */}
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
                <span className="text-[11px] font-bold text-indigo-400 block">Lin 4</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 4 - R (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin4R ?? ''} onChange={(e) => setFormData({ ...formData, lin4R: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 4 - S (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin4S ?? ''} onChange={(e) => setFormData({ ...formData, lin4S: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Lin 4 - T (A)</span>
                    <input type="number" step="0.1" placeholder="0.0" value={formData.lin4T ?? ''} onChange={(e) => setFormData({ ...formData, lin4T: e.target.value ? Number(e.target.value) : undefined })} className={`w-full px-2 py-1.5 rounded-xl border ${inputClass}`} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}>Catatan / Keterangan</label>
              <textarea rows={2} value={formData.catatan} onChange={(e) => setFormData({ ...formData, catatan: e.target.value })} className={`w-full px-3 py-2 rounded-xl border ${inputClass}`} />
            </div>
          </div>

          <div className="pt-2 shrink-0">
            <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-lg">Simpan Pengukuran Gardu</button>
          </div>
        </form>
      </div>
    </div>
  );
};
