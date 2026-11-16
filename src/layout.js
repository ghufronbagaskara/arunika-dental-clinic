// Data denah Arunika Dental Care.
// Semua ukuran dalam meter. Sumbu x berjalan dari kiri ke kanan, sumbu z dari
// dinding belakang (z = 0) ke fasad depan (z = 15). Pintu masuk utama berada di
// dinding depan dan fasad menghadap +z. Data ini dipakai bersama oleh denah 2D
// (SVG), maket 3D, dan tes `scripts/layout.test.js`.

export const building = { width: 24, depth: 15 }

export const wallSpec = {
  height: 2.8, // tinggi dinding sebenarnya
  cut: 1.6, // tinggi potongan maket (cutaway)
  exterior: 0.2,
  interior: 0.12,
  lead: 0.2, // dinding rontgen berlapis timbal
}

// Sumbu cermin antara Ruang praktik 1 dan Ruang praktik 2 (x' = 17.7 - x).
export const MIRROR_SUM = 17.7

export function mirrorX(x) {
  return MIRROR_SUM - x
}

export function mirrorPoint([x, z]) {
  return [mirrorX(x), z]
}

export const zones = {
  publik: { label: 'Area publik', tint: '#ece3d3' },
  klinis: { label: 'Area klinis', tint: '#dfe9e6' },
  penunjang: { label: 'Penunjang dan staf', tint: '#e6e3dc' },
}

// Ruang: rect = [x, z, lebar (arah x), panjang (arah z)].
// Nomor mengikuti urutan perjalanan pasien, lalu area penunjang.
export const rooms = [
  {
    id: '01',
    key: 'tunggu',
    name: 'Ruang tunggu',
    zone: 'publik',
    rect: [0, 9, 10.5, 6],
    floor: 'terrazzo',
    description: 'Ruang pertama setelah pintu kaca. Dua jendela besar di fasad depan menerima cahaya pagi.',
    equipment: ['7 kursi tunggu', 'Sofa dan meja kopi', 'Layar antrean', 'Dispenser air', 'Hand-rub di pintu masuk', 'Tanaman'],
  },
  {
    id: '02',
    key: 'pendaftaran',
    name: 'Pendaftaran',
    zone: 'publik',
    rect: [10.5, 9, 5.3, 6],
    floor: 'terrazzo',
    description: 'Loket setengah tinggi menghadap ruang tunggu. Petugas melayani registrasi, rekam medis, dan pembayaran.',
    equipment: ['Meja loket', 'Kursi kerja', 'Komputer dan printer', 'Lemari arsip'],
  },
  {
    id: '03',
    key: 'toilet',
    name: 'Toilet',
    zone: 'publik',
    rect: [15.8, 9, 3.7, 6],
    floor: 'tile',
    description: 'Toilet pasien dengan wastafel di dekat pintu dan bilik kloset bersekat.',
    equipment: ['Wastafel dan cermin', 'Kloset duduk', 'Partisi bilik'],
  },
  {
    id: '04',
    key: 'koridor',
    name: 'Koridor',
    zone: 'publik',
    rect: [0, 7, 24, 2],
    floor: 'terrazzo',
    description: 'Koridor lebar 2 m menghubungkan area depan dengan ruang klinis. Papan nama ruang dipasang di samping setiap pintu.',
    equipment: ['Papan nama ruang', 'Tanda radiasi di pintu rontgen'],
  },
  {
    id: '05',
    key: 'praktik-1',
    name: 'Ruang praktik 1',
    zone: 'klinis',
    rect: [0, 0, 6.9, 7],
    floor: 'vinyl',
    description: 'Dental unit di tengah ruang dengan tata letak four-handed dentistry. Instrumen masuk dan keluar lewat jendela pass-through ke sterilisasi.',
    equipment: ['Dental unit dan lampu tindakan', 'Stool operator dan asisten', 'Delivery unit dan suction', 'Kabinet bawah, wastafel kerja, monitor', 'Lemari tinggi', 'Troli kaset instrumen', 'Wastafel cuci tangan dan hand-rub'],
  },
  {
    id: '06',
    key: 'sterilisasi',
    name: 'Sterilisasi',
    zone: 'penunjang',
    rect: [6.9, 0, 3.9, 7],
    floor: 'vinyl',
    description: 'Bangku kerja pulau dengan alur satu arah dari depan ke belakang: terima kotor, cuci, kemas, autoklaf, simpan steril. Sekat kaca memisahkan zona kotor dan bersih.',
    equipment: ['Bak cuci dan ultrasonic cleaner', 'Sekat kaca kotor/bersih', 'Sealer dan pouch', 'Autoklaf', 'Kabinet steril'],
  },
  {
    id: '07',
    key: 'praktik-2',
    name: 'Ruang praktik 2',
    zone: 'klinis',
    rect: [10.8, 0, 6.9, 7],
    floor: 'vinyl',
    description: 'Cermin dari Ruang praktik 1 terhadap dinding sterilisasi, sehingga kedua ruang berbagi satu pusat pemrosesan instrumen.',
    equipment: ['Dental unit dan lampu tindakan', 'Stool operator dan asisten', 'Delivery unit dan suction', 'Kabinet bawah, wastafel kerja, monitor', 'Lemari tinggi', 'Troli kaset instrumen', 'Wastafel cuci tangan dan hand-rub'],
  },
  {
    id: '08',
    key: 'rontgen',
    name: 'Rontgen',
    zone: 'klinis',
    rect: [17.7, 0, 3.5, 7],
    floor: 'vinyl',
    description: 'Dinding 20 cm berlapis timbal. Operator memicu paparan dari balik tabir pelindung.',
    equipment: ['Unit X-ray', 'Kursi pasien', 'Tabir timbal', 'Panel kendali operator', 'Gantungan apron'],
  },
  {
    id: '09',
    key: 'gudang',
    name: 'Gudang bahan dan limbah',
    zone: 'penunjang',
    rect: [21.2, 0, 2.8, 7],
    floor: 'epoxy',
    description: 'Stok bahan habis pakai dan penampungan limbah sementara. Limbah keluar lewat pintu servis belakang, terpisah dari jalur pasien.',
    equipment: ['Rak bahan', 'Tong limbah medis kuning', 'Tong limbah umum', 'Kardus stok'],
  },
  {
    id: '10',
    key: 'staf',
    name: 'Staf dan ganti APD',
    zone: 'penunjang',
    rect: [19.5, 9, 4.5, 6],
    floor: 'wood',
    description: 'Ruang istirahat dan berganti APD. Loker, meja kerja, dan wastafel tersedia sebelum staf masuk ke area klinis.',
    equipment: ['Loker', 'Meja dan kursi', 'Bangku ganti', 'Rak APD', 'Wastafel cuci tangan'],
  },
]

// Dinding: segmen lurus sejajar sumbu. `a` dan `b` adalah titik ujung [x, z].
export const walls = [
  { id: 'luar-belakang', a: [0, 0], b: [24, 0], thickness: wallSpec.exterior, kind: 'exterior' },
  { id: 'luar-depan', a: [0, 15], b: [24, 15], thickness: wallSpec.exterior, kind: 'exterior' },
  { id: 'luar-kiri', a: [0, 0], b: [0, 15], thickness: wallSpec.exterior, kind: 'exterior' },
  { id: 'luar-kanan', a: [24, 0], b: [24, 15], thickness: wallSpec.exterior, kind: 'exterior' },

  { id: 'koridor-belakang-a', a: [0, 7], b: [17.7, 7], thickness: wallSpec.interior, kind: 'interior' },
  { id: 'koridor-belakang-rontgen', a: [17.7, 7], b: [21.2, 7], thickness: wallSpec.lead, kind: 'lead' },
  { id: 'koridor-belakang-b', a: [21.2, 7], b: [24, 7], thickness: wallSpec.interior, kind: 'interior' },
  { id: 'koridor-depan', a: [0, 9], b: [24, 9], thickness: wallSpec.interior, kind: 'interior' },

  { id: 'praktik1-steril', a: [6.9, 0], b: [6.9, 7], thickness: wallSpec.interior, kind: 'interior' },
  { id: 'steril-praktik2', a: [10.8, 0], b: [10.8, 7], thickness: wallSpec.interior, kind: 'interior' },
  { id: 'praktik2-rontgen', a: [17.7, 0], b: [17.7, 7], thickness: wallSpec.lead, kind: 'lead' },
  { id: 'rontgen-gudang', a: [21.2, 0], b: [21.2, 7], thickness: wallSpec.lead, kind: 'lead' },

  { id: 'tunggu-pendaftaran', a: [10.5, 9], b: [10.5, 15], thickness: wallSpec.interior, kind: 'interior' },
  { id: 'pendaftaran-toilet', a: [15.8, 9], b: [15.8, 15], thickness: wallSpec.interior, kind: 'interior' },
  { id: 'toilet-staf', a: [19.5, 9], b: [19.5, 15], thickness: wallSpec.interior, kind: 'interior' },
]

// Jenis bukaan dan ketinggian vertikalnya (sill = ambang bawah, head = ambang atas).
export const openingTypes = {
  'pintu-kaca-ganda': { label: 'Pintu kaca ganda', sill: 0, head: 2.4, passable: true },
  pintu: { label: 'Pintu', sill: 0, head: 2.1, passable: true },
  'pintu-servis': { label: 'Pintu servis', sill: 0, head: 2.1, passable: true },
  bukaan: { label: 'Bukaan tanpa daun pintu', sill: 0, head: 2.4, passable: true },
  jendela: { label: 'Jendela kaca', sill: 0.45, head: 2.5, passable: false },
  loket: { label: 'Loket', sill: 1.05, head: 2.2, passable: false },
  'pass-through': { label: 'Jendela pass-through', sill: 0.95, head: 1.5, passable: false },
}

// Bukaan: start/end adalah koordinat sepanjang dinding (x untuk dinding
// horizontal, z untuk dinding vertikal). `swing` = arah bukaan daun pintu pada
// sumbu tegak lurus dinding (+1 atau -1), `hinge` = sisi engsel.
export const openings = [
  { id: 'pintu-utama', wall: 'luar-depan', start: 4.0, end: 6.2, type: 'pintu-kaca-ganda', swing: -1, hinge: 'both', room: '01' },
  { id: 'jendela-tunggu-kiri', wall: 'luar-depan', start: 0.6, end: 3.4, type: 'jendela' },
  { id: 'jendela-tunggu-kanan', wall: 'luar-depan', start: 6.8, end: 9.9, type: 'jendela' },
  { id: 'pintu-belakang', wall: 'luar-belakang', start: 22.3, end: 23.3, type: 'pintu-servis', swing: -1, hinge: 'end', room: '09' },

  { id: 'pintu-praktik-1', wall: 'koridor-belakang-a', start: 0.85, end: 2.05, type: 'pintu', swing: -1, hinge: 'start', room: '05' },
  { id: 'pintu-sterilisasi', wall: 'koridor-belakang-a', start: 8.15, end: 9.35, type: 'pintu', swing: -1, hinge: 'start', room: '06' },
  { id: 'pintu-praktik-2', wall: 'koridor-belakang-a', start: 15.65, end: 16.85, type: 'pintu', swing: -1, hinge: 'end', room: '07' },
  { id: 'pintu-rontgen', wall: 'koridor-belakang-rontgen', start: 18.7, end: 19.8, type: 'pintu', swing: -1, hinge: 'end', room: '08', radiation: true },
  { id: 'pintu-gudang', wall: 'koridor-belakang-b', start: 21.9, end: 23.0, type: 'pintu', swing: -1, hinge: 'start', room: '09' },

  { id: 'bukaan-tunggu', wall: 'koridor-depan', start: 4.6, end: 7.4, type: 'bukaan', room: '01' },
  { id: 'pintu-pendaftaran', wall: 'koridor-depan', start: 12.3, end: 13.3, type: 'pintu', swing: 1, hinge: 'end', room: '02' },
  { id: 'pintu-toilet', wall: 'koridor-depan', start: 16.5, end: 17.4, type: 'pintu', swing: 1, hinge: 'start', room: '03' },
  { id: 'pintu-staf', wall: 'koridor-depan', start: 21.3, end: 22.3, type: 'pintu', swing: 1, hinge: 'start', room: '10' },

  { id: 'loket-pendaftaran', wall: 'tunggu-pendaftaran', start: 11.3, end: 13.3, type: 'loket' },

  { id: 'pass-bersih-1', wall: 'praktik1-steril', start: 1.3, end: 2.4, type: 'pass-through', side: 'bersih' },
  { id: 'pass-kotor-1', wall: 'praktik1-steril', start: 3.95, end: 5.1, type: 'pass-through', side: 'kotor' },
  { id: 'pass-bersih-2', wall: 'steril-praktik2', start: 1.3, end: 2.4, type: 'pass-through', side: 'bersih' },
  { id: 'pass-kotor-2', wall: 'steril-praktik2', start: 3.95, end: 5.1, type: 'pass-through', side: 'kotor' },
]

// Perabot dan alat. pos = titik pusat [x, z], size = [lebar lokal, kedalaman lokal],
// rot = rotasi (radian) terhadap sumbu y; rot 0 berarti sisi depan alat menghadap +z.
// `stack: true` untuk benda yang berada di atas/menempel pada benda lain (tidak dicek tabrakan).
const HALF_PI = Math.PI / 2

const practiceRoomOne = [
  { type: 'dental-unit', pos: [3.3, 3.0], size: [0.8, 2.3], rot: 0, label: 'Dental unit' },
  { type: 'operating-light', pos: [3.3, 1.95], size: [0.5, 0.3], rot: 0, stack: true },
  { type: 'stool-operator', pos: [2.5, 1.4], size: [0.6, 0.6], rot: 0.7, shape: 'circle', label: 'Operator' },
  { type: 'stool-assistant', pos: [5.2, 2.1], size: [0.45, 0.45], rot: -HALF_PI, shape: 'circle', label: 'Asisten' },
  { type: 'delivery-cart', pos: [2.0, 2.6], size: [0.5, 0.45], rot: HALF_PI },
  { type: 'suction-unit', pos: [4.35, 2.55], size: [0.35, 0.45], rot: -HALF_PI },
  { type: 'counter-sink', pos: [1.725, 0.45], size: [2.55, 0.7], rot: 0, label: 'Kabinet + wastafel kerja' },
  { type: 'monitor', pos: [2.75, 0.32], size: [0.54, 0.18], rot: 0, stack: true },
  { type: 'sharps-bin', pos: [2.25, 0.3], size: [0.25, 0.17], rot: 0, stack: true, elevation: 0.9 },
  { type: 'tall-cabinet', pos: [5.15, 0.42], size: [0.6, 0.58], rot: 0, label: 'Lemari' },
  { type: 'instrument-trolley', pos: [6.3, 3.05], size: [0.76, 0.5], rot: -HALF_PI, label: 'Troli' },
  { type: 'hand-sink', pos: [0.37, 5.5], size: [0.61, 0.51], rot: HALF_PI, label: 'Cuci tangan' },
  { type: 'hand-rub', pos: [2.35, 6.89], size: [0.12, 0.08], rot: Math.PI, stack: true },
]

function mirrorFixture(fixture) {
  const [x, z] = fixture.pos
  return { ...fixture, pos: [mirrorX(x), z], rot: -fixture.rot, mirrored: true }
}

export const fixtures = [
  ...practiceRoomOne.map((fixture) => ({ ...fixture, room: '05' })),
  ...practiceRoomOne.map((fixture) => ({ ...mirrorFixture(fixture), room: '07' })),
  // Figur dokter dan perawat hanya di Ruang praktik 1 (posisi operator dan asisten).
  { room: '05', type: 'person-dentist', pos: [1.95, 1.75], size: [0.79, 0.35], rot: HALF_PI, stack: true },
  { room: '05', type: 'person-nurse', pos: [5.45, 2.8], size: [0.55, 0.35], rot: -HALF_PI, stack: true },

  // Sterilisasi: satu bangku pulau, isinya dibangun dari `sterileStations`.
  { room: '06', type: 'sterile-island', pos: [8.85, 3.25], size: [1.5, 5.5], rot: 0 },

  // Rontgen
  { room: '08', type: 'xray-unit', pos: [19.6, 2.3], size: [0.7, 0.6], rot: 0, label: 'Unit X-ray' },
  { room: '08', type: 'xray-chair', pos: [19.6, 3.6], size: [0.65, 0.7], rot: Math.PI },
  { room: '08', type: 'lead-screen', pos: [20.35, 5.0], size: [1.53, 0.39], rot: 0, label: 'Tabir timbal' },
  { room: '08', type: 'operator-mark', pos: [18.25, 5.75], size: [0.6, 0.6], rot: 0, shape: 'circle', label: 'Operator' },
  { room: '08', type: 'xray-control', pos: [17.86, 5.75], size: [0.3, 0.1], rot: HALF_PI, stack: true },
  { room: '08', type: 'apron-rack', pos: [20.95, 3.0], size: [0.9, 0.3], rot: -HALF_PI },

  // Gudang
  { room: '09', type: 'shelf', pos: [21.6, 2.0], size: [3.6, 0.4], rot: HALF_PI, label: 'Rak bahan' },
  { room: '09', type: 'bin-medical', pos: [23.55, 5.65], size: [0.62, 0.37], rot: -HALF_PI, label: 'Limbah medis' },
  { room: '09', type: 'bin-general', pos: [23.5, 4.95], size: [0.45, 0.45], rot: -HALF_PI },
  { room: '09', type: 'boxes', pos: [23.5, 3.4], size: [1.0, 0.55], rot: -HALF_PI },

  // Ruang tunggu: 7 dudukan (bangku 4 + bangku 3) di depan, pintu tetap bebas.
  { room: '01', type: 'waiting-bench-4', pos: [2.05, 14.3], size: [2.37, 0.61], rot: Math.PI, label: 'Kursi tunggu' },
  { room: '01', type: 'waiting-bench-3', pos: [8.3, 14.3], size: [1.77, 0.61], rot: Math.PI, label: 'Kursi tunggu' },
  { room: '01', type: 'sofa', pos: [0.6, 11.4], size: [2.28, 0.93], rot: HALF_PI, label: 'Sofa' },
  { room: '01', type: 'coffee-table', pos: [1.75, 11.4], size: [0.9, 0.9], rot: 0, shape: 'circle' },
  { room: '01', type: 'person-seated', pos: [2.85, 11.4], size: [0.63, 0.8], rot: -HALF_PI },
  { room: '01', type: 'queue-tv', pos: [2.8, 9.1], size: [1.25, 0.06], rot: 0, stack: true },
  { room: '01', type: 'plant-large', pos: [0.45, 9.5], size: [0.6, 0.6], rot: 0, shape: 'circle' },
  { room: '01', type: 'plant-large', pos: [10.05, 14.55], size: [0.6, 0.6], rot: 0, shape: 'circle' },
  { room: '01', type: 'water-dispenser', pos: [10.19, 9.4], size: [0.31, 0.5], rot: -HALF_PI },
  { room: '01', type: 'hand-rub-stand', pos: [6.45, 14.6], size: [0.46, 0.46], rot: Math.PI, label: 'Hand-rub' },
  { room: '01', type: 'person-standing', pos: [9.75, 12.3], size: [0.54, 0.32], rot: HALF_PI, stack: true },

  // Pendaftaran
  { room: '02', type: 'reception-desk', pos: [11.2, 12.3], size: [2.6, 1.14], rot: -HALF_PI, label: 'Meja loket' },
  { room: '02', type: 'task-chair', pos: [12.15, 12.3], size: [0.67, 0.69], rot: -HALF_PI, shape: 'circle' },
  { room: '02', type: 'person-receptionist', pos: [12.15, 12.3], size: [0.55, 0.78], rot: -HALF_PI, stack: true },
  { room: '02', type: 'monitor', pos: [11.25, 12.1], size: [0.54, 0.18], rot: HALF_PI, stack: true, elevation: 0.75 },
  { room: '02', type: 'keyboard', pos: [11.5, 12.15], size: [0.44, 0.14], rot: HALF_PI, stack: true, elevation: 0.75 },
  { room: '02', type: 'printer', pos: [11.3, 13.2], size: [0.36, 0.34], rot: HALF_PI, stack: true, elevation: 0.75 },
  { room: '02', type: 'file-cabinet', pos: [13.4, 14.62], size: [0.9, 0.51], rot: Math.PI, label: 'Arsip' },
  { room: '02', type: 'bookcase', pos: [14.6, 14.7], size: [0.8, 0.35], rot: Math.PI },
  { room: '02', type: 'plant-small', pos: [15.3, 9.55], size: [0.7, 0.66], rot: 0, shape: 'circle' },

  // Toilet
  { room: '03', type: 'washbasin', pos: [18.8, 9.33], size: [0.61, 0.51], rot: 0, label: 'Wastafel' },
  { room: '03', type: 'mirror', pos: [18.8, 9.075], size: [0.6, 0.02], rot: 0, stack: true, elevation: 1.0 },
  { room: '03', type: 'toilet', pos: [17.65, 14.5], size: [0.43, 0.67], rot: Math.PI, label: 'Kloset' },
  { room: '03', type: 'partition', pos: [16.38, 12.8], size: [1.04, 0.05], rot: 0 },
  { room: '03', type: 'partition', pos: [18.92, 12.8], size: [1.04, 0.05], rot: 0 },

  // Staf dan ganti APD
  { room: '10', type: 'lockers', pos: [23.6, 10.0], size: [1.61, 0.52], rot: -HALF_PI, label: 'Loker' },
  { room: '10', type: 'staff-desk', pos: [21.85, 11.85], size: [0.7, 1.57], rot: HALF_PI, label: 'Meja + kursi' },
  { room: '10', type: 'bench', pos: [21.2, 14.55], size: [1.77, 0.61], rot: Math.PI, label: 'Bangku ganti' },
  { room: '10', type: 'ppe-rack', pos: [23.55, 14.1], size: [1.2, 0.5], rot: -HALF_PI, label: 'Rak APD' },
  { room: '10', type: 'hand-sink', pos: [19.82, 14.0], size: [0.61, 0.51], rot: HALF_PI },
]

// Stasiun bangku sterilisasi, dari depan (kotor) ke belakang (bersih).
// z0..z1 = rentang sepanjang bangku, center = titik pusat stasiun.
export const sterileStations = [
  { id: 'terima', label: 'Terima kotor', side: 'kotor', z: [4.7, 6.0], center: 5.3 },
  { id: 'cuci', label: 'Cuci', side: 'kotor', z: [3.35, 4.7], center: 4.0 },
  { id: 'kemas', label: 'Kemas', side: 'bersih', z: [2.35, 3.35], center: 2.85 },
  { id: 'autoklaf', label: 'Autoklaf', side: 'bersih', z: [1.35, 2.35], center: 1.85 },
  { id: 'simpan', label: 'Simpan steril', side: 'bersih', z: [0.5, 1.35], center: 0.9 },
]
export const sterilePartitionZ = 3.35

// Alur sirkulasi. Titik [x, z]; `level` menentukan tinggi pita di maket 3D:
// 'lantai' untuk orang dan troli limbah, 'meja' untuk baki instrumen.
const dirtyFromPracticeOne = [[6.3, 3.05], [6.3, 4.5], [6.9, 4.5], [8.85, 5.3]]
const sterileToPracticeOne = [[8.85, 1.85], [6.9, 1.85], [6.3, 1.85], [6.3, 2.6]]

export const flows = [
  {
    id: 'pasien',
    label: 'Pasien',
    note: 'Pintu utama, koridor, ke dental unit',
    color: '#3f9d5a',
    level: 'lantai',
    paths: [
      [[5.1, 15.4], [5.1, 8.0], [1.45, 8.0], [1.45, 5.6], [3.3, 5.6], [3.3, 4.5]],
      [[5.7, 15.4], [5.7, 8.4], [16.25, 8.4], [16.25, 5.6], [14.4, 5.6], [14.4, 4.5]],
    ],
  },
  {
    id: 'kotor',
    label: 'Instrumen kotor',
    note: 'Pass-through kotor, cuci, kemas, autoklaf',
    color: '#d5533f',
    level: 'meja',
    paths: [
      [...dirtyFromPracticeOne, [8.85, 4.0], [8.85, 2.85], [8.85, 1.85], [8.85, 0.9]],
      dirtyFromPracticeOne.map(mirrorPoint),
    ],
  },
  {
    id: 'steril',
    label: 'Instrumen steril',
    note: 'Autoklaf lewat pass-through bersih ke troli',
    color: '#2a8c82',
    level: 'meja',
    paths: [sterileToPracticeOne, sterileToPracticeOne.map(mirrorPoint)],
  },
  {
    id: 'limbah',
    label: 'Limbah',
    note: 'Sterilisasi, koridor belakang, gudang, pintu servis',
    color: '#c47a1c',
    level: 'lantai',
    paths: [
      [[8.85, 5.6], [8.85, 7.6], [22.45, 7.6], [22.45, 5.9], [22.8, 5.0], [22.8, -0.6]],
    ],
  },
]

// Zona kerja four-handed dentistry (sistem jam, jam 12 di belakang kepala pasien).
// Sudut jam h diukur searah jarum jam dari arah -z pada tampak atas.
export const workZoneTypes = [
  { id: 'operator', label: 'Operator', from: 7, to: 12, color: '#4f78a8' },
  { id: 'statis', label: 'Statis', from: 12, to: 14, color: '#8f8677' },
  { id: 'asisten', label: 'Asisten', from: 14, to: 16, color: '#8a6cae' },
  { id: 'transfer', label: 'Transfer', from: 16, to: 19, color: '#b39433' },
]

export const workZoneRadius = { patient: 0.5, inner: 0.62, outer: 1.95 }

// Pusat jam = kepala pasien di Ruang praktik 1 dan cerminnya di Ruang praktik 2.
export const workZoneSets = [
  {
    room: '05',
    center: [3.3, 2.15],
    sectors: workZoneTypes.map((zone) => ({ ...zone })),
  },
  {
    room: '07',
    center: mirrorPoint([3.3, 2.15]),
    // Cermin: jam h menjadi 12 - h, sehingga rentang [a, b] menjadi [12 - b, 12 - a].
    sectors: workZoneTypes.map((zone) => ({ ...zone, from: 12 - zone.to, to: 12 - zone.from })),
  },
]

// Arah satuan [x, z] untuk posisi jam tertentu (tampak atas).
export function clockDirection(hour) {
  const angle = hour * Math.PI / 6
  return [Math.sin(angle), -Math.cos(angle)]
}

// --- Fungsi bantu geometri yang dipakai bersama ---

export function wallById(id) {
  return walls.find((wall) => wall.id === id)
}

// Dinding horizontal berjalan sepanjang x (z tetap), vertikal sepanjang z.
export function wallAxis(wall) {
  return wall.a[1] === wall.b[1] ? 'x' : 'z'
}

export function wallRange(wall) {
  const axis = wallAxis(wall)
  const index = axis === 'x' ? 0 : 1
  return [Math.min(wall.a[index], wall.b[index]), Math.max(wall.a[index], wall.b[index])]
}

// Koordinat tetap dinding (z untuk dinding horizontal, x untuk dinding vertikal).
export function wallConstant(wall) {
  return wallAxis(wall) === 'x' ? wall.a[1] : wall.a[0]
}

export function openingsOnWall(wallId) {
  return openings
    .filter((opening) => opening.wall === wallId)
    .sort((first, second) => first.start - second.start)
}

// Kotak pembatas (AABB) perabot, memperhitungkan rotasi kelipatan 90 derajat.
export function fixtureBounds(fixture) {
  const [x, z] = fixture.pos
  const [width, depth] = fixture.size
  const cos = Math.abs(Math.cos(fixture.rot))
  const sin = Math.abs(Math.sin(fixture.rot))
  const spanX = width * cos + depth * sin
  const spanZ = width * sin + depth * cos
  return [x - spanX / 2, z - spanZ / 2, x + spanX / 2, z + spanZ / 2]
}

export function roomById(id) {
  return rooms.find((room) => room.id === id)
}

export function roomAt(x, z) {
  return rooms.find(({ rect: [rx, rz, width, depth] }) => x >= rx && x <= rx + width && z >= rz && z <= rz + depth)
}

export function roomArea(room) {
  return room.rect[2] * room.rect[3]
}

// Rentang dinding padat setinggi penuh (di luar semua bukaan), dalam koordinat sepanjang dinding.
export function solidIntervals(wall) {
  const [start, end] = wallRange(wall)
  const intervals = []
  let cursor = start
  for (const opening of openingsOnWall(wall.id)) {
    if (opening.start > cursor) intervals.push([cursor, opening.start])
    cursor = Math.max(cursor, opening.end)
  }
  if (cursor < end) intervals.push([cursor, end])
  return intervals
}

// Sisi luar dinding eksterior: +1 / -1 pada sumbu tegak lurus, 0 untuk dinding dalam.
export function exteriorSide(wall) {
  if (wall.kind !== 'exterior') return 0
  const constant = wallConstant(wall)
  const middle = wallAxis(wall) === 'x' ? building.depth / 2 : building.width / 2
  return constant > middle ? 1 : -1
}

// Nama pendek dan posisi label ruang [x, z], dipakai denah 2D dan maket 3D.
// Posisi dipilih di area kosong (bukan di atas perabot besar).
export const roomLabels = {
  '01': { short: 'Ruang tunggu', at: [5.3, 12.1] },
  '02': { short: 'Pendaftaran', at: [12.75, 11.0] },
  '03': { short: 'Toilet', at: [17.4, 11.1] },
  '04': { short: 'Koridor', at: [12.0, 8.0] },
  '05': { short: 'Praktik 1', at: [4.55, 5.3] },
  '06': { short: 'Sterilisasi', at: [7.15, 6.45] },
  '07': { short: 'Praktik 2', at: [12.85, 5.3] },
  '08': { short: 'Rontgen', at: [18.2, 0.65] },
  '09': { short: 'Gudang', at: [21.75, 4.5] },
  '10': { short: 'Staf + APD', at: [20.6, 10.1] },
}
