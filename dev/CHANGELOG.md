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