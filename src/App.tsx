import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ROWRecord, FilterState, ViewTab } from './types';
import { INITIAL_RECORDS } from './data/mockData';
import { calculateKPIStats, formatBulan } from './utils/calculations';
import { getMonthlyTargetsMap, saveMonthlyTargetsMap, MonthlyTargetItem, DEFAULT_MONTHLY_TARGETS } from './utils/targetStorage';
import { 
  subscribeRecords, 
  subscribeMonthlyTargets, 
  saveRecordToCloud, 
  deleteRecordFromCloud, 
  syncAllRecordsToCloud, 
  syncAllTargetsToCloud,
  clearAllCloudRecords
} from './lib/firebase';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { FilterBar } from './components/FilterBar';
import { TrendCharts } from './components/TrendCharts';
import { TimelineView } from './components/TimelineView';
import { DataTable } from './components/DataTable';
import { EntryFormModal } from './components/EntryFormModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { AiAdvisor } from './components/AiAdvisor';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { TargetManagerModal } from './components/TargetManagerModal';
import { CalendarView } from './components/CalendarView';
import { MapView } from './components/MapView';
import { Plus, Clock, FileSpreadsheet, Sparkles, CheckCircle2, Map as MapIcon, LayoutDashboard, BarChart3, Calendar, Table, TreePine, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import bgImage from './assets/images/power_lines_bg_1785580144298.jpg';

const STORAGE_KEY = 'row_tree_monitoring_records_v1';
const AUTH_KEY = 'row_monitoring_auth_user_v1';

export default function App() {
  // Monthly Targets Map state
  const [monthlyTargetsMap, setMonthlyTargetsMap] = useState<Record<string, MonthlyTargetItem>>(() => getMonthlyTargetsMap());

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

  // Subscribe to Cloud Firestore Real-time Records & Monthly Targets
  useEffect(() => {
    const unsubscribeRecords = subscribeRecords((cloudRecords) => {
      // Always sync state with Cloud Firestore (whether records exist or is empty [])
      setRecords(cloudRecords || []);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudRecords || []));
      } catch (e) {
        console.error('Error caching cloud records:', e);
      }
    });

    const unsubscribeTargets = subscribeMonthlyTargets((cloudTargetsMap) => {
      if (cloudTargetsMap && Object.keys(cloudTargetsMap).length > 0) {
        const merged = { ...DEFAULT_MONTHLY_TARGETS, ...cloudTargetsMap };
        setMonthlyTargetsMap(merged);
        saveMonthlyTargetsMap(merged);
      }
    });

    return () => {
      unsubscribeRecords();
      unsubscribeTargets();
    };
  }, []);

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
    kendala: [],
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ROWRecord | null>(null);

  const isReadOnly = useMemo(() => {
    return (
      currentUser?.role === 'Manager' || 
      currentUser?.role === 'Koordinator' || 
      currentUser?.role === 'Team Leader' || 
      currentUser?.role?.toLowerCase().includes('team leader') ||
      currentUser?.username?.toLowerCase() === 'teamleader'
    );
  }, [currentUser]);

  const handleTargetsUpdated = () => {
    setMonthlyTargetsMap(getMonthlyTargetsMap());
  };

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
      // Filter Kategori Kendala (Multi-select)
      if (filter.kendala && filter.kendala.length > 0) {
        const matchesAny = filter.kendala.some((k) => {
          if (k === 'Perlu Padam') return r.perluPadam === true;
          if (k === 'Izin') return r.tidakAdaIzin === true;
          if (k === 'Pohon Besar') return r.pohonBesar === true;
          return false;
        });
        if (!matchesAny) {
          return false;
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

  // Calculate KPI Stats for filtered records with manual monthly targets
  const kpiStats = useMemo(() => {
    return calculateKPIStats(filteredRecords, monthlyTargetsMap, filter);
  }, [filteredRecords, monthlyTargetsMap, filter]);

  // Save state tracking
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(() => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  });

  const handleManualSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      syncAllRecordsToCloud(records);
      syncAllTargetsToCloud(monthlyTargetsMap);
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSaveTime(nowTime);
    } catch (e) {
      console.error('Failed to save data to storage:', e);
    }
  };

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: ROWRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleSaveRecord = async (savedRecord: ROWRecord) => {
    setRecords((prev) => {
      const exists = prev.some((item) => item.id === savedRecord.id);
      if (exists) {
        return prev.map((item) => (item.id === savedRecord.id ? savedRecord : item));
      } else {
        return [savedRecord, ...prev];
      }
    });
    try {
      await saveRecordToCloud(savedRecord);
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSaveTime(nowTime);
    } catch (e) {
      console.error('Error saving to Cloud Firestore:', e);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data temuan ini?')) {
      setRecords((prev) => prev.filter((item) => item.id !== id));
      try {
        await deleteRecordFromCloud(id);
      } catch (e) {
        console.error('Error deleting from Cloud Firestore:', e);
      }
    }
  };

  const handleDeleteAllData = async () => {
    if (records.length === 0) {
      alert('Data di Cloud Firestore dan lokal sudah kosong.');
      return;
    }
    if (
      window.confirm(
        `Apakah Anda YAKIN ingin MENGHAPUS SEMUA ${records.length} data monitoring ROW? Data pada Cloud Firestore akan dikosongkan secara langsung untuk semua pengguna!`
      )
    ) {
      setRecords([]);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        await clearAllCloudRecords();
        const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSaveTime(nowTime);
      } catch (e) {
        console.error('Failed to clear Cloud Firestore:', e);
      }
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Isi ulang Cloud Firestore dengan data sample default awal PLN?')) {
      setRecords(INITIAL_RECORDS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
        await syncAllRecordsToCloud(INITIAL_RECORDS);
        const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSaveTime(nowTime);
      } catch (e) {
        console.error('Failed to reset sample data to cloud:', e);
      }
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

  const handleExportTableOnlyExcel = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data untuk diexport.');
      return;
    }

    const DELIM = ';';
    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvLines: string[] = [];
    csvLines.push('sep=;');

    // Header Title
    csvLines.push(`"LAPORAN DATA TABEL TEMUAN & REALISASI ROW POHON (DATA SAJA)"`);
    csvLines.push(`"Tanggal Unduh"${DELIM}"${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}"`);
    csvLines.push(`"Jumlah Baris"${DELIM}"${filteredRecords.length} Section"`);
    csvLines.push('');

    const headers = [
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
    csvLines.push(headers.map(escapeCsv).join(DELIM));

    filteredRecords.forEach((r, idx) => {
      const sisaTemuan = (r.jumlahTemuan || 0) - (r.realisasiTemuan || 0);
      const persentase = r.jumlahTemuan > 0 ? ((r.realisasiTemuan / r.jumlahTemuan) * 100).toFixed(1) + '%' : '0%';
      
      const row = [
        idx + 1,
        r.id,
        formatBulan(r.bulan),
        r.tanggal || '-',
        r.penyulang || 'Tanpa Penyulang / Umum',
        r.section,
        r.targetKms || 0,
        r.realisasiKms || 0,
        r.realisasiGawang || 0,
        r.jumlahTemuan || 0,
        r.realisasiTemuan || 0,
        r.luarTemuan || 0,
        r.realisasiLuarTemuan || 0,
        sisaTemuan,
        persentase,
        r.jumlahPerluPadam ?? (r.perluPadam ? 1 : 0),
        r.jumlahTidakAdaIzin ?? (r.tidakAdaIzin ? 1 : 0),
        r.jumlahPohonBesar ?? (r.pohonBesar ? 1 : 0),
        r.catatan || ''
      ];
      csvLines.push(row.map(escapeCsv).join(DELIM));
    });

    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tabel_ROW_Baguala_Only_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportTableOnlyPdf = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data untuk diexport.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Elegant header banner in forest green / emerald
    doc.setFillColor(6, 78, 59); // deep emerald/forest green
    doc.rect(0, 0, 297, 30, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PLN UP3 AMBON - ULP BAGUALA', 14, 11);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('LAPORAN DATA TABEL MONITORING & REALISASI ROW POHON', 14, 17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 211, 153); // emerald light text
    doc.text('Slogan: Menuju Zero Gangguan Pohon', 14, 23);

    // Metadata Block on right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(209, 250, 229);
    doc.text(`Dicetak Oleh: ${currentUser?.name || currentUser?.username || 'Sistem'}`, 210, 11);
    doc.text(`Waktu Cetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 210, 17);
    doc.text(`Jumlah Baris: ${filteredRecords.length} records (Filtered)`, 210, 23);

    // Let's build table data
    const tableHeaders = [
      ['No', 'Bulan', 'Tanggal', 'Penyulang', 'Section', 'Tgt KMS', 'Rl KMS', 'Gwng', 'Tmn Phn', 'Rl Tmn', 'Luar Tmn', 'Sisa', 'Cap%']
    ];

    const tableRows = filteredRecords.map((r, idx) => {
      const sisaTemuan = (r.jumlahTemuan || 0) - (r.realisasiTemuan || 0);
      const persentase = r.jumlahTemuan > 0 ? ((r.realisasiTemuan / r.jumlahTemuan) * 100).toFixed(1) + '%' : '0%';
      return [
        idx + 1,
        formatBulan(r.bulan),
        r.tanggal || '-',
        r.penyulang || 'Umum',
        r.section,
        r.targetKms || 0,
        r.realisasiKms || 0,
        r.realisasiGawang || 0,
        r.jumlahTemuan || 0,
        r.realisasiTemuan || 0,
        r.luarTemuan || 0,
        sisaTemuan,
        persentase
      ];
    });

    // AutoTable call
    autoTable(doc, {
      startY: 35,
      head: tableHeaders,
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [16, 185, 129], // emerald-500
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 20 },
        2: { cellWidth: 22 },
        3: { cellWidth: 38 },
        4: { cellWidth: 42 },
        5: { halign: 'right', cellWidth: 15 },
        6: { halign: 'right', cellWidth: 15 },
        7: { halign: 'right', cellWidth: 12 },
        8: { halign: 'right', cellWidth: 15 },
        9: { halign: 'right', cellWidth: 15 },
        10: { halign: 'right', cellWidth: 15 },
        11: { halign: 'right', cellWidth: 12 },
        12: { halign: 'center', cellWidth: 15 }
      },
      margin: { left: 10, right: 10 },
      didDrawPage: (data) => {
        // Footer Page numbering
        const str = 'Halaman ' + data.pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`Tabel_ROW_Baguala_Only_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div 
      className="min-h-screen text-slate-900 font-sans flex flex-col relative bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.90)), url(${bgImage})`,
      }}
    >
      {/* Top Header */}
      <Header
        onOpenModal={handleOpenAddModal}
        onResetData={handleResetData}
        onExportCsv={handleExportCsv}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onDeleteAllData={handleDeleteAllData}
        onSaveData={handleManualSave}
        lastSaveTime={lastSaveTime}
        totalRecordsCount={records.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenUserModal={() => setIsUserModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* KPI Cards Bar */}
        <KPICards 
          stats={kpiStats} 
          onOpenTargetModal={() => setIsTargetModalOpen(true)} 
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN: NAVIGATION SIDEBAR & COMMAND CENTER */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl text-white">
              {/* Brand Logo & Slogan */}
              <div className="mb-5 border-b border-slate-800/80 pb-4 text-center">
                <div className="inline-flex p-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-xl mb-3 shadow-inner shadow-emerald-500/10">
                  <TreePine className="w-7 h-7 animate-pulse text-emerald-400" />
                </div>
                <h3 className="text-sm font-black tracking-widest text-emerald-400 uppercase">
                  ⚡ BAGUALA ROW ⚡
                </h3>
                <p className="text-xs font-black tracking-widest text-emerald-400 uppercase mt-1.5 animate-pulse">
                  Menuju Zero Gangguan Pohon
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                  PLN UP3 Ambon - ULP Baguala
                </p>
              </div>

              {/* Navigation Menu */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
                  Menu Navigasi
                </p>

                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Dashboard Overview</span>
                </button>

                <button
                  onClick={() => setActiveTab('charts')}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${
                    activeTab === 'charts'
                      ? 'bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>Grafik Tren &amp; Analytics</span>
                </button>

                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${
                    activeTab === 'timeline'
                      ? 'bg-indigo-500 text-slate-950 shadow-lg shadow-indigo-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Timeline ROW Pohon</span>
                </button>

                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${
                    activeTab === 'calendar'
                      ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Kalender Hasil Tanggal</span>
                </button>

                <button
                  onClick={() => setActiveTab('map')}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${
                    activeTab === 'map'
                      ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <MapIcon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">Peta Sebaran</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                </button>

                <button
                  onClick={() => setActiveTab('table')}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-all ${
                    activeTab === 'table'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Table className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">Data Tabel</span>
                  <span className="bg-slate-800 text-[10px] text-slate-300 font-bold px-2 py-0.5 rounded-md border border-slate-700 shrink-0">
                    {filteredRecords.length}
                  </span>
                </button>
              </div>

              {/* Status block info */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400 leading-relaxed">
                <div className="flex items-center space-x-2 text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold">Sistem Aktif</span>
                </div>
                <p>Baguala Support by the tukimen — Pemangkasan ROW &amp; Jaringan 20kV PLN.</p>
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: FILTER DECK & ACTIVE TAB VIEW CONTENT */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Filter Bar */}
            <FilterBar
              filter={filter}
              onFilterChange={setFilter}
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
                <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        Timeline ROW Pohon Terkini
                      </h3>
                      <p className="text-xs text-slate-500">
                        Progres pemangkasan pohon per penyulang &amp; section berdasarkan periode bulanan
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Data Tabel Temuan &amp; Realisasi ROW</h3>
                    <p className="text-xs text-slate-500">Daftar lengkap hasil temuan, realisasi KMS &amp; gawang, serta status kendala</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Export Excel Button */}
                    <button
                      onClick={handleExportTableOnlyExcel}
                      title="Unduh data tabel dalam format Microsoft Excel (.csv)"
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-lg shadow-xs transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Export Excel (Tabel Saja)</span>
                    </button>

                    {/* Export PDF Button */}
                    <button
                      onClick={handleExportTableOnlyPdf}
                      title="Unduh laporan data tabel ini dalam format PDF"
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-lg shadow-xs transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-rose-600" />
                      <span>Export PDF (Tabel Saja)</span>
                    </button>

                    {!isReadOnly && (
                      <button
                        onClick={handleOpenAddModal}
                        className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs transition border border-emerald-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Realisasi</span>
                      </button>
                    )}
                  </div>
                </div>

                <DataTable
                  records={filteredRecords}
                  onEditRecord={handleOpenEditModal}
                  onDeleteRecord={handleDeleteRecord}
                  onDeleteAllRecords={isReadOnly ? undefined : handleDeleteAllData}
                  isReadOnly={isReadOnly}
                />
              </div>
            )}

            {activeTab === 'map' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-sm gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <MapIcon className="w-5 h-5 text-teal-600 animate-pulse" />
                      Peta Sebaran Gangguan &amp; Temuan ROW Pohon
                    </h3>
                    <p className="text-xs text-slate-500">
                      Visualisasi sebaran koordinat temuan dahan/pohon yang berpotensi menyentuh jaringan 20kV
                    </p>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={handleOpenAddModal}
                      className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-xs transition border border-emerald-300 flex items-center justify-center gap-1 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Temuan Map</span>
                    </button>
                  )}
                </div>

                <MapView
                  records={filteredRecords}
                  onSelectRecord={handleOpenEditModal}
                />
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950/90 backdrop-blur-md text-slate-400 border-t border-slate-800/80 text-xs py-4 mt-8">
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
        isReadOnly={isReadOnly}
      />

      {/* Interactive PDF Export Modal */}
      <ExportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        records={records}
        currentUser={currentUser}
      />

      {/* Admin User Management Modal */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Target Manager Modal */}
      <TargetManagerModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        onTargetsUpdated={handleTargetsUpdated}
        selectedYear={filter.tahun}
      />
    </div>
  );
}
