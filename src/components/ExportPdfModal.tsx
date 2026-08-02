import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  X, 
  FileText, 
  Calendar, 
  Filter, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Info,
  TrendingUp,
  MapPin,
  Clock,
  Printer,
  CalendarDays
} from 'lucide-react';
import { ROWRecord } from '../types';
import { formatBulan, formatNumber } from '../utils/calculations';
import { PENYULANG_COORDINATES, getRecordCoordinates } from './MapView';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ROWRecord[];
  currentUser?: { username: string; name: string; role: string } | null;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  records,
  currentUser,
}) => {
  // Filter types: 'MONTH' (by month selection) or 'DATE_RANGE' (by exact date calendar)
  const [filterMode, setFilterMode] = useState<'ALL' | 'MONTH' | 'DATE_RANGE'>('ALL');
  
  // Month Selection state
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Date Range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Penyulang selection (optional sub-filter for maximum convenience)
  const [selectedPenyulang, setSelectedPenyulang] = useState<string>('ALL');

  // Theme options for PDF Styling
  const [pdfTheme, setPdfTheme] = useState<'emerald' | 'slate' | 'navy'>('emerald');

  if (!isOpen) return null;

  // Extract unique month periods for selection list
  const availableMonths = useMemo(() => {
    const months = records
      .map(r => r.bulan)
      .filter((b): b is string => !!b);
    return Array.from(new Set(months)).sort();
  }, [records]);

  // Extract unique penyulang list
  const availablePenyulang = useMemo(() => {
    const penyulangs = records
      .map(r => r.penyulang)
      .filter((p): p is string => !!p && p.trim() !== '');
    return Array.from(new Set(penyulangs)).sort();
  }, [records]);

  // Apply PDF Modal Filters
  const filteredRecordsForExport = useMemo(() => {
    return records.filter(r => {
      // 1. Filter Penyulang
      if (selectedPenyulang !== 'ALL' && r.penyulang !== selectedPenyulang) {
        return false;
      }

      // 2. Filter Mode
      if (filterMode === 'MONTH') {
        if (!selectedMonth) return true; // if no month selected yet, show all
        return r.bulan === selectedMonth;
      }

      if (filterMode === 'DATE_RANGE') {
        if (!r.tanggal) return false;
        if (startDate && r.tanggal < startDate) return false;
        if (endDate && r.tanggal > endDate) return false;
        return true;
      }

      return true; // Mode 'ALL'
    });
  }, [records, filterMode, selectedMonth, startDate, endDate, selectedPenyulang]);

  // Summaries calculation for preview card
  const previewStats = useMemo(() => {
    const totalCount = filteredRecordsForExport.length;
    const realisasiKms = filteredRecordsForExport.reduce((sum, r) => sum + (r.realisasiKms || 0), 0);
    const targetGawang = filteredRecordsForExport.reduce((sum, r) => sum + (r.realisasiGawang || 0), 0);
    const temuanPohon = filteredRecordsForExport.reduce((sum, r) => sum + (r.jumlahTemuan || 0), 0);
    const pangkasPohon = filteredRecordsForExport.reduce((sum, r) => sum + (r.realisasiTemuan || 0), 0);
    
    const sisaPohon = temuanPohon - pangkasPohon;
    const persentasePohon = temuanPohon > 0 ? (pangkasPohon / temuanPohon) * 100 : 0;

    const perluPadam = filteredRecordsForExport.filter(r => r.perluPadam).length;
    const tidakAdaIzin = filteredRecordsForExport.filter(r => r.tidakAdaIzin).length;
    const pohonBesar = filteredRecordsForExport.filter(r => r.pohonBesar).length;

    return {
      totalCount,
      realisasiKms,
      targetGawang,
      temuanPohon,
      pangkasPohon,
      sisaPohon,
      persentasePohon,
      perluPadam,
      tidakAdaIzin,
      pohonBesar
    };
  }, [filteredRecordsForExport]);

  // Generate and Download PDF using jsPDF
  const handleDownloadPdf = () => {
    if (filteredRecordsForExport.length === 0) {
      alert('Tidak ada data dalam filter saat ini untuk diexport.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Color definitions based on chosen PDF theme
    let primaryColor = [16, 185, 129]; // emerald
    let secondaryColor = [6, 78, 59]; // dark emerald
    let accentColor = [52, 211, 153]; // light emerald

    if (pdfTheme === 'slate') {
      primaryColor = [71, 85, 105]; // slate
      secondaryColor = [30, 41, 59]; // dark slate
      accentColor = [148, 163, 184]; // light slate
    } else if (pdfTheme === 'navy') {
      primaryColor = [14, 116, 144]; // cyan/navy
      secondaryColor = [15, 23, 42]; // slate-900
      accentColor = [34, 211, 238]; // cyan-400
    }

    // Header Background Accent Stripe (Top Page decoration)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 297, 8, 'F');

    // Corporate Title & PLN Brand
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('LAPORAN MONITORING RUANG BEBAS (ROW) & PANGKAS POHON', 14, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('SISTEM PERANG PADAM BAGUALA - JARINGAN DISTRIBUSI DISTRICT 20kV PLN', 14, 23);

    // Filter Periode Metadata Info
    let periodeStr = 'Semua Periode';
    if (filterMode === 'MONTH' && selectedMonth) {
      periodeStr = `Bulan Periode: ${formatBulan(selectedMonth).toUpperCase()}`;
    } else if (filterMode === 'DATE_RANGE') {
      const sD = startDate ? startDate.split('-').reverse().join('/') : 'Awal';
      const eD = endDate ? endDate.split('-').reverse().join('/') : 'Kini';
      periodeStr = `Rentang Tanggal: ${sD} s/d ${eD}`;
    }

    if (selectedPenyulang !== 'ALL') {
      periodeStr += ` | Penyulang: ${selectedPenyulang}`;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Filter Periode : ${periodeStr}`, 14, 28);
    doc.text(`Waktu Cetak    : ${new Date().toLocaleDateString('id-ID')} Pukul ${new Date().toLocaleTimeString('id-ID')}`, 14, 32);

    // Draw Author User Badge on Right side of Header
    if (currentUser) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(205, 12, 78, 22, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('DICETAK OLEH PETUGAS:', 209, 17);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(currentUser.name.toUpperCase(), 209, 23);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(currentUser.role, 209, 28);
    }

    // Dividers
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 37, 283, 37);

    // --- INTERACTIVE KPI STATS SECTION IN PDF ---
    // Background for KPI panel
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 40, 269, 24, 'F');

    // KPI 1: Total Temuan
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('TOTAL TEMUAN POHON', 18, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`${previewStats.temuanPohon} Pohon`, 18, 52);

    // KPI 2: Realisasi Pangkas
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('REALISASI PANGKAS', 74, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(`${previewStats.pangkasPohon} Pohon`, 74, 52);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`(${previewStats.persentasePohon.toFixed(1)}% Capaian)`, 74, 57);

    // KPI 3: Realisasi Jaringan
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('REALISASI JARINGAN (KMS)', 134, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(14, 116, 144); // cyan
    doc.text(`${formatNumber(previewStats.realisasiKms, 2)} KMS`, 134, 52);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Realisasi Gawang: ${previewStats.targetGawang} Span`, 134, 57);

    // KPI 4: Kendala
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('KENDALA TEMUAN (PADAM / IZIN / BESAR)', 204, 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${previewStats.perluPadam} Padam | ${previewStats.tidakAdaIzin} Izin | ${previewStats.pohonBesar} P.Besar`, 204, 52);

    // --- VISUAL GRAPHICS & ANALYTICS CHARTS (PAGE 1) ---
    // Aggregation for Chart A (KMS Achievement per Penyulang)
    const penyulangKmsMap: Record<string, { real: number }> = {};
    filteredRecordsForExport.forEach(r => {
      const p = r.penyulang || 'Rutin/Umum';
      if (!penyulangKmsMap[p]) {
        penyulangKmsMap[p] = { real: 0 };
      }
      penyulangKmsMap[p].real += r.realisasiKms || 0;
    });

    const chartAPenyulangs = Object.entries(penyulangKmsMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.real - a.real)
      .slice(0, 5); // top 5

    // Aggregation for Chart B (Monthly Tree Trimming Progress)
    const monthlyTrimmingMap: Record<string, { temuan: number; real: number }> = {};
    filteredRecordsForExport.forEach(r => {
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
      .slice(-5); // last 5 months

    // RENDER CHART A: TARGET VS REALISASI KMS PER PENYULANG
    doc.setFillColor(255, 255, 255);
    doc.rect(14, 70, 131, 122, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, 70, 131, 122, 'D');

    // Title Chart A
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('REALISASI KMS PER PENYULANG', 20, 77);

    // Legend for Chart A
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]); // Realisasi (primary color)
    doc.rect(20, 81, 3.5, 3.5, 'F');
    doc.text('Realisasi KMS', 25, 84);

    const maxKms = Math.max(...chartAPenyulangs.map(p => p.real), 1);
    const scaleKms = 58 / maxKms; // 58 mm max bar width

    chartAPenyulangs.forEach((item, idx) => {
      const rowY = 96 + idx * 18;
      
      // Label Penyulang
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const cleanName = item.name.length > 22 ? item.name.substring(0, 20) + '..' : item.name;
      doc.text(cleanName.toUpperCase(), 20, rowY);

      // Bars
      const realW = item.real * scaleKms;

      // Realisasi bar
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(20, rowY + 3, Math.max(0.5, Math.min(58, realW)), 4, 'F');

      // Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Realisasi: ${formatNumber(item.real, 1)} KMS`, 82, rowY + 5.5);
    });

    // RENDER CHART B: MONTHLY TREE TRIMMING PROGRESS
    doc.setFillColor(255, 255, 255);
    doc.rect(152, 70, 131, 122, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(152, 70, 131, 122, 'D');

    // Title Chart B
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('PROGRES PANGKAS TEMUAN POHON PER BULAN', 158, 77);

    // Legend for Chart B
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setFillColor(254, 202, 202); // light red for total temuan
    doc.rect(158, 81, 3.5, 3.5, 'F');
    doc.setTextColor(100, 116, 139);
    doc.text('Total Temuan', 163, 84);

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]); // Realisasi pangkas
    doc.rect(200, 81, 3.5, 3.5, 'F');
    doc.text('Pohon Dipangkas', 205, 84);

    const maxPohon = Math.max(...chartBMonths.map(m => Math.max(m.temuan, m.real)), 1);
    const scalePohon = 58 / maxPohon; // 58 mm max bar width

    chartBMonths.forEach((item, idx) => {
      const rowY = 96 + idx * 18;

      // Label Month
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(item.name.toUpperCase(), 158, rowY);

      // Bars
      const temuanW = item.temuan * scalePohon;
      const realW = item.real * scalePohon;

      // Temuan bar
      doc.setFillColor(254, 242, 242);
      doc.rect(158, rowY + 2, 58, 3, 'F'); // background track
      doc.setFillColor(254, 202, 202);
      doc.rect(158, rowY + 2, Math.max(0.5, Math.min(58, temuanW)), 3, 'F');

      // Realisasi bar
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(158, rowY + 6.5, Math.max(0.5, Math.min(58, realW)), 3, 'F');

      // Capaian calculation & Text
      const pct = item.temuan > 0 ? (item.real / item.temuan) * 100 : 100;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Pangkas: ${item.real} / Tmn: ${item.temuan} Phn`, 220, rowY + 3.5);

      let pctColor = [239, 68, 68]; // red
      if (pct >= 100) {
        pctColor = [16, 185, 129]; // emerald
      } else if (pct >= 80) {
        pctColor = [245, 158, 11]; // amber
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(pctColor[0], pctColor[1], pctColor[2]);
      doc.text(`${pct.toFixed(0)}% Tuntas`, 220, rowY + 8);
    });

    // --- TRANSITION TO PAGE 2 FOR THE DETAILED TABLE ---
    doc.addPage();

    // --- TABULAR DATA SECTION ---
    // Formatting data rows for autoTable
    const tableHeaders = [
      'No',
      'Tanggal',
      'Bulan',
      'Penyulang',
      'Section Jaringan',
      'Real KMS',
      'Real Span',
      'Realisasi Pohon',
      'Koordinat GPS',
      'Kendala Lapangan',
      'Catatan / Rekomendasi'
    ];

    const tableRows = filteredRecordsForExport.map((r, index) => {
      // Jitter or exact coordinates
      const coords = getRecordCoordinates(r);
      const coordStr = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;

      // Compile kendala list
      const kendalaList: string[] = [];
      if (r.perluPadam) kendalaList.push('Perlu Padam');
      if (r.tidakAdaIzin) kendalaList.push('Izin Warga');
      if (r.pohonBesar) kendalaList.push('Pohon Besar');
      const kendalaStr = kendalaList.length > 0 ? kendalaList.join(', ') : 'Lancar';

      const completionPct = r.jumlahTemuan > 0 ? Math.round((r.realisasiTemuan / r.jumlahTemuan) * 100) : 100;

      return [
        index + 1,
        r.tanggal ? r.tanggal.split('-').reverse().join('/') : '-',
        formatBulan(r.bulan),
        r.penyulang || 'Rutin/Umum',
        r.section,
        `${formatNumber(r.realisasiKms, 1)} KMS`,
        `${r.realisasiGawang || 0} Span`,
        `${r.realisasiTemuan} / ${r.jumlahTemuan} (${completionPct}%)`,
        coordStr,
        kendalaStr,
        r.catatan || '-'
      ];
    });

    autoTable(doc, {
      startY: 18,
      head: [tableHeaders],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [15, 23, 42],
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, // No
        1: { cellWidth: 16, halign: 'center' }, // Tanggal
        2: { cellWidth: 16 }, // Bulan
        3: { cellWidth: 26 }, // Penyulang
        4: { cellWidth: 35 }, // Section
        5: { cellWidth: 20, halign: 'right' }, // Real KMS
        6: { cellWidth: 16, halign: 'center' }, // Span
        7: { cellWidth: 24, halign: 'center' }, // Realisasi Pohon
        8: { cellWidth: 26, halign: 'center' }, // Koordinat
        9: { cellWidth: 24 }, // Kendala
        10: { cellWidth: 'auto' } // Catatan
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didParseCell: (data) => {
        // Color code some statuses for visual interactive quality
        if (data.section === 'body' && data.column.index === 10) {
          const val = String(data.cell.raw);
          if (val.includes('Perlu Padam')) {
            data.cell.styles.textColor = [190, 24, 74]; // dark pink
            data.cell.styles.fontStyle = 'bold';
          } else if (val.includes('Izin Warga')) {
            data.cell.styles.textColor = [180, 83, 9]; // dark amber
            data.cell.styles.fontStyle = 'bold';
          } else if (val.includes('Lancar')) {
            data.cell.styles.textColor = [16, 185, 129]; // light green
          }
        }
      },
      margin: { left: 14, right: 14, top: 20, bottom: 25 },
      didDrawPage: (data) => {
        // Render compact page header on subsequent pages of the document
        const totalDocPages = doc.getNumberOfPages();
        if (totalDocPages > 1) {
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(0, 0, 297, 5, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text('LAMPIRAN DATA RINCIAN MONITORING ROW POHON - SISTEM PERANG PADAM BAGUALA', 14, 11);
          
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(14, 14, 283, 14);
        }
      }
    });

    // Signatures and approval footer on the last page
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    
    // Check if enough space is left on the page, else add a page
    let sigY = finalY + 12;
    if (sigY > 165) {
      doc.addPage();
      sigY = 25;
    }

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(14, sigY, 283, sigY);

    // Signature Block left
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Dibuat Oleh,', 14, sigY + 5);
    doc.text('Petugas Lapangan Jaringan Distribusi', 14, sigY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(currentUser ? currentUser.name.toUpperCase() : 'PETUGAS LAPANGAN', 14, sigY + 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Role: ${currentUser ? currentUser.role : 'Staff Lapangan'}`, 14, sigY + 29);

    // Signature Block right
    doc.text('Mengetahui / Menyetujui,', 220, sigY + 5);
    doc.text('Manager Unit Layanan Pelanggan (ULP)', 220, sigY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('MANAGER ULP BAGUALA', 220, sigY + 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('NIP PLN: 19890241031', 220, sigY + 29);

    // Page Numbers using jsPDF page count
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Halaman ${i} dari ${pageCount}`, 268, 204);
      doc.text('Sistem Perang Padam Baguala PLN — Laporan Resmi ini diterbitkan secara elektronik & sah', 14, 204);
    }

    doc.save(`Laporan_Perang_Padam_PDF_${periodeStr.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Cetak Laporan PDF Interaktif</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded border border-teal-500/30 animate-pulse">
                  Premium
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ekspor laporan pemangkasan pohon berdesain grid &amp; visualisasi target
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Split: Filters & Live Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 max-h-[500px] overflow-y-auto">
          
          {/* Left Panel: Configuration Filters */}
          <div className="p-5 md:col-span-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                Konfigurasi Filter Cetak
              </h3>
            </div>

            {/* Filter Mode Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Metode Filter Data</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode('ALL');
                    setSelectedMonth('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition ${
                    filterMode === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Data
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('MONTH')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition ${
                    filterMode === 'MONTH'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Bulan
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('DATE_RANGE')}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition ${
                    filterMode === 'DATE_RANGE'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Tanggal
                </button>
              </div>
            </div>

            {/* Dynamic Filter Inputs */}
            {filterMode === 'MONTH' && (
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Pilih Bulan Periode
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">-- Pilih Bulan --</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatBulan(m)}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  *Hanya menampilkan bulan-bulan yang memiliki catatan temuan aktif.
                </p>
              </div>
            )}

            {filterMode === 'DATE_RANGE' && (
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                  <label className="block text-xs font-bold text-slate-700">Filter Jarak Tanggal</label>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-1">Mulai Tanggal</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-1">Sampai Tanggal</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Optional Penyulang Filter */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Penyulang (Optional Sub-Filter)</label>
              <select
                value={selectedPenyulang}
                onChange={(e) => setSelectedPenyulang(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
              >
                <option value="ALL">Semua Penyulang</option>
                {availablePenyulang.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Premium PDF Theme Picker */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">Palet Warna PDF Laporan</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPdfTheme('emerald')}
                  className={`flex-1 py-1 px-2 border rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                    pdfTheme === 'emerald'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  PLN Emerald
                </button>
                <button
                  type="button"
                  onClick={() => setPdfTheme('slate')}
                  className={`flex-1 py-1 px-2 border rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                    pdfTheme === 'slate'
                      ? 'bg-slate-500/15 border-slate-500 text-slate-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  Elegant Slate
                </button>
                <button
                  type="button"
                  onClick={() => setPdfTheme('navy')}
                  className={`flex-1 py-1 px-2 border rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                    pdfTheme === 'navy'
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-800" />
                  Midnight Navy
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive Report Stats & Table Row Preview */}
          <div className="p-5 md:col-span-7 bg-slate-50/50 flex flex-col space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                Interaktif Preview Hasil Cetak
              </h3>
            </div>

            {/* Quick Live Preview Banner */}
            {filteredRecordsForExport.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 border-dashed rounded-xl space-y-2">
                <AlertCircle className="w-7 h-7 text-rose-500 animate-bounce" />
                <h4 className="text-xs font-extrabold text-slate-800">Tidak ada baris data cocok!</h4>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  Konfigurasi filter Anda menghasilkan 0 baris data. Sesuaikan rentang tanggal atau pilihan bulan agar cocok dengan rekaman temuan pohon.
                </p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {/* Stats Summary Grid Preview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Baris Temuan</span>
                    <p className="text-lg font-black text-slate-900 mt-1">{previewStats.totalCount} Section</p>
                    <span className="text-[9px] text-emerald-600 font-medium">Lolos filter siap ekspor</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Realisasi KMS</span>
                    <p className="text-lg font-black text-emerald-600 mt-1">{formatNumber(previewStats.realisasiKms, 1)} KMS</p>
                    <span className="text-[9px] text-slate-500 font-medium">Total jarak yang tuntas</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Temuan Pohon</span>
                    <p className="text-lg font-black text-slate-900 mt-1">{previewStats.temuanPohon} Pohon</p>
                    <span className="text-[9px] text-slate-500 font-medium">Telah dipangkas: {previewStats.pangkasPohon} pohon</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tingkat Hambatan</span>
                    <p className="text-sm font-bold text-rose-600 mt-1">
                      {previewStats.perluPadam} Perlu Padam
                    </p>
                    <span className="text-[9px] text-slate-500 font-medium">{previewStats.tidakAdaIzin} Izin, {previewStats.pohonBesar} P.Besar</span>
                  </div>
                </div>

                {/* Micro Table Preview */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-b pb-1.5 font-bold">
                    <span>SEDIKIT INTIPAN LIST BARIS (MAKS 3):</span>
                    <span className="text-emerald-500">SIAP DICETAK</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-[10px] space-y-2">
                    {filteredRecordsForExport.slice(0, 3).map((r) => (
                      <div key={r.id} className="pt-2 flex justify-between items-start text-slate-700">
                        <div>
                          <p className="font-bold text-slate-900">{r.section}</p>
                          <p className="text-slate-400 text-[9px]">Penyulang: {r.penyulang || 'Umum'} • {r.tanggal}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-teal-600">{r.realisasiKms} KMS</p>
                          <p className="text-slate-400 text-[9px]">{r.realisasiTemuan} / {r.jumlahTemuan} Pohon</p>
                        </div>
                      </div>
                    ))}
                    {filteredRecordsForExport.length > 3 && (
                      <p className="text-center text-[9px] text-slate-400 italic pt-2">
                        + {filteredRecordsForExport.length - 3} baris section lainnya akan dimasukkan otomatis dalam file PDF...
                      </p>
                    )}
                  </div>
                </div>

                {/* Disclaimer info */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 text-[10px] text-emerald-800 flex items-start space-x-1.5 leading-relaxed">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p>
                    PDF menggunakan format **Landscape A4** agar seluruh data pangkas, koordinat map GPS, dan kendala dapat tersusun dalam satu baris rapi dan berstandar internasional.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-200 bg-slate-50">
          <div className="text-slate-400 text-[10px] italic flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Terintegrasi dengan Cloud Firestore</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={filteredRecordsForExport.length === 0}
              className={`px-5 py-2 text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5 ${
                filteredRecordsForExport.length === 0
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  : 'text-slate-950 bg-teal-400 hover:bg-teal-300 border border-teal-300'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Laporan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
