import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ROWRecord, FilterState, ViewTab, Penyulang, PenyulangTarget, MasterSection, PemeliharaanRecord } from './types';
import { INITIAL_RECORDS } from './data/mockData';
import { calculateKPIStats, formatBulan } from './utils/calculations';
import { getMonthlyTargetsMap, saveMonthlyTargetsMap, MonthlyTargetItem, DEFAULT_MONTHLY_TARGETS } from './utils/targetStorage';
import { 
  subscribeRecords, 
  subscribeMonthlyTargets, 
  subscribePenyulang,
  subscribeMasterSection,
  subscribePemeliharaan,
  savePemeliharaanToCloud,
  deletePemeliharaanFromCloud,
  saveRecordToCloud, 
  deleteRecordFromCloud, 
  syncAllRecordsToCloud, 
  syncAllTargetsToCloud,
  clearAllCloudRecords,
  logActivityToCloud
} from './lib/firebase';
import { Header } from './components/Header';
import { ExecutiveSummaryView } from './components/ExecutiveSummaryView';
import { FilterBar } from './components/FilterBar';
import { TrendCharts } from './components/TrendCharts';
import { TimelineView } from './components/TimelineView';
import { DataTable } from './components/DataTable';
import { EntryFormModal } from './components/EntryFormModal';
import { GangguanView } from './components/GangguanView';
import { GarduMeasurementView } from './components/GarduMeasurementView';
import { GarduMeasurementFormModal } from './components/GarduMeasurementFormModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { TargetManagerModal } from './components/TargetManagerModal';
import { CalendarView } from './components/CalendarView';
import { MapView } from './components/MapView';
import { MasterDataView } from './components/MasterDataView';
import { TargetManagementView } from './components/TargetManagementView';
import { DashboardTargetTable } from './components/DashboardTargetTable';
import { SaidiSaifiView } from './components/SaidiSaifiView';
import { HealthIndexView } from './components/HealthIndexView';
import { GangguanPangkalView } from './components/GangguanPangkalView';
import { HealthIndexSummaryCard } from './components/HealthIndexSummaryCard';
import { SldView } from './components/SldView';
import { SpkluEvChargingBackground } from './components/SpkluEvChargingBackground';
import { HorizontalNav } from './components/HorizontalNav';
import { TopGangguanPenyulangCard } from './components/TopGangguanPenyulangCard';
import { Plus, Clock, FileSpreadsheet, Sparkles, CheckCircle2, Map as MapIcon, LayoutDashboard, BarChart3, Calendar, Table, TreePine, Download, FileText, LogOut, Save, Users, Database, Target, ChevronDown, ClipboardCheck, Zap, HeartPulse, Wrench } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import bgImage from './assets/images/power_lines_bg_1785580144298.jpg';

const STORAGE_KEY = 'row_tree_monitoring_records_v1';
const AUTH_KEY = 'row_monitoring_auth_user_v1';

export default function App() {
  // Monthly Targets Map state
  const [monthlyTargetsMap, setMonthlyTargetsMap] = useState<Record<string, MonthlyTargetItem>>(() => getMonthlyTargetsMap());

  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string; role: string; photo?: string } | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLoginSuccess = (user: { username: string; name: string; role: string; photo?: string }) => {
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

    const unsubscribePenyulang = subscribePenyulang(setPenyulangMaster);
    const unsubscribeSection = subscribeMasterSection(setSectionMaster);
    const unsubscribePemeliharaan = subscribePemeliharaan(setPemeliharaanRecords);

    return () => {
      unsubscribeRecords();
      unsubscribeTargets();
      unsubscribePenyulang();
      unsubscribeSection();
      unsubscribePemeliharaan();
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
    tipeData: 'ROW',
  });
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light') || 'dark';
  });

  const isLight = theme === 'light';

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('app_theme', nextTheme);
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');

  // Master Data State
  const [penyulangMaster, setPenyulangMaster] = useState<Penyulang[]>([]);
  const [sectionMaster, setSectionMaster] = useState<MasterSection[]>([]);
  const [pemeliharaanRecords, setPemeliharaanRecords] = useState<PemeliharaanRecord[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isPemeliharaanModalOpen, setIsPemeliharaanModalOpen] = useState(false);
  const [isGarduMeasurementModalOpen, setIsGarduMeasurementModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ROWRecord | null>(null);
  const [isMapModeModal, setIsMapModeModal] = useState(false);

  const isReadOnly = useMemo(() => {
    return (
      currentUser?.role === 'Manager' || 
      currentUser?.role === 'Koordinator' || 
      currentUser?.role === 'Team Leader' || 
      (currentUser?.role?.toLowerCase() || '').includes('team leader') ||
      currentUser?.username?.toLowerCase() === 'teamleader'
    );
  }, [currentUser]);

  const handleTargetsUpdated = () => {
    setMonthlyTargetsMap(getMonthlyTargetsMap());
  };

  // Unique Penyulang derived from current records + master data
  const availablePenyulang = useMemo(() => {
    const list = new Set<string>();
    records.forEach((r) => {
      if (r.penyulang && r.penyulang.trim() !== '') {
        list.add(r.penyulang.trim());
      }
    });
    penyulangMaster.forEach((p) => {
      if (p.nama && p.nama.trim() !== '') {
        list.add(p.nama.trim());
      }
    });
    return Array.from(list).sort();
  }, [records, penyulangMaster]);

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
      // Filter Tipe Data
      if (filter.tipeData === 'ROW') {
        if (r.gangguan || r.inspectionType === 'Gardu' || r.inspectionType === 'Tier 1' || r.inspectionType === 'Tier 2') return false;
      } else if (filter.tipeData === 'INSPEKSI') {
        if (r.inspectionType !== 'Tier 1' && r.inspectionType !== 'Tier 2') return false;
      } else if (filter.tipeData === 'GANGGUAN') {
        if (!r.gangguan) return false;
      } else if (filter.tipeData === 'GARDU') {
        if (r.inspectionType !== 'Gardu') return false;
      }
      return true;
    });
  }, [records, filter.tipeData]);

  const typeCounts = useMemo(() => {
    let row = 0;
    let inspeksi = 0;
    let gangguan = 0;
    let gardu = 0;

    records.forEach((r) => {
      if (r.gangguan) {
        gangguan++;
      } else if (r.inspectionType === 'Gardu') {
        gardu++;
      } else if (r.inspectionType === 'Tier 1' || r.inspectionType === 'Tier 2') {
        inspeksi++;
      } else {
        row++;
      }
    });

    return {
      ROW: row,
      INSPEKSI: inspeksi,
      GANGGUAN: gangguan,
      GARDU: gardu,
      PEMELIHARAAN: pemeliharaanRecords.length,
    };
  }, [records, pemeliharaanRecords]);

  // Calculate KPI Stats for filtered records with manual monthly targets
  const kpiStats = useMemo(() => {
    return calculateKPIStats(filteredRecords, monthlyTargetsMap, { tahun: selectedYear, bulan: selectedMonth });
  }, [filteredRecords, monthlyTargetsMap, selectedYear, selectedMonth]);

  const handleFilterChange = (newFilter: FilterState) => {
    setFilter(newFilter);
    if (newFilter.tipeData === 'GARDU') {
      setActiveTab('gardu');
    } else if (newFilter.tipeData === 'GANGGUAN') {
      setActiveTab('gangguan');
    }
  };

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
  const handleOpenAddModal = (isMapFinding = false) => {
    setEditingRecord(null);
    setIsMapModeModal(isMapFinding);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: ROWRecord) => {
    setEditingRecord(record);
    setIsMapModeModal(!!record.isMapFinding);
    setIsModalOpen(true);
  };

  const handleSaveRecord = async (savedRecord: ROWRecord) => {
    const isEdit = records.some((item) => item.id === savedRecord.id);
    setRecords((prev) => {
      if (isEdit) {
        return prev.map((item) => (item.id === savedRecord.id ? savedRecord : item));
      } else {
        return [savedRecord, ...prev];
      }
    });
    try {
      await saveRecordToCloud(savedRecord);
      const actionType = isEdit ? 'EDIT' : 'TAMBAH';
      const modType = savedRecord.gangguan ? 'Gangguan' : 'ROW';
      const detailStr = `Penyulang: ${savedRecord.penyulang || '-'}, Section: ${savedRecord.section || '-'}`;
      await logActivityToCloud(currentUser?.name || currentUser?.username || 'Petugas', actionType, modType, detailStr, savedRecord.id);

      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSaveTime(nowTime);
    } catch (e) {
      console.error('Error saving to Cloud Firestore:', e);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Apakah Anda ingin menghapus file / data ini?')) {
      const targetRecord = records.find((item) => item.id === id);
      const updated = records.filter((item) => item.id !== id);
      setRecords(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        await deleteRecordFromCloud(id);
        
        const modType = targetRecord?.gangguan ? 'Gangguan' : 'ROW';
        const detailStr = `Penghapusan data Penyulang ${targetRecord?.penyulang || '-'} (${targetRecord?.section || '-'})`;
        await logActivityToCloud(currentUser?.name || currentUser?.username || 'Petugas', 'HAPUS', modType, detailStr, id);

        const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSaveTime(nowTime);
      } catch (e) {
        console.error('Error deleting from Cloud Firestore:', e);
      }
    }
  };

  const handleDeleteMultipleRecords = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${ids.length} data gangguan hasil impor Excel ini?`)) {
      const updated = records.filter((item) => !ids.includes(item.id));
      setRecords(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        await Promise.all(ids.map(id => deleteRecordFromCloud(id)));
        
        await logActivityToCloud(
          currentUser?.name || currentUser?.username || 'Petugas',
          'HAPUS',
          'Gangguan',
          `Menghapus ${ids.length} data gangguan hasil impor Excel`,
          ids.join(',')
        );

        const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSaveTime(nowTime);
      } catch (e) {
        console.error('Error deleting multiple from Cloud Firestore:', e);
      }
    }
  };

  const handleSavePemeliharaan = async (rec: PemeliharaanRecord) => {
    const isEdit = pemeliharaanRecords.some((p) => p.id === rec.id);
    try {
      await savePemeliharaanToCloud(rec);
      const actionType = isEdit ? 'EDIT' : 'TAMBAH';
      const detailStr = `Pemeliharaan ${rec.jenisPemeliharaan || 'Rutin'} - Penyulang ${rec.penyulang || '-'} (${rec.status || 'Baru'})`;
      await logActivityToCloud(currentUser?.name || currentUser?.username || 'Petugas', actionType, 'Pemeliharaan', detailStr, rec.id);
      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSaveTime(nowTime);
    } catch (e) {
      console.error('Error saving Pemeliharaan:', e);
    }
  };

  const handleDeletePemeliharaan = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan pemeliharaan ini?')) {
      const target = pemeliharaanRecords.find((p) => p.id === id);
      try {
        await deletePemeliharaanFromCloud(id);
        const detailStr = `Penghapusan pemeliharaan ${target?.jenisPemeliharaan || ''} Penyulang ${target?.penyulang || ''}`;
        await logActivityToCloud(currentUser?.name || currentUser?.username || 'Petugas', 'HAPUS', 'Pemeliharaan', detailStr, id);
        const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSaveTime(nowTime);
      } catch (e) {
        console.error('Error deleting Pemeliharaan:', e);
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

    const generateProgressBar = (pctVal: string | number) => {
      const pct = typeof pctVal === 'number' ? pctVal : parseFloat(String(pctVal).replace('%', ''));
      if (isNaN(pct)) return '░░░░░░░░░░';
      const maxBlocks = 10;
      const filled = Math.min(maxBlocks, Math.max(0, Math.round((pct / 100) * maxBlocks)));
      const empty = maxBlocks - filled;
      return '█'.repeat(filled) + '░'.repeat(empty);
    };

    const csvLines: string[] = [];

    // Instruction for Excel to auto-split columns using semicolon
    csvLines.push('sep=;');

    // Header Title Banner
    csvLines.push(`"LAPORAN EXECUTIVE & DASHBOARD MONITORING ROW DAN PANGKAS POHON JARINGAN DISTRIBUSI"`);
    csvLines.push(`"Tanggal Export"${DELIM}"${new Date().toISOString().split('T')[0]}"`);
    csvLines.push(`"Tipe Data"${DELIM}"${filter.tipeData}"`);
    csvLines.push(`"Total Record"${DELIM}"${filteredRecords.length} Section"`);
    csvLines.push('');

    // SECTION 1: RINGKASAN KPI DASHBOARD
    csvLines.push(`"=== 1. RINGKASAN KPI & INDIKATOR UTAMA (DASHBOARD SUMMARY) ==="`);
    csvLines.push([
      escapeCsv('Indikator Kinerja'),
      escapeCsv('Nilai Target / Total'),
      escapeCsv('Realisasi Eksekusi'),
      escapeCsv('Persentase Capaian'),
      escapeCsv('Grafik Progres (In-Cell)'),
      escapeCsv('Status')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Eksekusi Temuan Pohon (Pohon)'),
      stats.totalTemuan,
      stats.totalRealisasiTemuan,
      escapeCsv(`${stats.persentaseTemuan.toFixed(1)}%`),
      escapeCsv(generateProgressBar(stats.persentaseTemuan)),
      escapeCsv(stats.persentaseTemuan >= 100 ? 'Selesai 100%' : 'Dalam Proses')
    ].join(DELIM));

    const sisaTemuanGlobal = stats.totalTemuan - stats.totalRealisasiTemuan;
    const sisaPct = stats.totalTemuan > 0 ? (sisaTemuanGlobal / stats.totalTemuan) * 100 : 0;
    csvLines.push([
      escapeCsv('Sisa Temuan Pohon Belum Dieksekusi'),
      stats.totalTemuan,
      sisaTemuanGlobal,
      escapeCsv(`${sisaPct.toFixed(1)}%`),
      escapeCsv(generateProgressBar(sisaPct)),
      escapeCsv(sisaTemuanGlobal > 0 ? 'Perlu Tindak Lanjut' : 'Tuntas')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Realisasi Jarak Jaringan (KMS)'),
      '-',
      stats.totalRealisasiKms,
      '-',
      '-',
      escapeCsv('Total KMS Tuntas')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Realisasi Pemangkasan Span (Gawang)'),
      '-',
      stats.totalRealisasiGawang,
      '-',
      '-',
      escapeCsv('Gawang Bebas Dahan')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Kendala: Perlu Pemadaman Listrik'),
      '-',
      stats.totalPerluPadam,
      '-',
      '-',
      escapeCsv('Prioritas Koordinasi PL')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Kendala: Izin Masy / Pemilik Pohon'),
      '-',
      stats.totalPerluIzin,
      '-',
      '-',
      escapeCsv('Perlu Sosialisasi Himbauan')
    ].join(DELIM));

    csvLines.push([
      escapeCsv('Kendala: Pohon Ukuran Besar'),
      '-',
      stats.totalPohonBesar,
      '-',
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
      escapeCsv('Realisasi KMS Bulanan'),
      escapeCsv('Realisasi Gawang Bulanan'),
      escapeCsv('Total Temuan Pohon'),
      escapeCsv('Realisasi Temuan Pohon'),
      escapeCsv('Sisa Temuan Pohon'),
      escapeCsv('Capaian Temuan (%)'),
      escapeCsv('Grafik Progres Pangkas'),
      escapeCsv('Perlu Padam'),
      escapeCsv('Tidak Ada Izin'),
      escapeCsv('Pohon Besar')
    ].join(DELIM));

    sortedMonths.forEach((bKey, idx) => {
      const recs = groupedByBulan[bKey];
      const penyulangInMonth = Array.from(new Set(recs.map((r) => r.penyulang?.trim() || 'Tanpa Penyulang / Umum'))).join(', ');

      const mRealisasiKms = recs.reduce((a, c) => a + (c.realisasiKms || 0), 0);
      const mRealisasiGawang = recs.reduce((a, c) => a + (c.realisasiGawang || 0), 0);
      const mTemuan = recs.reduce((a, c) => a + (c.jumlahTemuan || 0), 0);
      const mRealTemuan = recs.reduce((a, c) => a + (c.realisasiTemuan || 0), 0);
      const mSisaTemuan = mTemuan - mRealTemuan;
      const mPadam = recs.reduce((a, c) => a + (c.jumlahPerluPadam ?? (c.perluPadam ? 1 : 0)), 0);
      const mIzin = recs.reduce((a, c) => a + (c.jumlahTidakAdaIzin ?? (c.tidakAdaIzin ? 1 : 0)), 0);
      const mBesar = recs.reduce((a, c) => a + (c.jumlahPohonBesar ?? (c.pohonBesar ? 1 : 0)), 0);

      const mTemuanPct = mTemuan > 0 ? ((mRealTemuan / mTemuan) * 100).toFixed(1) + '%' : '0%';

      csvLines.push([
        idx + 1,
        escapeCsv(formatBulan(bKey)),
        escapeCsv(penyulangInMonth),
        recs.length,
        mRealisasiKms,
        mRealisasiGawang,
        mTemuan,
        mRealTemuan,
        mSisaTemuan,
        escapeCsv(mTemuanPct),
        escapeCsv(generateProgressBar(mTemuanPct)),
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
      escapeCsv('Grafik Progres KMS'),
      escapeCsv('Realisasi Gawang'),
      escapeCsv('Total Temuan Pohon'),
      escapeCsv('Realisasi Temuan Pohon'),
      escapeCsv('Sisa Temuan Pohon'),
      escapeCsv('Capaian Temuan (%)'),
      escapeCsv('Grafik Progres Pangkas'),
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
        escapeCsv(generateProgressBar(pKmsPct)),
        pRealisasiGawang,
        pTemuan,
        pRealTemuan,
        pSisaTemuan,
        escapeCsv(pTemuanPct),
        escapeCsv(generateProgressBar(pTemuanPct)),
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
      'Realisasi KMS',
      'Realisasi Gawang',
      'Jumlah Temuan Pohon',
      'Realisasi Temuan Pohon',
      'Luar Temuan Pohon',
      'Realisasi Luar Temuan',
      'Sisa Temuan Pohon',
      'Capaian Temuan (%)',
      'Grafik Capaian',
      'Perlu Padam',
      'Tidak Ada Izin',
      'Pohon Besar',
      'Catatan / Keterangan'
    ];
    csvLines.push(tableHeaders.join(DELIM));

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
          r.realisasiKms || 0,
          r.realisasiGawang || 0,
          r.jumlahTemuan || 0,
          r.realisasiTemuan || 0,
          r.luarTemuan || 0,
          r.realisasiLuarTemuan || 0,
          sisaTemuan,
          escapeCsv(persentase),
          escapeCsv(generateProgressBar(persentase)),
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
        subRealisasiKms,
        subRealisasiGawang,
        subJumlahTemuan,
        subRealisasiTemuan,
        0,
        0,
        subJumlahTemuan - subRealisasiTemuan,
        escapeCsv(subPersentase),
        escapeCsv(generateProgressBar(subPersentase)),
        subPerluPadam,
        subTidakAdaIzin,
        subPohonBesar,
        '""'
      ];
      csvLines.push(subtotalRow.join(DELIM));
      csvLines.push(''); // Blank row separator
    });

    // Grand Total Section
    const grandRealisasiKms = filteredRecords.reduce((acc, r) => acc + (r.realisasiKms || 0), 0);
    const grandRealisasiGawang = filteredRecords.reduce((acc, r) => acc + (r.realisasiGawang || 0), 0);
    const grandJumlahTemuan = filteredRecords.reduce((acc, r) => acc + (r.jumlahTemuan || 0), 0);
    const grandRealisasiTemuan = filteredRecords.reduce((acc, r) => acc + (r.realisasiTemuan || 0), 0);
    const grandPerluPadam = filteredRecords.reduce((acc, r) => acc + (r.jumlahPerluPadam ?? (r.perluPadam ? 1 : 0)), 0);
    const grandTidakAdaIzin = filteredRecords.reduce((acc, r) => acc + (r.jumlahTidakAdaIzin ?? (r.tidakAdaIzin ? 1 : 0)), 0);
    const grandPohonBesar = filteredRecords.reduce((acc, r) => acc + (r.jumlahPohonBesar ?? (r.pohonBesar ? 1 : 0)), 0);
    const grandPersentase = grandJumlahTemuan > 0 ? ((grandRealisasiTemuan / grandJumlahTemuan) * 100).toFixed(1) + '%' : '0%';

    csvLines.push(`"=== REKAPITULASI TOTAL SELURUH MONITORING DISTRIBUSI ==="`);
    csvLines.push(tableHeaders.map(escapeCsv).join(DELIM));
    const grandTotalRow = [
      '""',
      '""',
      '""',
      '""',
      '""',
      escapeCsv(`TOTAL KESELURUHAN (${filteredRecords.length} Section)`),
      grandRealisasiKms,
      grandRealisasiGawang,
      grandJumlahTemuan,
      grandRealisasiTemuan,
      0,
      0,
      grandJumlahTemuan - grandRealisasiTemuan,
      escapeCsv(grandPersentase),
      escapeCsv(generateProgressBar(grandPersentase)),
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

    const generateProgressBar = (pctVal: string | number) => {
      const pct = typeof pctVal === 'number' ? pctVal : parseFloat(String(pctVal).replace('%', ''));
      if (isNaN(pct)) return '░░░░░░░░░░';
      const maxBlocks = 10;
      const filled = Math.min(maxBlocks, Math.max(0, Math.round((pct / 100) * maxBlocks)));
      const empty = maxBlocks - filled;
      return '█'.repeat(filled) + '░'.repeat(empty);
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
      'Realisasi KMS',
      'Realisasi Gawang',
      'Jumlah Temuan Pohon',
      'Realisasi Temuan Pohon',
      'Luar Temuan Pohon',
      'Realisasi Luar Temuan',
      'Sisa Temuan Pohon',
      'Capaian Temuan (%)',
      'Grafik Capaian',
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
        r.realisasiKms || 0,
        r.realisasiGawang || 0,
        r.jumlahTemuan || 0,
        r.realisasiTemuan || 0,
        r.luarTemuan || 0,
        r.realisasiLuarTemuan || 0,
        sisaTemuan,
        persentase,
        generateProgressBar(persentase),
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

    const primaryColor = [6, 78, 59]; // deep emerald/forest green

    // --- PAGE 1: EXECUTIVE ANALYTICS DASHBOARD WITH CHARTS ---
    // Elegant header banner in forest green / emerald
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 297, 30, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PLN UP3 AMBON - ULP BAGUALA', 14, 11);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('LAPORAN GRAFIK MONITORING & ANALISIS REALISASI ROW POHON', 14, 17);
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

    // Aggregations for Chart A & B
    const penyulangKmsMap: Record<string, { target: number; real: number }> = {};
    filteredRecords.forEach(r => {
      const p = r.penyulang || 'Rutin/Umum';
      if (!penyulangKmsMap[p]) {
        penyulangKmsMap[p] = { target: 0, real: 0 };
      }
      penyulangKmsMap[p].target += r.targetKms || 0;
      penyulangKmsMap[p].real += r.realisasiKms || 0;
    });

    const chartAPenyulangs = Object.entries(penyulangKmsMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.target - a.target)
      .slice(0, 5);

    const monthlyTrimmingMap: Record<string, { temuan: number; real: number }> = {};
    filteredRecords.forEach(r => {
      const b = r.bulan || 'Umum';
      if (!monthlyTrimmingMap[b]) {
        monthlyTrimmingMap[b] = { temuan: 0, real: 0 };
      }
      monthlyTrimmingMap[b].temuan += r.jumlahTemuan || 0;
      monthlyTrimmingMap[b].real += r.realisasiTemuan || 0;
    });

    const chartBMonths = Object.entries(monthlyTrimmingMap)
      .map(([code, data]) => ({ code, name: formatBulan(code), ...data }))
      .sort((a, b) => a.code.localeCompare(b.code))
      .slice(-5);

    // RENDER CHART A
    doc.setFillColor(255, 255, 255);
    doc.rect(14, 40, 131, 152, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, 40, 131, 152, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('TARGET VS REALISASI KMS PER PENYULANG', 20, 48);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setFillColor(203, 213, 225);
    doc.rect(20, 52, 3.5, 3.5, 'F');
    doc.setTextColor(100, 116, 139);
    doc.text('Target KMS', 25, 55);

    doc.setFillColor(16, 185, 129);
    doc.rect(55, 52, 3.5, 3.5, 'F');
    doc.text('Realisasi KMS', 60, 55);

    const maxKms = Math.max(...chartAPenyulangs.map(p => Math.max(p.target, p.real)), 1);
    const scaleKms = 58 / maxKms;

    chartAPenyulangs.forEach((item, idx) => {
      const rowY = 68 + idx * 22;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const cleanName = item.name.length > 22 ? item.name.substring(0, 20) + '..' : item.name;
      doc.text(cleanName.toUpperCase(), 20, rowY);

      const targetW = item.target * scaleKms;
      const realW = item.real * scaleKms;

      doc.setFillColor(241, 245, 249);
      doc.rect(20, rowY + 2, 58, 3, 'F');
      doc.setFillColor(203, 213, 225);
      doc.rect(20, rowY + 2, Math.max(0.5, Math.min(58, targetW)), 3, 'F');

      doc.setFillColor(16, 185, 129);
      doc.rect(20, rowY + 6.5, Math.max(0.5, Math.min(58, realW)), 3, 'F');

      const pct = item.target > 0 ? (item.real / item.target) * 100 : 0;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Rl: ${item.real.toFixed(1)} / Tgt: ${item.target.toFixed(1)} KMS`, 82, rowY + 3.5);
      
      let pctColor = [239, 68, 68];
      if (pct >= 100) pctColor = [16, 185, 129];
      else if (pct >= 80) pctColor = [245, 158, 11];
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(pctColor[0], pctColor[1], pctColor[2]);
      doc.text(`${pct.toFixed(0)}% Capaian`, 82, rowY + 8);
    });

    // RENDER CHART B
    doc.setFillColor(255, 255, 255);
    doc.rect(152, 40, 131, 152, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(152, 40, 131, 152, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('PROGRES PANGKAS TEMUAN POHON PER BULAN', 158, 48);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setFillColor(254, 202, 202);
    doc.rect(158, 52, 3.5, 3.5, 'F');
    doc.setTextColor(100, 116, 139);
    doc.text('Total Temuan', 163, 55);

    doc.setFillColor(16, 185, 129);
    doc.rect(200, 52, 3.5, 3.5, 'F');
    doc.text('Pohon Dipangkas', 205, 55);

    const maxPohon = Math.max(...chartBMonths.map(m => Math.max(m.temuan, m.real)), 1);
    const scalePohon = 58 / maxPohon;

    chartBMonths.forEach((item, idx) => {
      const rowY = 68 + idx * 22;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(item.name.toUpperCase(), 158, rowY);

      const temuanW = item.temuan * scalePohon;
      const realW = item.real * scalePohon;

      doc.setFillColor(254, 242, 242);
      doc.rect(158, rowY + 2, 58, 3, 'F');
      doc.setFillColor(254, 202, 202);
      doc.rect(158, rowY + 2, Math.max(0.5, Math.min(58, temuanW)), 3, 'F');

      doc.setFillColor(16, 185, 129);
      doc.rect(158, rowY + 6.5, Math.max(0.5, Math.min(58, realW)), 3, 'F');

      const pct = item.temuan > 0 ? (item.real / item.temuan) * 100 : 100;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Pangkas: ${item.real} / Tmn: ${item.temuan} Phn`, 220, rowY + 3.5);

      let pctColor = [239, 68, 68];
      if (pct >= 100) pctColor = [16, 185, 129];
      else if (pct >= 80) pctColor = [245, 158, 11];
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(pctColor[0], pctColor[1], pctColor[2]);
      doc.text(`${pct.toFixed(0)}% Tuntas`, 220, rowY + 8);
    });

    // --- TRANSITION TO PAGE 2 FOR THE DETAILED TABLE ---
    doc.addPage();

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
      startY: 18,
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
      margin: { left: 10, right: 10, top: 20 },
      didDrawPage: (data) => {
        // Compact page header on subsequent pages
        const totalDocPages = doc.getNumberOfPages();
        if (totalDocPages > 1) {
          doc.setFillColor(6, 78, 59);
          doc.rect(0, 0, 297, 5, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text('LAMPIRAN DATA TABEL MONITORING & REALISASI ROW POHON - PLN ULP BAGUALA', 14, 11);
          
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(14, 14, 283, 14);
        }

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
      className={`min-h-screen font-sans flex flex-col relative transition-colors duration-300 ${
        isLight ? "text-slate-800 bg-slate-50" : "text-white bg-slate-950"
      }`}
    >
      {/* Animated SPKLU Electric Vehicle Charging Station Background */}
      <SpkluEvChargingBackground isLight={isLight} />
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
        theme={theme}
        onToggleTheme={toggleTheme}
        isReadOnly={isReadOnly}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Horizontal Navigation Menu (Positioned directly below Safety Banner) */}
        <HorizontalNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isLight={isLight}
          gangguanCount={typeCounts.GANGGUAN}
          penyulangCount={penyulangMaster.length || 8}
          isReadOnly={isReadOnly}
          onOpenAddModal={() => handleOpenAddModal(false)}
          onOpenInspectionModal={() => setIsInspectionModalOpen(true)}
          onOpenPemeliharaanModal={() => setIsPemeliharaanModalOpen(true)}
        />

        {/* Persistent Feeder Health Index Status Card across ALL tabs */}
        <HealthIndexSummaryCard
          records={records}
          penyulangMaster={penyulangMaster}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          isLight={isLight}
          onNavigateToHealthIndex={() => setActiveTab('health_index')}
        />

        {/* Main Tab Content */}
        <div className="w-full">
          {activeTab === 'dashboard' && (
            <ExecutiveSummaryView 
              records={records}
              pemeliharaanRecords={pemeliharaanRecords}
              penyulangMaster={penyulangMaster}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              isLight={isLight}
            />
          )}

            {activeTab === 'charts' && (
              <TrendCharts 
                records={records} 
                monthlyTargetsMap={monthlyTargetsMap} 
                isLight={isLight}
              />
            )}

            {activeTab === 'master' && (
              <MasterDataView 
                isLight={isLight} 
              />
            )}

            {activeTab === 'target_management' && (
              <TargetManagementView 
                isLight={isLight}
              />
            )}

            {activeTab === 'map' && (
              <MapView
                records={records}
                pemeliharaanRecords={pemeliharaanRecords}
              />
            )}

            {activeTab === 'gangguan' && (
              <GangguanView
                records={records}
                isLight={isLight}
                onSaveRecord={handleSaveRecord}
                onDeleteRecord={handleDeleteRecord}
                onDeleteMultipleRecords={handleDeleteMultipleRecords}
                penyulangList={penyulangMaster}
                sectionList={sectionMaster}
                isReadOnly={isReadOnly}
              />
            )}

            {activeTab === 'saidi_saifi' && (
              <SaidiSaifiView
                records={records}
                isLight={isLight}
                onSaveRecord={handleSaveRecord}
                onDeleteRecord={handleDeleteRecord}
                penyulangList={penyulangMaster}
                sectionList={sectionMaster}
                isReadOnly={isReadOnly}
              />
            )}

            {activeTab === 'health_index' && (
              <HealthIndexView
                records={records}
                isLight={isLight}
                penyulangList={penyulangMaster}
                isReadOnly={isReadOnly}
                onSaveRecord={(recordData) => handleSaveRecord(recordData as ROWRecord)}
                onDeleteRecord={handleDeleteRecord}
              />
            )}

            {activeTab === 'gangguan_pangkal' && (
              <GangguanPangkalView
                isLight={isLight}
                penyulangList={penyulangMaster}
                isReadOnly={isReadOnly}
              />
            )}

            {activeTab === 'sld' && (
              <SldView
                isLight={isLight}
                penyulangList={penyulangMaster}
                sectionsList={sectionMaster}
              />
            )}

          </div>
        </main>

      {/* Modals */}
      <EntryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
        initialData={editingRecord}
      />



      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
        onUserUpdate={handleLoginSuccess}
      />

      <TargetManagerModal onTargetsUpdated={handleTargetsUpdated}
        isOpen={false} // Handled within TargetManagementView
        onClose={() => {}}
      />

      <ExportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        records={filteredRecords}
        currentUser={currentUser}
      />
    </div>
  );
}
