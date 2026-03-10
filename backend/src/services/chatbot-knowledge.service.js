// DoKi Knowledge Base — Static knowledge about DocLoq features, roles, and FAQ
// DoKi = Document Knowledge Intelligence

export const DOCLOQ_FEATURES = {
  upload: {
    title: 'Upload Dokumen',
    description: 'Upload dokumen dengan enkripsi AES-256 otomatis.',
    steps: [
      'Klik **Documents** di sidebar kiri.',
      'Klik tombol **"+ Upload"** di toolbar atas.',
      'Drag & drop file ke area upload, atau klik **browse** untuk memilih file dari komputer.',
      'File yang dipilih tampil di daftar — kamu bisa hapus file tertentu sebelum upload.',
      'Klik **"Upload"** — progress bar akan tampil selama proses upload.',
      'Setelah selesai, lihat hasil upload (sukses/gagal per file), lalu klik **"Done"**.',
      'File otomatis terenkripsi AES-256 dan QR Code verifikasi dibuat otomatis.',
    ],
    tips: 'Kamu juga bisa drag file langsung dari desktop ke halaman Documents — overlay biru akan muncul, dan file langsung terupload ke folder aktif.',
    supportedFormats: 'PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, ODT, ODS, ODP, CSV, RTF, PNG, JPEG, TXT',
    maxSize: '50 MB',
    keywords: ['upload', 'unggah', 'kirim file', 'tambah dokumen', 'simpan file', 'cara upload'],
  },

  folders: {
    title: 'Manajemen Folder',
    description: 'Atur dokumen dalam folder hierarki dengan drag & drop.',
    steps: [
      'Klik **Documents** di sidebar untuk mengelola folder langsung bersama dokumen.',
      'Klik **"+ New Folder"** di toolbar atas.',
      'Masukkan nama folder dan pilih warna folder di modal yang muncul.',
      'Klik **"Create"** — folder baru akan muncul di halaman.',
      'Untuk masuk ke folder, klik folder card — breadcrumb di atas akan update.',
      'Untuk memindahkan dokumen, drag & drop dokumen ke folder card yang dituju.',
      'Gunakan breadcrumb di atas untuk navigasi kembali ke folder parent.',
    ],
    tips: 'Kamu juga bisa buka **Folder Hierarchy** di sidebar untuk melihat tree view seluruh struktur folder. Di sana kamu bisa drag folder untuk mengatur ulang hierarki, tambah subfolder, dan rename folder.',
    keywords: ['folder', 'direktori', 'organisasi file', 'buat folder', 'pindah file', 'sub folder', 'hierarchy'],
  },

  verification: {
    title: 'Verifikasi Dokumen',
    description: 'Verifikasi keaslian dokumen digital maupun fisik.',
    steps: [
      'Klik **Verification** di sidebar kiri.',
      'Pilih tipe verifikasi: **"Soft File"** (dokumen digital) atau **"Hard File"** (dokumen fisik).',
      '**Soft File:** Masukkan hash dokumen di text input → klik **"Verify Hash"**.',
      '**Hard File:** Pilih metode **"QR Code"** (scan QR dari dokumen cetak) atau **"Upload Document"** (upload scan dokumen).',
      'Klik **"Verify Document"** untuk memulai verifikasi.',
      'Lihat hasil: status verified/not found, nama dokumen, siapa yang upload, tanggal upload, dan status blockchain verification.',
      'Untuk Hard File, sistem juga menampilkan **similarity percentage** (≥90% = verified).',
    ],
    tips: 'Gunakan tombol "Verify Another" untuk verifikasi dokumen berikutnya tanpa kembali ke awal.',
    keywords: ['verifikasi', 'verify', 'cek keaslian', 'asli', 'palsu', 'hash', 'qr', 'scan', 'qr code', 'cek dokumen'],
  },

  encryption: {
    title: 'Enkripsi Dokumen',
    description: 'Semua dokumen dienkripsi menggunakan AES-256.',
    info: 'DocLoq mengenkripsi setiap file menggunakan AES-256 encryption secara otomatis saat upload. Setiap dokumen memiliki encryption key unik yang dikelola oleh sistem. File hanya bisa didekripsi saat diakses oleh user yang berhak. Kamu bisa lihat detail enkripsi di **Security Details** saat membuka detail dokumen.',
    keywords: ['enkripsi', 'encrypt', 'keamanan file', 'aes', 'aman'],
  },

  honeytokens: {
    title: 'Honeytokens & Anti-Leak',
    description: 'Tracking kebocoran dokumen dengan teknologi invisible.',
    info: 'DocLoq menanamkan honeytokens invisible ke dalam dokumen menggunakan teknologi: Zero-Width Characters (ZWC), Homoglyph substitution, dan Whitespace encoding. Jika dokumen bocor, OSINT Tracker dapat mendeteksi dan melacak sumbernya. Lihat fitur **OSINT Tracker** di sidebar untuk monitoring kebocoran.',
    keywords: ['honeytoken', 'anti leak', 'bocor', 'tracking', 'watermark', 'kebocoran'],
  },

  tasks: {
    title: 'Task Management',
    description: 'Lihat dan selesaikan tugas yang di-assign ke kamu.',
    steps: [
      'Klik **Tasks** di sidebar kiri.',
      'Kamu akan melihat 3 tab: **Active** (tugas aktif), **Completed** (selesai), **Rejected** (ditolak).',
      'Gunakan filter **Type** untuk memfilter berdasarkan tipe: Fill, Review, Approve, Sign.',
      'Klik **calendar** di sisi kanan untuk melihat tugas berdasarkan tanggal deadline.',
      'Klik salah satu task card untuk melihat detail tugas.',
      'Di halaman detail: buka dokumen terkait dengan klik **"Open & Edit"** atau **"View Document"**.',
      'Selesaikan tugas sesuai tipe: isi dokumen (Fill), review & beri catatan (Review), approve/reject (Approve), atau tanda tangani (Sign).',
      'Klik tombol aksi (**"Mark as Complete"**, **"Complete Review"**, **"Approve"**, dll) untuk menyelesaikan tugas.',
    ],
    tips: 'Tugas dibuat melalui **Forms workflow** — bukan di halaman Tasks langsung. Lihat tutorial "Cara Membuat Workflow" untuk membuat tugas baru.',
    keywords: ['task', 'tugas', 'assign', 'pekerjaan', 'selesaikan tugas', 'complete task'],
  },

  create_task: {
    title: 'Cara Membuat Tugas (Workflow)',
    description: 'Buat tugas melalui Forms workflow untuk assign ke user lain.',
    steps: [
      'Klik **Forms** di sidebar kiri.',
      'Pastikan kamu sudah punya **template** — jika belum, klik **"+ New Template"** dulu.',
      'Pada "+ New Template", pilih **"Create Blank"** (buat dari kosong) atau **"Upload File"** (upload file yang sudah ada).',
      'Setelah template siap, klik **"+ Create Form"** di halaman Forms.',
      'Isi **Form Name** (nama form/tugas).',
      'Pilih **Template** yang ingin digunakan dari dropdown.',
      'Set **Start Date** dan **Due Date** (opsional).',
      'Tambahkan **Workflow Steps** — untuk setiap step:',
      '  - Pilih **User** yang akan mengerjakan dari dropdown.',
      '  - Pilih **Action**: Fill (isi), Review (periksa), Approve (setujui), atau Sign (tanda tangan).',
      '  - Klik tombol **"+"** untuk menambah step lainnya.',
      'Klik **"Create Form"** — sistem otomatis membuat task untuk setiap user yang di-assign.',
      'User yang di-assign akan melihat tugas baru di halaman **Tasks** mereka.',
    ],
    tips: 'Workflow berjalan berurutan — step berikutnya baru aktif setelah step sebelumnya selesai. Contoh flow: Fill → Review → Approve → Sign.',
    keywords: ['buat tugas', 'buat task', 'create task', 'assign tugas', 'assign task', 'assign user', 'workflow baru', 'bikin tugas'],
  },

  forms: {
    title: 'Forms & Template',
    description: 'Buat form template dan kelola workflow multi-step.',
    steps: [
      'Klik **Forms** di sidebar kiri.',
      'Halaman Forms memiliki 2 section: **Templates** dan **Created** (form yang sudah dibuat).',
      '**Membuat Template Baru:** Klik **"+ New Template"** → pilih **"Create Blank"** atau **"Upload File"**.',
      'Untuk Create Blank: masukkan judul → template DOCX kosong akan dibuat.',
      'Untuk Upload File: upload file (PDF otomatis dikonversi ke DOCX), isi judul, deskripsi, icon, dan kategori.',
      'Setelah template dibuat, kamu bisa edit di OnlyOffice, ubah metadata, atau langsung gunakan.',
      '**Membuat Form Instance:** Klik **"+ Create Form"** → pilih template → tambahkan workflow steps → klik **"Create Form"**.',
      'Form yang sudah dibuat tampil di tab **Created** dengan status dan progress workflow.',
    ],
    tips: 'Klik template card untuk opsi: Edit Template (edit di OnlyOffice), View Template, Edit Metadata, Use Template, atau Delete.',
    keywords: ['form', 'formulir', 'workflow', 'approval', 'template', 'buat form', 'create form'],
  },

  onlyoffice: {
    title: 'Edit Dokumen Online',
    description: 'Edit dokumen langsung di browser menggunakan OnlyOffice.',
    steps: [
      'Klik **Documents** di sidebar kiri.',
      'Klik dokumen yang ingin dibuka — modal detail akan tampil.',
      'Klik **"Edit"** untuk membuka OnlyOffice editor dalam mode edit.',
      'Atau klik **"View"** untuk membuka dalam mode read-only.',
      'Edit dokumen seperti biasa — supported: DOCX, XLSX, PPTX.',
      'Perubahan tersimpan otomatis (auto-save) atau klik **Save** manual.',
      'Tutup tab editor untuk kembali ke halaman Documents — versi baru otomatis terenkripsi.',
    ],
    tips: 'Dari halaman Tasks, kamu juga bisa langsung klik "Open & Edit" pada dokumen yang terkait dengan tugas.',
    keywords: ['edit', 'editor', 'onlyoffice', 'buka dokumen', 'ubah dokumen', 'edit online'],
  },

  download: {
    title: 'Download Dokumen',
    description: 'Download dokumen dalam berbagai format.',
    steps: [
      'Klik **Documents** di sidebar kiri.',
      'Klik dokumen yang ingin didownload — modal detail akan tampil.',
      'Klik tombol **"Download"** dropdown.',
      'Pilih format download: format asli, atau konversi ke **PDF, DOCX, PNG, JPG, CSV**, dll.',
      'File akan otomatis terdownload ke komputermu.',
    ],
    keywords: ['download', 'unduh', 'simpan ke komputer', 'export', 'konversi format'],
  },

  trash: {
    title: 'Trash & Recovery',
    description: 'Pulihkan dokumen yang terhapus dari Trash.',
    steps: [
      'Klik **Trash** di sidebar kiri.',
      'Kamu akan melihat daftar item yang terhapus (dokumen & template) beserta waktu hapus dan countdown auto-delete.',
      'Gunakan tab **All**, **Documents**, atau **Templates** untuk filter.',
      'Untuk memulihkan: hover item → klik ikon **Restore**, atau centang beberapa item → klik **"Restore Selected"**.',
      'Untuk hapus permanen: hover item → klik ikon **Delete**, atau centang beberapa item → klik **"Delete Selected"**.',
      'Untuk mengosongkan semua: klik **"Empty Trash"** di atas (konfirmasi akan muncul).',
    ],
    tips: 'Secure wipe memastikan data yang dihapus permanen benar-benar tidak bisa dipulihkan.',
    keywords: ['trash', 'sampah', 'hapus', 'restore', 'pulihkan', 'recovery', 'kembalikan'],
  },

  two_factor_auth: {
    title: 'Two-Factor Authentication (2FA)',
    description: 'Tambahkan lapisan keamanan ekstra dengan TOTP.',
    steps: [
      'Klik **avatar profil** kamu di bagian bawah sidebar.',
      'Pilih **"Settings"** dari dropdown menu.',
      'Buka tab **Security**.',
      'Klik tombol **"Enable 2FA"**.',
      '**Step 1:** Baca instruksi untuk install Google Authenticator di HP, lalu klik **"Next"**.',
      '**Step 2:** Scan **QR Code** yang tampil menggunakan aplikasi Authenticator. Atau salin kode manual dengan klik tombol copy. Klik **"Next"**.',
      '**Step 3:** Masukkan **kode 6 digit** dari aplikasi Authenticator ke input field, lalu klik **"Enable 2FA"**.',
      '**Step 4:** Sukses! 🎉 2FA aktif. Klik **"Done"**.',
      'Setiap login berikutnya, kamu akan diminta memasukkan kode 6 digit dari Authenticator atau via email.',
    ],
    tips: 'Untuk menonaktifkan 2FA: buka Settings → Security → klik "Disable" → masukkan kode 6 digit → konfirmasi.',
    keywords: ['2fa', 'totp', 'two factor', 'authenticator', 'keamanan login', 'otp', 'aktifkan 2fa', 'enable 2fa'],
  },

  sharing: {
    title: 'Sharing Dokumen',
    description: 'Bagikan dokumen dengan kontrol akses ketat.',
    steps: [
      'Klik **Documents** di sidebar kiri.',
      'Klik dokumen yang ingin dibagikan — modal detail akan tampil.',
      'Klik tombol **"Share"**.',
      'Pilih tipe akses: **View Only** atau **Can Edit**.',
      'Set **expiry date** (tanggal kadaluarsa) dan batas jumlah view jika perlu.',
      'Klik **"Generate Link"** atau **"Share"** — link share akan dibuat.',
      'Salin link dan berikan ke penerima.',
    ],
    tips: 'Penerima dengan link hanya bisa mengakses sesuai permission yang diberikan dan sampai tanggal kadaluarsa.',
    keywords: ['share', 'bagikan', 'kirim', 'akses', 'link', 'berbagi'],
  },

  settings: {
    title: 'Settings & Profile',
    description: 'Kelola profil, keamanan, dan preferensi akun.',
    steps: [
      'Klik **avatar profil** kamu di bagian bawah sidebar.',
      'Pilih **"Settings"** atau **"Profile"** dari dropdown menu.',
      '**Tab Profile:** Update nama, email, phone, department, dan position → klik **"Save Changes"**.',
      '**Tab Security:** Ganti password (masukkan password lama & baru) atau aktifkan/nonaktifkan 2FA.',
      '**Tab User Management** (khusus Admin): Kelola user organisasi — tambah, edit role, aktifkan/nonaktifkan user.',
      '**Tab Notifications:** Atur preferensi notifikasi email dan push.',
    ],
    keywords: ['settings', 'pengaturan', 'profil', 'password', 'akun', 'ganti password', 'ubah profil'],
  },

  ai_analysis: {
    title: 'AI Document Analysis',
    description: 'Analisis dokumen menggunakan AI untuk mendapatkan insight mendalam.',
    steps: [
      'Klik **AI Document Analysis** di sidebar kiri.',
      'Di panel kiri, pilih dokumen yang ingin dianalisis dari daftar.',
      'Di panel kanan, ketik pertanyaan atau prompt tentang dokumen.',
      'Tekan **Enter** atau klik **Send** untuk memulai analisis.',
      'AI akan memberikan: ringkasan, key metrics (halaman, klausa, tanda tangan), sentiment analysis, topik utama, insights, word frequency, dan readability score.',
      'Kamu bisa terus bertanya tentang dokumen yang sama — riwayat percakapan tersimpan selama sesi.',
      'Klik **"Clear"** untuk reset analisis dan mulai dokumen baru.',
    ],
    keywords: ['ai analysis', 'analisis dokumen', 'analisa', 'ai', 'insight', 'summary', 'rangkuman'],
  },

  osint_tracker: {
    title: 'OSINT Tracker',
    description: 'Monitor kebocoran dokumen di internet menggunakan OSINT.',
    steps: [
      'Klik **OSINT Tracker** di sidebar kiri.',
      'Di tab **Monitor**: klik **"+ Add Document"** → pilih dokumen yang ingin dimonitor.',
      'Dokumen akan otomatis dipantau di berbagai sumber: Pastebin, GitHub, Dark Web Forums, Cloud Storage.',
      'Di tab **Leaks**: lihat daftar kebocoran yang terdeteksi — nama dokumen, sumber, tanggal, severity.',
      'Di tab **Check Document**: pilih dokumen untuk menjalankan pengecekan OSINT secara manual.',
      'Panel **Monitored Sources** menampilkan sumber yang aktif dipantau dan waktu scan terakhir.',
    ],
    tips: 'Stat bar di atas menampilkan: Total tracked documents, Active leaks, Total honeytokens, dan Safe documents.',
    keywords: ['osint', 'tracker', 'monitor', 'leak', 'kebocoran', 'pantau', 'dark web', 'pastebin'],
  },

  role_management: {
    title: 'Role Management (Admin)',
    description: 'Kelola role dan permission akses dokumen (khusus Admin).',
    steps: [
      'Klik **Role Management** di sidebar kiri (hanya visible untuk Admin/Super Admin).',
      'Lihat daftar role yang sudah ada: Finance Team, Legal Department, HR Team, dll.',
      'Klik **"+ Create Role"** untuk membuat role baru.',
      'Klik sebuah role card untuk membuka detail dan permissions matrix.',
      'Di detail role: atur **permission level** per folder/dokumen — No Access, Viewer, Editor, Admin.',
      'Tambah/hapus member dari role menggunakan panel member management.',
      'Gunakan search bar untuk memfilter folder/dokumen di permission matrix.',
    ],
    keywords: ['role', 'permission', 'hak akses', 'izin', 'kelola role', 'manage role', 'role management'],
  },

  user_management: {
    title: 'User Management (Admin)',
    description: 'Tambah dan kelola user organisasi (khusus Admin).',
    steps: [
      'Klik **avatar profil** di bagian bawah sidebar → pilih **"Settings"**.',
      'Buka tab **User Management** (hanya tersedia untuk Admin/Super Admin).',
      'Untuk menambah user baru: klik **"+ Add New User"**.',
      'Isi form: **First Name**, **Last Name**, **Email**, **Password**, **Phone**, **Department**, **Position**.',
      'Pilih **Role** dari dropdown: Admin, Manager, User, Auditor, atau Viewer.',
      'Klik **"Create"** — user baru akan ditambahkan dan bisa langsung login.',
      'Untuk mengubah status user: klik toggle **Active/Inactive** di tabel user.',
      'Untuk menghapus user: klik tombol **Delete** di baris user (konfirmasi akan muncul).',
    ],
    keywords: ['tambah user', 'add user', 'kelola user', 'manage user', 'buat akun', 'invite user', 'hapus user'],
  },

  move_document: {
    title: 'Pindahkan Dokumen ke Folder',
    description: 'Pindahkan dokumen antar folder dengan drag & drop atau modal.',
    steps: [
      'Klik **Documents** di sidebar kiri.',
      '**Cara 1 — Drag & Drop:** Drag dokumen card dan drop ke folder card yang dituju.',
      '**Cara 2 — Modal:** Klik dokumen → di modal detail, klik **"Move to Folder"** → pilih folder tujuan.',
      'Dokumen akan langsung pindah ke folder yang dipilih.',
      'Navigasi ke folder tujuan untuk memastikan dokumen sudah berpindah.',
    ],
    keywords: ['pindah dokumen', 'move document', 'pindahkan file', 'move to folder', 'drag drop'],
  },
};

export const DOCLOQ_ROLES = {
  super_admin: {
    name: 'Super Admin',
    description: 'Akses penuh ke seluruh sistem termasuk konfigurasi global.',
    permissions: ['Semua akses admin', 'Kelola organisasi', 'Konfigurasi sistem', 'Manage billing'],
  },
  admin: {
    name: 'Admin',
    description: 'Kelola user, dokumen, dan konfigurasi organisasi.',
    permissions: ['CRUD semua user', 'CRUD semua dokumen', 'Assign role', 'Lihat audit log', 'Kelola tim'],
  },
  manager: {
    name: 'Manager',
    description: 'Kelola tim dan approval workflow.',
    permissions: ['Lihat semua dokumen org', 'Approve workflow', 'Kelola tim sendiri', 'Assign tasks'],
  },
  user: {
    name: 'User',
    description: 'User standar dengan akses ke dokumen sendiri.',
    permissions: ['Upload dokumen', 'Edit dokumen sendiri', 'View dokumen sendiri', 'Complete tasks'],
  },
  auditor: {
    name: 'Auditor',
    description: 'Read-only access untuk audit dan compliance.',
    permissions: ['Lihat semua dokumen (read-only)', 'Lihat audit log', 'Lihat user list', 'Generate report'],
  },
  viewer: {
    name: 'Viewer',
    description: 'View-only access ke dokumen yang di-assign.',
    permissions: ['Lihat dokumen yang di-share', 'Download dokumen (jika diizinkan)'],
  },
};

export const DOCLOQ_FAQ = [
  {
    patterns: ['format', 'file apa', 'tipe file', 'jenis file', 'ekstensi'],
    answer: 'DocLoq mendukung format: **PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, ODT, ODS, ODP, CSV, RTF, PNG, JPEG, dan TXT**. Maksimal ukuran file **50MB**.',
  },
  {
    patterns: ['aman', 'keamanan', 'security', 'data aman', 'privasi'],
    answer: 'Ya! DocLoq menggunakan **enkripsi AES-256**, **honeytokens anti-leak**, dan **QR verification**. Semua data disimpan terenkripsi dan compliant dengan **UU PDP Indonesia** serta **GDPR**.',
  },
  {
    patterns: ['uu pdp', 'perlindungan data', 'compliance', 'gdpr', 'regulasi'],
    answer: 'DocLoq compliant dengan:\n- **UU No. 27 Tahun 2022** tentang Perlindungan Data Pribadi Indonesia\n- **GDPR** (General Data Protection Regulation)\n\nFitur compliance: enkripsi data, right to erasure (secure wipe), data retention policy (default 7 tahun), audit logging.',
  },
  {
    patterns: ['lupa password', 'reset password', 'ganti password'],
    answer: 'Untuk reset/ganti password:\n1. Klik **avatar profil** di bawah sidebar → **Settings**\n2. Buka tab **Security**\n3. Masukkan password lama, lalu password baru\n4. Klik **"Update Password"**',
  },
  {
    patterns: ['maksimal', 'limit', 'batas', 'ukuran file', 'size'],
    answer: 'Batas upload file di DocLoq adalah **50MB per file**. Jika membutuhkan upload lebih besar, hubungi admin organisasi kamu.',
  },
  {
    patterns: ['login', 'masuk', 'sign in', 'cara login'],
    answer: 'Cara login ke DocLoq:\n1. Buka halaman login DocLoq\n2. Masukkan **Email** dan **Password**\n3. Lengkapi **hCaptcha** jika diminta\n4. Klik **"Sign In"**\n5. Jika 2FA aktif, masukkan kode 6 digit dari Authenticator atau pilih verifikasi via email',
  },
  {
    patterns: ['dark mode', 'tema gelap', 'mode gelap', 'light mode', 'tema terang'],
    answer: 'Untuk mengubah tema: klik ikon **Dark/Light mode** di bagian bawah sidebar (di atas avatar profil). Kamu bisa beralih antara mode terang dan gelap.',
  },
];

export const DOCLOQ_COMPLIANCE = {
  uu_pdp: {
    title: 'UU Perlindungan Data Pribadi (UU PDP)',
    info: 'DocLoq compliant dengan UU No. 27 Tahun 2022. Data disimpan di region AWS Jakarta (ap-southeast-3), dienkripsi, dan memiliki data retention policy yang bisa dikonfigurasi.',
  },
  gdpr: {
    title: 'GDPR Compliance',
    info: 'DocLoq mendukung GDPR compliance dengan fitur: right to erasure (secure wipe), data portability, audit logging, dan consent management.',
  },
  data_retention: {
    title: 'Data Retention',
    info: 'Default retensi data 7 tahun. Setelah 1 tahun, dokumen otomatis dipindahkan ke deep archive. Konfigurasi bisa disesuaikan per organisasi.',
  },
};

/**
 * Find the most relevant feature based on user message keywords
 */
export const findRelevantFeature = (message) => {
  const lower = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, feature] of Object.entries(DOCLOQ_FEATURES)) {
    const keywords = feature.keywords || [];
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.length; // longer keyword = more specific = higher score
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { key, ...feature };
    }
  }

  return bestScore > 0 ? bestMatch : null;
};

/**
 * Find FAQ match
 */
export const findFAQMatch = (message) => {
  const lower = message.toLowerCase();
  for (const faq of DOCLOQ_FAQ) {
    const matchCount = faq.patterns.filter(p => lower.includes(p)).length;
    if (matchCount > 0) {
      return faq.answer;
    }
  }
  return null;
};

/**
 * Format feature info as markdown response
 */
export const formatFeatureResponse = (feature) => {
  let response = `## ${feature.title}\n\n${feature.description}\n`;

  if (feature.steps) {
    response += '\n**Langkah-langkah:**\n';
    feature.steps.forEach((step, i) => {
      response += `${i + 1}. ${step}\n`;
    });
  }

  if (feature.info) {
    response += `\n${feature.info}\n`;
  }

  if (feature.tips) {
    response += `\n**Tips:** ${feature.tips}\n`;
  }

  if (feature.supportedFormats) {
    response += `\n**Format didukung:** ${feature.supportedFormats}\n`;
    response += `**Maks ukuran:** ${feature.maxSize}\n`;
  }

  return response;
};

/**
 * Format roles as a readable response
 */
export const formatRolesResponse = (targetRole = null) => {
  if (targetRole && DOCLOQ_ROLES[targetRole]) {
    const role = DOCLOQ_ROLES[targetRole];
    let response = `## ${role.name}\n\n${role.description}\n\n**Permissions:**\n`;
    role.permissions.forEach(p => { response += `- ${p}\n`; });
    return response;
  }

  let response = '## Role & Permissions di DocLoq\n\n';
  for (const [key, role] of Object.entries(DOCLOQ_ROLES)) {
    response += `### ${role.name}\n${role.description}\n`;
    response += `Permissions: ${role.permissions.join(', ')}\n\n`;
  }
  return response;
};

export default {
  DOCLOQ_FEATURES,
  DOCLOQ_ROLES,
  DOCLOQ_FAQ,
  DOCLOQ_COMPLIANCE,
  findRelevantFeature,
  findFAQMatch,
  formatFeatureResponse,
  formatRolesResponse,
};
