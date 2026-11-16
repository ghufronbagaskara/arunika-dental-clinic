# Arunika Dental Care

Denah 2D dan maket 3D interaktif untuk rancangan klinik gigi satu lantai berukuran 24 × 15 m. Nama *arunika* berarti cahaya matahari pagi; fasad depan dengan jendela besar ruang tunggu menghadap arah datangnya cahaya itu.

Fitur:

- **Maket 3D** yang bisa diputar, digeser, dan di-zoom. Ada dua sudut kamera (3/4 dan tampak atas), kamera terbang ke ruang yang dipilih, dan dinding bisa dipotong 1,6 m atau ditampilkan utuh 2,8 m.
- **Denah 2D** (SVG) yang langsung tampil saat halaman dibuka, sebelum maket 3D selesai dimuat.
- **Alur sirkulasi**: pasien, instrumen kotor, instrumen steril, dan limbah. Setiap alur bisa dinyalakan atau dimatikan, dan tampil di denah maupun maket.
- **Zona kerja four-handed dentistry** (operator, statis, asisten, transfer) di kedua ruang praktik.
- **Daftar ruang bernomor** berisi fungsi dan isi alat tiap ruang.
- **Unduh gambar** (PNG) dari tampilan yang sedang aktif.

Ukuran di web bersifat konseptual, bukan gambar konstruksi.

## Menjalankan proyek

Butuh Node.js 22.12 atau lebih baru. Jalankan dari folder ini:

```bash
npm install
npm run dev        # server pengembangan
npm test           # tes data denah (node --test)
npm run build      # build produksi ke dist/
npm run preview    # cek hasil build secara lokal
```

Parameter URL `?kualitas=rendah` memaksa mode ringan (tanpa ambient occlusion, piksel 1×, bayangan 1024). `?kualitas=tinggi` memaksa mode penuh.

## Deploy ke Vercel (Hobby)

1. Push folder ini ke GitHub (boleh sebagai repositori sendiri atau subfolder).
2. Di Vercel, impor repositori dengan preset **Vite**. Jika folder ini berada di dalam repositori yang lebih besar, isi **Root Directory** dengan `arunika-dental-care`.
3. Build command `npm run build`, output `dist`. Keduanya sudah diatur di `vercel.json`.

Tidak ada backend atau variabel lingkungan. `vercel.json` memberi header cache satu tahun untuk `/models/*`, `/textures/*`, dan `/assets/*`. Jika isi sebuah file model atau tekstur diganti dengan nama yang sama, naikkan `ASSET_VERSION` di `src/assets.js` agar browser mengambil versi baru.

## Struktur

| Berkas | Isi |
| --- | --- |
| `src/layout.js` | Satu-satunya sumber data denah: ruang, dinding, bukaan, perabot, alur, zona kerja, label (meter). |
| `src/plan.js` | Denah 2D SVG dari data denah. |
| `src/viewer.js` | Maket 3D: renderer, kamera, kontrol, render sesuai kebutuhan, GTAO, label ruang. Dimuat lazy. |
| `src/architecture.js` | Lantai, dinding berpotongan, kusen, pintu, jendela, pass-through, loket, papan nama. |
| `src/furniture.js` | Perabot dan alat, memakai model GLB dari registry atau versi prosedural berbevel. |
| `src/overlays.js` | Pita alur, sektor zona kerja, sorotan ruang di maket. |
| `src/assets.js` | Registry model dan tekstur (lihat di bawah). |
| `src/loader.js` | Pemuat GLB (meshopt + WebP), normalisasi skala dan posisi. |
| `src/materials.js` | Material PBR dan tekstur lantai/dinding. |
| `src/kit.js` | Primitif berbevel dan penggabungan geometri statis per material. |
| `src/screenshot.js` | Ekspor PNG denah dan maket. |
| `scripts/layout.test.js` | Tes: ruang tidak tumpang tindih, total menutup 24 × 15 m, bukaan berada di dinding, alur hanya lewat bukaan, perabot tidak bertabrakan, praktik 2 cermin praktik 1. |

## Dasar denah

Sumbu x berjalan dari kiri ke kanan dan sumbu z dari dinding belakang (z = 0) ke fasad depan (z = 15). Pintu masuk utama berada di dinding depan.

| No | Ruang | x, z, lebar × panjang (m) |
| --- | --- | --- |
| 01 | Ruang tunggu | 0, 9, 10,5 × 6 |
| 02 | Pendaftaran | 10,5, 9, 5,3 × 6 |
| 03 | Toilet | 15,8, 9, 3,7 × 6 |
| 04 | Koridor | 0, 7, 24 × 2 |
| 05 | Ruang praktik 1 | 0, 0, 6,9 × 7 |
| 06 | Sterilisasi | 6,9, 0, 3,9 × 7 |
| 07 | Ruang praktik 2 (cermin praktik 1, x' = 17,7 − x) | 10,8, 0, 6,9 × 7 |
| 08 | Rontgen (dinding 20 cm berlapis timbal) | 17,7, 0, 3,5 × 7 |
| 09 | Gudang bahan dan limbah | 21,2, 0, 2,8 × 7 |
| 10 | Staf dan ganti APD | 19,5, 9, 4,5 × 6 |

Instrumen kotor masuk ke sterilisasi lewat jendela pass-through kotor, diproses satu arah di bangku pulau (terima, cuci, sekat kaca, kemas, autoklaf, simpan), lalu kembali lewat pass-through bersih. Limbah keluar lewat koridor belakang ke gudang dan pintu servis, terpisah dari jalur pasien.

## Menukar model atau tekstur

Semua aset terdaftar di `src/assets.js`. Untuk menukar model, ganti satu baris:

```js
'dental-unit': { file: 'models/dental-unit.glb', rotation: [0, Math.PI / 2, 0], scale: 1, tier: 'core' },
```

- `file`: jalur di dalam `public/`.
- `rotation`: putar model mentah agar sisi depannya menghadap +z (dental unit: kaki pasien ke +z).
- `scale` atau `fit: { height }` / `fit: { length }` dalam meter.
- `offset`: koreksi posisi kecil setelah model dipusatkan otomatis.
- `tier`: `core` dimuat sebelum maket tampil, `detail` (figur, tanaman) dimuat sesudahnya.
- `tint`: warna pengganti untuk semua material model (dipakai untuk tabir timbal).

Model otomatis dipusatkan dan diletakkan di lantai. Jika kunci dihapus atau file gagal dimuat, maket memakai versi prosedural. Tekstur diatur di objek `textures` pada berkas yang sama (`map`, `normalMap`, `roughnessMap`, `size` = meter per ulangan).

## Performa

- Render hanya saat ada perubahan; tidak ada loop animasi saat diam. Animasi garis alur berhenti sendiri 12 detik setelah interaksi terakhir.
- Bayangan matahari dihitung ulang hanya saat adegan berubah. Peta bayangan 2048 di desktop, 1024 di ponsel.
- Geometri statis (dinding, lantai, perabot buatan sendiri) digabung per material, sehingga jumlah draw call kecil.
- Ambient occlusion (GTAO) hanya di desktop yang mampu dan hanya pada frame diam. Jika frame saat diputar terlalu lambat, resolusi turun ke 1× dan AO dimatikan otomatis.
- Pixel ratio maksimal 2 (1,5 di ponsel). Chunk three.js (sekitar 200 kB gzip) dimuat lazy setelah denah tampil. Figur manusia dan tanaman dimuat pada tahap kedua.

## Aset 3D dan tekstur

Disalin dari `ASSETS.md`; detail teknis per aset ada di `assets-manifest.json`. Model berstatus *fallback* tidak dipakai maket (alat terkait dirakit prosedural), tetapi filenya dibiarkan untuk referensi.

Semua aset berlisensi CC0 1.0 (domain publik; atribusi tidak wajib, dicatat sebagai kesopanan). Ringkasan teknis lengkap per aset ada di `assets-manifest.json`.

Model dikompres meshopt (+ KHR_mesh_quantization) dengan tekstur WebP; `GLTFLoader` perlu `MeshoptDecoder`. Total model 9.9 MB, tekstur 1.39 MB.

### Model (public/models)

| Kunci | Status | Sumber | Pembuat | Lisensi | Ukuran |
|---|---|---|---|---|---|
| dental-unit | baru | www.innerscene.com/tools/library/3d-parts/dental-chair-652b8b58 | Innerscene | CC0 1.0 | 924 KB |
| operator-stool | baru | www.innerscene.com/tools/library/3d-parts/doctor-s-stool-on-castors-8cfa4842 | Innerscene | CC0 1.0 | 40 KB |
| assistant-stool | baru | www.innerscene.com/tools/library/3d-parts/swivel-gas-lift-bar-stool-21384a31 | Innerscene | CC0 1.0 | 77 KB |
| instrument-trolley | baru | www.innerscene.com/tools/library/3d-parts/medical-trolley-with-drawers-7d8a7753 | Innerscene | CC0 1.0 | 37 KB |
| tall-cabinet | baru | www.innerscene.com/tools/library/3d-parts/office-bookcase-tall-800-x-350-x-1900-mm-5feecdf6 | Innerscene | CC0 1.0 | 38 KB |
| tall-cabinet-closed | baru | www.innerscene.com/tools/library/3d-parts/tall-larder-cabinet-600-mm-two-doors-da765f43 | Innerscene | CC0 1.0 | 92 KB |
| autoclave | baru | www.innerscene.com/tools/library/3d-parts/autoclave-6a9820dc | Innerscene | CC0 1.0 | 241 KB |
| lead-shield | baru | www.innerscene.com/tools/library/3d-parts/mobile-privacy-screen-3-panels-ed1dfac2 | Innerscene | CC0 1.0 | 30 KB |
| sharps-bin | baru | www.innerscene.com/tools/library/3d-parts/sharps-disposal-container-b830542c | Innerscene | CC0 1.0 | 26 KB |
| medical-waste-bin | baru | www.innerscene.com/tools/library/3d-parts/sharps-container-and-pedal-waste-bin-ed3a0dd8 | Innerscene | CC0 1.0 | 16 KB |
| hand-sanitizer | baru | www.innerscene.com/tools/library/3d-parts/freestanding-hand-sanitizer-station-e954be27 | Innerscene | CC0 1.0 | 33 KB |
| waiting-chair | baru | www.innerscene.com/tools/library/3d-parts/waiting-room-four-seat-beam-bench-76c5854d | Innerscene | CC0 1.0 | 122 KB |
| bench | baru | www.innerscene.com/tools/library/3d-parts/waiting-room-three-seat-beam-bench-2cad4a64 | Innerscene | CC0 1.0 | 100 KB |
| sofa | baru | www.innerscene.com/tools/library/3d-parts/haven-224-oatmeal-two-seat-sofa-40262c27 | Innerscene | CC0 1.0 | 412 KB |
| armchair | baru | polyhaven.com/a/modern_arm_chair_01 | Vibrant Nordic | CC0 1.0 | 308 KB |
| coffee-table | baru | www.innerscene.com/tools/library/3d-parts/marble-top-round-coffee-table-446df690 | Innerscene | CC0 1.0 | 197 KB |
| plant-large | baru | polyhaven.com/a/potted_plant_01 | Rico Cilliers | CC0 1.0 | 836 KB |
| plant-small | baru | polyhaven.com/a/potted_plant_02 | Rico Cilliers | CC0 1.0 | 322 KB |
| tv | baru | www.innerscene.com/tools/library/3d-parts/flat-screen-tv-55-inch-on-a-pedestal-stand-44fcc478 | Innerscene | CC0 1.0 | 126 KB |
| water-dispenser | baru | www.innerscene.com/tools/library/3d-parts/water-dispenser-f854519e | Innerscene | CC0 1.0 | 300 KB |
| reception-desk | baru | www.innerscene.com/tools/library/3d-parts/curved-reception-desk-ac93e59a | Innerscene | CC0 1.0 | 40 KB |
| office-chair | baru | www.innerscene.com/tools/library/3d-parts/office-task-chair-with-mesh-back-and-armrests-73dc5abe | Innerscene | CC0 1.0 | 128 KB |
| monitor | baru | www.innerscene.com/tools/library/3d-parts/desktop-monitor-24-inch-326dfa17 | Innerscene | CC0 1.0 | 89 KB |
| keyboard | baru | www.innerscene.com/tools/library/3d-parts/full-size-ansi-mechanical-keyboard-with-case-99b91adb | Innerscene | CC0 1.0 | 175 KB |
| printer | baru | www.innerscene.com/tools/library/3d-parts/page-one-laser-printer-242caf15 | Innerscene | CC0 1.0 | 41 KB |
| filing-cabinet | baru | www.innerscene.com/tools/library/3d-parts/two-drawer-lateral-filing-cabinet-157adbfa | Innerscene | CC0 1.0 | 90 KB |
| toilet | baru | www.innerscene.com/tools/library/3d-parts/floating-wc-wall-hung-toilet-1db044d9 | Innerscene | CC0 1.0 | 36 KB |
| wash-basin | baru | www.innerscene.com/tools/library/3d-parts/pedestal-pedestal-washbasin-236263ca | Innerscene | CC0 1.0 | 67 KB |
| mirror | baru | www.innerscene.com/tools/library/3d-parts/round-mirror-original-interior-decor-17db5768 | Innerscene | CC0 1.0 | 19 KB |
| lockers | baru | www.innerscene.com/tools/library/3d-parts/four-compartment-office-locker-bank-e9b274a5 | Innerscene | CC0 1.0 | 86 KB |
| table | baru | www.innerscene.com/tools/library/3d-parts/restaurant-2-top-table-set-49d30711 | Innerscene | CC0 1.0 | 69 KB |
| storage-shelf | baru | www.innerscene.com/tools/library/3d-parts/steel-shelving-unit-900-x-400-x-2000-mm-5-shelves-53bb8e17 | Innerscene | CC0 1.0 | 86 KB |
| cardboard-boxes | baru | polyhaven.com/a/cardboard_box_01 | Rahul Chaudhary | CC0 1.0 | 310 KB |
| receptionist | baru | www.innerscene.com/tools/library/3d-parts/seated-office-figure-79182d38 | Innerscene | CC0 1.0 | 557 KB |
| visitor-seated | baru | www.innerscene.com/tools/library/3d-parts/rowan-3d-person-older-adult-seated-reading-9d81f2cd | Innerscene | CC0 1.0 | 1015 KB |
| visitor-standing | baru | www.innerscene.com/tools/library/3d-parts/riley-3d-person-woman-standing-8d40398f | Innerscene | CC0 1.0 | 635 KB |
| dentist | baru | www.innerscene.com/tools/library/3d-parts/doctor-standing-3d-person-healthcare-247b8838 | Innerscene | CC0 1.0 | 1078 KB |
| nurse | baru | www.innerscene.com/tools/library/3d-parts/alex-3d-person-nurse-standing-d18f2e37 | Innerscene | CC0 1.0 | 773 KB |
| medical-cabinet | fallback | 3dassets.dev/assets/dental-practice-and-surgery-cabinet-run-sink-module-42493004 | 3DAssets.dev (Dental Practice and Surgery) | CC0 1.0 | 30 KB |
| delivery-cart | fallback | 3dassets.dev/assets/dental-practice-and-surgery-delivery-unit-5e9334f5 | 3DAssets.dev (Dental Practice and Surgery) | CC0 1.0 | 42 KB |
| ultrasonic-cleaner | fallback | 3dassets.dev/assets/dental-practice-and-surgery-ultrasonic-cleaner-bath-1c9409ff | 3DAssets.dev (Dental Practice and Surgery) | CC0 1.0 | 21 KB |
| sealer | fallback | 3dassets.dev/assets/dental-practice-and-surgery-sterile-pouch-rack-6c397dee | 3DAssets.dev (Dental Practice and Surgery) | CC0 1.0 | 26 KB |
| xray-unit | fallback | 3dassets.dev/assets/dental-practice-and-surgery-intraoral-xray-arm-7ea56888 | 3DAssets.dev (Dental Practice and Surgery) | CC0 1.0 | 22 KB |

Sumber: Innerscene 3D parts library (https://www.innerscene.com/tools/library/3d-parts/), Poly Haven (https://polyhaven.com), 3DAssets.dev (https://3dassets.dev, paket Dental Practice and Surgery, dipakai sebagai fallback dari proyek lama).

### Tekstur PBR (public/textures)

| Kunci | Sumber | Pembuat | Lisensi | Ukuran (3 peta) |
|---|---|---|---|---|
| floor-terrazzo | ambientcg.com/a/Terrazzo004 | ambientCG | CC0 1.0 | 322 KB |
| floor-vinyl | ambientcg.com/a/Tiles036 | ambientCG | CC0 1.0 | 57 KB |
| floor-tile-wet | ambientcg.com/a/Tiles040 | ambientCG | CC0 1.0 | 399 KB |
| wall-plaster | ambientcg.com/a/PaintedPlaster017 | ambientCG | CC0 1.0 | 189 KB |
| floor-wood | polyhaven.com/a/laminate_floor_02 | Dario Barresi, Charlotte Baglioni (Poly Haven) | CC0 1.0 | 231 KB |
| wood-veneer | polyhaven.com/a/white_oak_veneer | Jenelle van Heerden (Poly Haven) | CC0 1.0 | 157 KB |

Setiap tekstur punya tiga file: `_diff.webp`, `_nor.webp` (OpenGL), `_rough.webp`. Sumber tekstur: ambientCG (https://ambientcg.com) dan Poly Haven.
