# Arah desain Arunika Dental Care

Papan presentasi arsitektur yang terang dan hangat. Maket menjadi pusat; panel samping berisi kontrol dan indeks ruang.

- **Warna.** Kertas `#f4f1ea`, tinta teal gelap `#12343b`, aksen fajar `#d9793b` (tombol utama, nomor ruang terpilih, penanda cahaya pagi), teal klinis `#2a8c82`. Warna alur: pasien `#3f9d5a`, instrumen kotor `#d5533f`, instrumen steril `#2a8c82`, limbah `#c47a1c` (digelapkan dari `#d98a2b` agar kontras minimal 3:1 terhadap kertas).
- **Huruf.** Satu keluarga variable, Archivo, dengan sumbu lebar: sedikit melebar untuk wordmark dan judul blok, sedikit menyempit untuk catatan kecil. Label dalam huruf kalimat, tanpa huruf kapital semua.
- **Logo.** Setengah matahari terbit dengan lima sinar di atas lengkung senyum. Dipakai sebagai favicon, di panel, di papan nama fasad maket, dan di layar antrean.
- **Maket.** Kamera perspektif lensa panjang (FOV 32°). Material PBR dengan tekstur foto untuk lantai, plester, dan veneer; perabot buatan sendiri memakai kotak berbevel. Satu matahari pagi hangat dari depan-kiri, fill langit lembut, environment map `RoomEnvironment`, tone mapping ACES. Potongan dinding diberi tutup abu netral; dinding rontgen menampilkan garis lapisan timbal.
- **Denah.** Gaya gambar kerja: dinding hitam tinta, dinding timbal diarsir, ayunan pintu putus-putus, jendela garis ganda, pass-through berwarna zona (merah muda kotor, teal bersih). Nomor ruang dalam lingkaran, sama dengan nomor di maket dan daftar.
- **Gerak.** Hanya kamera terbang ke ruang dan garis alur yang mengalir pelan. Keduanya mati jika pengguna memilih `prefers-reduced-motion`.
- **Layar sempit.** Satu kolom: panggung di atas, kontrol di bawah, tombol unduh menempel di bawah layar. Label maket hanya menampilkan nomor.
