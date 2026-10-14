# Shugen Hub: PLAN

## Tujuan
PWA untuk membantu operasional Shugen Store (joki dan topup).
Jalan di HP dan PC, bisa dipasang seperti app, tanpa server.

## Checklist fitur (urut prioritas)
Spek lengkap fitur yang sudah selesai ada di dev/PLANSPEC.md.

### Selesai
- [x] 1. Pesanan + Status
- [x] 2. Progress joki (checklist + persentase)
- [x] 3. Pemasukan
- [x] 4. Pengeluaran
- [x] 5. Invoice
- [x] 6. Data pelanggan (riwayat order, tandai langganan)
- [x] 13. Kas toko (saldo gabungan, menu sendiri)
- [x] 14. Kategori game (daftar game di Pengaturan, wajib dipilih di form pesanan)
- [x] 12. Backup dan restore manual (export/import file)

### Berikutnya
- [x] 12b. Pratinjau isi backup sebelum import
- [x] 12c. Backup otomatis sebelum import (unduh backup data saat ini dulu)
- [x] 12d. Perbandingan jumlah data saat ini dengan isi file backup (di dialog konfirmasi import)
- [x] 8. Rekap harian dan bulanan (omzet, pengeluaran, untung bersih)
- [x] 7. Template pesan WA (konfirmasi, update progress, selesai)
- [x] 10. Deadline pesanan dan pengingat
- [x] 9. Daftar penjoki/partner dan bagi hasil per pesanan
- [x] 11. Katalog harga (hanya template, harga bisa diubah per pesanan)
- [ ] 15. Pengingat backup berkala (tunda, putuskan setelah rencana sinkron Google Drive jelas)
- [x] 16. Hapus semua data

## Aturan umum
- Metode pembayaran bisa diatur sendiri (tambah, hapus, ganti nama), bukan daftar tetap
- Harga dari katalog hanya saran awal, selalu bisa diubah per pesanan
- ID pesanan harus unik walau dibuat dari beberapa perangkat sekaligus. Nomor urut tidak boleh hanya bergantung pada data lokal satu perangkat. Kalau format SGN-YYMMDD-001 tidak bisa menjamin itu, pilih cara lain yang tetap diawali SGN-YYMMDD dan mudah dibaca manusia, lalu jelaskan pilihannya di laporan akhir.

## Aturan teknis
- PWA (manifest + service worker, bisa offline)
- JavaScript, HTML, CSS
- Data disimpan lokal di perangkat (IndexedDB)
- Sinkron Google Drive pakai email toko (Google Cloud Console, scope drive.file atau appDataFolder)
- Tampilan mobile-first, tapi nyaman di PC
- Bahasa antarmuka: Indonesia

## Aturan repo (publik, masuk portofolio)
- Repo hanya berisi kode dan Client ID OAuth (publik)
- Jangan pernah commit data pesanan, data pelanggan, backup, atau client secret
- Sediakan data contoh (dummy) untuk demo portofolio

## Di luar cakupan fitur 2
Keuangan dan invoice belum dikerjakan. Struktur data harus siap dihubungkan ke fitur-fitur itu nanti.

## Utang teknis kecil
- Tombol #btn-mark-done dan .status-option sifatnya idempotent (hasil sama kalau dijalankan dua kali), jadi tidak mendesak.