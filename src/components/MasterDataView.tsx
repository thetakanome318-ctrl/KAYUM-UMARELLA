import React, { useState, useEffect, useMemo } from 'react';
import { Penyulang, MasterSection } from '../types';
import { 
  subscribePenyulang, 
  savePenyulangToCloud, 
  deletePenyulangFromCloud,
  subscribeMasterSection,
  saveMasterSectionToCloud,
  deleteMasterSectionFromCloud
} from '../lib/firebase';
import { Plus, Trash2, Save, Search, Database, Layers, Edit, Users } from 'lucide-react';

interface MasterDataViewProps {
  isLight: boolean;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ isLight }) => {
  const [activeSubTab, setActiveSubTab] = useState<'penyulang' | 'section'>('penyulang');
  
  // Penyulang State
  const [penyulangList, setPenyulangList] = useState<Penyulang[]>([]);
  const [searchQueryPenyulang, setSearchQueryPenyulang] = useState('');
  const [isAddingPenyulang, setIsAddingPenyulang] = useState(false);
  const [editingPenyulang, setEditingPenyulang] = useState<Penyulang | null>(null);
  const [newPenyulang, setNewPenyulang] = useState({ nama: '', kode: '', panjangJaringan: 0 });

  // Master Section State
  const [sectionList, setSectionList] = useState<MasterSection[]>([]);
  const [searchQuerySection, setSearchQuerySection] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [editingSection, setEditingSection] = useState<MasterSection | null>(null);
  const [newSection, setNewSection] = useState({
    namaSection: '',
    penyulang: '',
    jumlahPelanggan: 0,
    keterangan: ''
  });

  useEffect(() => {
    const unsubP = subscribePenyulang(setPenyulangList);
    const unsubS = subscribeMasterSection(setSectionList);
    return () => {
      unsubP();
      unsubS();
    };
  }, []);

  const filteredPenyulang = useMemo(() => {
    return penyulangList.filter(p => 
      (p.nama || '').toLowerCase().includes(searchQueryPenyulang.toLowerCase()) || 
      (p.kode || '').toLowerCase().includes(searchQueryPenyulang.toLowerCase())
    ).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [penyulangList, searchQueryPenyulang]);

  const filteredSection = useMemo(() => {
    return sectionList.filter(s => 
      (s.namaSection || '').toLowerCase().includes(searchQuerySection.toLowerCase()) || 
      (s.penyulang || '').toLowerCase().includes(searchQuerySection.toLowerCase()) ||
      (s.keterangan || '').toLowerCase().includes(searchQuerySection.toLowerCase())
    ).sort((a, b) => (a.namaSection || '').localeCompare(b.namaSection || ''));
  }, [sectionList, searchQuerySection]);

  const handleSavePenyulang = async (data: any) => {
    if (!data.nama) return;
    const id = editingPenyulang ? editingPenyulang.id : crypto.randomUUID();
    await savePenyulangToCloud({
      id,
      ...data,
      createdAt: editingPenyulang ? editingPenyulang.createdAt : new Date().toISOString()
    });
    setNewPenyulang({ nama: '', kode: '', panjangJaringan: 0 });
    setIsAddingPenyulang(false);
    setEditingPenyulang(null);
  };

  const handleDeletePenyulang = async (id: string) => {
    if (window.confirm('Hapus penyulang ini dari master data?')) {
      await deletePenyulangFromCloud(id);
    }
  };

  const handleSaveSection = async (data: typeof newSection) => {
    if (!data.namaSection) return;
    const id = editingSection ? editingSection.id : crypto.randomUUID();
    await saveMasterSectionToCloud({
      id,
      namaSection: data.namaSection,
      penyulang: data.penyulang,
      jumlahPelanggan: Number(data.jumlahPelanggan) || 0,
      keterangan: data.keterangan,
      createdAt: editingSection ? editingSection.createdAt : new Date().toISOString()
    });
    setNewSection({ namaSection: '', penyulang: '', jumlahPelanggan: 0, keterangan: '' });
    setIsAddingSection(false);
    setEditingSection(null);
  };

  const handleDeleteSection = async (id: string) => {
    if (window.confirm('Hapus section ini dari master data?')) {
      await deleteMasterSectionFromCloud(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sub-tab Navigation */}
      <div className="flex space-x-3 border-b border-slate-800/60 pb-3">
        <button
          onClick={() => setActiveSubTab('penyulang')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'penyulang'
              ? 'bg-indigo-500 text-slate-950 shadow-lg shadow-indigo-500/20'
              : isLight
                ? 'bg-slate-100 text-slate-600 hover:text-slate-900'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Master Penyulang</span>
        </button>

        <button
          onClick={() => setActiveSubTab('section')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeSubTab === 'section'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : isLight
                ? 'bg-slate-100 text-slate-600 hover:text-slate-900'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Master Section ({sectionList.length})</span>
        </button>
      </div>

      {/* MASTER PENYULANG TAB */}
      {activeSubTab === 'penyulang' && (
        <>
          <div className={`backdrop-blur-md p-6 rounded-2xl border shadow-xl transition-all duration-300 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                  <Database className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Master Data Penyulang</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Daftar penyulang dan informasi panjang jaringan (KMS)
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingPenyulang(null);
                  setNewPenyulang({ nama: '', kode: '', panjangJaringan: 0 });
                  setIsAddingPenyulang(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Penyulang Baru</span>
              </button>
            </div>
          </div>

          <div className={`backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="p-4 border-b border-slate-800/50 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau kode..."
                  value={searchQueryPenyulang}
                  onChange={(e) => setSearchQueryPenyulang(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:bg-white text-slate-800' 
                      : 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 focus:bg-slate-800 text-white'
                  }`}
                />
              </div>
              <div className="text-xs font-bold text-slate-500">
                TOTAL: {filteredPenyulang.length} PENYULANG
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={isLight ? 'bg-slate-50 text-slate-500' : 'bg-white/5 text-slate-400'}>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Nama Penyulang</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Kode / ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Panjang Jaringan</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {filteredPenyulang.map((p) => (
                    <tr key={p.id} className="group hover:bg-indigo-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm">{p.nama}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {p.kode || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-500">
                        {p.panjangJaringan || 0} <span className="text-[10px] text-slate-500 font-normal ml-1">KMS</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => {
                              setEditingPenyulang(p);
                              setNewPenyulang({ nama: p.nama, kode: p.kode || '', panjangJaringan: p.panjangJaringan || 0 });
                              setIsAddingPenyulang(true);
                            }}
                            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeletePenyulang(p.id)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredPenyulang.length === 0 && (
                <div className="p-12 text-center">
                  <Database className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                  <p className="text-sm text-slate-500 italic">Belum ada data penyulang. Tambahkan data baru untuk memulai.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MASTER SECTION TAB */}
      {activeSubTab === 'section' && (
        <>
          <div className={`backdrop-blur-md p-6 rounded-2xl border shadow-xl transition-all duration-300 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Layers className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Master Data Section</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Daftar section dan jumlah pelanggan per section
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingSection(null);
                  setNewSection({ namaSection: '', penyulang: penyulangList[0]?.nama || '', jumlahPelanggan: 0, keterangan: '' });
                  setIsAddingSection(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Section Baru</span>
              </button>
            </div>
          </div>

          <div className={`backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden transition-all duration-300 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="p-4 border-b border-slate-800/50 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan section, penyulang, atau keterangan..."
                  value={searchQuerySection}
                  onChange={(e) => setSearchQuerySection(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 focus:border-indigo-400 focus:bg-white text-slate-800' 
                      : 'bg-slate-800/50 border-slate-700 focus:border-indigo-500 focus:bg-slate-800 text-white'
                  }`}
                />
              </div>
              <div className="text-xs font-bold text-slate-500">
                TOTAL: {filteredSection.length} SECTION
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={isLight ? 'bg-slate-50 text-slate-500' : 'bg-white/5 text-slate-400'}>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Nama Section</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Penyulang</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Jumlah Pelanggan</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Keterangan</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {filteredSection.map((s) => (
                    <tr key={s.id} className="group hover:bg-emerald-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm">{s.namaSection}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {s.penyulang || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-500">
                        <div className="inline-flex items-center space-x-1 bg-emerald-500/10 px-3 py-1 rounded-full text-emerald-400 border border-emerald-500/20">
                          <Users className="w-3.5 h-3.5" />
                          <span>{(s.jumlahPelanggan || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {s.keterangan || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => {
                              setEditingSection(s);
                              setNewSection({ 
                                namaSection: s.namaSection, 
                                penyulang: s.penyulang || '', 
                                jumlahPelanggan: s.jumlahPelanggan || 0,
                                keterangan: s.keterangan || ''
                              });
                              setIsAddingSection(true);
                            }}
                            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSection(s.id)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredSection.length === 0 && (
                <div className="p-12 text-center">
                  <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                  <p className="text-sm text-slate-500 italic">Belum ada data section. Tambahkan section baru untuk memulai.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Penyulang Modal */}
      {isAddingPenyulang && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsAddingPenyulang(false)}
          />
          <div className={`relative w-full max-w-md backdrop-blur-xl rounded-2xl border shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <h3 className="text-lg font-bold mb-4">
              {editingPenyulang ? 'Edit Penyulang' : 'Tambah Penyulang Baru'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Nama Penyulang</label>
                <input
                  autoFocus
                  type="text"
                  value={newPenyulang.nama}
                  onChange={(e) => setNewPenyulang({ ...newPenyulang, nama: e.target.value.toUpperCase() })}
                  placeholder="Contoh: BAGUALA"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Kode / ID</label>
                <input
                  type="text"
                  value={newPenyulang.kode}
                  onChange={(e) => setNewPenyulang({ ...newPenyulang, kode: e.target.value.toUpperCase() })}
                  placeholder="Contoh: BGL"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Total Panjang Jaringan (KMS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPenyulang.panjangJaringan}
                  onChange={(e) => setNewPenyulang({ ...newPenyulang, panjangJaringan: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsAddingPenyulang(false)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold border ${
                  isLight ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-700 hover:bg-slate-800'
                }`}
              >
                Batal
              </button>
              <button
                onClick={() => handleSavePenyulang(newPenyulang)}
                disabled={!newPenyulang.nama}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      {isAddingSection && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsAddingSection(false)}
          />
          <div className={`relative w-full max-w-md backdrop-blur-xl rounded-2xl border shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <h3 className="text-lg font-bold mb-4">
              {editingSection ? 'Edit Section' : 'Tambah Section Baru'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Nama Section</label>
                <input
                  autoFocus
                  type="text"
                  value={newSection.namaSection}
                  onChange={(e) => setNewSection({ ...newSection, namaSection: e.target.value })}
                  placeholder="Contoh: REC POHON / GH BAGUALA"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Penyulang Terkait</label>
                {penyulangList.length > 0 ? (
                  <select
                    value={newSection.penyulang}
                    onChange={(e) => setNewSection({ ...newSection, penyulang: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="">-- Pilih Penyulang --</option>
                    {penyulangList.map((p) => (
                      <option key={p.id} value={p.nama}>
                        {p.nama} {p.kode ? `(${p.kode})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newSection.penyulang}
                    onChange={(e) => setNewSection({ ...newSection, penyulang: e.target.value })}
                    placeholder="Contoh: BAGUALA"
                    className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Jumlah Pelanggan</label>
                <input
                  type="number"
                  value={newSection.jumlahPelanggan}
                  onChange={(e) => setNewSection({ ...newSection, jumlahPelanggan: parseInt(e.target.value) || 0 })}
                  placeholder="Contoh: 1250"
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Keterangan (Opsional)</label>
                <input
                  type="text"
                  value={newSection.keterangan}
                  onChange={(e) => setNewSection({ ...newSection, keterangan: e.target.value })}
                  placeholder="Catatan tambahan section..."
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsAddingSection(false)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold border ${
                  isLight ? 'border-slate-200 hover:bg-slate-50' : 'border-slate-700 hover:bg-slate-800'
                }`}
              >
                Batal
              </button>
              <button
                onClick={() => handleSaveSection(newSection)}
                disabled={!newSection.namaSection}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

