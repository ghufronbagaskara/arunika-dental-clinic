// Arsitektur maket: lantai, dinding berpotongan (cutaway), kusen, daun pintu,
// kaca, ambang pass-through, loket, plint, tapak luar, dan papan nama.
// Semua geometri dibangun dari data `layout.js`.
import * as T from 'three'
import {
  building, exteriorSide, openingTypes, openings, openingsOnWall, rooms, solidIntervals,
  wallAxis, wallConstant, wallRange, walls,
} from './layout.js'
import { box, cylinder, group } from './kit.js'

const CAP = 0.012
const SKIRTING_HEIGHT = 0.08

// Menambah balok dinding di antara dua koordinat sepanjang dinding.
// `across` menggeser balok tegak lurus dinding (positif = arah +z atau +x).
function wallBlock(parent, wall, start, end, bottom, top, material, thickness = wall.thickness, across = 0) {
  if (end - start < 0.001 || top - bottom < 0.001) return
  const constant = wallConstant(wall)
  const middle = (start + end) / 2
  if (wallAxis(wall) === 'x') {
    box(parent, material, middle, bottom, constant + across, end - start, top - bottom, thickness)
  } else {
    box(parent, material, constant + across, bottom, middle, thickness, top - bottom, end - start)
  }
}

function floors(parent, materials) {
  for (const room of rooms) {
    const [x, z, width, depth] = room.rect
    const material = materials['floor-' + room.floor]
    const size = material.userData.textureSize ?? 1
    const geometry = new T.PlaneGeometry(width, depth)
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(x + width / 2, 0, z + depth / 2)
    const position = geometry.attributes.position
    const uv = geometry.attributes.uv
    for (let i = 0; i < position.count; i++) {
      uv.setXY(i, position.getX(i) / size, position.getZ(i) / size)
    }
    parent.add(new T.Mesh(geometry, material))
  }
}

function solidWall(parent, wall, start, end, height, materials) {
  const [wallStart, wallEnd] = wallRange(wall)
  // Ujung dinding diperpanjang setengah tebal agar sudut tertutup rapat.
  const from = start === wallStart ? start - wall.thickness / 2 : start
  const to = end === wallEnd ? end + wall.thickness / 2 : end
  wallBlock(parent, wall, from, to, 0, height - CAP, materials.plaster)
  wallBlock(parent, wall, from, to, height - CAP, height, materials.cap)
  if (wall.kind === 'lead') {
    // Garis lapisan timbal terlihat pada potongan dinding.
    wallBlock(parent, wall, from, to, height, height + 0.002, materials.leadPanel, 0.03)
  }
  skirting(parent, wall, start, end, materials)
}

function skirting(parent, wall, start, end, materials) {
  const outside = exteriorSide(wall)
  for (const side of [-1, 1]) {
    if (side === outside) continue
    wallBlock(parent, wall, start, end, 0, SKIRTING_HEIGHT, materials.skirting, 0.012, side * (wall.thickness / 2 + 0.006))
  }
}

function doorFrame(parent, wall, opening, top, frameMaterial) {
  const depth = wall.thickness + 0.03
  wallBlock(parent, wall, opening.start, opening.start + 0.045, 0, top, frameMaterial, depth)
  wallBlock(parent, wall, opening.end - 0.045, opening.end, 0, top, frameMaterial, depth)
}

// Daun pintu terbuka sebagian. Engsel di sisi `hinge`, membuka ke arah `swing`.
function doorLeaves(parent, wall, opening, height, materials) {
  const type = opening.type
  const head = openingTypes[type].head
  const top = Math.min(head - 0.012, height - 0.006)
  const hinges = opening.hinge === 'both' ? ['start', 'end'] : [opening.hinge ?? 'start']
  const leafWidth = (opening.end - opening.start - 0.09) / hinges.length - 0.006
  const angle = { 'pintu-kaca-ganda': 0.45, 'pintu-servis': 0.28 }[type] ?? 0.62
  const swing = opening.swing ?? 1
  const constant = wallConstant(wall)

  for (const hinge of hinges) {
    const along = hinge === 'start' ? opening.start + 0.045 : opening.end - 0.045
    const closed = hinge === 'start' ? 1 : -1
    const face = constant + swing * (wall.thickness / 2 - 0.02)
    let leaf
    if (wallAxis(wall) === 'x') {
      leaf = group(parent, along, 0, face, Math.atan2(-swing * Math.sin(angle), closed * Math.cos(angle)))
    } else {
      leaf = group(parent, face, 0, along, Math.atan2(-closed * Math.cos(angle), swing * Math.sin(angle)))
    }

    if (type === 'pintu-kaca-ganda') {
      // Daun kaca berbingkai aluminium.
      box(leaf, materials.aluminium, 0.03, 0.01, 0, 0.06, top - 0.01, 0.045)
      box(leaf, materials.aluminium, leafWidth - 0.03, 0.01, 0, 0.06, top - 0.01, 0.045)
      box(leaf, materials.aluminium, leafWidth / 2, 0.01, 0, leafWidth, 0.12, 0.045)
      if (top > 2.2) box(leaf, materials.aluminium, leafWidth / 2, top - 0.08, 0, leafWidth, 0.08, 0.045)
      box(leaf, materials.glass, leafWidth / 2, 0.13, 0, leafWidth - 0.12, Math.min(top, 2.32) - 0.13, 0.012)
      box(leaf, materials.chrome, leafWidth - 0.11, 0.85, 0.05, 0.025, Math.min(0.7, top - 0.9), 0.025, 0.012)
    } else {
      const leafMaterial = type === 'pintu-servis' ? materials.powderCoat : materials.oakDoor
      box(leaf, leafMaterial, leafWidth / 2, 0.012, 0, leafWidth, top - 0.012, 0.04, 0.006)
      if (top > 1.0) {
        for (const side of [-1, 1]) {
          box(leaf, materials.chrome, leafWidth - 0.12, 0.98, side * 0.035, 0.14, 0.02, 0.02, 0.008)
        }
      }
      if (opening.radiation) {
        // Panel timbal tampak di tepi daun pintu rontgen.
        box(leaf, materials.leadPanel, leafWidth / 2, 0.012, 0, leafWidth + 0.004, Math.min(0.9, top - 0.02), 0.045)
      }
    }
  }
}

function windowUnit(parent, wall, opening, height, materials) {
  const { sill, head } = openingTypes.jendela
  const top = Math.min(head, height)
  const frame = materials.darkFrame
  const depth = wall.thickness * 0.55
  const inside = -exteriorSide(wall)
  wallBlock(parent, wall, opening.start, opening.start + 0.05, sill, top, frame, depth)
  wallBlock(parent, wall, opening.end - 0.05, opening.end, sill, top, frame, depth)
  wallBlock(parent, wall, opening.start, opening.end, sill, sill + 0.05, frame, depth)
  if (head < height) wallBlock(parent, wall, opening.start, opening.end, head - 0.05, head, frame, depth)
  const panes = Math.max(2, Math.round((opening.end - opening.start) / 0.95))
  const step = (opening.end - opening.start) / panes
  for (let i = 1; i < panes; i++) {
    const at = opening.start + i * step
    wallBlock(parent, wall, at - 0.025, at + 0.025, sill, top, frame, depth)
  }
  if (top > 2.15) wallBlock(parent, wall, opening.start, opening.end, 2.1, 2.14, frame, depth)
  wallBlock(parent, wall, opening.start + 0.05, opening.end - 0.05, sill + 0.05, top - 0.004, materials.glass, 0.012)
  // Ambang dalam (solid surface) dan ambang luar (aluminium).
  wallBlock(parent, wall, opening.start - 0.04, opening.end + 0.04, sill - 0.025, sill, materials.solidSurface, 0.07, inside * (wall.thickness / 2 + 0.02))
  wallBlock(parent, wall, opening.start - 0.02, opening.end + 0.02, sill - 0.02, sill, materials.aluminium, 0.06, -inside * (wall.thickness / 2 + 0.015))
}

function passThrough(parent, wall, opening, height, materials) {
  const { sill, head } = openingTypes['pass-through']
  const top = Math.min(head, height)
  const accent = opening.side === 'kotor' ? materials.accentDirty : materials.accentClean
  const liner = wall.thickness + 0.006
  // Ambang stainless menonjol ke dua sisi.
  wallBlock(parent, wall, opening.start - 0.03, opening.end + 0.03, sill - 0.025, sill + 0.004, materials.steel, wall.thickness + 0.14)
  wallBlock(parent, wall, opening.start, opening.start + 0.012, sill, top, materials.steel, liner)
  wallBlock(parent, wall, opening.end - 0.012, opening.end, sill, top, materials.steel, liner)
  if (head < height) wallBlock(parent, wall, opening.start, opening.end, head - 0.012, head, materials.steel, liner)
  // Pita warna zona tepat di bawah ambang, kedua sisi dinding.
  wallBlock(parent, wall, opening.start - 0.03, opening.end + 0.03, sill - 0.075, sill - 0.025, accent, wall.thickness + 0.012)
  // Panel kaca geser setengah terbuka.
  const middle = (opening.start + opening.end) / 2
  wallBlock(parent, wall, opening.start + 0.012, middle + 0.06, sill + 0.006, top - 0.01, materials.glass, 0.01, 0.025)
  wallBlock(parent, wall, middle + 0.045, middle + 0.06, sill + 0.006, top - 0.01, materials.aluminium, 0.02, 0.025)
}

function counterOpening(parent, wall, opening, height, materials) {
  const { sill, head } = openingTypes.loket
  // Meja loket menonjol ke arah ruang tunggu (sisi -x dari dinding x = 10.5).
  wallBlock(parent, wall, opening.start - 0.06, opening.end + 0.06, sill, sill + 0.04, materials.solidSurface, wall.thickness + 0.36, -0.14)
  wallBlock(parent, wall, opening.start + 0.08, opening.end - 0.08, sill + 0.04, Math.min(sill + 0.42, height - 0.01), materials.glass, 0.012, 0.02)
  wallBlock(parent, wall, opening.start, opening.start + 0.03, sill, Math.min(head, height), materials.aluminium, wall.thickness + 0.02)
  wallBlock(parent, wall, opening.end - 0.03, opening.end, sill, Math.min(head, height), materials.aluminium, wall.thickness + 0.02)
}

function wallWithOpenings(parent, wall, height, materials) {
  for (const [start, end] of solidIntervals(wall)) solidWall(parent, wall, start, end, height, materials)

  for (const opening of openingsOnWall(wall.id)) {
    const { sill, head } = openingTypes[opening.type]
    if (sill > 0) {
      wallBlock(parent, wall, opening.start, opening.end, 0, sill - (opening.type === 'jendela' ? 0.025 : 0), materials.plaster)
      skirting(parent, wall, opening.start, opening.end, materials)
    }
    if (head < height) {
      wallBlock(parent, wall, opening.start, opening.end, head, height - CAP, materials.plaster)
      wallBlock(parent, wall, opening.start, opening.end, height - CAP, height, materials.cap)
    }

    if (opening.type === 'jendela') windowUnit(parent, wall, opening, height, materials)
    else if (opening.type === 'pass-through') passThrough(parent, wall, opening, height, materials)
    else if (opening.type === 'loket') counterOpening(parent, wall, opening, height, materials)
    else if (opening.type === 'bukaan') {
      // Bukaan lebar: hanya ambang lantai tipis.
      wallBlock(parent, wall, opening.start, opening.end, 0, 0.004, materials.aluminium, wall.thickness)
    } else {
      const frame = opening.type === 'pintu-kaca-ganda' ? materials.aluminium
        : opening.type === 'pintu-servis' ? materials.darkFrame : materials.laminate
      doorFrame(parent, wall, opening, Math.min(head, height), frame)
      if (head < height) wallBlock(parent, wall, opening.start, opening.end, head - 0.05, head, frame, wall.thickness + 0.03)
      wallBlock(parent, wall, opening.start, opening.end, 0, 0.006, materials.aluminium, wall.thickness)
      doorLeaves(parent, wall, opening, height, materials)
    }
  }
}

function site(parent, materials) {
  const { width, depth } = building
  // Pelat lantai bangunan (ditinggikan 30 cm dari tanah).
  box(parent, materials.slab, width / 2, -0.3, depth / 2, width + 0.24, 0.3 - 0.002, depth + 0.24)
  // Tanah/halaman.
  const ground = new T.Mesh(new T.PlaneGeometry(90, 70), materials.ground)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(width / 2, -0.3, depth / 2 + 4)
  parent.add(ground)
  // Teras pintu masuk, anak tangga, dan jalan setapak.
  box(parent, materials.paving, 5.1, -0.3, 15.95, 4.6, 0.296, 1.5, 0.01)
  box(parent, materials.paving, 5.1, -0.3, 16.9, 3.6, 0.15, 0.4, 0.01)
  box(parent, materials.paving, 5.1, -0.3, 19.6, 2.6, 0.012, 5.0)
  // Jalur rumput di sepanjang fasad.
  box(parent, materials.lawn, 1.35, -0.3, 15.75, 2.4, 0.08, 1.2)
  box(parent, materials.lawn, 15.6, -0.3, 15.75, 16.4, 0.08, 1.2)
}

export function buildArchitecture(materials, height) {
  const root = new T.Group()
  floors(root, materials)
  for (const wall of walls) wallWithOpenings(root, wall, height, materials)
  site(root, materials)
  return root
}

// ---------------------------------------------------------------------------
// Papan nama: satu atlas kanvas untuk semua papan agar cukup satu material.

const ATLAS_COLUMNS = 4
const ATLAS_ROWS = 4
const CELL_WIDTH = 256
const CELL_HEIGHT = 128

function drawLogo(ctx, x, y, size) {
  // Matahari terbit di atas lengkung senyum, sama dengan favicon.
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 64, size / 64)
  ctx.fillStyle = '#d9793b'
  ctx.beginPath()
  ctx.arc(32, 34, 14, Math.PI, 0)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#d9793b'
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'
  for (const angle of [-150, -120, -90, -60, -30]) {
    const radians = angle * Math.PI / 180
    ctx.beginPath()
    ctx.moveTo(32 + Math.cos(radians) * 19, 34 + Math.sin(radians) * 19)
    ctx.lineTo(32 + Math.cos(radians) * 25, 34 + Math.sin(radians) * 25)
    ctx.stroke()
  }
  ctx.strokeStyle = '#12343b'
  ctx.lineWidth = 4.5
  ctx.beginPath()
  ctx.moveTo(10, 42)
  ctx.quadraticCurveTo(32, 58, 54, 42)
  ctx.stroke()
  ctx.restore()
}

export function createSignAtlas() {
  const canvas = document.createElement('canvas')
  canvas.width = CELL_WIDTH * ATLAS_COLUMNS
  canvas.height = CELL_HEIGHT * ATLAS_ROWS
  const ctx = canvas.getContext('2d')
  const font = '"Archivo", "Segoe UI", Arial, sans-serif'
  const cells = new Map()
  let next = 0

  function allocate(key, span = 1) {
    if (next % ATLAS_COLUMNS + span > ATLAS_COLUMNS) next += ATLAS_COLUMNS - next % ATLAS_COLUMNS
    const cell = { column: next % ATLAS_COLUMNS, row: Math.floor(next / ATLAS_COLUMNS), span }
    next += span
    cells.set(key, cell)
    return [cell.column * CELL_WIDTH, cell.row * CELL_HEIGHT, span * CELL_WIDTH, CELL_HEIGHT]
  }

  for (const room of rooms) {
    const [x, y, width, height] = allocate('ruang-' + room.id)
    ctx.fillStyle = '#12343b'
    ctx.fillRect(x, y, width, height)
    ctx.fillStyle = '#f0b48a'
    ctx.font = '600 50px ' + font
    ctx.textBaseline = 'middle'
    ctx.fillText(room.id, x + 18, y + 48)
    ctx.fillStyle = '#f4f1ea'
    ctx.font = '500 25px ' + font
    ctx.fillText(room.name, x + 18, y + 96, width - 30)
  }

  {
    const [x, y, width, height] = allocate('radiasi')
    ctx.fillStyle = '#ebc43a'
    ctx.fillRect(x, y, width, height)
    ctx.fillStyle = '#1c1c1c'
    const cx = x + 64
    const cy = y + 64
    for (let i = 0; i < 3; i++) {
      const start = -Math.PI / 2 + i * Math.PI * 2 / 3 - Math.PI / 6
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, 46, start, start + Math.PI / 3)
      ctx.closePath()
      ctx.fill()
    }
    ctx.fillStyle = '#ebc43a'
    ctx.beginPath()
    ctx.arc(cx, cy, 13, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1c1c1c'
    ctx.beginPath()
    ctx.arc(cx, cy, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '700 25px ' + font
    ctx.textBaseline = 'middle'
    ctx.fillText('Radiasi', x + 122, y + 52)
    ctx.font = '500 18px ' + font
    ctx.fillText('Area terbatas', x + 122, y + 82)
  }

  {
    const [x, y, width, height] = allocate('logo', 2)
    ctx.fillStyle = '#f4f1ea'
    ctx.fillRect(x, y, width, height)
    drawLogo(ctx, x + 18, y + 14, 100)
    ctx.fillStyle = '#12343b'
    ctx.textBaseline = 'middle'
    ctx.font = '650 44px ' + font
    ctx.fillText('Arunika', x + 136, y + 50)
    ctx.font = '500 26px ' + font
    ctx.fillText('Dental Care', x + 138, y + 92)
  }

  const texture = new T.CanvasTexture(canvas)
  texture.colorSpace = T.SRGBColorSpace
  texture.anisotropy = 4
  const material = new T.MeshStandardMaterial({ map: texture, roughness: 0.55, metalness: 0 })
  material.name = 'papan-nama'
  return { cells, material }
}

// Bidang papan menghadap arah `facing` ('+z', '-z', '+x', '-x').
function signPlane(parent, atlas, key, x, y, z, width, height, facing) {
  const cell = atlas.cells.get(key)
  if (!cell) return
  const geometry = new T.PlaneGeometry(width, height)
  const uv = geometry.attributes.uv
  for (let i = 0; i < uv.count; i++) {
    const u = (cell.column + uv.getX(i) * cell.span) / ATLAS_COLUMNS
    const v = 1 - (cell.row + 1 - uv.getY(i)) / ATLAS_ROWS
    uv.setXY(i, u, v)
  }
  const mesh = new T.Mesh(geometry, atlas.material)
  mesh.position.set(x, y, z)
  mesh.rotation.y = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[facing]
  parent.add(mesh)
  // Pelat belakang tipis agar papan terlihat menempel di dinding.
  return mesh
}

export function buildSigns(atlas, materials, height) {
  const root = new T.Group()
  const signHeight = Math.min(1.42, height - 0.16)
  for (const opening of openings) {
    if (!opening.room) continue
    const wall = walls.find(({ id }) => id === opening.wall)
    const constant = wallConstant(wall)
    // Papan di sisi koridor (dinding z = 7 dan z = 9) atau di fasad untuk pintu utama.
    let facing
    if (constant === 7) facing = '+z'
    else if (constant === 9) facing = '-z'
    else continue
    const offset = wall.thickness / 2 + 0.012
    const z = constant + (facing === '+z' ? offset : -offset)
    const along = opening.hinge === 'end' ? opening.start - 0.3 : opening.end + 0.3
    box(root, materials.charcoal, along, signHeight - 0.1, z - (facing === '+z' ? 0.006 : -0.006), 0.36, 0.2, 0.01)
    signPlane(root, atlas, 'ruang-' + opening.room, along, signHeight, z + (facing === '+z' ? 0.002 : -0.002), 0.34, 0.17, facing)
    if (opening.radiation) {
      const other = opening.hinge === 'end' ? opening.end + 0.3 : opening.start - 0.3
      signPlane(root, atlas, 'radiasi', other, signHeight, z + 0.002, 0.3, 0.15, facing)
    }
  }
  // Papan nama klinik di fasad depan, di kanan jendela ruang tunggu.
  signPlane(root, atlas, 'logo', 12.4, Math.min(1.25, height - 0.35), 15.112, 2.4, 0.6, '+z')
  // Lampu dinding kecil di kedua sisi pintu utama (aksen fasad).
  for (const x of [3.8, 6.4]) cylinder(root, materials.darkFrame, x, Math.min(1.3, height - 0.3), 15.14, 0.04, 0.18, 12)
  return root
}
