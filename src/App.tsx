import React, { useState, useEffect, useMemo } from 'react';
import { ROWRecord, FilterState, ViewTab } from './types';
import { INITIAL_RECORDS } from './data/mockData';
import { calculateKPIStats, formatBulan } from './utils/calculations';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { FilterBar } from './components/FilterBar';
import { TrendCharts } from './components/TrendCharts';
import { TimelineView } from './components/TimelineView';
import { DataTable } from './components/DataTable';
import { EntryFormModal } from './components/EntryFormModal';
import { AiAdvisor } from './components/AiAdvisor';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { CalendarView } from './components/CalendarView';
import { Plus, Clock, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'row_tree_monitoring_records_v1';
const AUTH_KEY = 'row_monitoring_auth_user_v1';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string; role: string } | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLoginSuccess = (user: { username: string; name: string; role: string }) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save auth state:', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (e) {
      console.error('Failed to remove auth state:', e);
    }
  };

  // Load initial data from localStorage or default
  const [records, setRecords] = useState<ROWRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved records:', e);
    }
    return INITIAL_RECORDS;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save records to storage:', e);
    }
  }, [records]);

  // Filter State
  const [filter, setFilter] = useState<FilterState>({
    penyulang: 'ALL',
    bulan: 'ALL',
    tahun: 'ALL',
    search: '',
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ROWRecord | null>(null);

  // Unique Penyulang derived from current records
  const availablePenyulang = useMemo(() => {
    const list = new Set<string>();
    records.forEach((r) => {
      if (r.penyulang && r.penyulang.trim() !== '') {
        list.add(r.penyulang.trim());
      }
    });
    return Array.from(list).sort();
  }, [records]);

  // Unique / Available Years derived from current records + defaults
  const availableYears = useMemo(() => {
    const set = new Set<number>([2024, 2025, 2026, 2027, 2028, 2029, 2030]);
    records.forEach((r) => {
      if (r.tahun) set.add(Number(r.tahun));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [records]);

  // Filtered Records Computation
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Filter Penyulang
      if (filter.penyulang !== 'ALL' && r.penyulang !== filter.penyulang) {
        return false;
      }
      // Filter Tahun
      if (filter.tahun !== 'ALL' && Number(r.tahun) !== Number(filter.tahun)) {
        return false;
      }
      // Filter Bulan
      if (filter.bulan !== 'ALL') {
        if (filter.bulan.includes('-')) {
          if (r.bulan !== filter.bulan) return false;
        } else {
          const mKe = parseInt(filter.bulan, 10);
          if (!isNaN(mKe) && r.bulanKe !== mKe) {
            return false;
          }
        }
      }
      // Filter Search
      if (filter.search.trim() !== '') {
        const query = filter.search.toLowerCase();
        const matchSection = r.section.toLowerCase().includes(query);
        const matchPenyulang = (r.penyulang || '').toLowerCase().includes(query);
        const matchCatatan = (r.catatan || '').toLowerCase().includes(query);
        const matchTanggal = (r.tanggal || '').toLowerCase().includes(query);
        const matchTahun = r.tahun ? String(r.tahun).includes(query) : false;
        if (!matchSection && !matchPenyulang && !matchCatatan && !matchTanggal && !matchTahun) {
          return false;
        }
      }
      return true;
    });
  }, [records, filter]);

  // Calculate KPI Stats for filtered records
  const kpiStats = useMemo(() => {
    return calculateKPIStats(filteredRecords);
  }, [filteredRecords]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: ROWRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleSaveRecord = (savedRecord: ROWRecord) => {
    setRecords((prev) => {
      const exists = prev.some((item) => item.id === savedRecord.id);
      if (exists) {
        return prev.map((item) => (item.id === savedRecord.id ? savedRecord : item));
      } else {
        return [savedRecord, ...prev];
      }
    });
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data temuan ini?')) {
      setRecords((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleDeleteAllData = () => {
    if (records.length === 0) {
      alert('Tidak ada data monitoring untuk dihapus.');
      return;
    }
    if (
      window.confirm(
        `Apakah Anda YAKIN ingin MENGHAPUS SEMUA ${records.length} data monitoring ROW? Seluruh data pada tabel akan dikosongkan secara langsung!`
      )
    ) {
      setRecords([]);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset seluruh data ke sample default awal?')) {
      setRecords(INITIAL_RECORDS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data untuk diexport.');
      return;
    }

    const stats = calculateKPIStats(filteredRecords);

    // Semicolon separator for Excel (especially in Indonesian locale)
    const DELIM = ';';

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvLines: string[] = [];

    // Instruction for Excel to auto-split columns using semicolon
    csvLines.push('sep=;');

    // Header Title Banner
    csvLines.push(`"LAPORAN EXECUTIVE & DASHBOARD MONITORING ROW DAN PANGKAS POHON JARINGAN DISTRIBUSI"`);
    csvLines.push(`"Tanggal Export"${DELIM}"${new Date().toISOString().split('T')[0]}"`);
    csvLines.push(`"Filter Penyulang"${DELIM}"${filter.penyulang === 'ALL' ? 'Semua Penyulang' : filter.penyulang}"`);
    csvLines.push(`"Filter Bulan"${DELIM}"${filter.bulan === 'ALL' ? 'Semua Bulan' : formatBulan(filter.bulan)}"`);
    csvLines.push(`"Total Record"${DELIM}"${filteredRecords.length} Section"`);
    csvLines.push('');

    // SECTION 1: RINGKASAN KPI DASHBOARD
    csvLines.push(`"=== 1. RINGKASAN KPI & INDIKATOR UTAMA (DASHBOARD SUMMARY) ==="`);
    csvLines.push([
      escapeCsv('Indikator Kinerja'),
      escapeCsv('Nilai Target / Total'),
      escapeCsv('Realisasi Eksekusi'),
      escapeCsv('Persentase Capaian'),
      escapeCsv('Status')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Eksekusi Temuan Pohon (Pohon)'),
      stats.totalTemuan,
      stats.totalRealisasiTemuan,
      escapeCsv(`${stats.persentaseTemuan.toFixed(1)}%`),
      escapeCsv(stats.persentaseTemuan >= 100 ? 'Selesai 100%' : 'Dalam Proses')
    ].join(DELIM));

    const sisaTemuanGlobal = stats.totalTemuan - stats.totalRealisasiTemuan;
    csvLines.push([
      escapeCsv('Sisa Temuan Pohon Belum Dieksekusi'),
      stats.totalTemuan,
      sisaTemuanGlobal,
      escapeCsv(`${stats.totalTemuan > 0 ? ((sisaTemuanGlobal / stats.totalTemuan) * 100).toFixed(1) : 0}%`),
      escapeCsv(sisaTemuanGlobal > 0 ? 'Perlu Tindak Lanjut' : 'Tuntas')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Target & Realisasi Jarak Jaringan (KMS)'),
      stats.totalTargetKms,
      stats.totalRealisasiKms,
      escapeCsv(`${stats.persentaseKms.toFixed(1)}%`),
      escapeCsv(stats.persentaseKms >= 100 ? 'Target Tercapai' : 'Belum Mencapai Target')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Realisasi Pemangkasan Span (Gawang)'),
      '-',
      stats.totalRealisasiGawang,
      '-',
      escapeCsv('Gawang Bebas Dahan')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Kendala: Perlu Pemadaman Listrik'),
      '-',
      stats.totalPerluPadam,
      '-',
      escapeCsv('Prioritas Koordinasi PL')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Kendala: Izin Masy / Pemilik Pohon'),
      '-',
      stats.totalPerluIzin,
      '-',
      escapeCsv('Perlu Sosialisasi Himbauan')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Kendala: Pohon Ukuran Besar'),
      '-',
      stats.totalPohonBesar,
      '-',
      escapeCsv('Perlu Tim & Alat Khusus')
    ].join(DELIM));

    csvLines.push('');

    // Grouping for Recaps
    const groupedByBulan: { [key: string]: ROWRecord[] } = {};
    const groupedByPenyulang: { [key: string]: ROWRecord[] } = {};

    filteredRecords.forEach((r) => {
      const bKey = r.bulan || 'Tanpa Bulan';
      if (!groupedByBulan[bKey]) groupedByBulan[bKey] = [];
      groupedByBulan[bKey].push(r);

      const pKey = r.penyulang && r.penyulang.trim() !== '' ? r.penyulang.trim() : 'Tanpa Penyulang / Umum';
      if (!groupedByPenyulang[pKey]) groupedByPenyulang[pKey] = [];
      groupedByPenyulang[pKey].push(r);
    });

    const sortedMonths = Object.keys(groupedByBulan).sort();
    const sortedPenyulang = Object.keys(groupedByPenyulang).sort();

    // SECTION 2: REKAPITULASI BULANAN & REALISASI KMS
    csvLines.push(`"=== 2. REKAPITULASI REALISASI KMS & PANGKAS POHON PER BULAN ==="`);
    csvLines.push([
      escapeCsv('No'),
      escapeCsv('Bulan Periode'),
      escapeCsv('Penyulang Terlibat'),
      escapeCsv('Jumlah Section'),
      escapeCsv('Target KMS Bulanan'),
      escapeCsv('Realisasi KMS Bulanan'),
      escapeCsv('Capaian Realisasi KMS (%)'),
      escapeCsv('Realisasi Gawang Bulanan'),
      escapeCsv('Total Temuan Pohon'),
      escapeCsv('Realisasi Temuan Pohon'),
      escapeCsv('Sisa Temuan Pohon'),
      escapeCsv('Capaian Temuan (%)'),
      escapeCsv('Perlu Padam'),
      escapeCsv('Tidak Ada Izin'),
      escapeCsv('Pohon Besar')
    ].join(DELIM));

    sortedMonths.forEach((bKey, idx) => {
      const recs = groupedByBulan[bKey];
      const penyulangInMonth = Array.from(new Set(recs.map((r) => r.penyulang?.trim() || 'Tanpa Penyulang / Umum'))).join(', ');

      const mTargetKms = recs.reduce((a, c) => a + (c.targetKms || 0), 0);
      const mRealisasiKms = recs.reduce((a, c) => a + (c.realisasiKms || 0), 0);
      const mRealisasiGawang = recs.reduce((a, c) => a + (c.realisasiGawang || 0), 0);
      const mTemuan = recs.reduce((a, c) => a + (c.jumlahTemuan || 0), 0);
      const mRealTemuan = recs.reduce((a, c) => a + (c.realisasiTemuan || 0), 0);
      const mSisaTemuan = mTemuan - mRealTemuan;
      const mPadam = recs.reduce((a, c) => a + (c.jumlahPerluPadam ?? (c.perluPadam ? 1 : 0)), 0);
      const mIzin = recs.reduce((a, c) => a + (c.jumlahTidakAdaIzin ?? (c.tidakAdaIzin ? 1 : 0)), 0);
      const mBesar = recs.reduce((a, c) => a + (c.jumlahPohonBesar ?? (c.pohonBesar ? 1 : 0)), 0);

      const mKmsPct = mTargetKms > 0 ? ((mRealisasiKms / mTargetKms) * 100).toFixed(1) + '%' : '0%';
      const mTemuanPct = mTemuan > 0 ? ((mRealTemuan / mTemuan) * 100).toFixed(1) + '%' : '0%';

      csvLines.push([
        idx + 1,
        escapeCsv(formatBulan(bKey)),
        escapeCsv(penyulangInMonth),
        recs.length,
        mTargetKms,
        mRealisasiKms,
        escapeCsv(mKmsPct),
        mRealisasiGawang,
        mTemuan,
        mRealTemuan,
        mSisaTemuan,
        escapeCsv(mTemuanPct),
        mPadam,
        mIzin,
        mBesar
      ].join(DELIM));
    });
    csvLines.push('');

    // SECTION 3: REKAPITULASI PER PENYULANG
    csvLines.push(`"=== 3. REKAPITULASI REALISASI KMS & PANGKAS POHON PER PENYULANG ==="`);
    csvLines.push([
      escapeCsv('No'),
      escapeCsv('Nama Penyulang'),
      escapeCsv('Jumlah Section'),
      escapeCsv('Target KMS'),
      escapeCsv('Realisasi KMS'),
      escapeCsv('Capaian KMS (%)'),
      escapeCsv('Realisasi Gawang'),
      escapeCsv('Total Temuan Pohon'),
      escapeCsv('Realisasi Temuan Pohon'),
      escapeCsv('Sisa Temuan Pohon'),
      escapeCsv('Capaian Temuan (%)'),
      escapeCsv('Perlu Padam'),
      escapeCsv('Tidak Ada Izin'),
      escapeCsv('Pohon Besar')
    ].join(DELIM));

    sortedPenyulang.forEach((pKey, idx) => {
      const recs = groupedByPenyulang[pKey];
      const pTargetKms = recs.reduce((a, c) => a + (c.targetKms || 0), 0);
      const pRealisasiKms = recs.reduce((a, c) => a + (c.realisasiKms || 0), 0);
      const pRealisasiGawang = recs.reduce((a, c) => a + (c.realisasiGawang || 0), 0);
      const pTemuan = recs.reduce((a, c) => a + (c.jumlahTemuan || 0), 0);
      const pRealTemuan = recs.reduce((a, c) => a + (c.realisasiTemuan || 0), 0);
      const pSisaTemuan = pTemuan - pRealTemuan;
      const pPadam = recs.reduce((a, c) => a + (c.jumlahPerluPadam ?? (c.perluPadam ? 1 : 0)), 0);
      const pIzin = recs.reduce((a, c) => a + (c.jumlahTidakAdaIzin ?? (c.tidakAdaIzin ? 1 : 0)), 0);
      const pBesar = recs.reduce((a, c) => a + (c.jumlahPohonBesar ?? (c.pohonBesar ? 1 : 0)), 0);

      const pKmsPct = pTargetKms > 0 ? ((pRealisasiKms / pTargetKms) * 100).toFixed(1) + '%' : '0%';
      const pTemuanPct = pTemuan > 0 ? ((pRealTemuan / pTemuan) * 100).toFixed(1) + '%' : '0%';

      csvLines.push([
        idx + 1,
        escapeCsv(pKey),
        recs.length,
        pTargetKms,
        pRealisasiKms,
        escapeCsv(pKmsPct),
        pRealisasiGawang,
        pTemuan,
        pRealTemuan,
        pSisaTemuan,
        escapeCsv(pTemuanPct),
        pPadam,
        pIzin,
        pBesar
      ].join(DELIM));
    });
    csvLines.push('');

    // SECTION 4: DETAIL TABEL PER BULAN & SECTION JARINGAN
    csvLines.push(`"=== 4. DETAIL RINCIAN MONITORING BULANAN PER SECTION JARINGAN ==="`);

    const tableHeaders = [
      'No',
      'ID Rekaman',
      'Bulan Periode',
      'Tanggal Pelaksanaan',
      'Nama Penyulang',
      'Section Jaringan',
      'Target KMS',
      'Realisasi KMS',
      'Realisasi Gawang',
      'Jumlah Temuan Pohon',
      'Realisasi Temuan Pohon',
      'Luar Temuan Pohon',
      'Realisasi Luar Temuan',
      'Sisa Temuan Pohon',
      'Capaian Temuan (%)',
      'Perlu Padam',
      'Tidak Ada Izin',
      'Pohon Besar',
      'Catatan / Keterangan'
    ];

    sortedMonths.forEach((bulanKey) => {
      const monthName = formatBulan(bulanKey);
      const monthRecords = groupedByBulan[bulanKey];

      csvLines.push(`"--- TABEL MONITORING BULAN: ${monthName.toUpperCase()} ---"`);
      csvLines.push(tableHeaders.map((h) => escapeCsv(h)).join(DELIM));

      let subTargetKms = 0;
      let subRealisasiKms = 0;
      let subRealisasiGawang = 0;
      let subJumlahTemuan = 0;
      let subRealisasiTemuan = 0;
      let subPerluPadam = 0;
      let subTidakAdaIzin = 0;
      let subPohonBesar = 0;

      monthRecords.forEach((r, idx) => {
        const sisaTemuan = (r.jumlahTemuan || 0) - (r.realisasiTemuan || 0);
        const persentase = r.jumlahTemuan > 0 ? ((r.realisasiTemuan / r.jumlahTemuan) * 100).toFixed(1) + '%' : '0%';
        
        const perluPadamCount = r.jumlahPerluPadam ?? (r.perluPadam ? 1 : 0);
        const tidakAdaIzinCount = r.jumlahTidakAdaIzin ?? (r.tidakAdaIzin ? 1 : 0);
        const pohonBesarCount = r.jumlahPohonBesar ?? (r.pohonBesar ? 1 : 0);

        subTargetKms += r.targetKms || 0;
        subRealisasiKms += r.realisasiKms || 0;
        subRealisasiGawang += r.realisasiGawang || 0;
        subJumlahTemuan += r.jumlahTemuan || 0;
        subRealisasiTemuan += r.realisasiTemuan || 0;
        subPerluPadam += perluPadamCount;
        subTidakAdaIzin += tidakAdaIzinCount;
        subPohonBesar += pohonBesarCount;

        const row = [
          idx + 1,
          escapeCsv(r.id),
          escapeCsv(formatBulan(r.bulan)),
          escapeCsv(r.tanggal || '-'),
          escapeCsv(r.penyulang || 'Tanpa Penyulang / Umum'),
          escapeCsv(r.section),
          r.targetKms || 0,
          r.realisasiKms || 0,
          r.realisasiGawang || 0,
          r.jumlahTemuan || 0,
          r.realisasiTemuan || 0,
          r.luarTemuan || 0,
          r.realisasiLuarTemuan || 0,
          sisaTemuan,
          escapeCsv(persentase),
          perluPadamCount,
          tidakAdaIzinCount,
          pohonBesarCount,
          escapeCsv(r.catatan || '')
        ];
        csvLines.push(row.join(DELIM));
      });

      // Subtotal Row for the Month
      const subPersentase = subJumlahTemuan > 0 ? ((subRealisasiTemuan / subJumlahTemuan) * 100).toFixed(1) + '%' : '0%';
      const subtotalRow = [
        '""',
        '""',
        '""',
        '""',
        '""',
        escapeCsv(`SUBTOTAL BULAN ${monthName.toUpperCase()} (${monthRecords.length} Section)`),
        subTargetKms,
        subRealisasiKms,
        subRealisasiGawang,
        subJumlahTemuan,
        subRealisasiTemuan,
        subJumlahTemuan - subRealisasiTemuan,
        escapeCsv(subPersentase),
        subPerluPadam,
        subTidakAdaIzin,
        subPohonBesar,
        '""'
      ];
      csvLines.push(subtotalRow.join(DELIM));
      csvLines.push(''); // Blank row separator
    });

    // Grand Total Section
    const grandTargetKms = filteredRecords.reduce((acc, r) => acc + (r.targetKms || 0), 0);
    const grandRealisasiKms = filteredRecords.reduce((acc, r) => acc + (r.realisasiKms || 0), 0);
    const grandRealisasiGawang = filteredRecords.reduce((acc, r) => acc + (r.realisasiGawang || 0), 0);
    const grandJumlahTemuan = filteredRecords.reduce((acc, r) => acc + (r.jumlahTemuan || 0), 0);
    const grandRealisasiTemuan = filteredRecords.reduce((acc, r) => acc + (r.realisasiTemuan || 0), 0);
    const grandPerluPadam = filteredRecords.reduce((acc, r) => acc + (r.jumlahPerluPadam ?? (r.perluPadam ? 1 : 0)), 0);
    const grandTidakAdaIzin = filteredRecords.reduce((acc, r) => acc + (r.jumlahTidakAdaIzin ?? (r.tidakAdaIzin ? 1 : 0)), 0);
    const grandPohonBesar = filteredRecords.reduce((acc, r) => acc + (r.jumlahPohonBesar ?? (r.pohonBesar ? 1 : 0)), 0);
    const grandPersentase = grandJumlahTemuan > 0 ? ((grandRealisasiTemuan / grandJumlahTemuan) * 100).toFixed(1) + '%' : '0%';

    csvLines.push(`"=== REKAPITULASI TOTAL SELURUH MONITORING DISTRIBUSI ==="`);
    csvLines.push(tableHeaders.map((h) => escapeCsv(h)).join(DELIM));
    const grandTotalRow = [
      '""',
      '""',
      '""',
      '""',
      '""',
      escapeCsv(`TOTAL KESELURUHAN (${filteredRecords.length} Section)`),
      grandTargetKms,
      grandRealisasiKms,
      grandRealisasiGawang,
      grandJumlahTemuan,
      grandRealisasiTemuan,
      grandJumlahTemuan - grandRealisasiTemuan,
      escapeCsv(grandPersentase),
      grandPerluPadam,
      grandTidakAdaIzin,
      grandPohonBesar,
      '""'
    ];
    csvLines.push(grandTotalRow.join(DELIM));

    // UTF-8 BOM for Excel formatting
    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `monitoring_row_excel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Top Header */}
      <Header
        onOpenModal={handleOpenAddModal}
        onResetData={handleResetData}
        onExportCsv={handleExportCsv}
        onDeleteAllData={handleDeleteAllData}
        totalRecordsCount={records.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenUserModal={() => setIsUserModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* KPI Cards Bar */}
        <KPICards stats={kpiStats} />

        {/* Filter Bar & Navigation Tabs */}
        <FilterBar
          filter={filter}
          onFilterChange={setFilter}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalFilteredCount={filteredRecords.length}
          availablePenyulang={availablePenyulang}
          availableYears={availableYears}
        />

        {/* Main Tab View Contents */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* AI Advisor Panel */}
            <AiAdvisor records={filteredRecords} stats={kpiStats} />

            {/* Combined Trend Charts Preview */}
            <TrendCharts records={filteredRecords} />

            {/* Quick Section Preview: Recent Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Timeline ROW Pohon Terkini
                  </h3>
                  <p className="text-xs text-slate-500">
                    Progres pemangkasan pohon per penyulang & section berdasarkan periode bulanan
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                >
                  Lihat Seluruh Timeline →
                </button>
              </div>

              <TimelineView
                records={filteredRecords.slice(0, 6)}
                onSelectRecord={handleOpenEditModal}
              />
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-6">
            <TrendCharts records={filteredRecords} />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <TimelineView
              records={filteredRecords}
              onSelectRecord={handleOpenEditModal}
            />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <CalendarView
              records={filteredRecords}
              onSelectRecord={handleOpenEditModal}
            />
          </div>
        )}

        {activeTab === 'table' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Data Tabel Temuan & Realisasi ROW</h3>
                <p className="text-xs text-slate-500">Daftar lengkap hasil temuan, target KMS, realisasi gawang, dan status kendala</p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs transition border border-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <DataTable
              records={filteredRecords}
              onEditRecord={handleOpenEditModal}
              onDeleteRecord={handleDeleteRecord}
              onDeleteAllRecords={handleDeleteAllData}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center sm:flex sm:items-center sm:justify-between">
          <p>© 2026 Monitoring ROW Pohon Penyulang — Sistem Pemantauan Jaringan Distribusi 20kV</p>
          <div className="mt-2 sm:mt-0 flex justify-center space-x-4 text-slate-400">
            <span>KMS: Kilometer Sirkit</span>
            <span>•</span>
            <span>Gawang: Span Bebas Dahan</span>
          </div>
        </div>
      </footer>

      {/* Entry Modal */}
      <EntryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
        initialData={editingRecord}
      />

      {/* Admin User Management Modal */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
