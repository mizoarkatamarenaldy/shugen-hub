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

### #030 [2026-10-15] Implementasi Fitur 20 (Grafik pemasukan dan pengeluaran)
- Fitur: Grafik pemasukan dan pengeluaran
- Ringkasan: Menambahkan grafik batang tren harian dan diagram donat komposisi di bagian atas halaman Pemasukan dan Pengeluaran menggunakan SVG murni tanpa library eksternal. Grafik batang menampilkan total per hari untuk rentang 7 hari (default), 30 hari, dan Bulan ini, dengan nilai 0 pada hari tanpa transaksi serta detail tanggal dan nominal saat batang diketuk tanpa tooltip melayang. Diagram donat menampilkan komposisi per metode pembayaran untuk pemasukan dan per kategori pengeluaran dengan maksimal 5 segmen (sisanya digabung menjadi Lainnya) lengkap dengan legenda nominal dan persentase, tema gelap dan terang sesuai token dev/DESIGN.md, serta teks "Belum ada data untuk rentang ini" saat kosong.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - dev/PLANSPEC.md
  - index.html
  - js/app.js
  - sw.js
- Catatan: Grafik hanya membaca data lokal yang sudah ada tanpa menambah field atau mengubah struktur data; cache service worker dinaikkan ke shugen-v27.

### #029 [2026-10-14] Implementasi Fitur 19 (Dashboard)
- Fitur: Dashboard
- Ringkasan: Menambahkan halaman Dashboard sebagai halaman awal aplikasi saat dibuka dan menu navigasi baru untuk merangkum kondisi operasional toko hari ini dalam tampilan satu kolom monokrom sesuai dev/DESIGN.md. Dashboard menampilkan 6 blok berurutan: pesanan yang perlu perhatian (menunggu bayar dan deadline mendesak beserta daftar pendek), performa keuangan hari ini dan ringkasan bulan ini dengan rumus rekap Fitur 8, saldo kas toko saat ini yang dapat diketuk membuka menu Kas, daftar maksimal 5 joki berjalan berstatus diproses dengan progress bar CSS dan tautan lihat semua, total dan rincian bagi hasil partner yang belum dibayar, serta tombol aksi cepat untuk pesanan baru, pemasukan, dan pengeluaran.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - dev/PLANSPEC.md
  - index.html
  - js/app.js
  - sw.js
- Catatan: Dashboard hanya membaca data lokal tanpa timer atau polling; penanda bagi hasil sudah dibayar menggunakan field partnerPaid yang sudah ada di IndexedDB; cache service worker dinaikkan ke shugen-v26.


### #028 [2026-10-14] Implementasi Fitur 18 (Template WA Konfirmasi Payout)
- Fitur: Template WA konfirmasi payout ke partner
- Ringkasan: Menambahkan template WhatsApp baru "Konfirmasi payout" ke dalam pengaturan template WA yang sudah ada dengan teks bawaan untuk mengonfirmasi transfer bagi hasil partner. Nilai [Nama Partner], [ID Pesanan], dan [Nominal] (diformat Rupiah) otomatis terisi dari data pesanan dan bagian partner serta template dapat diedit atau dikembalikan ke teks bawaan. Tombol "Kirim Konfirmasi Payout" disediakan pada area status bayar ke partner di detail pesanan, membuka dialog pesan WhatsApp dengan tab payout aktif, menampilkan nomor partner atau tombol salin pesan jika nomor tidak tersedia, dan cache service worker dinaikkan ke shugen-v25.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - dev/PLANSPEC.md
  - index.html
  - js/app.js
  - sw.js
- Catatan: Mendukung placeholder format kurung siku maupun kurung kurawal; tab payout di dialog WA otomatis disembunyikan untuk pesanan tanpa partner; tidak ada perubahan skema data partner atau struktur bagi hasil; cache service worker dinaikkan ke shugen-v25.

### #027 [2026-10-14] Implementasi Fitur 17 (Rekening / E-Wallet Partner)
- Fitur: Rekening / e-wallet partner + tombol salin
- Ringkasan: Menambahkan tiga field opsional di data partner (nama bank / e-wallet, nomor rekening / e-wallet, dan atas nama) yang disimpan sebagai string di IndexedDB agar angka 0 di depan tetap utuh dan partner lama tetap berfungsi normal. Field ini tersedia di form tambah dan edit partner, ditampilkan di detail partner serta di bagian bagi hasil pesanan (order share summary) lengkap dengan tombol 'Salin Nomor Rekening' untuk menyalin nomor saja ke clipboard dalam satu ketukan dengan notifikasi singkat dan nomor tetap dapat diseleksi manual jika clipboard tidak tersedia. Seluruh data rekening ikut dalam alur backup/restore dan terhapus pada aksi hapus semua data, data dummy portofolio diperbarui menggunakan nomor rekening dan identitas fiktif tanpa mengekspos data riil ke repo, dan cache service worker dinaikkan ke shugen-v24.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - dev/PLANSPEC.md
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: Mendukung pencarian dan update partner baik lewat ID integer maupun partnerId string; tombol salin nomor rekening hanya muncul jika nomor rekening terisi; versi cache service worker dinaikkan ke shugen-v24.

### #026 [2026-10-14] Implementasi Fitur 16 (Hapus semua data)
- Fitur: Hapus semua data
- Ringkasan: Menambahkan bagian 'Hapus Semua Data' di Pengaturan untuk mengosongkan seluruh data operasional toko di IndexedDB perangkat dalam sekali aksi secara aman. Dialog konfirmasi menyajikan perbandingan jumlah data saat ini per jenis ke 0 (pesanan, pelanggan, partner, pemasukan, pengeluaran, invoice, game, katalog, progress, kategori, metode pembayaran, template pesan, dan kas toko), mewajibkan pemakai mengetik kata 'HAPUS' untuk mengaktifkan tombol konfirmasi, serta secara otomatis mengunduh file backup (fitur 12c) sebelum penghapusan dieksekusi. Jika pengunduhan backup otomatis gagal, tindakan penghapusan langsung dibatalkan; setelah penghapusan berhasil, preferensi tema tampilan (gelap/terang) tetap dipertahankan, aplikasi kembali ke keadaan kosong awal, dan ditampilkan pesan notifikasi bahwa semua data sudah dihapus.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - dev/PLANSPEC.md
  - index.html
  - js/app.js
  - js/db.js
  - sw.js
- Catatan: Pilihan tema tampilan tetap dipertahankan di object store settings; backup otomatis diunduh dengan awalan 'shugen-backup-sebelum-hapus-'; versi cache service worker dinaikkan ke shugen-v23.

### #025 [2026-10-14] Implementasi Fitur 11 (Katalog harga)
- Fitur: Katalog harga
- Ringkasan: Menambahkan fitur pengelolaan katalog harga layanan di Pengaturan yang dikelompokkan per game (nama layanan, jenis joki atau topup, game dari kategori game, dan harga saran dalam Rupiah) dengan dukungan tambah, ubah, dan hapus item. Pada form pesanan, ditambahkan opsi dropdown "Ambil dari katalog" sesuai game yang dipilih untuk mengisi otomatis nama layanan, harga, dan jenis pesanan tanpa mengunci nilai tersebut serta pesanan tetap dapat dibuat manual tanpa katalog. Data katalog disimpan di IndexedDB versi 10 dengan ID unik CTL-YYMMDD-XXXX, diikutsertakan dalam backup dan restore (lengkap dengan pratinjau dan perbandingan jumlah data pada dialog import), dilengkapi data dummy 11 item katalog untuk demo portofolio, dan cache service worker dinaikkan ke shugen-v22.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - dev/PLANSPEC.md
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: Skema IndexedDB dinaikkan ke versi 10 dengan penambahan object store "catalog"; pesanan menyimpan salinan independen nama dan harga sehingga perubahan atau penghapusan item katalog tidak mempengaruhi pesanan yang sudah ada; penghapusan kategori game dicegah jika masih digunakan oleh item katalog; cache service worker dinaikkan ke shugen-v22.

### #024 [2026-10-14] Implementasi Fitur 9 (Daftar penjoki/partner dan bagi hasil per pesanan)
- Fitur: Daftar penjoki/partner dan bagi hasil per pesanan
- Ringkasan: Menambahkan menu mandiri "Partner" untuk mengelola data penjoki/partner (nama unik, nomor HP opsional, catatan, dan pengaturan bagi hasil bawaan mode persen atau nominal tetap dengan ID acak PRT-YYMMDD-XXXX). Di form dan detail pesanan, pengguna dapat memilih satu partner opsional serta mengatur bagi hasil per pesanan dengan kalkulasi otomatis bagian partner dan toko sesuai harga total pesanan serta validasi batas nilai. Status bayar ke partner ("Belum dibayar" / "Sudah dibayar") dapat ditandai atau dibatalkan khusus untuk pesanan berstatus Selesai, termasuk fitur tandai semua siap bayar sekaligus dari detail partner dengan dialog konfirmasi nominal dan jumlah pesanan. Data partner dan status bagi hasil tetap bersifat internal tanpa bocor ke invoice/WA pelanggan, IndexedDB dinaikkan ke versi 9 dengan migrasi aman, alur backup/restore dan dialog perbandingan diperbarui menyertakan jumlah partner, data dummy dilengkapi 5 partner (termasuk 1 nonaktif), dan cache service worker dinaikkan ke shugen-v21.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - dev/PLANSPEC.md
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: Skema IndexedDB dinaikkan ke versi 9 dengan penambahan object store "partners" dan indeks "partnerId" pada "orders"; data partner dan bagi hasil murni internal untuk tim toko; pembedaan status bayar partner menggunakan teks dan monokrom tanpa menambah warna status baru sesuai dev/DESIGN.md; versi cache service worker dinaikkan ke shugen-v21.

### #023 [2026-10-14] Implementasi Fitur 10 (Deadline pesanan dan pengingat)
- Fitur: Deadline pesanan dan pengingat
- Ringkasan: Menambahkan field deadline opsional (tanggal wajib jika diisi, jam opsional) pada pesanan yang dapat diisi saat pembuatan serta diubah atau dihapus melalui detail pesanan, lengkap dengan penandaan tingkat urgensi (Terlambat, Hari ini, Besok, atau tanggal lainnya) yang disajikan lewat penekanan tipografi tanpa menambah warna baru sesuai dev/DESIGN.md. Di atas daftar pesanan kini terdapat ringkasan satu baris ("N pesanan terlambat, M deadline hari ini") yang dapat diketuk untuk memfilter pesanan yang perlu perhatian, pilihan pengurutan "Deadline terdekat" dengan pesanan tanpa deadline di paling bawah, serta pengingat notifikasi browser opsional di Pengaturan untuk pesanan yang mendekati 1 jam atau terlambat. Data contoh (dummy) diperbarui dengan variasi lengkap status deadline, spek fitur 10 disalin ke dev/PLANSPEC.md dan dicentang di dev/PLAN.md, serta versi cache service worker dinaikkan ke shugen-v20.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - dev/PLANSPEC.md
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: Skema IndexedDB tetap pada versi 8 tanpa perubahan skema; pelacakan notifikasi yang sudah diingatkan disimpan lokal per perangkat di localStorage sehingga tidak membebani alur backup; versi cache service worker dinaikkan ke shugen-v20.

### #022 [2026-10-14] Implementasi Fitur 7 (Template pesan WA)
- Fitur: Template pesan WA (konfirmasi, update progress, selesai)
- Ringkasan: Menambahkan fitur pengelolaan dan pengiriman template pesan WhatsApp (Konfirmasi, Update progress, dan Selesai) yang dapat diakses langsung dari detail pesanan dengan saran otomatis sesuai status pesanan serta pratinjau pesan sebelum dikirim. Tim toko dapat melakukan aksi salin pesan atau buka langsung ke WhatsApp (wa.me) apabila data pelanggan memiliki nomor telepon valid, serta mengatur dan mengembalikan teks template ke bawaan melalui menu Pengaturan. Template disimpan lokal di IndexedDB dan otomatis tercakup dalam alur backup dan restore, spek fitur disalin ke dev/PLANSPEC.md, serta cache service worker dinaikkan ke shugen-v19.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - dev/PLANSPEC.md
  - index.html
  - js/app.js
  - js/db.js
  - sw.js
- Catatan: Placeholder {layanan} tidak dibuat karena data entitas layanan belum tersedia di aplikasi dan berada di cakupan Fitur 11 (Katalog harga); skema IndexedDB tetap pada versi 8 tanpa penambahan store baru; versi cache service worker dinaikkan ke shugen-v19.

### #021 [2026-10-14] Pindah spek fitur selesai ke PLANSPEC.md dan tambah aturan baca spek
- Fitur: Perapian dokumen (bukan fitur aplikasi)
- Ringkasan: Memindahkan seluruh spesifikasi detail fitur yang telah selesai dari dev/PLAN.md ke file baru dev/PLANSPEC.md dengan urutan dan isi yang sama persis tanpa mengubah checklist maupun aturan umum di PLAN.md. Menambahkan baris penunjuk lokasi spek lengkap di bawah judul checklist dev/PLAN.md, serta mendaftarkan dev/PLANSPEC.md ke daftar file panduan dev/RULES.md. Menambahkan aturan nomor 11 dan 12 pada Aturan kerja di dev/RULES.md mengenai batasan pembacaan spek fitur fokus dan prosedur pemindahan spek setelah fitur selesai, serta memperbarui aturan nomor 4.
- File diubah:
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - dev/PLANSPEC.md
  - dev/RULES.md
- Catatan: -

### #020 [2026-10-13] Implementasi Fitur 8 (Rekap harian dan bulanan)
- Fitur: Rekap harian dan bulanan (omzet, pengeluaran, untung bersih)
- Ringkasan: Menambahkan menu navigasi baru "Rekap" dengan dua mode periode Harian dan Bulanan yang menyajikan tiga metrik keuangan utama: omzet, pengeluaran, dan untung bersih tanpa memodifikasi data toko atau skema IndexedDB. Mode Harian menyajikan angka pada tanggal yang dipilih (default hari ini), sedangkan mode Bulanan menyajikan akumulasi bulanan (default bulan ini) beserta daftar rincian per hari yang memiliki transaksi urut tanggal terbaru, format angka rupiah minus yang jelas tanpa mengandalkan warna semata sesuai dev/DESIGN.md, pembaruan checklist dan fokus pengerjaan di PLAN.md ke Fitur 7, serta peningkatan cache service worker ke shugen-v18.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - index.html
  - js/app.js
  - sw.js
- Catatan: Skema IndexedDB tetap pada versi 8 tanpa perubahan; nilai untung bersih negatif ditampilkan menggunakan tanda minus -Rp sesuai dev/DESIGN.md; versi cache service worker dinaikkan ke shugen-v18.

### #019 [2026-10-13] Implementasi Fitur 12d (Perbandingan jumlah data saat import)
- Fitur: Perbandingan jumlah data saat import
- Ringkasan: Menampilkan perbandingan jumlah data di perangkat saat ini dengan data di dalam file backup pada setiap baris ringkasan dialog konfirmasi import (contoh: "8 -> 12 (+4)"), di mana data saat ini dibaca langsung dari IndexedDB saat dialog dibuka. Menyertakan selisih angka secara tekstual saat jumlahnya berbeda tanpa mengandalkan warna semata sesuai dev/DESIGN.md, memperbarui checklist dan penanda fokus pengerjaan di PLAN.md ke Fitur 8, serta menaikkan versi cache service worker ke shugen-v17.
- File diubah:
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - js/app.js
  - sw.js
- Catatan: Skema IndexedDB tetap pada versi 8 tanpa perubahan; alur validasi, Fitur 12c, dan proses import tidak diubah; versi cache service worker dinaikkan ke shugen-v17.

### #018 [2026-10-13] Implementasi Fitur 12c (Backup otomatis sebelum import)
- Fitur: Backup otomatis sebelum import
- Ringkasan: Menambahkan opsi kotak centang "Unduh backup data saat ini dulu" yang tercentang secara default pada dialog pratinjau dan konfirmasi import. Memanfaatkan ulang logika fungsi export untuk secara otomatis mengunduh file backup berformat shugen-backup-sebelum-import-YYYYMMDD-HHMM.json sebelum proses import dijalankan, membatalkan import dan menjaga data tetap utuh jika proses pengunduhan gagal, memperbarui checklist dan fokus pengerjaan di PLAN.md, serta menaikkan versi cache service worker ke shugen-v16.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - index.html
  - js/app.js
  - sw.js
- Catatan: Skema IndexedDB tetap pada versi 8 tanpa perubahan; file backup tidak disimpan di IndexedDB melainkan langsung diunduh ke perangkat; versi cache service worker dinaikkan ke shugen-v16.

### #017 [2026-10-13] Implementasi Fitur 12b (Pratinjau isi backup sebelum import)
- Fitur: Pratinjau isi backup sebelum import
- Ringkasan: Menambahkan dialog pratinjau isi backup sebelum import yang menampilkan waktu export dan rincian jumlah data untuk seluruh object store IndexedDB (pesanan, pelanggan, pemasukan, pengeluaran, invoice, game, progress joki, kategori pengeluaran, metode pembayaran) serta nilai saldo awal kas dan nama toko di atas peringatan penimpaan data. Menambahkan tampilan ukuran file backup dalam KB atau MB pada notifikasi sukses export, memastikan dialog responsif dan ramah perangkat bergerak, memperbarui checklist dan spesifikasi PLAN.md, serta menaikkan versi cache service worker ke shugen-v15.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - index.html
  - js/app.js
  - sw.js
- Catatan: Skema IndexedDB tetap pada versi 8 tanpa perubahan; versi cache service worker dinaikkan ke shugen-v15.

### #016 [2026-10-13] Implementasi Fitur 12 (Backup dan restore manual)
- Fitur: Backup dan restore manual (export/import file)
- Ringkasan: Menambahkan bagian Backup dan Restore di dialog Pengaturan dengan fitur export seluruh object store IndexedDB ke file JSON berformat shugen-backup-YYYYMMDD-HHMM.json dan import file backup dengan validasi ketat (penanda aplikasi shugen-hub, format JSON, dan kecocokan versi skema database). Proses restore dijalankan dalam satu transaksi IndexedDB dengan konfirmasi pengguna serta pemulihan tampilan otomatis ke seluruh menu, pengaman tombol selama operasi berlangsung, dan peningkatan cache service worker ke shugen-v14.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - index.html
  - js/app.js
  - js/db.js
  - sw.js
- Catatan: Versi skema IndexedDB tetap pada versi 8 (tanpa penambahan store baru); versi cache service worker dinaikkan ke shugen-v14.

### #015 [2026-10-13] Implementasi Fitur 14 (Kategori game)
- Fitur: Kategori game (daftar game di Pengaturan, wajib dipilih di form pesanan)
- Ringkasan: Menambahkan pengelolaan kategori game dinamis di Pengaturan (tambah, ganti nama, dan hapus) dengan validasi nama unik tidak peka huruf besar/kecil. Mengubah input game pada form pesanan menjadi dropdown pilihan wajib yang menyimpan ID game (gameId) berformat GAM-YYMMDD-XXXX, memblokir simpan pesanan dan menampilkan peringatan jika daftar game kosong, serta mencegah penghapusan game yang sedang dipakai pesanan. Menampilkan nama game terbaru berdasarkan gameId di daftar pesanan, pencarian pesanan, detail pesanan, invoice, dan riwayat pesanan pelanggan, menaikkan skema IndexedDB ke versi 8 dengan store games, memperbarui data demo di js/dummy.js, dan menaikkan versi cache service worker ke shugen-v13.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: Skema IndexedDB dinaikkan ke versi 8 dengan object store games dan indeks gameId pada orders; format ID game GAM-YYMMDD-XXXX; cache service worker dinaikkan ke shugen-v13.

### #014 [2026-10-13] Rapikan daftar fitur di PLAN.md menjadi checklist prioritas
- Fitur: Persiapan
- Ringkasan: Mengubah daftar fitur di dev/PLAN.md menjadi checklist prioritas yang memisahkan fitur selesai (berdasarkan implementasi di CHANGELOG) dan fitur berikutnya. Memindahkan fokus pengerjaan ke Fitur 12 (Backup dan restore manual).
- File diubah:
  - dev/CHANGELOG.md
  - dev/PLAN.md
- Catatan: -

### #013 [2026-10-13] Implementasi Fitur 6 (Data pelanggan)
- Fitur: Data pelanggan
- Ringkasan: Menambahkan menu Pelanggan berisi daftar pelanggan toko yang diurutkan sesuai abjad, pencarian berdasarkan nama atau kontak, filter Semua atau Langganan saja, tanda langganan, dan tombol toggle status langganan satu tap. Menambahkan tampilan detail pelanggan lengkap dengan ringkasan statistik (jumlah order, total harga order, dan total bayar dari pemasukan tidak termasuk pesanan dibatalkan) serta riwayat pesanan yang dapat dibuka ke detail pesanan, form tambah/edit/hapus pelanggan dengan validasi nama unik dan pengaman tombol, sinkronisasi otomatis nama pelanggan pada pesanan saat nama diganti dalam satu transaksi IndexedDB, serta saran datalist nama pelanggan pada form pesanan tanpa pembuatan otomatis. Memperbarui skema IndexedDB ke versi 7 dengan store `customers`, menambahkan data dummy pelanggan di `js/dummy.js` yang cocok dengan nama pelanggan di pesanan demo, menaikkan cache service worker ke `shugen-v12`, dan memindahkan penanda fokus di `dev/PLAN.md`.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: Skema IndexedDB dinaikkan ke versi 7 dengan object store `customers` secara aman tanpa menghapus data lama, format ID pelanggan menggunakan PLG-YYMMDD-XXXX (4 karakter acak crypto.getRandomValues), dan versi cache service worker dinaikkan ke shugen-v12.

### #012 [2026-10-13] Implementasi Fitur 5 (Invoice)
- Fitur: Invoice
- Ringkasan: Menambahkan pembuatan invoice manual dari detail pesanan dengan nomor unik berformat INV-YYMMDD-XXXX (4 karakter acak crypto.getRandomValues), tampilan invoice dengan data terkini toko dan pesanan serta badge status LUNAS/BELUM LUNAS, tombol cetak atau simpan PDF melalui window.print() dengan CSS print bersih latar putih tanpa library, form edit catatan invoice, tombol hapus invoice tanpa menghapus pesanan, serta sinkronisasi penghapusan invoice saat pesanan dihapus. Menambahkan menu Invoice berisi daftar invoice urut tanggal terbaru dan pencarian nomor invoice atau nama pelanggan, pengaturan nama dan kontak toko di Pengaturan dengan pengaman tombol selama operasi IndexedDB, skema IndexedDB versi 6 dengan object store `invoices`, data contoh invoice di `js/dummy.js`, pembaruan cache service worker ke `shugen-v11`, dan pemindahan penanda fokus di `dev/PLAN.md`.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: Skema IndexedDB dinaikkan ke versi 6 dengan object store `invoices` secara aman tanpa menghapus data lama, nomor invoice menggunakan format INV-YYMMDD-XXXX, dan versi cache service worker dinaikkan ke shugen-v11.

### #011 [2026-10-13] Implementasi Fitur 13 (Kas toko)
- Fitur: Kas toko (saldo gabungan, menu sendiri)
- Ringkasan: Menambahkan menu Kas untuk menampilkan saldo kas saat ini secara otomatis (saldo awal ditambah total pemasukan dikurangi total pengeluaran) yang tidak terpengaruh filter tanggal, input dan penyimpanan saldo awal dengan pengaman tombol selama operasi IndexedDB, serta daftar mutasi gabungan pemasukan dan pengeluaran urut tanggal terbaru dengan filter rentang tanggal. Mengetuk baris mutasi membuka form pemasukan atau pengeluaran aslinya, memigrasi skema IndexedDB ke versi 5 dengan object store `cashSettings`, menambahkan saldo awal contoh di `js/dummy.js`, menaikkan cache service worker ke `shugen-v10`, dan memperbarui penanda fokus di `dev/PLAN.md`.
- File diubah:
  - css/style.css
  - dev/CHANGELOG.md
  - dev/PLAN.md
  - index.html
  - js/app.js
  - js/db.js
  - js/dummy.js
  - sw.js
- Catatan: Skema IndexedDB naik ke versi 5 (`cashSettings` store untuk menyimpan `initialBalance`) secara aman tanpa menghapus data lama, dan versi cache service worker dinaikkan ke shugen-v10.

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