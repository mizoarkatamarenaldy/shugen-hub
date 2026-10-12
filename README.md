# Shugen Hub

Aplikasi web (PWA) untuk membantu operasional Shugen Store, toko jasa joki dan topup game.
Bisa dipasang seperti aplikasi di HP maupun PC, dan tetap jalan tanpa internet.

> Status: dalam pengembangan. Fitur dikerjakan satu per satu.

## Fitur

Fitur inti:
- Pesanan dan status pesanan (ID otomatis)
- Progress joki (checklist dengan persentase)
- Pemasukan
- Pengeluaran
- Invoice

Fitur tambahan yang direncanakan:
- Data pelanggan
- Template pesan WhatsApp
- Rekap harian dan bulanan
- Daftar penjoki dan bagi hasil
- Deadline dan pengingat
- Katalog harga (template, harga tetap bisa diubah per pesanan)
- Backup dan restore manual

Rencana lengkap ada di [dev/PLAN.md](dev/PLAN.md).

## Teknologi

- JavaScript, HTML, dan CSS
- PWA (manifest dan service worker)
- Penyimpanan lokal di perangkat (IndexedDB)
- Sinkron lewat Google Drive

## Privasi data

Repo ini hanya berisi kode.
Data pesanan, data pelanggan, dan backup toko tidak disimpan di sini. Semuanya hanya ada di perangkat pemilik dan Google Drive toko.
Data yang tampil di demo adalah data contoh (dummy).

## Struktur repo

```
shugen-hub/
├── dev/
│   ├── PLAN.md        rencana fitur dan aturan teknis
│   ├── RULES.md       aturan kerja pengembangan
│   └── CHANGELOG.md   riwayat perubahan
├── .gitignore
├── LICENSE
└── README.md
```

## Pengembangan

Proyek ini dikembangkan dengan bantuan AI coding assistant, dengan aturan kerja yang tertulis di [dev/RULES.md](dev/RULES.md). Riwayat perubahan ada di [dev/CHANGELOG.md](dev/CHANGELOG.md).

## Lisensi

MIT. Lihat berkas [LICENSE](LICENSE).