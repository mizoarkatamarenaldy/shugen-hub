# Shugen Hub: PLANSPEC

File ini berisi spek lengkap fitur yang sudah selesai, dipindah dari dev/PLAN.md. Checklist dan aturan umum tetap di dev/PLAN.md. Aturan umum yang dirujuk spek ada di dev/PLAN.md.

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

## Fitur 8: Rekap harian dan bulanan
- Menu baru bernama Rekap, berisi dua tab: Harian dan Bulanan.
- Tiga angka utama: omzet, pengeluaran, dan untung bersih.
- Omzet = total pemasukan (Fitur 3) pada periode itu, dihitung dari tanggal pemasukan (kapan uang masuk), bukan dari harga pesanan.
- Pengeluaran = total pengeluaran (Fitur 4) pada periode itu, dihitung dari tanggal pengeluaran.
- Untung bersih = omzet - pengeluaran. Kalau hasilnya negatif, tampilkan dengan tanda minus. Jangan hanya mengandalkan warna. Ikuti dev/DESIGN.md: warna hanya untuk status.
- Tab Harian: pilih satu tanggal (default hari ini), tampilkan tiga angka di atas.
- Tab Bulanan: pilih satu bulan (default bulan ini), tampilkan tiga angka di atas, lalu daftar per hari (hanya hari yang ada transaksi, urut tanggal terbaru) dengan omzet, pengeluaran, dan untung bersih tiap hari.
- Tanggal dibaca sesuai zona waktu perangkat.
- Pesanan Dibatalkan tetap menghitung pemasukan dan pengeluaran yang sudah tercatat.
- Kalau periode tidak punya transaksi, tampilkan 0 dan pesan yang jelas.
- Menu Rekap hanya menampilkan dan tidak menambah atau mengubah data apa pun.
- Tanpa grafik, tanpa library baru, tanpa perubahan skema IndexedDB. Tidak ada ekspor atau cetak rekap. Tidak ada rincian per kategori.

## Fitur 7: Template pesan WA

Tujuan: tim toko bisa membuat pesan WhatsApp ke pelanggan dengan cepat dari detail pesanan, tanpa mengetik ulang.

### Tiga jenis template
1. Konfirmasi: pesanan sudah dicatat, sebut ringkasan pesanan dan total bayar.
2. Update progress: kabar perkembangan pesanan, sebut persentase progress.
3. Selesai: pesanan sudah selesai, ucapan terima kasih.

### Isi template
- Setiap template punya teks bawaan dalam bahasa Indonesia yang sopan dan singkat.
- Teks template memakai placeholder yang diganti otomatis dengan data pesanan: {nama_pelanggan}, {id_pesanan}, {game}, {layanan}, {total}, {progress}.
- Pakai hanya placeholder yang datanya memang ada di aplikasi. Kalau ada yang datanya tidak ada, jangan dibuat. Sebutkan di laporan akhir.
- Kalau sebuah nilai kosong, placeholder diganti teks kosong, bukan tampil mentah seperti {progress}.

### Mengatur template (di Pengaturan)
- Pemilik bisa mengedit teks tiap template.
- Ada tombol "Kembalikan ke bawaan" per template.
- Tampilkan daftar placeholder yang tersedia di dekat kolom edit, dengan penjelasan singkat untuk pengguna baru.
- Template disimpan lokal di IndexedDB bersama data lain, ikut masuk backup dan restore yang sudah ada.

### Memakai template (di detail pesanan)
- Tombol "Pesan WA" di detail pesanan. Pengguna memilih salah satu dari tiga template.
- Pratinjau hasil pesan ditampilkan sebelum dikirim.
- Dua aksi: "Salin pesan" (selalu tersedia) dan "Buka WhatsApp" (hanya kalau data pelanggan punya nomor HP, pakai link wa.me dengan pesan terisi).
- Template yang disarankan otomatis mengikuti status pesanan (Menunggu Bayar: konfirmasi, Diproses: update progress, Selesai: selesai), tapi pengguna tetap bisa memilih template lain.

### Di luar cakupan
Pengingat otomatis, kirim massal, dan integrasi WA API tidak dikerjakan.
## Fitur 10: Deadline pesanan dan pengingat

Tujuan: tim toko tahu pesanan mana yang harus segera dikerjakan atau sudah lewat waktu, tanpa mengecek satu per satu.

### Data deadline
- Setiap pesanan punya field deadline yang opsional: tanggal wajib kalau diisi, jam opsional.
- Waktu memakai zona waktu lokal perangkat.
- Pesanan lama yang belum punya deadline tetap valid dan tidak boleh rusak. Kalau skema IndexedDB perlu naik versi, ikuti pola migrasi yang sudah ada dan pastikan data lama aman.
- Deadline bisa diisi di form pesanan dan diubah atau dihapus di detail pesanan.
- Field deadline ikut masuk backup, restore, dan pratinjau backup yang sudah ada.

### Tingkat urgensi
Hanya pesanan berstatus Menunggu Bayar dan Diproses yang dihitung. Selesai dan Dibatalkan tidak pernah ditandai.
- Terlambat: waktu deadline sudah lewat. Kalau deadline hanya tanggal tanpa jam, dianggap lewat setelah hari itu berakhir.
- Hari ini: deadline jatuh hari ini dan belum lewat.
- Besok: deadline jatuh besok.
- Lainnya: tampilkan tanggal deadline saja, tanpa tanda khusus.

### Tampilan
- Di kartu daftar pesanan dan detail pesanan, tampilkan deadline dengan label teks yang jelas (misalnya "Terlambat", "Hari ini 15.00", "Besok", atau tanggalnya).
- Ikuti dev/DESIGN.md. Warna hanya untuk badge status, jadi jangan menambah warna baru untuk urgensi. Bedakan urgensi lewat label teks dan penekanan tipografi. Kalau ini bertentangan dengan kebutuhan fitur, berhenti dan tanya pemilik (aturan 6).
- Di atas daftar pesanan, tampilkan ringkasan satu baris bila ada yang perlu perhatian, contoh: "2 pesanan terlambat, 1 deadline hari ini". Ketuk ringkasan untuk memfilter daftar ke pesanan tersebut. Kalau tidak ada, ringkasan tidak ditampilkan.
- Tambahkan pilihan urutan "Deadline terdekat" di daftar pesanan. Pesanan tanpa deadline ditaruh paling bawah.

### Pengingat
- Pengingat utama adalah ringkasan di atas daftar pesanan. Ringkasan dihitung ulang saat app dibuka, saat app kembali aktif, dan secara berkala (sekitar tiap menit) selama app terbuka.
- Di Pengaturan ada saklar "Notifikasi browser" (default mati). Izin notifikasi hanya diminta saat pengguna menyalakan saklar itu.
- Kalau saklar menyala dan app sedang terbuka, tampilkan satu notifikasi untuk pesanan yang baru menjadi Terlambat atau deadline-nya tinggal 1 jam. Satu pesanan hanya diingatkan sekali per tingkat. Catatan "sudah diingatkan" disimpan lokal per perangkat dan tidak perlu ikut backup.
- Kalau izin ditolak atau browser tidak mendukung, saklar menampilkan penjelasan singkat dan app tetap jalan dengan ringkasan saja.
- Teks di Pengaturan harus jelas untuk pengguna baru, termasuk penjelasan bahwa notifikasi hanya muncul saat app terbuka.

### Data contoh
Perbarui data contoh (dummy) supaya ada pesanan dengan deadline terlambat, hari ini, besok, jauh, dan tanpa deadline.

### Di luar cakupan
Push notification saat app tertutup, server atau background sync, pengingat lewat WhatsApp atau email, dan deadline berulang tidak dikerjakan. Kalau ada ide tambahan, tulis di laporan akhir.
