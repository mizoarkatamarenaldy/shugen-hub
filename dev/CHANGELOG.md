# CHANGELOG

Entri terbaru ada di paling atas. Setiap tugas selesai = satu entri.
Nomor urut berlanjut terus antar-file dan tidak pernah di-reset.

## Format entri

### #NNN [TANGGAL] Judul singkat tugas
- Fitur: nama fitur dari PLAN.md
- Ringkasan: 1 sampai 3 kalimat tentang apa yang dikerjakan
- File diubah:
  - path/file1
  - path/file2
- Catatan: hal yang perlu diketahui pemilik (opsional, tulis "-" kalau tidak ada)

NNN = nomor urut 3 digit (001, 002, dst). TANGGAL = YYYY-MM-DD.

---

## Riwayat

### #010 [2026-10-13] Implementasi Fitur 4 (Pengeluaran)
- Fitur: Pengeluaran
- Ringkasan: Menambahkan fitur pencatatan pengeluaran toko (terhubung ke pesanan maupun berdiri sendiri) dengan daftar urut tanggal terbaru, filter rentang tanggal dan kategori, total pengeluaran hasil filter, serta form tambah/edit/hapus pengeluaran. Menambahkan pengelolaan kategori pengeluaran di Pengaturan (tambah, ganti nama, cegah nama kembar, dan cegah hapus kategori yang sedang dipakai), pengaman tombol serta cek keunikan nama pada `#btn-add-payment`, tampilan total pengeluaran di detail pesanan, data contoh pengeluaran di `js/dummy.js`, migrasi IndexedDB ke versi 4, dan pembaruan `dev/PLAN.md`.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: ID pengeluaran memakai format MKL-YYMMDD-XXXX (4 karakter acak dengan crypto.getRandomValues) dan pengeluaran menyimpan ID kategori (`categoryId`) agar penggantian nama kategori otomatis berlaku pada seluruh catatan. Skema IndexedDB naik ke versi 4 dan versi cache service worker dinaikkan ke shugen-v9.

### #009 [2026-10-13] Penyesuaian tampilan Fitur 3 terhadap DESIGN.md dan pembaruan RULES.md
- Fitur: Pemasukan
- Ringkasan: Memperbarui `dev/RULES.md` untuk menyertakan `dev/DESIGN.md` serta aturan kerja nomor 9 dan 10 sesuai instruksi pemilik. Menyesuaikan tampilan Fitur 3 agar sepenuhnya mengikuti token warna, kontras tema terang dan gelap (`--accent-text` `#1A1A1E` dan ikon panah `select` `#6B6D78` di tema terang, serta `var(--accent-text)` pada `.nav-tab.active`), `border-radius` (`6px` pada tag pemasukan dan `8px` pada dialog form), dan `max-width: 640px` dari `dev/DESIGN.md`.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/RULES.md
  - index.html
  - sw.js
- Catatan: Versi cache service worker dinaikkan ke shugen-v8.

### #008 [2026-10-13] Implementasi Fitur 3 (Pemasukan)
- Fitur: Pemasukan
- Ringkasan: Menambahkan fitur pencatatan pemasukan toko (terhubung ke pesanan maupun berdiri sendiri) dengan daftar urut tanggal terbaru, filter rentang tanggal, total pemasukan hasil filter, serta form tambah/edit/hapus pemasukan. Menampilkan total yang sudah dibayar pada dialog detail pesanan, memigrasi skema IndexedDB ke versi 3 secara aman dengan object store `incomes`, dan memperbarui `dev/PLAN.md` sesuai instruksi.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: ID pemasukan memakai format MSK-YYMMDD-XXXX (4 karakter acak dengan crypto.getRandomValues) agar unik lintas perangkat secara offline. Skema IndexedDB naik ke versi 3 dan versi cache service worker dinaikkan ke shugen-v7.

### #007 [2026-10-13] Pengaman tombol Hapus dan Muat Data Demo serta tombol salin ID pesanan
- Fitur: Pesanan + Status
- Ringkasan: Menonaktifkan tombol Hapus di dialog pesanan dan tombol Muat Data Demo di dialog Pengaturan selama operasi IndexedDB berlangsung agar tap ganda tidak menjalankan aksi dua kali, serta mengaktifkannya kembali jika proses gagal. Menambahkan tombol salin di sebelah ID pesanan pada dialog detail pesanan yang menyalin ID lengkap ke clipboard dengan umpan balik "Tersalin" dan pesan gagal jika penyalinan terkendala.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - index.html
  - js/app.js
  - sw.js
- Catatan: Versi cache service worker dinaikkan ke shugen-v6.

### #006 [2026-10-13] Pengacakan ID dengan crypto.getRandomValues dan pengaman tombol Simpan
- Fitur: Pesanan + Status
- Ringkasan: Mengganti pemilihan karakter acak ID pesanan dari Math.random() ke crypto.getRandomValues() tanpa bias distribusi serta menangani ConstraintError saat penyimpanan berurutan di IndexedDB. Menonaktifkan tombol Simpan di dialog form pesanan selama proses penyimpanan berlangsung untuk mencegah penyimpanan ganda akibat tap cepat, dan mengaktifkannya kembali jika penyimpanan gagal.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - index.html
  - js/app.js
  - js/db.js
  - sw.js
- Catatan: Data pesanan yang sudah ada di IndexedDB tidak diubah, dan versi cache service worker dinaikkan ke shugen-v5.

### #005 [2026-10-13] Perbaikan keunikan ID pesanan dan pembaruan ID data contoh
- Fitur: Pesanan + Status
- Ringkasan: Mengamankan pembuatan ID pesanan dan penyimpanan ke IndexedDB dalam satu transaksi readwrite berurutan agar bebas kondisi balapan serta mengacak ulang otomatis jika ID sudah terpakai. Mengubah seluruh ID pesanan di data contoh dari format urutan ke format acak 4 karakter beserta referensi progress jokinya.
- File diubah:
  - dev/CHANGELOG.md
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: Data pesanan yang sudah tersimpan di IndexedDB tidak diubah. Untuk melihat ID baru pada data contoh, muat ulang data demo lewat dialog Pengaturan.

### #004 [2026-10-13] Implementasi Fitur 2 (Progress joki)
- Fitur: Progress joki
- Ringkasan: Menambahkan fitur checklist langkah pengerjaan khusus pesanan Joki (tambah, hapus, ganti nama, atur ulang urutan, centang satu tap) dengan perhitungan persentase otomatis yang tampil di daftar dan detail pesanan. Menyediakan saran penyelesaian manual saat progress mencapai 100%, menjaga progress pada pesanan yang dibatalkan, serta melakukan migrasi skema IndexedDB ke versi 2 secara aman.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: Data progress disimpan pada object store `progress` di IndexedDB (versi 2) menggunakan `orderId` (SGN-YYMMDD-XXXX) sebagai kunci agar data pesanan Fitur 1 tetap utuh dan siap disinkronkan lintas perangkat.

### #003 [2026-10-13] Perbaikan ikon PWA dan path relatif
- Fitur: Pesanan + Status
- Ringkasan: Mengganti ikon di manifest.json menjadi PNG persegi 192x192, 512x512, dan ikon maskable 512x512, serta memperbarui apple-touch-icon di index.html menjadi PNG. Memastikan semua path di manifest.json dan sw.js bersifat relatif untuk dukungan subfolder GitHub Pages, serta menaikkan versi cache service worker ke shugen-v2.
- File diubah:
  - dev/CHANGELOG.md
  - icons/icon-192.png
  - icons/icon-512.png
  - icons/icon-maskable.png
  - index.html
  - manifest.json
  - sw.js
- Catatan: Ikon SVG sebelumnya gagal dimuat di tab Manifest DevTools karena elemen `<svg>` hanya memiliki `viewBox` tanpa atribut dimensi `width` dan `height` eksplisit.

### #002 [2026-10-13] Implementasi Fitur 1 (Pesanan + Status)
- Fitur: Pesanan + Status
- Ringkasan: Membangun struktur dasar PWA offline Shugen Hub menggunakan IndexedDB lokal. Menyediakan daftar pesanan dengan filter status dan pencarian, form tambah/edit pesanan, pengubah status cepat, pengaturan metode pembayaran kustom, dan data demo untuk demonstrasi portofolio.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/DESIGN.md
  - icons/icon.svg
  - icons/icon-192.svg
  - icons/icon-512.svg
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - manifest.json
  - sw.js
- Catatan: ID pesanan menggunakan format SGN-YYMMDD-XXXX (4 karakter alfanumerik) untuk memastikan keunikan data antar-perangkat secara offline.

### #001 [2026-10-13] Setup awal repo
- Fitur: Persiapan
- Ringkasan: Menambahkan PLAN.md, RULES.md, dan CHANGELOG.md di folder dev.
- File diubah:
  - dev/PLAN.md
  - dev/RULES.md
  - dev/CHANGELOG.md
- Catatan: -