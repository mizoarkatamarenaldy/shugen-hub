# Shugen Hub: PLAN

## Tujuan
PWA untuk membantu operasional Shugen Store (joki dan topup).
Jalan di HP dan PC, bisa dipasang seperti app, tanpa server.

## Checklist fitur (urut prioritas)

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
- [x] 12b. Pratinjau isi backup sebelum import  <- FOKUS SEKARANG
- [ ] 12c. Backup otomatis sebelum import (unduh backup data saat ini dulu)
- [ ] 12d. Perbandingan jumlah data saat ini dengan isi file backup (di dialog konfirmasi import)
- [ ] 8. Rekap harian dan bulanan (omzet, pengeluaran, untung bersih)
- [ ] 7. Template pesan WA (konfirmasi, update progress, selesai)
- [ ] 10. Deadline pesanan dan pengingat
- [ ] 9. Daftar penjoki/partner dan bagi hasil per pesanan
- [ ] 11. Katalog harga (hanya template, harga bisa diubah per pesanan)
- [ ] 15. Pengingat backup berkala (tunda, putuskan setelah rencana sinkron Google Drive jelas)

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

## Fitur 6: Data pelanggan
- Menyimpan data pelanggan toko dan riwayat ordernya. Pelanggan dihubungkan ke pesanan lewat nama pelanggan di Fitur 1 (dicocokkan tanpa membedakan huruf besar kecil dan tanpa spasi di pinggir). Struktur pesanan Fitur 1 tidak diubah.
- Data pelanggan: ID unik (PLG-YYMMDD-XXXX, 4 karakter acak dengan crypto.getRandomValues, ikuti Aturan umum soal keunikan ID lintas perangkat), nama (wajib, tidak boleh kembar), kontak seperti nomor WA atau username (opsional), catatan (opsional), tanda langganan (ya atau tidak, default tidak).
- Kebutuhan layar: menu Pelanggan berisi daftar pelanggan (urut nama, pencarian berdasarkan nama atau kontak, filter Semua atau Langganan saja, tanda langganan terlihat di tiap baris), form tambah/edit/hapus pelanggan, dan tombol tandai atau cabut langganan satu tap.
- Mengetuk baris pelanggan membuka detail: kontak, catatan, jumlah order, total harga order, total yang sudah dibayar (dari Fitur 3), dan daftar riwayat order (urut tanggal terbaru, tiap baris menampilkan ID, jenis, game, status, harga). Mengetuk baris order membuka detail pesanan.
- Ganti nama pelanggan otomatis ikut mengganti nama pelanggan di semua pesanannya, dalam satu transaksi IndexedDB.
- Menghapus pelanggan tidak menghapus pesanannya. Pesan konfirmasi hapus menjelaskan hal itu.
- Di form pesanan (Fitur 1), kolom nama pelanggan menampilkan saran dari daftar pelanggan (datalist). Pengguna tetap bebas mengetik nama yang belum ada, dan itu tidak otomatis membuat pelanggan baru.
- Pesanan Dibatalkan tetap tampil di riwayat order pelanggan, dan tidak dihitung ke total harga order maupun jumlah order.
- Tidak ada pembuatan pelanggan otomatis, tidak ada diskon atau poin langganan, dan tidak ada kirim pesan WA (itu Fitur 7).

## Fitur 14: Kategori game
- Daftar game diatur sendiri di Pengaturan (tambah, ganti nama, hapus), bukan daftar tetap. Daftar awal kosong.
- Nama game wajib diisi dan tidak boleh kembar (tanpa membedakan huruf besar kecil dan spasi di pinggir).
- Game wajib dipilih dari daftar ini di form pesanan (Fitur 1). Kolom Game berupa pilihan (select), tidak bisa diketik bebas.
- Kalau daftar game masih kosong, form pesanan menampilkan pesan jelas yang mengarahkan pengguna ke Pengaturan untuk menambah game dulu, dan pesanan tidak bisa disimpan.
- Pesanan menyimpan ID game (`gameId`), bukan teks nama, supaya ganti nama game otomatis berlaku di semua pesanan. Format ID: GAM-YYMMDD-XXXX (4 karakter acak dengan crypto.getRandomValues, ikuti Aturan umum soal keunikan ID lintas perangkat).
- Game yang sedang dipakai oleh minimal satu pesanan tidak boleh dihapus (tampilkan pesan yang jelas).
- Nama game tampil (diambil dari daftar lewat `gameId`) di semua tempat yang sebelumnya menampilkan game: daftar pesanan, detail pesanan, pencarian pesanan, invoice, dan riwayat order pelanggan.
- Tidak ada kompatibilitas dengan data pesanan lama. Semua data yang ada sekarang adalah data demo, dan pengguna akan memuat ulang data demo.
- Tidak ada harga atau katalog di fitur ini (itu Fitur 11).

## Fitur 12: Backup dan restore manual
- Ada di dialog Pengaturan, bagian baru bernama "Backup dan Restore".
- Tombol Export: mengunduh satu file JSON berisi seluruh isi semua object store IndexedDB (baca js/db.js untuk daftar store lengkap, jangan ada yang terlewat, termasuk pengaturan toko, metode pembayaran, kategori, saldo awal kas, dan daftar game).
- Nama file: shugen-backup-YYYYMMDD-HHMM.json.
- File berisi penanda aplikasi ("shugen-hub"), versi skema IndexedDB saat export, waktu export, dan data per store.
- Tombol Import: pilih file JSON dari perangkat.
- Sebelum menimpa data, validasi file: harus JSON valid, penanda aplikasi cocok, dan versi skema sama persis dengan versi skema aplikasi saat ini. Kalau tidak lolos, tampilkan pesan error yang jelas dan jangan ubah data apa pun.
- Setelah lolos validasi, tampilkan konfirmasi yang menjelaskan bahwa semua data sekarang akan DIGANTI dengan isi file backup.
- Proses import menghapus isi semua store lalu menulis data dari file dalam satu transaksi IndexedDB. Kalau gagal di tengah jalan, data lama tetap utuh.
- Tombol Export dan Import dinonaktifkan selama prosesnya berjalan (ikuti pola pengaman tombol yang sudah ada). Setelah import berhasil, tampilkan pesan sukses dan muat ulang tampilan agar semua menu menampilkan data baru.
- Tanpa library baru. Tanpa kompresi, tanpa enkripsi, tanpa sinkron Google Drive (itu fitur terpisah).
- Jangan menyimpan atau meng-commit file backup apa pun ke repo.

## Fitur 12b: Pratinjau isi backup sebelum import
- Pada dialog konfirmasi import (Fitur 12), tampilkan ringkasan isi file backup di atas peringatan "semua data akan DIGANTI".
- Ringkasan memuat tanggal dan waktu export (diambil dari file), lalu jumlah data untuk SEMUA jenis data yang disimpan. Baca js/db.js untuk daftar store lengkap, jangan ada yang terlewat. Minimal: pesanan, pelanggan, pemasukan, pengeluaran, invoice, game, progress joki, kategori pengeluaran, dan metode pembayaran.
- Store yang hanya berisi satu pengaturan (misalnya nama toko atau saldo awal kas) tidak dihitung jumlahnya. Kalau mau ditampilkan, tampilkan sebagai nilainya saja (contoh: saldo awal).
- Tiap baris pakai label bahasa Indonesia yang mudah dipahami pengguna baru, bukan nama store teknis.
- Angka dihitung dari data di dalam file yang sudah lolos validasi. Kalau sebuah store tidak ada atau kosong di file, tampilkan 0.
- Ringkasan hanya menampilkan. Tidak mengubah data apa pun, dan alur validasi serta proses import yang sudah ada tidak berubah.
- Pada notifikasi (toast) sukses export, tampilkan ukuran file backup (pakai KB, atau MB kalau lebih dari 1024 KB).
- Tanpa library baru. Tanpa perubahan skema IndexedDB.

## Fitur 13: Kas toko
- Satu saldo gabungan untuk seluruh toko. Kas berfungsi sebagai penampung: uang pelanggan masuk ke kas, uang keluar ke worker dan biaya lain dari kas.
- Saldo dihitung otomatis: saldo awal + total pemasukan - total pengeluaran. Tidak ada pencatatan kas terpisah dan tidak ada transfer antar kas.
- Saldo awal bisa diisi dan diubah di menu Kas (angka rupiah, default 0).
- Menu Kas menampilkan: saldo saat ini, dan daftar mutasi gabungan pemasukan dan pengeluaran (urut tanggal terbaru, filter rentang tanggal, tiap baris menandai masuk atau keluar beserta jumlahnya). Mengetuk baris membuka form pemasukan atau pengeluaran aslinya.
- Menu Kas hanya menampilkan dan tidak menambah atau mengubah data baru selain saldo awal. Pencatatan tetap lewat Fitur 3 dan 4.
- Pesanan Dibatalkan tetap menghitung pemasukan dan pengeluaran yang sudah tercatat.
- Tidak ada perhitungan untung bersih dan tidak ada rekap harian/bulanan (itu Fitur 8). Tidak ada hitungan gaji otomatis (itu Fitur 9).

## Fitur 12c: Backup otomatis sebelum import
- Di dialog konfirmasi import (Fitur 12), tambahkan kotak centang "Unduh backup data saat ini dulu". Kotak ini aktif (tercentang) secara default.
- Kalau tercentang, saat pengguna menekan tombol konfirmasi import, aplikasi mengunduh file backup dari data saat ini lebih dulu, baru menjalankan import.
- Pakai ulang fungsi export dari Fitur 12. Jangan menulis ulang logika export.
- Nama file: shugen-backup-sebelum-import-YYYYMMDD-HHMM.json.
- Kalau pengunduhan gagal, import dibatalkan dan data tidak diubah. Tampilkan pesan yang jelas.
- Kalau kotak tidak tercentang, import berjalan seperti biasa tanpa unduhan.
- Backup tidak disimpan di IndexedDB. Hasilnya hanya file unduhan di perangkat.
- Tanpa store baru, tanpa perubahan skema IndexedDB, tanpa library baru.
- Tidak ada fitur "pulihkan otomatis". Pemulihan dilakukan lewat Import biasa memakai file yang diunduh.

## Fitur 12d: Perbandingan jumlah data saat import
- Di ringkasan dialog konfirmasi import (Fitur 12b), tiap baris jumlah data menampilkan dua angka: jumlah di perangkat sekarang dan jumlah di file backup. Contoh: "Pesanan: 8 -> 12".
- Jumlah data sekarang dibaca dari IndexedDB saat dialog dibuka (hanya baca, tidak mengubah apa pun).
- Daftar baris sama dengan ringkasan 12b (semua store yang dihitung jumlahnya). Store pengaturan tunggal tetap tidak dihitung.
- Kalau angkanya berbeda, tambahkan selisih dalam teks, misalnya "(+4)" atau "(-2)". Jangan hanya mengandalkan warna. Ikuti dev/DESIGN.md: warna hanya untuk status.
- Kalau sebuah store kosong atau tidak ada, tampilkan 0.
- Ringkasan hanya menampilkan. Alur validasi, Fitur 12c, dan proses import tidak berubah.
- Tanpa perubahan skema IndexedDB, tanpa library baru.

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