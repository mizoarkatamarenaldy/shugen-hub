# RULES untuk Agy (Antigravity)

File panduan ada di folder dev/: dev/PLAN.md, dev/RULES.md, dev/CHANGELOG.md, dev/DESIGN.md.

## Aturan kerja
1. Satu tugas satu sesi. Kerjakan hanya fitur yang bertanda FOKUS SEKARANG di dev/PLAN.md.
2. Dilarang membuat Implementation Plan. Rencana sudah ada di dev/PLAN.md, ikuti itu.
3. Dilarang menambah fitur, langkah, atau refactor di luar tugas. Kalau punya ide tambahan, tulis di laporan akhir, jangan dikerjakan.
4. Dilarang mengubah dev/PLAN.md, dev/RULES.md, dan dev/DESIGN.md kecuali pemilik yang meminta.
5. Dilarang menambah library atau dependency baru tanpa izin pemilik. Pakai JavaScript, HTML, dan CSS biasa.
6. Kalau instruksi tidak jelas atau bertentangan dengan dev/PLAN.md, berhenti dan tanya pemilik. Jangan menebak.
7. Sebelum commit, jalankan app dan pastikan tidak ada error di console.
8. Jangan pernah menyentuh atau meng-commit data toko, backup, file .env, atau secret apa pun.
9. Semua tampilan baru wajib mengikuti dev/DESIGN.md.
10. Kalau skill antislop dipakai, selalu pilih mode 1 (terapkan selama pengerjaan). Jangan tanya pemilik dan jangan buat audit tambahan.

## Aturan CHANGELOG
1. Setiap tugas selesai = satu entri baru di paling atas bagian Riwayat di dev/CHANGELOG.md.
2. Wajib memakai format entri yang tertulis di bagian "Format entri" pada dev/CHANGELOG.md. Jangan mengubah format itu.
3. Nomor entri baru = nomor entri paling atas saat ini ditambah 1, ditulis 3 digit (001, 002, dst). Nomor tidak pernah di-reset dan tidak boleh dilewati.
4. Tanggal memakai format YYYY-MM-DD.
5. Hash commit tidak ditulis di entri. Hash cukup dilaporkan di akhir sesi.
6. Batas satu file adalah 50 entri. Hitung entri dengan menghitung judul yang diawali "### #" di bagian Riwayat.
7. Kalau dev/CHANGELOG.md sudah berisi 50 entri, lakukan ini sebelum menulis entri baru:
   a. Catat nomor entri paling atas di file lama (misalnya #050).
   b. Cari nomor arsip terkecil yang belum dipakai, dimulai dari 1 (dev/CHANGELOG1.md, dev/CHANGELOG2.md, dan seterusnya).
   c. Jalankan git mv dev/CHANGELOG.md dev/CHANGELOG[nomor].md
   d. Buat dev/CHANGELOG.md baru yang berisi judul, penjelasan, dan bagian "Format entri" yang sama persis dengan file lama, dengan bagian Riwayat kosong.
   e. Tulis entri tugas ini di file baru dengan nomor lanjutan dari langkah a (misalnya #051).
8. File arsip (CHANGELOG1.md dan seterusnya) tidak boleh diedit lagi setelah dipindahkan.

## Aturan git (jalankan setelah tugas selesai)
1. Jalankan git status --short. Kalau ada file yang muncul tapi bukan bagian dari tugas, berhenti: jangan commit, jangan push, laporkan ke pemilik.
2. Tulis entri CHANGELOG sesuai aturan di atas. Daftar file diambil dari git status --short, ditambah dev/CHANGELOG.md sendiri. Kalau terjadi rotasi, sebutkan juga file arsip barunya.
3. Stage file dengan menyebut namanya satu per satu. Dilarang git add -A atau git add .
4. Commit dengan pesan lengkap: judul singkat, isi penjelasan, lalu dua baris trailer di bawah, dipisah satu baris kosong dari isi pesan.
   Co-authored-by: Claude <noreply@anthropic.com>
   Co-authored-by: Gemini (Antigravity) <200291788+gemini-code-assist@users.noreply.github.com>
5. Jalankan git push ke branch yang sedang aktif. Dilarang force push, dilarang membuat atau menghapus branch, dan dilarang mengubah git config.
6. Kalau commit atau push gagal, jangan coba cara lain. Berhenti dan laporkan error-nya ke pemilik.
7. Di akhir, kabari dalam bahasa Indonesia yang singkat: file apa saja yang diubah dan hash commit-nya.