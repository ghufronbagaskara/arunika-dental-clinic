// Perabot dan alat klinik. Setiap pembangun bekerja di koordinat lokal:
// pusat tapak di (0, 0), sisi depan menghadap +z, satuan meter.
// Jika model GLB tersedia di registry, dipakai penanda aset; jika tidak,
// dibangun versi prosedural berbevel.
import * as T from 'three'
import { isDetailModel } from './assets.js'
import { fixtures, sterilePartitionZ, sterileStations } from './layout.js'
import { assetMarker, bar, box, cylinder, ellipsoid, group, torus } from './kit.js'

const TAU = Math.PI * 2

// Kaki bintang lima beroda (stool dan kursi kerja).
function starBase(parent, M, radius = 0.27, height = 0.08) {
  for (let i = 0; i < 5; i++) {
    const arm = group(parent, 0, 0, 0, i * TAU / 5)
    box(arm, M.chrome, radius / 2, height - 0.03, 0, radius, 0.025, 0.04, 0.01)
    ellipsoid(arm, M.rubber, radius, 0.03, 0, 0.03, 0.03, 0.022, 10)
  }
  cylinder(parent, M.chrome, 0, height - 0.03, 0, 0.05, 0.05, 16)
}

function stool(parent, M, { seatHeight = 0.52, backrest = false, assistant = false }) {
  starBase(parent, M)
  cylinder(parent, M.chrome, 0, 0.1, 0, 0.022, seatHeight - 0.15, 12)
  cylinder(parent, M.charcoal, 0, seatHeight - 0.08, 0, 0.13, 0.02, 20, 0.12)
  cylinder(parent, M.upholstery, 0, seatHeight - 0.06, 0, 0.21, 0.07, 28, 0.2)
  if (backrest) {
    box(parent, M.chrome, 0, seatHeight - 0.05, -0.17, 0.03, 0.22, 0.02)
    box(parent, M.upholstery, 0, seatHeight + 0.14, -0.2, 0.3, 0.16, 0.06, 0.03)
  }
  if (assistant) {
    // Cincin kaki dan sandaran perut asisten.
    torus(parent, M.chrome, 0, 0.3, 0, 0.19, 0.01).rotation.x = Math.PI / 2
    box(parent, M.chrome, 0.14, seatHeight - 0.02, 0, 0.18, 0.025, 0.025)
    box(parent, M.chrome, 0.22, seatHeight - 0.02, 0, 0.025, 0.2, 0.025)
    box(parent, M.upholstery, 0.22, seatHeight + 0.17, 0.06, 0.06, 0.12, 0.3, 0.025).rotation.y = 0.2
  }
}

function proceduralDentalChair(parent, M) {
  // Kaki pasien ke +z, kepala ke -z.
  box(parent, M.plasticWhite, 0, 0, 0.05, 0.62, 0.05, 1.1, 0.02)
  box(parent, M.plasticWhite, 0, 0.05, -0.05, 0.36, 0.38, 0.5, 0.06)
  box(parent, M.upholstery, 0, 0.42, 0.15, 0.6, 0.12, 0.62, 0.05)
  const back = group(parent, 0, 0.5, -0.15)
  back.rotation.x = -1.05
  box(back, M.upholstery, 0, 0, -0.32, 0.56, 0.1, 0.66, 0.05)
  box(back, M.upholstery, 0, 0.02, -0.76, 0.3, 0.09, 0.22, 0.04)
  const legs = group(parent, 0, 0.47, 0.45)
  legs.rotation.x = 0.3
  box(legs, M.upholstery, 0, -0.06, 0.32, 0.5, 0.1, 0.62, 0.05)
  for (const side of [-1, 1]) box(parent, M.plasticWhite, side * 0.33, 0.55, 0.05, 0.08, 0.06, 0.42, 0.03)
  // Unit cuspidor kecil di sisi asisten.
  cylinder(parent, M.plasticWhite, 0.45, 0, -0.15, 0.08, 0.7, 16)
  cylinder(parent, M.ceramic, 0.45, 0.7, -0.15, 0.13, 0.08, 20, 0.15)
}

function operatingLight(parent, M) {
  // Lampu tindakan bertiang di sisi kepala pasien.
  cylinder(parent, M.plasticWhite, -0.55, 0, -0.1, 0.2, 0.04, 24)
  cylinder(parent, M.plasticWhite, -0.55, 0.04, -0.1, 0.035, 1.95, 14)
  bar(parent, M.plasticWhite, -0.28, 1.97, -0.1, 0.56, 0.025)
  const head = group(parent, 0, 1.75, -0.1)
  head.rotation.x = 0.35
  box(head, M.plasticWhite, 0, 0, 0, 0.44, 0.1, 0.2, 0.04)
  box(head, M.chrome, 0, -0.005, 0, 0.38, 0.012, 0.15, 0.005)
  cylinder(parent, M.plasticWhite, 0, 1.84, -0.1, 0.018, 0.13, 10)
}

function deliveryCart(parent, M) {
  starBase(parent, M, 0.22)
  cylinder(parent, M.plasticWhite, 0, 0.08, 0, 0.035, 0.66, 14)
  box(parent, M.plasticWhite, 0, 0.72, 0, 0.48, 0.1, 0.4, 0.04)
  box(parent, M.screen, 0, 0.822, 0.02, 0.38, 0.004, 0.28)
  // Lima handpiece pada dudukan.
  for (let i = 0; i < 5; i++) {
    const handpiece = cylinder(parent, M.charcoal, -0.16 + i * 0.08, 0.77, -0.17, 0.011, 0.16, 8)
    handpiece.rotation.x = -0.35
  }
}

function suctionUnit(parent, M) {
  box(parent, M.plasticWhite, 0, 0, 0, 0.35, 0.72, 0.45, 0.04)
  box(parent, M.plasticGrey, 0, 0.02, 0.226, 0.29, 0.5, 0.004)
  cylinder(parent, M.ceramic, 0, 0.72, 0.03, 0.12, 0.09, 24, 0.15)
  for (const offset of [-0.08, 0.06]) {
    const hose = cylinder(parent, M.charcoal, offset, 0.72, -0.17, 0.012, 0.18, 8)
    hose.rotation.x = 0.4
  }
}

function baseCabinet(parent, M, width, depth, options = {}) {
  const { top = M.solidSurface, front = M.laminate, height = 0.9, drawers = true } = options
  box(parent, M.charcoal, 0, 0, -0.03, width - 0.04, 0.1, depth - 0.1)
  box(parent, M.laminate, 0, 0.1, -0.01, width - 0.02, height - 0.14, depth - 0.04)
  const units = Math.max(1, Math.round(width / 0.5))
  const unit = (width - 0.02) / units
  for (let i = 0; i < units; i++) {
    const x = -width / 2 + 0.01 + unit * (i + 0.5)
    if (drawers && i % 3 === 0) {
      for (let d = 0; d < 3; d++) {
        box(parent, front, x, 0.11 + d * 0.255, depth / 2 - 0.03, unit - 0.006, 0.245, 0.02, 0.004)
        box(parent, M.steel, x, 0.11 + d * 0.255 + 0.2, depth / 2 - 0.012, 0.16, 0.012, 0.016, 0.004)
      }
    } else {
      box(parent, front, x, 0.11, depth / 2 - 0.03, unit - 0.006, height - 0.16, 0.02, 0.004)
      box(parent, M.steel, x + unit / 2 - 0.06, 0.6, depth / 2 - 0.012, 0.014, 0.16, 0.016, 0.004)
    }
  }
  box(parent, top, 0, height - 0.04, 0, width, 0.04, depth, 0.008)
}

function sinkBasin(parent, M, x, z, topHeight = 0.9, width = 0.5, depth = 0.38) {
  box(parent, M.steel, x, topHeight - 0.002, z, width, 0.004, depth, 0.02)
  box(parent, M.charcoal, x, topHeight - 0.0005, z, width - 0.06, 0.002, depth - 0.06, 0.02)
  cylinder(parent, M.chrome, x, topHeight, z - depth / 2 - 0.02, 0.018, 0.3, 12)
  bar(parent, M.chrome, x, topHeight + 0.3, z - depth / 2 + 0.06, 0.16, 0.012, 'z')
}

function counterSink(parent, M, fixture) {
  const [width, depth] = fixture.size
  baseCabinet(parent, M, width, depth)
  sinkBasin(parent, M, -width / 2 + 0.55, 0.02)
  // Dispenser sabun dan tisu menempel dinding.
  box(parent, M.plasticWhite, -width / 2 + 0.95, 1.05, -depth / 2 + 0.03, 0.12, 0.2, 0.08, 0.02)
  box(parent, M.plasticWhite, -width / 2 + 0.15, 1.0, -depth / 2 + 0.04, 0.25, 0.3, 0.1, 0.02)
  // Wadah instrumen kecil di permukaan meja.
  box(parent, M.plasticWhite, 0.3, 0.9, 0.05, 0.26, 0.08, 0.18, 0.02)
  box(parent, M.pouch, 0.65, 0.9, -0.05, 0.22, 0.05, 0.16, 0.01)
}

function tallCabinet(parent, M, fixture) {
  const [width, depth] = fixture.size
  const height = 2.1
  box(parent, M.charcoal, 0, 0, -0.03, width - 0.04, 0.1, depth - 0.1)
  box(parent, M.laminate, 0, 0.1, -0.01, width - 0.02, height - 0.1, depth - 0.04)
  const doors = Math.max(2, Math.round(width / 0.5))
  const door = (width - 0.02) / doors
  for (let i = 0; i < doors; i++) {
    const x = -width / 2 + 0.01 + door * (i + 0.5)
    box(parent, M.laminate, x, 0.11, depth / 2 - 0.03, door - 0.006, 0.78, 0.02, 0.004)
    box(parent, M.laminateWarm, x, 0.9, depth / 2 - 0.03, door - 0.006, height - 0.91, 0.02, 0.004)
    const handleX = x + (i % 2 ? -1 : 1) * (door / 2 - 0.05)
    box(parent, M.steel, handleX, 0.95, depth / 2 - 0.012, 0.014, 0.2, 0.016, 0.004)
  }
}

function instrumentTrolley(parent, M) {
  for (const [x, z] of [[-0.2, -0.27], [0.2, -0.27], [-0.2, 0.27], [0.2, 0.27]]) {
    box(parent, M.steel, x, 0.06, z, 0.02, 0.86, 0.02)
    cylinder(parent, M.rubber, x, 0, z, 0.03, 0.06, 10)
  }
  for (const y of [0.18, 0.52, 0.86]) box(parent, M.brushedSteel, 0, y, 0, 0.44, 0.02, 0.58, 0.006)
  // Kaset instrumen.
  for (let i = 0; i < 3; i++) box(parent, M.plasticGrey, -0.1 + i * 0.1, 0.88, 0.05, 0.08, 0.04, 0.3, 0.008)
  box(parent, M.pouch, 0, 0.54, 0, 0.3, 0.05, 0.4, 0.01)
}

function handSink(parent, M) {
  box(parent, M.ceramic, 0, 0.72, -0.02, 0.5, 0.16, 0.42, 0.06)
  box(parent, M.charcoal, 0, 0.879, 0.0, 0.38, 0.002, 0.28, 0.04)
  box(parent, M.chrome, 0, 0.55, -0.18, 0.06, 0.18, 0.06, 0.02)
  cylinder(parent, M.chrome, 0, 0.88, -0.17, 0.016, 0.24, 12)
  bar(parent, M.chrome, 0, 1.12, -0.11, 0.13, 0.011, 'z')
  box(parent, M.plasticWhite, 0.2, 1.0, -0.2, 0.1, 0.2, 0.06, 0.02)
  box(parent, M.plasticWhite, -0.2, 0.98, -0.2, 0.24, 0.3, 0.08, 0.02)
}

function handRub(parent, M, y = 1.15) {
  box(parent, M.plasticWhite, 0, y, 0, 0.1, 0.22, 0.07, 0.02)
  box(parent, M.chrome, 0, y - 0.02, 0.03, 0.03, 0.02, 0.03, 0.006)
  box(parent, M.accentClean, 0, y + 0.13, 0.036, 0.07, 0.04, 0.002)
}

function monitor(parent, M) {
  box(parent, M.charcoal, 0, 0, -0.02, 0.2, 0.012, 0.15, 0.005)
  box(parent, M.charcoal, 0, 0.012, -0.04, 0.04, 0.2, 0.02)
  box(parent, M.charcoal, 0, 0.12, -0.02, 0.5, 0.3, 0.03, 0.01)
  box(parent, M.screen, 0, 0.14, -0.004, 0.47, 0.26, 0.004)
  box(parent, M.charcoal, 0, 0, 0.17, 0.38, 0.015, 0.13, 0.004)
}

function printer(parent, M) {
  box(parent, M.plasticGrey, 0, 0, 0, 0.4, 0.2, 0.35, 0.02)
  box(parent, M.charcoal, 0, 0.2, -0.02, 0.36, 0.01, 0.28, 0.005)
  box(parent, M.pouch, 0, 0.12, 0.19, 0.22, 0.004, 0.08)
}

// Bangku pulau sterilisasi dengan stasiun dari depan (kotor) ke belakang (bersih).
function sterileIsland(parent, M, fixture, assets) {
  const [width, depth] = fixture.size
  const centerZ = fixture.pos[1]
  const worktop = 0.9
  const local = (worldZ) => worldZ - centerZ
  const benchStart = local(sterileStations.at(-2).z[0])
  const benchEnd = local(sterileStations[0].z[1])
  const benchLength = benchEnd - benchStart
  const benchCenter = (benchStart + benchEnd) / 2

  // Badan kabinet (dibangun miring 90°: panjang bangku di sumbu z lokal).
  const bench = group(parent, 0, 0, benchCenter, Math.PI / 2)
  box(bench, M.charcoal, 0, 0, 0, benchLength - 0.06, 0.1, width - 0.1)
  box(bench, M.laminate, 0, 0.1, 0, benchLength - 0.02, worktop - 0.14, width - 0.04)
  for (const side of [-1, 1]) {
    const units = Math.round(benchLength / 0.55)
    const unit = (benchLength - 0.02) / units
    for (let i = 0; i < units; i++) {
      const x = -benchLength / 2 + 0.01 + unit * (i + 0.5)
      box(bench, M.laminate, x, 0.11, side * (width / 2 - 0.01), unit - 0.006, worktop - 0.16, 0.02, 0.004)
    }
  }
  box(bench, M.brushedSteel, 0, worktop - 0.04, 0, benchLength, 0.04, width, 0.006)

  // Pita warna zona di bawah permukaan kerja.
  for (const station of sterileStations.slice(0, 4)) {
    const accent = station.side === 'kotor' ? M.accentDirty : M.accentClean
    const start = local(station.z[0])
    const end = local(station.z[1])
    for (const side of [-1, 1]) {
      box(parent, accent, side * (width / 2 + 0.004), worktop - 0.07, (start + end) / 2, 0.006, 0.03, end - start - 0.02)
    }
  }

  const stationZ = (id) => local(sterileStations.find((station) => station.id === id).center)

  // Terima kotor: bak plastik berisi kaset kotor.
  box(parent, M.accentDirty, 0, worktop, stationZ('terima') + 0.1, 0.5, 0.12, 0.38, 0.03)
  box(parent, M.plasticGrey, 0.02, worktop + 0.12, stationZ('terima') + 0.1, 0.3, 0.025, 0.24, 0.008)
  box(parent, M.plasticWhite, -0.45, worktop, stationZ('terima') - 0.2, 0.3, 0.1, 0.4, 0.02)

  // Cuci: bak ganda dan ultrasonic cleaner.
  const wash = stationZ('cuci')
  for (const offset of [-0.25, 0.25]) {
    box(parent, M.steel, -0.25, worktop - 0.002, wash + offset, 0.6, 0.004, 0.42, 0.02)
    box(parent, M.charcoal, -0.25, worktop - 0.0005, wash + offset, 0.54, 0.002, 0.36, 0.02)
  }
  cylinder(parent, M.chrome, -0.62, worktop, wash, 0.018, 0.34, 12)
  bar(parent, M.chrome, -0.5, worktop + 0.34, wash, 0.22, 0.012)
  box(parent, M.steel, 0.45, worktop, wash, 0.36, 0.24, 0.3, 0.03)
  box(parent, M.charcoal, 0.45, worktop + 0.24, wash, 0.34, 0.018, 0.28, 0.01)
  box(parent, M.screen, 0.45, worktop + 0.08, wash + 0.152, 0.16, 0.06, 0.004)

  // Sekat kaca pemisah zona kotor dan bersih.
  const partition = local(sterilePartitionZ)
  box(parent, M.aluminium, 0, worktop, partition, width - 0.1, 0.03, 0.04)
  box(parent, M.frostedGlass, 0, worktop + 0.03, partition, width - 0.14, 0.62, 0.012)
  box(parent, M.aluminium, 0, worktop + 0.65, partition, width - 0.1, 0.025, 0.04)
  for (const side of [-1, 1]) box(parent, M.aluminium, side * (width / 2 - 0.07), worktop, partition, 0.03, 0.675, 0.04)

  // Kemas: heat sealer dan rak gulungan pouch.
  const pack = stationZ('kemas')
  box(parent, M.plasticWhite, 0.35, worktop, pack, 0.5, 0.14, 0.24, 0.03)
  box(parent, M.charcoal, 0.35, worktop + 0.14, pack + 0.04, 0.46, 0.02, 0.05, 0.008)
  box(parent, M.brushedSteel, -0.4, worktop, pack, 0.36, 0.02, 0.4)
  for (const offset of [-0.1, 0.02, 0.14]) {
    bar(parent, M.pouch, -0.4, worktop + 0.12, pack + offset, 0.3, 0.05)
  }
  box(parent, M.pouch, 0.0, worktop, pack - 0.2, 0.3, 0.03, 0.2, 0.01)

  // Autoklaf.
  const sterilize = stationZ('autoklaf')
  if (assets.has('autoclave')) {
    assetMarker(parent, 'autoclave', 0, worktop, sterilize, Math.PI / 2)
  } else {
    box(parent, M.plasticWhite, 0, worktop, sterilize, 0.5, 0.42, 0.62, 0.04)
    cylinder(parent, M.steel, 0.25, worktop + 0.21, sterilize, 0.15, 0.02, 24).rotation.z = Math.PI / 2
    box(parent, M.screen, 0.252, worktop + 0.32, sterilize + 0.18, 0.004, 0.06, 0.12)
  }

  // Simpan steril: kabinet tinggi berpintu kaca di ujung belakang.
  const storeStart = local(sterileStations.at(-1).z[0])
  const storeEnd = local(sterileStations.at(-1).z[1])
  const storeDepth = storeEnd - storeStart - 0.02
  const store = group(parent, 0, 0, (storeStart + storeEnd) / 2)
  box(store, M.laminate, 0, 0, 0, width - 0.02, 2.0, storeDepth, 0.01)
  for (const side of [-1, 1]) {
    box(store, M.frostedGlass, side * (width / 2 - 0.008), 0.3, 0, 0.012, 1.6, storeDepth - 0.08)
    for (let shelf = 0; shelf < 4; shelf++) {
      box(store, M.pouch, side * (width / 2 - 0.2), 0.42 + shelf * 0.38, 0, 0.26, 0.08, storeDepth - 0.2, 0.01)
    }
  }
  box(store, M.accentClean, 0, 1.98, 0, width - 0.02, 0.025, storeDepth)
}

function xrayUnit(parent, M) {
  box(parent, M.plasticWhite, 0, 0, 0, 0.6, 0.04, 0.5, 0.015)
  box(parent, M.plasticWhite, 0, 0.04, -0.12, 0.16, 1.85, 0.16, 0.03)
  // Lengan berengsel menuju kepala pasien di depan unit.
  const arm = group(parent, 0, 1.55, -0.12)
  box(arm, M.plasticWhite, 0, 0, 0.35, 0.08, 0.06, 0.7, 0.025)
  const elbow = group(arm, 0, 0, 0.7, 0.5)
  box(elbow, M.plasticWhite, 0, -0.02, 0.25, 0.07, 0.05, 0.5, 0.02)
  const head = group(elbow, 0, -0.08, 0.5)
  box(head, M.plasticWhite, 0, -0.1, 0, 0.16, 0.18, 0.22, 0.04)
  cylinder(head, M.plasticGrey, 0, -0.28, 0.05, 0.035, 0.2, 16, 0.04)
  box(parent, M.screen, 0, 1.2, -0.035, 0.11, 0.07, 0.004)
}

function xrayChair(parent, M) {
  for (const [x, z] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]]) {
    box(parent, M.chrome, x, 0, z, 0.03, 0.44, 0.03)
  }
  box(parent, M.upholstery, 0, 0.42, 0.02, 0.56, 0.08, 0.52, 0.035)
  box(parent, M.upholstery, 0, 0.5, -0.26, 0.52, 0.5, 0.07, 0.03).rotation.x = -0.12
  box(parent, M.chrome, 0, 0.9, -0.3, 0.03, 0.2, 0.03)
  box(parent, M.upholstery, 0, 1.06, -0.28, 0.24, 0.14, 0.08, 0.035)
}

function leadScreen(parent, M) {
  for (const x of [-0.42, 0.42]) {
    box(parent, M.charcoal, x, 0, 0, 0.08, 0.05, 0.45, 0.02)
    cylinder(parent, M.rubber, x, 0, 0.18, 0.03, 0.05, 10)
    cylinder(parent, M.rubber, x, 0, -0.18, 0.03, 0.05, 10)
  }
  box(parent, M.leadPanel, 0, 0.08, 0, 0.98, 1.82, 0.06, 0.015)
  box(parent, M.glass, 0, 1.28, 0, 0.5, 0.35, 0.065)
  box(parent, M.radiation, 0, 0.9, 0.032, 0.18, 0.18, 0.002)
}

function operatorMark(parent, M) {
  const ring = new T.Mesh(new T.RingGeometry(0.24, 0.28, 40), M.radiation)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.003
  parent.add(ring)
  for (const side of [-1, 1]) {
    box(parent, M.radiation, side * 0.07, 0, 0.02, 0.07, 0.003, 0.16, 0.03)
  }
}

function xrayControl(parent, M) {
  box(parent, M.plasticWhite, 0, 1.2, 0, 0.26, 0.32, 0.06, 0.015)
  box(parent, M.screen, 0, 1.33, 0.032, 0.18, 0.09, 0.003)
  cylinder(parent, M.charcoal, 0, 1.24, 0.035, 0.022, 0.02, 12).rotation.x = Math.PI / 2
}

function apronRack(parent, M) {
  box(parent, M.chrome, 0, 1.45, -0.1, 0.85, 0.04, 0.06, 0.01)
  for (const [index, offset] of [-0.22, 0.22].entries()) {
    box(parent, M.chrome, offset, 1.38, -0.04, 0.03, 0.08, 0.1)
    const apron = index === 0 ? M.upholstery : M.plasticGrey
    box(parent, apron, offset, 0.62, 0.02, 0.36, 0.78, 0.04, 0.02)
  }
}

function shelf(parent, M, fixture) {
  const [length, depth] = fixture.size
  const height = 2.0
  const random = createRandom(fixture.pos[0] * 13 + fixture.pos[1])
  for (const x of [-length / 2 + 0.02, -length / 6, length / 6, length / 2 - 0.02]) {
    for (const z of [-depth / 2 + 0.02, depth / 2 - 0.02]) box(parent, M.powderCoat, x, 0, z, 0.03, height, 0.03)
  }
  for (let level = 0; level < 5; level++) {
    const y = 0.12 + level * 0.45
    box(parent, M.powderCoat, 0, y, 0, length, 0.025, depth, 0.004)
    if (level === 4) continue
    let cursor = -length / 2 + 0.08
    while (cursor < length / 2 - 0.3) {
      const width = 0.22 + random() * 0.28
      const tall = 0.15 + random() * 0.2
      const material = random() > 0.45 ? M.cardboard : random() > 0.5 ? M.plasticWhite : M.accentClean
      box(parent, material, cursor + width / 2, y + 0.025, -0.02, width - 0.02, tall, depth - 0.12, 0.01)
      cursor += width + 0.03
    }
  }
}

function bin(parent, M, material) {
  box(parent, material, 0, 0.02, 0, 0.4, 0.62, 0.4, 0.05)
  box(parent, material, 0, 0.64, 0, 0.42, 0.04, 0.42, 0.02)
  box(parent, M.charcoal, 0, 0, 0.2, 0.18, 0.03, 0.06, 0.01)
}

function boxes(parent, M) {
  box(parent, M.cardboard, 0, 0, 0, 0.5, 0.4, 0.5, 0.01)
  box(parent, M.cardboard, 0.01, 0.4, 0.02, 0.44, 0.34, 0.42, 0.01).rotation.y = 0.08
  box(parent, M.cardboard, 0, 0, -0.27, 0.45, 0.32, 0.4, 0.01)
}

function waitingChair(parent, M) {
  for (const [x, z] of [[-0.24, -0.22], [0.24, -0.22], [-0.24, 0.24], [0.24, 0.24]]) {
    box(parent, M.oak, x, 0, z, 0.035, 0.42, 0.035, 0.01)
  }
  box(parent, M.upholsterySand, 0, 0.4, 0.02, 0.56, 0.08, 0.54, 0.035)
  const back = group(parent, 0, 0.46, -0.25)
  back.rotation.x = -0.12
  box(back, M.upholsterySand, 0, 0, 0, 0.54, 0.42, 0.07, 0.03)
}

function sofa(parent, M, fixture) {
  const [width, depth] = fixture.size
  box(parent, M.walnut, 0, 0, 0, width - 0.1, 0.08, depth - 0.15, 0.01)
  box(parent, M.upholsterySand, 0, 0.08, 0.02, width, 0.3, depth - 0.05, 0.05)
  box(parent, M.upholsterySand, 0, 0.36, -depth / 2 + 0.11, width, 0.42, 0.2, 0.06)
  for (const side of [-1, 1]) box(parent, M.upholsterySand, side * (width / 2 - 0.08), 0.36, 0.02, 0.16, 0.2, depth - 0.05, 0.05)
  for (const side of [-1, 1]) box(parent, M.upholsterySand, side * width / 4.4, 0.36, 0.06, width / 2 - 0.2, 0.12, depth - 0.3, 0.05)
}

function coffeeTable(parent, M, fixture) {
  const [width, depth] = fixture.size
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    box(parent, M.oak, x * (width / 2 - 0.06), 0, z * (depth / 2 - 0.06), 0.035, 0.4, 0.035, 0.01)
  }
  box(parent, M.oak, 0, 0.4, 0, width, 0.03, depth, 0.012)
  box(parent, M.pouch, 0.15, 0.43, 0.05, 0.22, 0.012, 0.3, 0.004)
}

function queueDisplay() {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const ctx = canvas.getContext('2d')
  const font = '"Archivo", "Segoe UI", Arial, sans-serif'
  ctx.fillStyle = '#12343b'
  ctx.fillRect(0, 0, 640, 360)
  ctx.fillStyle = '#1b4a52'
  ctx.fillRect(0, 0, 640, 62)
  ctx.fillStyle = '#f4f1ea'
  ctx.font = '600 28px ' + font
  ctx.textBaseline = 'middle'
  ctx.fillText('Arunika Dental Care', 28, 32)
  ctx.fillStyle = '#9fd0c7'
  ctx.font = '500 22px ' + font
  ctx.fillText('Nomor dipanggil', 28, 110)
  ctx.fillStyle = '#f4f1ea'
  ctx.font = '700 120px ' + font
  ctx.fillText('A-07', 24, 200)
  ctx.fillStyle = '#f0b48a'
  ctx.font = '600 30px ' + font
  ctx.fillText('Ruang praktik 1', 28, 290)
  ctx.fillStyle = '#1b4a52'
  ctx.fillRect(400, 86, 214, 246)
  ctx.fillStyle = '#9fd0c7'
  ctx.font = '500 20px ' + font
  ctx.fillText('Berikutnya', 422, 116)
  ctx.fillStyle = '#f4f1ea'
  ctx.font = '600 44px ' + font
  ctx.fillText('A-08', 422, 180)
  ctx.fillText('A-09', 422, 250)
  const texture = new T.CanvasTexture(canvas)
  texture.colorSpace = T.SRGBColorSpace
  texture.anisotropy = 4
  const material = new T.MeshBasicMaterial({ map: texture, toneMapped: false })
  material.name = 'layar-antrean'
  return material
}

function queueTv(parent, M, displayMaterial) {
  box(parent, M.charcoal, 0, 0.82, -0.01, 1.25, 0.72, 0.04, 0.01)
  const screen = new T.Mesh(new T.PlaneGeometry(1.2, 0.675), displayMaterial)
  screen.position.set(0, 0.82 + 0.36, 0.012)
  parent.add(screen)
}

function plant(parent, M, seed) {
  const random = createRandom(seed)
  cylinder(parent, M.pot, 0, 0, 0, 0.17, 0.42, 24, 0.21)
  cylinder(parent, M.soil, 0, 0.39, 0, 0.19, 0.02, 20)
  for (let i = 0; i < 26; i++) {
    const angle = i * 2.39996 + random() * 0.4
    const tilt = 0.35 + random() * 0.75
    const length = 0.28 + random() * 0.22
    const leaf = group(parent, 0, 0.4, 0, angle)
    const blade = group(leaf, 0, 0, 0)
    blade.rotation.z = tilt
    const material = i % 3 === 0 ? M.leafLight : M.leaf
    cylinder(blade, M.leaf, 0, 0, 0, 0.006, length * 0.6, 5)
    ellipsoid(blade, material, 0, length * 0.75, 0, 0.055, length * 0.42, 0.012, 10)
  }
}

function waterDispenser(parent, M) {
  box(parent, M.plasticWhite, 0, 0, 0, 0.32, 1.0, 0.32, 0.03)
  box(parent, M.charcoal, 0, 0.62, 0.155, 0.22, 0.2, 0.02, 0.01)
  for (const x of [-0.05, 0.05]) box(parent, M.plasticGrey, x, 0.72, 0.17, 0.03, 0.04, 0.04, 0.008)
  cylinder(parent, M.water, 0, 1.0, 0, 0.13, 0.42, 22)
  cylinder(parent, M.water, 0, 1.42, 0, 0.04, 0.05, 12, 0.03)
}

function handRubStand(parent, M) {
  cylinder(parent, M.charcoal, 0, 0, 0, 0.15, 0.02, 24)
  cylinder(parent, M.brushedSteel, 0, 0.02, 0, 0.018, 0.98, 12)
  handRub(parent, M, 0.98)
  box(parent, M.brushedSteel, 0, 0.85, -0.02, 0.16, 0.012, 0.12)
}

function receptionDesk(parent, M, fixture) {
  const [width, depth] = fixture.size
  // Meja kerja menghadap +z lokal (ke loket dan ruang tunggu).
  box(parent, M.laminate, -width / 2 + 0.03, 0, 0, 0.04, 0.72, depth - 0.02)
  box(parent, M.laminate, width / 2 - 0.03, 0, 0, 0.04, 0.72, depth - 0.02)
  box(parent, M.laminate, 0, 0.1, depth / 2 - 0.04, width - 0.08, 0.6, 0.02)
  box(parent, M.oak, 0, 0.72, 0, width, 0.035, depth, 0.008)
  // Laci beroda.
  box(parent, M.laminate, width / 2 - 0.35, 0.02, -0.05, 0.42, 0.58, 0.55, 0.01)
  for (let d = 0; d < 3; d++) box(parent, M.steel, width / 2 - 0.35, 0.2 + d * 0.18, -0.33, 0.16, 0.012, 0.012)
  // Keyboard, telepon, dan map.
  box(parent, M.charcoal, 0.15, 0.755, -0.12, 0.42, 0.015, 0.14, 0.004)
  box(parent, M.plasticGrey, -0.55, 0.755, 0.05, 0.18, 0.05, 0.2, 0.02)
  box(parent, M.pouch, 0.65, 0.755, 0.1, 0.24, 0.02, 0.32, 0.004)
}

function taskChair(parent, M) {
  starBase(parent, M, 0.3)
  cylinder(parent, M.chrome, 0, 0.1, 0, 0.025, 0.32, 12)
  box(parent, M.charcoal, 0, 0.42, 0.02, 0.5, 0.08, 0.48, 0.035)
  box(parent, M.charcoal, 0, 0.5, -0.24, 0.46, 0.5, 0.06, 0.03).rotation.x = -0.1
  for (const side of [-1, 1]) box(parent, M.charcoal, side * 0.25, 0.62, 0.02, 0.04, 0.03, 0.3, 0.012)
}

function fileCabinet(parent, M, fixture) {
  const [width, depth] = fixture.size
  box(parent, M.laminateWarm, 0, 0, 0, width, 1.1, depth, 0.01)
  for (let column = 0; column < 2; column++) {
    for (let row = 0; row < 3; row++) {
      const x = -width / 4 + column * width / 2
      box(parent, M.laminate, x, 0.05 + row * 0.35, depth / 2, width / 2 - 0.02, 0.33, 0.012, 0.004)
      box(parent, M.steel, x, 0.3 + row * 0.35, depth / 2 + 0.008, 0.16, 0.014, 0.012, 0.004)
    }
  }
  box(parent, M.oak, 0, 1.1, 0, width + 0.02, 0.03, depth + 0.02, 0.006)
}

function washbasin(parent, M) {
  box(parent, M.oak, 0, 0.42, -0.02, 0.6, 0.38, 0.42, 0.012)
  box(parent, M.solidSurface, 0, 0.8, 0, 0.6, 0.05, 0.45, 0.01)
  box(parent, M.ceramic, 0, 0.82, 0.02, 0.42, 0.04, 0.32, 0.04)
  box(parent, M.charcoal, 0, 0.859, 0.02, 0.34, 0.002, 0.24, 0.03)
  cylinder(parent, M.chrome, 0, 0.85, -0.17, 0.015, 0.2, 12)
  bar(parent, M.chrome, 0, 1.05, -0.12, 0.1, 0.01, 'z')
}

function mirror(parent, M) {
  box(parent, M.mirror, 0, 1.0, 0, 0.56, 0.55, 0.012, 0.004)
}

function proceduralToilet(parent, M) {
  box(parent, M.ceramic, 0, 0, -0.27, 0.36, 0.78, 0.16, 0.04)
  box(parent, M.ceramic, 0, 0.0, 0.03, 0.3, 0.38, 0.44, 0.08)
  box(parent, M.plasticWhite, 0, 0.38, 0.05, 0.38, 0.03, 0.5, 0.1)
  // Pegangan rambat di dinding samping.
  bar(parent, M.chrome, 0.35, 0.72, 0.05, 0.6, 0.016, 'z')
}

function partition(parent, M, fixture) {
  const [width] = fixture.size
  for (const x of [-width / 2 + 0.05, width / 2 - 0.05]) cylinder(parent, M.chrome, x, 0, 0, 0.018, 0.12, 10)
  box(parent, M.laminateWarm, 0, 0.12, 0, width, 1.9, 0.025, 0.006)
  box(parent, M.aluminium, 0, 2.02, 0, width, 0.03, 0.04)
}

function lockers(parent, M, fixture) {
  const [length, depth] = fixture.size
  const columns = 6
  const column = length / columns
  box(parent, M.charcoal, 0, 0, -0.03, length - 0.04, 0.08, depth - 0.1)
  box(parent, M.lockerSage, 0, 0.08, -0.01, length, 1.8, depth - 0.04, 0.008)
  for (let i = 0; i < columns; i++) {
    const x = -length / 2 + column * (i + 0.5)
    for (const [y, h] of [[0.09, 0.88], [0.99, 0.88]]) {
      box(parent, M.lockerSage, x, y, depth / 2 - 0.03, column - 0.012, h - 0.012, 0.02, 0.004)
      for (let slot = 0; slot < 3; slot++) box(parent, M.charcoal, x, y + h - 0.12 - slot * 0.03, depth / 2 - 0.018, column * 0.5, 0.008, 0.004)
      box(parent, M.chrome, x + column / 2 - 0.08, y + h / 2, depth / 2 - 0.012, 0.02, 0.1, 0.02, 0.006)
    }
  }
}

function staffDesk(parent, M, fixture) {
  const [width, depth] = fixture.size
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    box(parent, M.powderCoat, x * (width / 2 - 0.05), 0, z * (depth / 2 - 0.05), 0.04, 0.73, 0.04)
  }
  box(parent, M.oak, 0, 0.73, 0, width, 0.03, depth, 0.008)
  // Laptop terbuka dan gelas.
  const laptop = group(parent, -0.5, 0.76, 0.05)
  box(laptop, M.plasticGrey, 0, 0, 0, 0.34, 0.015, 0.24, 0.006)
  const lid = group(laptop, 0, 0.015, -0.12)
  lid.rotation.x = -0.25
  box(lid, M.plasticGrey, 0, 0, 0, 0.34, 0.22, 0.01, 0.006)
  box(lid, M.screen, 0, 0.012, 0.006, 0.31, 0.19, 0.002)
  cylinder(parent, M.ceramic, 0.45, 0.76, 0.1, 0.04, 0.1, 14)
  box(parent, M.pouch, 0.1, 0.76, -0.1, 0.3, 0.02, 0.22, 0.004)
}

function bench(parent, M, fixture) {
  const [width, depth] = fixture.size
  for (const x of [-width / 2 + 0.12, width / 2 - 0.12]) box(parent, M.powderCoat, x, 0, 0, 0.04, 0.42, depth - 0.04)
  for (let i = 0; i < 4; i++) {
    box(parent, M.oak, 0, 0.42, -depth / 2 + 0.06 + i * (depth - 0.12) / 3, width, 0.03, 0.08, 0.01)
  }
}

function ppeRack(parent, M, fixture) {
  const [width, depth] = fixture.size
  const random = createRandom(7)
  for (const x of [-width / 2 + 0.02, width / 2 - 0.02]) {
    for (const z of [-depth / 2 + 0.02, depth / 2 - 0.02]) box(parent, M.powderCoat, x, 0, z, 0.03, 1.7, 0.03)
  }
  for (let level = 0; level < 4; level++) {
    const y = 0.12 + level * 0.5
    box(parent, M.powderCoat, 0, y, 0, width, 0.02, depth, 0.004)
    if (level === 3) continue
    for (let i = 0; i < 4; i++) {
      const material = [M.accentClean, M.plasticWhite, M.upholstery, M.pouch][Math.floor(random() * 4)]
      box(parent, material, -width / 2 + 0.17 + i * 0.29, y + 0.02, 0, 0.25, 0.12, depth - 0.12, 0.01)
    }
  }
}

function createRandom(seed) {
  let state = Math.floor(Math.abs(seed) * 1000) % 2147483647 || 1
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

// Elevasi default untuk benda yang diletakkan di atas meja kerja.
const defaultElevation = { monitor: 0.93 }

// Deretan kursi tunggu prosedural (dipakai jika model bangku tidak tersedia).
function waitingRow(parent, M, seats, width) {
  const step = width / seats
  for (let i = 0; i < seats; i++) waitingChair(group(parent, -width / 2 + step * (i + 0.5), 0, 0), M)
}

export function buildFurniture(materials, assets) {
  const root = new T.Group()
  const M = materials
  const display = queueDisplay()
  let plantSeed = 1

  // Model detail (figur, tanaman) dimuat belakangan: penanda tetap dipasang
  // walau modelnya belum ada, lalu diganti klon saat model selesai dimuat.
  const useAsset = (key) => assets.has(key) || isDetailModel(key)

  for (const fixture of fixtures) {
    const node = new T.Group()
    node.position.set(fixture.pos[0], fixture.elevation ?? defaultElevation[fixture.type] ?? 0, fixture.pos[1])
    node.rotation.y = fixture.rot
    if (fixture.mirrored) node.scale.x = -1
    root.add(node)

    const withAsset = (key, fallback = () => {}) => {
      if (useAsset(key)) assetMarker(node, key)
      else fallback()
    }
    const [width] = fixture.size

    switch (fixture.type) {
      case 'dental-unit': withAsset('dental-unit', () => proceduralDentalChair(node, M)); break
      // Model dental unit sudah membawa lampu tindakan.
      case 'operating-light': if (!useAsset('dental-unit')) operatingLight(node, M); break
      case 'stool-operator': withAsset('operator-stool', () => stool(node, M, { backrest: true })); break
      case 'stool-assistant': withAsset('assistant-stool', () => stool(node, M, { seatHeight: 0.66, assistant: true })); break
      case 'delivery-cart': deliveryCart(node, M); break
      case 'suction-unit': suctionUnit(node, M); break
      case 'counter-sink': counterSink(node, M, fixture); break
      case 'monitor': withAsset('monitor', () => monitor(node, M)); break
      case 'keyboard': withAsset('keyboard'); break
      case 'sharps-bin': withAsset('sharps-bin', () => box(node, M.binYellow, 0, 0, 0, 0.24, 0.3, 0.16, 0.02)); break
      case 'tall-cabinet': withAsset('tall-cabinet-closed', () => tallCabinet(node, M, fixture)); break
      case 'bookcase': withAsset('tall-cabinet', () => tallCabinet(node, M, fixture)); break
      case 'instrument-trolley': withAsset('instrument-trolley', () => instrumentTrolley(node, M)); break
      case 'hand-sink': withAsset('wash-basin', () => handSink(node, M)); break
      case 'hand-rub': handRub(node, M); break
      case 'sterile-island': sterileIsland(node, M, fixture, assets); break
      case 'xray-unit': xrayUnit(node, M); break
      case 'xray-chair': xrayChair(node, M); break
      case 'lead-screen': withAsset('lead-shield', () => leadScreen(node, M)); break
      case 'operator-mark': operatorMark(node, M); break
      case 'xray-control': xrayControl(node, M); break
      case 'apron-rack': apronRack(node, M); break
      case 'shelf':
        if (useAsset('storage-shelf')) {
          // Empat rak baja 0,9 m berderet sepanjang dinding.
          for (const offset of [-1.35, -0.45, 0.45, 1.35]) assetMarker(node, 'storage-shelf', offset, 0, 0)
        } else shelf(node, M, fixture)
        break
      case 'bin-medical': withAsset('medical-waste-bin', () => bin(node, M, M.binYellow)); break
      case 'bin-general': bin(node, M, M.binGrey); break
      case 'boxes':
        if (useAsset('cardboard-boxes')) {
          assetMarker(node, 'cardboard-boxes', -0.24, 0, 0)
          assetMarker(node, 'cardboard-boxes', 0.24, 0, 0, 0.1)
          assetMarker(node, 'cardboard-boxes', -0.22, 0.41, 0.02, -0.15)
        } else boxes(node, M)
        break
      case 'waiting-bench-4': withAsset('waiting-chair', () => waitingRow(node, M, 4, width)); break
      case 'waiting-bench-3': withAsset('bench', () => waitingRow(node, M, 3, width)); break
      case 'person-seated': withAsset('visitor-seated'); break
      case 'person-standing': withAsset('visitor-standing'); break
      case 'person-dentist': withAsset('dentist'); break
      case 'person-nurse': withAsset('nurse'); break
      case 'person-receptionist': withAsset('receptionist'); break
      case 'sofa': withAsset('sofa', () => sofa(node, M, fixture)); break
      case 'coffee-table': withAsset('coffee-table', () => coffeeTable(node, M, { size: [0.9, 0.6] })); break
      case 'queue-tv': queueTv(node, M, display); break
      case 'plant-large': withAsset('plant-large', () => plant(node, M, plantSeed++)); break
      case 'plant-small': withAsset('plant-small', () => plant(node, M, plantSeed++)); break
      case 'water-dispenser': withAsset('water-dispenser', () => waterDispenser(node, M)); break
      case 'hand-rub-stand': withAsset('hand-sanitizer', () => handRubStand(node, M)); break
      case 'reception-desk': withAsset('reception-desk', () => receptionDesk(node, M, { size: [2.2, 0.8] })); break
      case 'task-chair': withAsset('office-chair', () => taskChair(node, M)); break
      case 'printer': withAsset('printer', () => printer(node, M)); break
      case 'file-cabinet': withAsset('filing-cabinet', () => fileCabinet(node, M, fixture)); break
      case 'washbasin': withAsset('wash-basin', () => washbasin(node, M)); break
      case 'mirror': withAsset('mirror', () => mirror(node, M)); break
      case 'toilet': withAsset('toilet', () => proceduralToilet(node, M)); break
      case 'partition': partition(node, M, fixture); break
      case 'lockers': withAsset('lockers', () => lockers(node, M, fixture)); break
      case 'staff-desk': withAsset('table', () => staffDesk(node, M, { size: [1.57, 0.7] })); break
      case 'bench': withAsset('bench', () => bench(node, M, fixture)); break
      case 'ppe-rack': ppeRack(node, M, fixture); break
      default: console.warn('Arunika: jenis perabot tidak dikenal', fixture.type)
    }
  }
  return root
}
