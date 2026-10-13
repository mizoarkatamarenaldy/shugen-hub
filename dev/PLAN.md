# Shugen Hub: PLAN

## Tujuan
PWA untuk membantu operasional Shugen Store (joki dan topup).
Jalan di HP dan PC, bisa dipasang seperti app, tanpa server.

## Fitur inti (dikerjakan satu per satu, urut)
1. Pesanan + Status
2. Progress joki (checklist + persentase)
3. Pemasukan  <- FOKUS SEKARANG
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

## Fitur 2: Progress joki
- Hanya untuk pesanan berjenis Joki. Pesanan Topup tidak punya progress.
- Tiap pesanan joki punya checklist langkah (tambah, hapus, ganti nama, atur ulang urutan). Checklist diisi dari nol per pesanan, tanpa template.
- Tiap langkah bisa dicentang satu tap.
- Persentase progress dihitung otomatis dari langkah yang sudah dicentang.
- Persentase tampil di daftar pesanan dan di detail pesanan.
- Status pesanan tidak berubah otomatis. Kalau semua langkah selesai, tampilkan saran "tandai Selesai?", keputusan tetap di pengguna.
- Pesanan Dibatalkan tetap menyimpan progress-nya.
- Data progress terhubung ke ID pesanan dari Fitur 1.

## Fitur 3: Pemasukan
- Mencatat uang masuk toko. Satu pemasukan bisa terhubung ke satu pesanan (lewat ID pesanan dari Fitur 1) atau berdiri sendiri (tanpa pesanan).
- Satu pesanan boleh punya beberapa pemasukan (misalnya DP lalu pelunasan).
- Data pemasukan: ID unik (ikuti Aturan umum soal keunikan ID lintas perangkat), tanggal, jumlah (rupiah), metode pembayaran (dari daftar di Pengaturan), ID pesanan (opsional), catatan.
- Kebutuhan layar: daftar pemasukan (urut tanggal terbaru, filter rentang tanggal, total pemasukan dari hasil filter), form tambah/edit/hapus pemasukan, dan di detail pesanan tampil total yang sudah dibayar.
- Mengubah status pesanan tidak otomatis membuat atau mengubah pemasukan. Semua pencatatan pemasukan dilakukan manual oleh pengguna.
- Pesanan Dibatalkan tetap menyimpan pemasukannya.
- Tidak ada rekap harian/bulanan di fitur ini (itu Fitur 8).

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
- Tombol #btn-add-payment di Pengaturan belum punya pengaman disabled selama operasi IndexedDB. Tap ganda bisa membuat metode pembayaran dobel kecuali nama dicek unik. Kerjakan nanti saat sebuah tugas memang menyentuh Pengaturan atau metode pembayaran. Jangan dibuat tugas sendiri.
- Tombol #btn-mark-done dan .status-option sifatnya idempotent (hasil sama kalau dijalankan dua kali), jadi tidak mendesak.