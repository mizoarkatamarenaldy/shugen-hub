# Shugen Hub: Design Direction

## Design Read
Internal operations tool for a game service store team, used on phones during customer chat, in a dense utility style.
Dial: ENERGY 1 / RHYTHM 1 / MOTION 1

## Identitas
Shugen Hub adalah alat operasional internal untuk Shugen Store (jasa joki dan topup game).
Bukan landing page, bukan etalase. Ini adalah tempat kerja.

## Pemakai
Pemilik dan tim toko. Dipakai di HP dengan satu tangan sambil melayani chat pelanggan.
Tidak ada login atau peran. Semua orang melihat dan mengubah data yang sama.
Teks dan label harus jelas untuk pengguna baru.

## Mood
Bersih, padat informasi, serius tapi tidak kaku.

## Tema
Gelap sebagai utama (dipakai sepanjang hari, mengurangi kelelahan mata).
Terang tersedia sebagai opsi.

### Palet gelap
| Token | Hex | Fungsi |
|---|---|---|
| bg | #0F1117 | Latar utama |
| surface | #181A24 | Kartu, dialog |
| surface-raised | #1F2232 | Elemen terangkat |
| border | #2A2D3A | Garis pemisah |
| text | #E4E4E8 | Teks utama |
| text-secondary | #9194A1 | Teks pendukung |
| accent | #2ECC8F | Aksen tunggal (teal-green) |

### Palet terang
| Token | Hex | Fungsi |
|---|---|---|
| bg | #F5F5F7 | Latar utama |
| surface | #FFFFFF | Kartu, dialog |
| surface-raised | #F0F0F2 | Elemen terangkat |
| border | #D8D8DC | Garis pemisah |
| text | #1A1A1E | Teks utama |
| text-secondary | #6B6D78 | Teks pendukung |
| accent | #24A574 | Aksen (lebih gelap untuk kontras pada latar terang) |

### Warna status
Warna DAN label teks, keduanya selalu ditampilkan.
| Status | Hex | Alasan warna |
|---|---|---|
| Menunggu Bayar | #F5A623 | Amber: butuh perhatian, belum dibayar |
| Diproses | #4A9EFF | Biru: sedang berjalan |
| Selesai | #34C759 | Hijau: selesai, positif |
| Dibatalkan | #FF453A | Merah: berhenti, negatif |

## Tipografi
System font stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
Alasan: memuat instan tanpa download font, terlihat native di setiap perangkat, mudah dibaca di ukuran kecil.

## Keputusan desain (R-31)
| Keputusan | Alasan |
|---|---|
| Aksen teal-green | Profesional, bukan generik AI (bukan biru-ungu), kontras bagus di gelap dan terang |
| Border radius 8px kartu, 6px input | Konsisten, tidak pill-shaped, cukup lembut tanpa bulat berlebihan |
| Gelap sebagai default | Dipakai sepanjang hari, mengurangi kelelahan mata, arahan pemilik |
| System font | Native di setiap perangkat, tidak perlu download, mudah dibaca |
| Satu kolom, max-width 640px | Daftar pesanan terbaca paling baik dalam kolom sempit, bahkan di layar lebar |
| Tanpa bayangan pada kartu | Border tipis cukup membedakan kartu dari latar, arahan pemilik |
| Tanpa animasi dekoratif | MOTION 1, alat kerja cepat, arahan pemilik |
| Warna hanya untuk status | Aksen muncul di kontrol interaktif, warna lain hanya di badge status, sisanya monokrom |

## Motif identitas
Badge status berwarna sebagai satu-satunya elemen yang mendapat warna di permukaan kartu monokrom.
Pembatasan ini IS identitasnya: alat yang memakai warna hanya untuk state, bukan dekorasi.

## Hindari
- Gradasi ungu/biru (arahan pemilik)
- Bayangan berlebihan pada kartu (arahan pemilik)
- Emoji sebagai ikon (arahan pemilik)
- Animasi dekoratif (arahan pemilik, MOTION 1)
- Glassmorphism (tidak relevan untuk alat kerja)
