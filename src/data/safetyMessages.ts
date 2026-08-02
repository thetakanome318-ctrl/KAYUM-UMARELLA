export interface SafetyMessage {
  id: number;
  category: 'K3 Listrik' | 'APD' | 'SOP & Distance' | 'Pekerjaan ROW' | 'Keselamatan Kerja';
  message: string;
  focus: string;
}

export const SAFETY_MESSAGES: SafetyMessage[] = [
  {
    id: 1,
    category: 'Keselamatan Kerja',
    message: 'Utamakan Keselamatan dan Kesehatan Kerja (K3) — Tidak ada yang lebih berharga dari jiwa manusia.',
    focus: 'Zero Harm',
  },
  {
    id: 2,
    category: 'APD',
    message: 'Selalu gunakan Alat Pelindung Diri (APD) lengkap K3 (Helm, Sarung Tangan Isolasi, Sepatu Safety) sebelum bertugas.',
    focus: 'APD Lengkap',
  },
  {
    id: 3,
    category: 'SOP & Distance',
    message: 'Patuhi Jarak Aman Minimum (Safe Clearance) 2.5 Meter dari Jaringan Listrik Tegangan Menengah 20kV.',
    focus: 'Jarak Aman 20kV',
  },
  {
    id: 4,
    category: 'Pekerjaan ROW',
    message: 'Lakukan pemeriksaan potensi bahaya pohon (dahan lapuk, lebah, kabel tersangkut) sebelum pemangkasan ROW.',
    focus: 'Inspeksi Pohon ROW',
  },
  {
    id: 5,
    category: 'K3 Listrik',
    message: 'Pastikan Pengujian Bebas Tegangan & Pemasangan Grounding Lokal sebelum menyentuh atau merabas di dekat jaringan.',
    focus: 'Uji Tegangan & Grounding',
  },
  {
    id: 6,
    category: 'Keselamatan Kerja',
    message: 'Lakukan Briefing K3 (Safety Talk) dan doa bersama setiap pagi sebelum tim bertugas menuju lokasi lapangan.',
    focus: 'Safety Briefing',
  },
  {
    id: 7,
    category: 'APD',
    message: 'Gunakan Full Body Harness & Absorber teruji saat bertugas pada ketinggian tiang listrik atau tangga hidrolik.',
    focus: 'Kerja di Ketinggian',
  },
  {
    id: 8,
    category: 'Keselamatan Kerja',
    message: 'Terapkan Stop Work Authority (SWA) — Berhak menghentikan pekerjaan jika menemukan kondisi tidak aman.',
    focus: 'Hak Stop Kerja (SWA)',
  },
  {
    id: 9,
    category: 'Pekerjaan ROW',
    message: 'Waspadai pohon basah akibat hujan yang tersentuh konduktor 20kV karena berpotensi merambatkan arus listrik.',
    focus: 'Bahaya Rambatan Basah',
  },
  {
    id: 10,
    category: 'SOP & Distance',
    message: 'Pastikan kelengkapan Working Permit (Ijin Kerja) dan JSA (Job Safety Analysis) telah disetujui Pengawas K3.',
    focus: 'Ijin Kerja & JSA',
  },
  {
    id: 11,
    category: 'K3 Listrik',
    message: 'Periksa kelayakan alat kerja berisolasi, tangga, dan gergaji mesin (chainsaw) sebelum dipergunakan.',
    focus: 'Inspeksi Peralatan',
  },
  {
    id: 12,
    category: 'Keselamatan Kerja',
    message: 'Jaga kondisi fisik dan konsentrasi. Istirahat sejenak bila lelah saat melakukan pemangkasan pohon berulang.',
    focus: 'Fit to Work',
  },
  {
    id: 13,
    category: 'Pekerjaan ROW',
    message: 'Pasang Rambu Keselamatan & Barricade Tape di area bawah pohon yang sedang dirabas untuk melindungi warga sekitar.',
    focus: 'Barikade Area Kerja',
  },
  {
    id: 14,
    category: 'SOP & Distance',
    message: 'Koordinasikan pemadaman terencana dengan Pengatur Distribusi sebelum melakukan pekerjaan dekat konduktor telanjang.',
    focus: 'Koordinasi Pemadaman',
  },
  {
    id: 15,
    category: 'Keselamatan Kerja',
    message: 'Ingat keluarga tercinta menunggu di rumah. Berangkat selamat, kerja aman, pulang dengan senyuman!',
    focus: 'Pulang Selamat',
  },
  {
    id: 16,
    category: 'K3 Listrik',
    message: 'Perhatikan kondisi cuaca. Hentikan pekerjaan outdoor dan pemangkasan pohon saat terjadi kilat/petir atau hujan deras.',
    focus: 'Waspada Cuaca Ekstrem',
  },
  {
    id: 17,
    category: 'APD',
    message: 'Pastikan Sarung Tangan Karet Isolasi Tegangan Menengah telah lulus Uji Kebocoran Udara sebelum pemakaian.',
    focus: 'Uji Sarung Tangan K3',
  },
  {
    id: 18,
    category: 'Pekerjaan ROW',
    message: 'Arahkan jatuhnya dahan/ranting hasil rabas menggunakan tali pandu (tagline) agar tidak menimpa jaringan.',
    focus: 'Teknik Pemangkasan ROW',
  },
  {
    id: 19,
    category: 'Keselamatan Kerja',
    message: 'Komunikasi efektif antar personil tim ROW sangat vital. Gunakan HT atau aba-aba standar saat eksekusi pohon.',
    focus: 'Komunikasi Tim Lapangan',
  },
  {
    id: 20,
    category: 'SOP & Distance',
    message: 'Jangan pernah berasumsi jaringan mati sebelum dipastikan langsung dengan Voltage Detector oleh Pengawas K3.',
    focus: 'Cek Bebas Tegangan',
  },
  {
    id: 21,
    category: 'K3 Listrik',
    message: 'Amankan area kerja gardu distribusi dari hewan atau benda konduktif saat melakukan pengukuran beban & pemeliharaan.',
    focus: 'Keselamatan Gardu',
  },
  {
    id: 22,
    category: 'Pekerjaan ROW',
    message: 'Pastikan jarak pangkas (clearing zone) memberikan ruang tumbuh aman minimal 6 bulan kedepan.',
    focus: 'Kualitas Rabas ROW',
  },
  {
    id: 23,
    category: 'Keselamatan Kerja',
    message: 'Disiplin K3 bukan sekadar aturan, tetapi bentuk kepedulian terhadap diri sendiri dan rekan sekerja.',
    focus: 'Budaya K3',
  },
  {
    id: 24,
    category: 'APD',
    message: 'Periksa kaca pelindung wajah (Face Shield) dan kacamata safety saat mengoperasikan chainsaw pemotong kayu.',
    focus: 'Pelindung Mata & Wajah',
  },
  {
    id: 25,
    category: 'Keselamatan Kerja',
    message: 'Saling mengingatkan sesama rekan kerja jika ada kelalaian APD atau tindakan tidak aman (Unsafe Act).',
    focus: 'Saling Menjaga K3',
  },
  {
    id: 26,
    category: 'SOP & Distance',
    message: 'Terapkan Prinsip 5M K3: Memeriksa, Memastikan, Memasang Grounding, Membatasi Area, & Mematuhi SOP.',
    focus: 'Prinsip 5M K3',
  },
  {
    id: 27,
    category: 'Pekerjaan ROW',
    message: 'Bersihkan sisa sampah hasil rabas/pangkasan pohon agar tidak mengganggu jalan umum & drainase masyarakat.',
    focus: 'Kebersihan Lingkungan',
  },
  {
    id: 28,
    category: 'K3 Listrik',
    message: 'Gunakan Alat Pemadam Api Ringan (APAR) yang siap pakai serta Kotak P3K lengkap pada setiap mobil operasional ROW.',
    focus: 'Tanggap Darurat K3',
  },
  {
    id: 29,
    category: 'Keselamatan Kerja',
    message: 'Lakukan evaluasi pasca kerja (Debriefing) untuk mencatat lesson learned dan penyempurnaan K3 esok hari.',
    focus: 'Evaluasi K3',
  },
  {
    id: 30,
    category: 'SOP & Distance',
    message: 'Patuhi batas beban maks tangga dan crane skylift. Jangan memaksakan muatan berlebih saat mobilisasi tim.',
    focus: 'Beban Maksimal Alat',
  },
  {
    id: 31,
    category: 'Keselamatan Kerja',
    message: 'Target Nol Kecelakaan Kerja (Zero Accident) adalah prioritas utama setiap hari di Unit PLN Baguala!',
    focus: 'Target Zero Accident',
  }
];

export function getDailySafetyMessage(date: Date = new Date()): SafetyMessage {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const index = Math.abs(dayOfYear) % SAFETY_MESSAGES.length;
  return SAFETY_MESSAGES[index];
}
