// Registry aset 3D dan tekstur. Satu-satunya tempat yang perlu diubah saat
// menukar model atau tekstur. Daftar sumber dan lisensi: ASSETS.md dan
// assets-manifest.json.
//
// Konvensi model setelah transform registry diterapkan:
//   - satuan meter, alas model di y = 0, titik tengah tapak di (0, 0);
//   - sisi depan model menghadap +z lokal. Dental unit: kaki pasien ke +z,
//     kepala ke -z. Kursi: arah duduk menghadap +z.
// Pemuat memusatkan model dan menurunkannya ke lantai secara otomatis,
// jadi `offset` hanya untuk koreksi kecil.
// Urutan transform: rotation (radian, XYZ) → scale / fit → pusatkan → offset.
//
// Kolom:
//   file      jalur relatif terhadap folder public/
//   rotation  [x, y, z] radian untuk memutar model mentah ke konvensi di atas
//   scale     faktor skala seragam (diabaikan jika ada `fit`)
//   fit       { height } atau { length } dalam meter
//   offset    [x, y, z] meter, setelah dipusatkan
//   tier      'core' dimuat sebelum maket tampil; 'detail' (figur manusia,
//             tanaman, aksesori) dimuat sesudahnya agar maket cepat terbuka
//   tint      warna pengganti untuk semua material model (opsional)
//
// Jika sebuah kunci dihapus atau file gagal dimuat, maket memakai model
// prosedural bawaan (furniture.js) atau melewati benda itu.

// Naikkan angka ini jika isi file diganti dengan nama yang sama: Vercel
// menyimpan cache /models dan /textures selama satu tahun.
export const ASSET_VERSION = '2'

const QUARTER = Math.PI / 2

export const models = {
  'dental-unit': { file: 'models/dental-unit.glb', rotation: [0, QUARTER, 0], scale: 1, tier: 'core' },
  'operator-stool': { file: 'models/operator-stool.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'assistant-stool': { file: 'models/assistant-stool.glb', rotation: [0, 0, 0], fit: { height: 0.76 }, tier: 'core' },
  'instrument-trolley': { file: 'models/instrument-trolley.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'tall-cabinet': { file: 'models/tall-cabinet.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  // Satu pintu model terbuka; offset mengembalikan badan lemari ke titik asal.
  'tall-cabinet-closed': { file: 'models/tall-cabinet-closed.glb', rotation: [0, 0, 0], scale: 1, offset: [-0.07, 0, 0.293], tier: 'core' },
  autoclave: { file: 'models/autoclave.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'lead-shield': { file: 'models/lead-shield.glb', rotation: [0, 0, 0], scale: 1, tier: 'core', tint: '#8e9aa3' },
  'sharps-bin': { file: 'models/sharps-bin.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'medical-waste-bin': { file: 'models/medical-waste-bin.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'hand-sanitizer': { file: 'models/hand-sanitizer.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'waiting-chair': { file: 'models/waiting-chair.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  bench: { file: 'models/bench.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  sofa: { file: 'models/sofa.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'coffee-table': { file: 'models/coffee-table.glb', rotation: [0, 0, 0], fit: { length: 0.9 }, tier: 'core' },
  'water-dispenser': { file: 'models/water-dispenser.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'reception-desk': { file: 'models/reception-desk.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'office-chair': { file: 'models/office-chair.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  monitor: { file: 'models/monitor.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  printer: { file: 'models/printer.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'filing-cabinet': { file: 'models/filing-cabinet.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  toilet: { file: 'models/toilet.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'wash-basin': { file: 'models/wash-basin.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  mirror: { file: 'models/mirror.glb', rotation: [0, 0, 0], fit: { height: 0.6 }, tier: 'core' },
  lockers: { file: 'models/lockers.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  table: { file: 'models/table.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'storage-shelf': { file: 'models/storage-shelf.glb', rotation: [0, 0, 0], scale: 1, tier: 'core' },
  'cardboard-boxes': { file: 'models/cardboard-boxes.glb', rotation: [0, 0, 0], scale: 1.2, tier: 'core' },

  // Detail: dimuat setelah maket tampil.
  keyboard: { file: 'models/keyboard.glb', rotation: [0, 0, 0], scale: 1, tier: 'detail' },
  'plant-large': { file: 'models/plant-large.glb', rotation: [0, 0, 0], scale: 1, tier: 'detail' },
  'plant-small': { file: 'models/plant-small.glb', rotation: [0, 0, 0], scale: 1, tier: 'detail' },
  receptionist: { file: 'models/receptionist.glb', rotation: [0, 0, 0], scale: 1, tier: 'detail' },
  'visitor-seated': { file: 'models/visitor-seated.glb', rotation: [0, 0, 0], scale: 1, tier: 'detail' },
  'visitor-standing': { file: 'models/visitor-standing.glb', rotation: [0, 0, 0], scale: 1, tier: 'detail' },
  dentist: { file: 'models/dentist.glb', rotation: [0, -QUARTER, 0], scale: 1, tier: 'detail' },
  nurse: { file: 'models/nurse.glb', rotation: [0, 0, 0], scale: 1, tier: 'detail' },
}

// Tekstur PBR (WebP 1024, tileable). `size` = ukuran satu ulangan dalam meter
// (tileSizeM di manifest). `tint` mengalikan warna diffuse (opsional).
// Jika `map` null, maket membuat tekstur PBR prosedural di kanvas (color + normal + roughness).
export const textures = {
  terrazzo: {
    map: 'textures/floor-terrazzo_diff.webp', normalMap: 'textures/floor-terrazzo_nor.webp',
    roughnessMap: 'textures/floor-terrazzo_rough.webp', size: 1.4,
  },
  // Vinyl medis seamless prosedural 2 m (lebih bersih & realistis untuk ruang tindakan).
  vinyl: { map: null, normalMap: null, roughnessMap: null, size: 2.0 },
  tile: {
    map: 'textures/floor-tile-wet_diff.webp', normalMap: 'textures/floor-tile-wet_nor.webp',
    roughnessMap: 'textures/floor-tile-wet_rough.webp', size: 1.2,
  },
  wood: {
    map: 'textures/floor-wood_diff.webp', normalMap: 'textures/floor-wood_nor.webp',
    roughnessMap: 'textures/floor-wood_rough.webp', size: 1.8,
  },
  // Gudang: beton/epoxy polos prosedural.
  epoxy: { map: null, normalMap: null, roughnessMap: null, size: 2 },
  plaster: {
    map: 'textures/wall-plaster_diff.webp', normalMap: 'textures/wall-plaster_nor.webp',
    roughnessMap: 'textures/wall-plaster_rough.webp', size: 1.5,
  },
  veneer: {
    map: 'textures/wood-veneer_diff.webp', normalMap: 'textures/wood-veneer_nor.webp',
    roughnessMap: 'textures/wood-veneer_rough.webp', size: 0.7,
  },
}

export function assetUrl(path) {
  return import.meta.env.BASE_URL + path + '?v=' + ASSET_VERSION
}

export function hasModel(key) {
  return Boolean(models[key]?.file)
}

export function isDetailModel(key) {
  return models[key]?.tier === 'detail'
}
