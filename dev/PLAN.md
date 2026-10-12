# Shugen Hub: PLAN

## Tujuan
PWA untuk membantu operasional Shugen Store (joki dan topup).
Jalan di HP dan PC, bisa dipasang seperti app, tanpa server.

## Fitur inti (dikerjakan satu per satu, urut)
1. Pesanan + Status  <- FOKUS SEKARANG
2. Progress joki (checklist + persentase)
3. Pemasukan
4. Pengeluaran
5. Invoice

## Fitur tambahan (setelah fitur inti)
6. Data pelanggan (riwayat order, tandai langganan)
7. Template pesan WA (konfirmasi, update progress, selesai)
8. Rekap harian dan bulanan (omzet, pengeluaran, untung bersih)
9. Daftar penjoki/partner dan bagi hasil per pesanan
10. Deadline pesanan dan pengingat
11. Katalog harga (hanya template, harga bisa diubah per pesanan)
12. Backup dan restore manual (export/import file)

## Fitur 1: Pesanan + Status
Data pesanan:
- ID pesanan otomatis (awalan SGN-YYMMDD, lihat Aturan umum soal keunikan)
- Nama pelanggan
- Jenis: Joki atau Topup
- Game
- Detail/catatan
- Harga
- Tanggal dibuat

Status pesanan:
- Menunggu Bayar
- Diproses
- Selesai
- Dibatalkan

Kebutuhan layar:
- Daftar pesanan, ada filter per status dan pencarian
- Form tambah/edit pesanan
- Ubah status dengan satu tap

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

## Di luar cakupan fitur 1
Progress, keuangan, dan invoice belum dikerjakan.
Struktur data pesanan harus siap dihubungkan ke fitur-fitur itu nanti.