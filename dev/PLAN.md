# Shugen Hub: PLAN

## Tujuan
PWA untuk membantu operasional Shugen Store (joki dan topup).
Jalan di HP dan PC, bisa dipasang seperti app, tanpa server.

## Fitur inti (dikerjakan satu per satu, urut)
1. Pesanan + Status
2. Progress joki (checklist + persentase)
3. Pemasukan
4. Pengeluaran
5. Invoice  <- FOKUS SEKARANG

## Fitur tambahan (setelah fitur inti)
6. Data pelanggan (riwayat order, tandai langganan)
7. Template pesan WA (konfirmasi, update progress, selesai)
8. Rekap harian dan bulanan (omzet, pengeluaran, untung bersih)
9. Daftar penjoki/partner dan bagi hasil per pesanan
10. Deadline pesanan dan pengingat
11. Katalog harga (hanya template, harga bisa diubah per pesanan)
12. Backup dan restore manual (export/import file)
13. Kas toko (saldo gabungan, menu sendiri)

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

## Fitur 4: Pengeluaran
- Mencatat uang keluar toko. Satu pengeluaran bisa terhubung ke satu pesanan (lewat ID pesanan dari Fitur 1, misalnya modal topup) atau berdiri sendiri (misalnya gaji worker, biaya operasional).
- Satu pesanan boleh punya beberapa pengeluaran.
- Setiap pengeluaran wajib punya kategori. Kategori bisa diatur sendiri di Pengaturan (tambah, hapus, ganti nama), bukan daftar tetap. Kategori awal: Modal Topup, Gaji Worker, Operasional, Lainnya.
- Kategori yang sudah dipakai oleh minimal satu pengeluaran tidak boleh dihapus (tampilkan pesan yang jelas). Ganti nama boleh dan otomatis berlaku di semua pengeluaran yang memakainya. Nama kategori tidak boleh kembar.
- Data pengeluaran: ID unik (ikuti Aturan umum soal keunikan ID lintas perangkat, awalan MKL-YYMMDD), tanggal, jumlah (rupiah), kategori (wajib), metode pembayaran (dari daftar di Pengaturan), ID pesanan (opsional), catatan (opsional).
- Kebutuhan layar: daftar pengeluaran (urut tanggal terbaru, filter rentang tanggal, filter kategori, total pengeluaran dari hasil filter, kategori tampil di tiap baris), form tambah/edit/hapus pengeluaran, pengelolaan kategori di Pengaturan, dan di detail pesanan tampil total pengeluaran yang terhubung ke pesanan itu.
- Gaji worker di fitur ini hanya dicatat lewat kategori dan catatan. Tidak ada data worker dan tidak ada bagi hasil (itu Fitur 9).
- Mengubah status pesanan tidak otomatis membuat atau mengubah pengeluaran. Semua pencatatan dilakukan manual oleh pengguna.
- Pesanan Dibatalkan tetap menyimpan pengeluarannya.

## Fitur 5: Invoice
- Invoice dibuat dari satu pesanan (lewat ID pesanan dari Fitur 1). Satu pesanan punya paling banyak satu invoice.
- Invoice dibuat manual lewat tombol di detail pesanan. Tidak dibuat otomatis saat pesanan dibuat atau status berubah.
- Nomor invoice: INV-YYMMDD-XXXX (4 karakter acak dengan crypto.getRandomValues, ikuti Aturan umum soal keunikan ID lintas perangkat).
- Data invoice yang disimpan: nomor invoice, ID pesanan, tanggal terbit, catatan invoice (opsional).
- Isi tampilan invoice diambil langsung dari data terkini: nama toko dan kontak toko, nomor dan tanggal invoice, nama pelanggan, jenis, game, detail pesanan, harga, total yang sudah dibayar (dari Fitur 3), sisa tagihan (harga dikurangi total dibayar), dan label LUNAS atau BELUM LUNAS.
- Nama toko dan kontak toko bisa diisi dan diubah di Pengaturan.
- Kebutuhan layar: tombol Buat Invoice atau Lihat Invoice di detail pesanan, tampilan invoice yang rapi, tombol Cetak/Simpan PDF memakai window.print() dengan CSS print (tanpa library), form edit catatan invoice, tombol hapus invoice (pesanan tidak ikut terhapus), dan menu Invoice berisi daftar invoice (urut tanggal terbaru, pencarian berdasarkan nomor invoice atau nama pelanggan). Mengetuk baris membuka tampilan invoice.
- Menghapus pesanan juga menghapus invoice-nya, dan pesan konfirmasi hapus harus menyebutkan hal itu.
- Pesanan Dibatalkan tetap boleh punya invoice.
- Tidak ada pajak, diskon, atau banyak item per invoice. Tidak ada kirim otomatis ke WA (itu Fitur 7).

## Fitur 13: Kas toko
- Satu saldo gabungan untuk seluruh toko. Kas berfungsi sebagai penampung: uang pelanggan masuk ke kas, uang keluar ke worker dan biaya lain dari kas.
- Saldo dihitung otomatis: saldo awal + total pemasukan - total pengeluaran. Tidak ada pencatatan kas terpisah dan tidak ada transfer antar kas.
- Saldo awal bisa diisi dan diubah di menu Kas (angka rupiah, default 0).
- Menu Kas menampilkan: saldo saat ini, dan daftar mutasi gabungan pemasukan dan pengeluaran (urut tanggal terbaru, filter rentang tanggal, tiap baris menandai masuk atau keluar beserta jumlahnya). Mengetuk baris membuka form pemasukan atau pengeluaran aslinya.
- Menu Kas hanya menampilkan dan tidak menambah atau mengubah data baru selain saldo awal. Pencatatan tetap lewat Fitur 3 dan 4.
- Pesanan Dibatalkan tetap menghitung pemasukan dan pengeluaran yang sudah tercatat.
- Tidak ada perhitungan untung bersih dan tidak ada rekap harian/bulanan (itu Fitur 8). Tidak ada hitungan gaji otomatis (itu Fitur 9).

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