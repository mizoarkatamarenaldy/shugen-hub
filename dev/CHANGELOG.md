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