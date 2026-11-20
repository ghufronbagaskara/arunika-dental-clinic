// Arsitektur maket: lantai, dinding berpotongan/utuh, aksen fasad & dinding dalam,
// bukaan, atap miring terpisah (split-skillion clerestory) yang dapat dilepas pasang,
// tapak luar (pagar, parkir sesuai kapasitas, taman, jalan akses), dan papan nama.
import * as T from 'three'
import {
  building, exteriorSide, openingTypes, openings, openingsOnWall, rooms, siteLayout,
  solidIntervals, wallAxis, wallConstant, wallRange, wallSpec, walls,
} from './layout.js'
import { box, cylinder, ellipsoid, group } from './kit.js'

const CAP = 0.014
const SKIRTING_HEIGHT = 0.1

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
    geometry.translate(x + width / 2, 0.001, z + depth / 2)
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
  const from = start === wallStart ? start - wall.thickness / 2 : start
  const to = end === wallEnd ? end + wall.thickness / 2 : end
  const outside = exteriorSide(wall)

  if (outside !== 0) {
    // Dinding luar: inti interior terang + lapisan plester mineral eksterior + sloof batu alam.
    const innerThick = wall.thickness * 0.72
    const outerThick = wall.thickness - innerThick
    const innerShift = -outside * (outerThick / 2)
    const outerShift = outside * (innerThick / 2)
    wallBlock(parent, wall, from, to, 0, height - CAP, materials.plaster, innerThick, innerShift)
    const plinthTop = Math.min(0.28, height - CAP)
    if (plinthTop > 0.01) {
      wallBlock(parent, wall, from, to, 0, plinthTop, materials.stonePlinth, outerThick + 0.012, outerShift + outside * 0.006)
    }
    if (height - CAP > plinthTop) {
      wallBlock(parent, wall, from, to, plinthTop, height - CAP, materials.plasterExterior, outerThick, outerShift)
    }
    wallBlock(parent, wall, from, to, height - CAP, height, materials.cap)
  } else {
    wallBlock(parent, wall, from, to, 0, height - CAP, materials.plaster)
    wallBlock(parent, wall, from, to, height - CAP, height, materials.cap)
  }

  if (wall.kind === 'lead') {
    wallBlock(parent, wall, from, to, height, height + 0.003, materials.leadPanel, 0.035)
  }
  skirting(parent, wall, start, end, materials)
}

function skirting(parent, wall, start, end, materials) {
  const outside = exteriorSide(wall)
  for (const side of [-1, 1]) {
    if (side === outside) continue
    wallBlock(parent, wall, start, end, 0, SKIRTING_HEIGHT, materials.skirting, 0.014, side * (wall.thickness / 2 + 0.007))
  }
}

function doorFrame(parent, wall, opening, top, frameMaterial) {
  const depth = wall.thickness + 0.036
  wallBlock(parent, wall, opening.start, opening.start + 0.05, 0, top, frameMaterial, depth)
  wallBlock(parent, wall, opening.end - 0.05, opening.end, 0, top, frameMaterial, depth)
}

function doorLeaves(parent, wall, opening, height, materials) {
  const type = opening.type
  const head = openingTypes[type].head
  const top = Math.min(head - 0.012, height - 0.006)
  const hinges = opening.hinge === 'both' ? ['start', 'end'] : [opening.hinge ?? 'start']
  const leafWidth = (opening.end - opening.start - 0.1) / hinges.length - 0.006
  const angle = { 'pintu-kaca-ganda': 0.45, 'pintu-servis': 0.28 }[type] ?? 0.62
  const swing = opening.swing ?? 1
  const constant = wallConstant(wall)

  for (const hinge of hinges) {
    const along = hinge === 'start' ? opening.start + 0.05 : opening.end - 0.05
    const closed = hinge === 'start' ? 1 : -1
    const face = constant + swing * (wall.thickness / 2 - 0.02)
    let leaf
    if (wallAxis(wall) === 'x') {
      leaf = group(parent, along, 0, face, Math.atan2(-swing * Math.sin(angle), closed * Math.cos(angle)))
    } else {
      leaf = group(parent, face, 0, along, Math.atan2(-closed * Math.cos(angle), swing * Math.sin(angle)))
    }

    if (type === 'pintu-kaca-ganda') {
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
        box(leaf, materials.leadPanel, leafWidth / 2, 0.012, 0, leafWidth + 0.004, Math.min(0.9, top - 0.02), 0.045)
      }
    }
  }
}

function windowUnit(parent, wall, opening, height, materials) {
  const spec = openingTypes[opening.type]
  const { sill, head, frosted } = spec
  const top = Math.min(head, height)
  if (top <= sill + 0.04) return
  const frame = materials.darkFrame
  const depth = wall.thickness * 0.58
  const inside = -exteriorSide(wall)
  const glassMat = frosted ? materials.frostedGlass : materials.glass

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
  wallBlock(parent, wall, opening.start + 0.05, opening.end - 0.05, sill + 0.05, top - 0.004, glassMat, 0.012)

  // Ambang dalam (solid surface) dan ambang luar (aluminium gelap).
  wallBlock(parent, wall, opening.start - 0.04, opening.end + 0.04, sill - 0.025, sill, materials.solidSurface, 0.075, inside * (wall.thickness / 2 + 0.02))
  wallBlock(parent, wall, opening.start - 0.03, opening.end + 0.03, sill - 0.022, sill, materials.darkFrame, 0.065, -inside * (wall.thickness / 2 + 0.018))
}

function passThrough(parent, wall, opening, height, materials) {
  const { sill, head } = openingTypes['pass-through']
  const top = Math.min(head, height)
  const accent = opening.side === 'kotor' ? materials.accentDirty : materials.accentClean
  const liner = wall.thickness + 0.006
  wallBlock(parent, wall, opening.start - 0.03, opening.end + 0.03, sill - 0.025, sill + 0.004, materials.steel, wall.thickness + 0.14)
  wallBlock(parent, wall, opening.start, opening.start + 0.012, sill, top, materials.steel, liner)
  wallBlock(parent, wall, opening.end - 0.012, opening.end, sill, top, materials.steel, liner)
  if (head < height) wallBlock(parent, wall, opening.start, opening.end, head - 0.012, head, materials.steel, liner)
  wallBlock(parent, wall, opening.start - 0.03, opening.end + 0.03, sill - 0.075, sill - 0.025, accent, wall.thickness + 0.012)
  const middle = (opening.start + opening.end) / 2
  wallBlock(parent, wall, opening.start + 0.012, middle + 0.06, sill + 0.006, top - 0.01, materials.glass, 0.01, 0.025)
  wallBlock(parent, wall, middle + 0.045, middle + 0.06, sill + 0.006, top - 0.01, materials.aluminium, 0.02, 0.025)
}

function counterOpening(parent, wall, opening, height, materials) {
  const { sill, head } = openingTypes.loket
  wallBlock(parent, wall, opening.start - 0.06, opening.end + 0.06, sill, sill + 0.04, materials.solidSurface, wall.thickness + 0.36, -0.14)
  wallBlock(parent, wall, opening.start + 0.08, opening.end - 0.08, sill + 0.04, Math.min(sill + 0.42, height - 0.01), materials.glass, 0.012, 0.02)
  wallBlock(parent, wall, opening.start, opening.start + 0.03, sill, Math.min(head, height), materials.aluminium, wall.thickness + 0.02)
  wallBlock(parent, wall, opening.end - 0.03, opening.end, sill, Math.min(head, height), materials.aluminium, wall.thickness + 0.02)
}

function wallWithOpenings(parent, wall, height, materials) {
  for (const [start, end] of solidIntervals(wall)) solidWall(parent, wall, start, end, height, materials)

  for (const opening of openingsOnWall(wall.id)) {
    const spec = openingTypes[opening.type]
    const { sill, head } = spec
    const outside = exteriorSide(wall)
    if (sill > 0) {
      const sillTop = Math.min(sill - (opening.type.startsWith('jendela') ? 0.025 : 0), height - CAP)
      if (outside !== 0) {
        const innerThick = wall.thickness * 0.72
        const outerThick = wall.thickness - innerThick
        const plinthTop = Math.min(0.28, sillTop)
        wallBlock(parent, wall, opening.start, opening.end, 0, sillTop, materials.plaster, innerThick, -outside * (outerThick / 2))
        if (plinthTop > 0.01) {
          wallBlock(parent, wall, opening.start, opening.end, 0, plinthTop, materials.stonePlinth, outerThick + 0.012, outside * (innerThick / 2 + 0.006))
        }
        if (sillTop > plinthTop) {
          wallBlock(parent, wall, opening.start, opening.end, plinthTop, sillTop, materials.plasterExterior, outerThick, outside * (innerThick / 2))
        }
      } else {
        wallBlock(parent, wall, opening.start, opening.end, 0, sillTop, materials.plaster)
      }
      if (height <= sill) {
        wallBlock(parent, wall, opening.start, opening.end, Math.max(0, height - CAP), height, materials.cap)
      }
      skirting(parent, wall, opening.start, opening.end, materials)
    }
    if (head < height) {
      if (outside !== 0) {
        const innerThick = wall.thickness * 0.72
        const outerThick = wall.thickness - innerThick
        wallBlock(parent, wall, opening.start, opening.end, head, height - CAP, materials.plaster, innerThick, -outside * (outerThick / 2))
        wallBlock(parent, wall, opening.start, opening.end, head, height - CAP, materials.plasterExterior, outerThick, outside * (innerThick / 2))
      } else {
        wallBlock(parent, wall, opening.start, opening.end, head, height - CAP, materials.plaster)
      }
      wallBlock(parent, wall, opening.start, opening.end, height - CAP, height, materials.cap)
    }

    if (opening.type.startsWith('jendela')) windowUnit(parent, wall, opening, height, materials)
    else if (opening.type === 'pass-through') passThrough(parent, wall, opening, height, materials)
    else if (opening.type === 'loket') counterOpening(parent, wall, opening, height, materials)
    else if (opening.type === 'bukaan') {
      wallBlock(parent, wall, opening.start, opening.end, 0, 0.004, materials.aluminium, wall.thickness)
    } else {
      const frame = opening.type === 'pintu-kaca-ganda' ? materials.aluminium
        : opening.type === 'pintu-servis' ? materials.darkFrame : materials.oak
      doorFrame(parent, wall, opening, Math.min(head, height), frame)
      if (head < height) wallBlock(parent, wall, opening.start, opening.end, head - 0.05, head, frame, wall.thickness + 0.036)
      wallBlock(parent, wall, opening.start, opening.end, 0, 0.006, materials.aluminium, wall.thickness + 0.02)
      doorLeaves(parent, wall, opening, height, materials)
    }
  }
}

function createPosterMaterial() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const ctx = c.getContext('2d')
  const palettes = [
    ['#e8efe9', '#2a8c82', '#d9793b'],
    ['#f1e8dc', '#12343b', '#c46b37'],
  ]
  for (let i = 0; i < 2; i++) {
    const ox = i * 256
    const [bg, p1, p2] = palettes[i]
    ctx.fillStyle = bg
    ctx.fillRect(ox, 0, 256, 256)
    ctx.fillStyle = p1
    ctx.beginPath()
    ctx.arc(ox + 128, 138, 66, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = p2
    ctx.beginPath()
    ctx.arc(ox + 128, 108, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#12343b'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(ox + 48, 178)
    ctx.quadraticCurveTo(ox + 128, 212, ox + 208, 178)
    ctx.stroke()
  }
  const tex = new T.CanvasTexture(c)
  tex.colorSpace = T.SRGBColorSpace
  return new T.MeshStandardMaterial({ map: tex, roughness: 0.72 })
}

// Aksen material dinding nyata: kisi kayu fasad & ruang tunggu, keramik backsplash,
// rel pelindung dinding koridor, serta kanvas lukisan/poster edukasi.
function wallEnhancements(parent, height, materials) {
  const hClad = Math.min(height - CAP, 2.72)
  const hBack = Math.min(height - CAP, 1.56)

  // Fasad depan: panel kisi kayu jati vertikal di sisi papan nama & sudut kanan.
  if (hClad > 0.35) {
    box(parent, materials.flutedOak, 10.52, 0.28, 15.145, 0.78, hClad - 0.28, 0.04)
    box(parent, materials.flutedOak, 23.15, 0.28, 15.145, 1.65, hClad - 0.28, 0.04)
    // Aksen kayu di sisi kiri dekat pintu samping koridor.
    box(parent, materials.flutedOak, -0.145, 0.28, 9.45, 0.04, hClad - 0.28, 1.25)
  }

  // Interior Ruang tunggu: panel kayu akustik di dinding belakang layar antrean.
  if (height > 0.3) {
    box(parent, materials.flutedOak, 2.8, 0.1, 8.932, 2.35, Math.min(height - 0.14, 2.25), 0.018)
    // Panel kayu hangat di dinding pendaftaran (sisi loket).
    box(parent, materials.flutedOak, 10.432, 0.1, 14.05, 0.018, Math.min(height - 0.14, 2.25), 1.35)
  }

  // Backsplash keramik di belakang wastafel Praktik 1, Praktik 2, dan dinding Toilet.
  if (hBack > 0.85) {
    box(parent, materials.wallTile, 1.72, 0.85, 0.106, 2.65, hBack - 0.85, 0.012)
    box(parent, materials.wallTile, 15.98, 0.85, 0.106, 2.65, hBack - 0.85, 0.012)
    // Toilet (ruang 03: x = 15.8..19.5, z = 9..15): pelapis dinding keramik.
    box(parent, materials.wallTile, 15.866, 0.1, 12.0, 0.012, hBack - 0.1, 5.8)
    box(parent, materials.wallTile, 19.434, 0.1, 12.0, 0.012, hBack - 0.1, 5.8)
    box(parent, materials.wallTile, 18.6, 0.1, 9.066, 1.7, hBack - 0.1, 0.012)
  }

  // Rel pelindung dinding koridor klinis (bumper guard) setinggi 88 cm.
  if (height > 1.0) {
    for (const [x0, x1] of [[2.2, 8.0], [9.5, 15.5], [17.0, 18.5], [20.0, 21.7]]) {
      box(parent, materials.wallRail, (x0 + x1) / 2, 0.88, 7.07, x1 - x0, 0.075, 0.025)
    }
    for (const [x0, x1] of [[0.4, 4.4], [7.6, 12.1], [13.5, 16.3], [17.6, 21.1], [22.5, 23.7]]) {
      box(parent, materials.wallRail, (x0 + x1) / 2, 0.88, 8.93, x1 - x0, 0.075, 0.025)
    }
  }

  // Bingkai poster edukasi klinis di Ruang tunggu dan Koridor.
  if (height > 1.55) {
    const posterMat = createPosterMaterial()
    const frames = [
      [7.4, 1.35, 8.925, 0.65, 0.85, 0],
      [8.3, 1.35, 8.925, 0.65, 0.85, 1],
      [4.5, 1.35, 7.075, 0.65, 0.85, 0],
      [13.4, 1.35, 7.075, 0.65, 0.85, 1],
    ]
    for (const [x, y, z, w, h, variant] of frames) {
      const dir = z < 8 ? 1 : -1
      box(parent, materials.walnut, x, y - h / 2, z, w, h, 0.02)
      const geo = new T.PlaneGeometry(w - 0.1, h - 0.1)
      const uv = geo.attributes.uv
      for (let i = 0; i < uv.count; i++) uv.setX(i, (variant + uv.getX(i)) / 2)
      const art = new T.Mesh(geo, posterMat)
      art.position.set(x, y, z + dir * 0.012)
      if (dir < 0) art.rotation.y = Math.PI
      parent.add(art)
    }
  }
}

export function buildArchitecture(materials, height) {
  const root = new T.Group()
  // Pelat dasar bangunan (ditinggikan 30 cm dari tanah).
  box(root, materials.slab, building.width / 2, -0.3, building.depth / 2, building.width + 0.24, 0.3 - 0.002, building.depth + 0.24)
  floors(root, materials)
  for (const wall of walls) wallWithOpenings(root, wall, height, materials)
  wallEnhancements(root, height, materials)
  return root
}

// ---------------------------------------------------------------------------
// Atap miring terpisah (Tropical Split-Skillion Clerestory Roof), dapat dilepas pasang.
// Berbeda dari atap datar parapet Elora maupun pelat kotak Dental House 31.

function slopedSlab(parent, material, x0, x1, z0, z1, y0, y1, thickness) {
  const dz = z1 - z0
  const dy = y1 - y0
  const lengthZ = Math.hypot(dz, dy)
  const pitch = Math.atan2(dy, dz)
  const slabGroup = group(parent, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
  slabGroup.rotation.x = -pitch
  box(slabGroup, material, 0, -thickness / 2, 0, x1 - x0, thickness, lengthZ)
  return slabGroup
}

function gableWedge(parent, material, x, z0, z1, yBase, y0, y1, thicknessX) {
  const shape = new T.Shape()
  shape.moveTo(z0, yBase)
  shape.lineTo(z1, yBase)
  shape.lineTo(z1, y1)
  shape.lineTo(z0, y0)
  shape.closePath()
  const geometry = new T.ExtrudeGeometry(shape, { depth: thicknessX, bevelEnabled: false })
  geometry.rotateY(-Math.PI / 2)
  geometry.translate(x + thicknessX / 2, 0, 0)
  const mesh = new T.Mesh(geometry, material)
  parent.add(mesh)
  return mesh
}

export function buildRoof(atlas, materials) {
  const root = new T.Group()
  const { width, depth } = building
  const wallH = wallSpec.height

  // 1. Atap sayap belakang (klinis): z = -0.85 (y = 2.86) naik ke koridor z = 8.4 (y = 3.92).
  const backZ0 = -0.85
  const backZ1 = 8.4
  const backY0 = 2.86
  const backY1 = 3.92
  slopedSlab(root, materials.oak, -0.85, width + 0.85, backZ0, backZ1, backY0, backY1, 0.04)
  const backDeck = slopedSlab(root, materials.roofMetal, -0.9, width + 0.9, backZ0 - 0.04, backZ1 + 0.04, backY0 + 0.06, backY1 + 0.06, 0.075)
  // Rusuk standing-seam setiap 0,85 m di atas dek atap belakang.
  const backLen = Math.hypot(backZ1 - backZ0, backY1 - backY0) + 0.08
  for (let x = -0.7; x <= width + 0.72; x += 0.85) {
    box(backDeck, materials.roofMetal, x - width / 2, 0.036, 0, 0.04, 0.042, backLen)
  }
  // Lisplang samping dan lis tepi aksen tembaga fajar.
  slopedSlab(root, materials.fenceMetal, -0.92, width + 0.92, backZ1 - 0.06, backZ1 + 0.08, backY1 + 0.02, backY1 + 0.02, 0.14)
  slopedSlab(root, materials.roofAccent, -0.94, width + 0.94, backZ1, backZ1 + 0.12, backY1 + 0.07, backY1 + 0.07, 0.04)

  // 2. Atap sayap depan (publik): z = 7.65 (y = 2.98) naik ke fasad depan z = 16.25 (y = 4.22).
  const frontZ0 = 7.65
  const frontZ1 = 16.25
  const frontY0 = 2.98
  const frontY1 = 4.22
  slopedSlab(root, materials.oak, -0.85, width + 0.85, frontZ0, frontZ1, frontY0, frontY1, 0.04)
  const frontDeck = slopedSlab(root, materials.roofMetal, -0.9, width + 0.9, frontZ0 - 0.04, frontZ1 + 0.04, frontY0 + 0.06, frontY1 + 0.06, 0.075)
  const frontLen = Math.hypot(frontZ1 - frontZ0, frontY1 - frontY0) + 0.08
  for (let x = -0.7; x <= width + 0.72; x += 0.85) {
    box(frontDeck, materials.roofMetal, x - width / 2, 0.036, 0, 0.04, 0.042, frontLen)
  }
  // Lisplang fasad depan dark teal + list tembaga fajar.
  box(root, materials.fenceMetal, width / 2, frontY1 - 0.04, frontZ1 + 0.03, width + 1.84, 0.18, 0.08)
  box(root, materials.roofAccent, width / 2, frontY1 + 0.12, frontZ1 + 0.04, width + 1.88, 0.045, 0.1)
  // Lisplang tepi kiri/kanan.
  for (const edgeX of [-0.9, width + 0.9]) {
    slopedSlab(root, materials.fenceMetal, edgeX - 0.04, edgeX + 0.04, backZ0, backZ1, backY0 + 0.01, backY1 + 0.01, 0.13)
    slopedSlab(root, materials.fenceMetal, edgeX - 0.04, edgeX + 0.04, frontZ0, frontZ1, frontY0 + 0.01, frontY1 + 0.01, 0.13)
  }

  // 3. Dinding penutup segitiga (gable wedge) di sisi kiri & kanan agar rapat ke atap miring.
  for (const gx of [0, width]) {
    gableWedge(root, materials.plasterExterior, gx, 0, 7.9, wallH - 0.02, 2.94, 3.85, 0.2)
    gableWedge(root, materials.plasterExterior, gx, 8.0, depth, wallH - 0.02, 3.04, 4.02, 0.2)
  }

  // 4. Pita kaca clerestory di tengah bangunan (z = 7.9, y = 3.04..3.88) memasukkan cahaya pagi.
  box(root, materials.darkFrame, width / 2, 3.04, 7.95, width + 0.12, 0.06, 0.09)
  box(root, materials.darkFrame, width / 2, 3.82, 7.95, width + 0.12, 0.06, 0.09)
  box(root, materials.glass, width / 2, 3.1, 7.95, width - 0.2, 0.72, 0.018)
  for (let x = 0; x <= width; x += 2.0) {
    box(root, materials.darkFrame, x, 3.06, 7.95, 0.06, 0.8, 0.09)
  }

  // 5. Kanopi pintu masuk depan (porte-cochere) di atas teras (x = 3.0..7.2, z = 15.0..17.15).
  box(root, materials.oak, 5.1, 2.66, 16.1, 4.1, 0.04, 2.05)
  box(root, materials.fenceMetal, 5.1, 2.7, 16.12, 4.28, 0.16, 2.15)
  box(root, materials.roofAccent, 5.1, 2.84, 17.16, 4.32, 0.045, 0.09)
  for (const px of [3.16, 7.04]) {
    cylinder(root, materials.fenceMetal, px, 0, 16.95, 0.055, 2.7, 14)
    cylinder(root, materials.stonePlinth, px, 0, 16.95, 0.085, 0.18, 14)
  }
  for (const lx of [4.1, 5.1, 6.1]) {
    cylinder(root, materials.glow, lx, 2.645, 16.25, 0.065, 0.02, 14)
  }
  // Papan nama Arunika di lisplang kanopi utama.
  signPlane(root, atlas, 'logo', 5.1, 2.78, 17.21, 2.3, 0.56, '+z')

  // 6. Plafon dalam ruangan & lampu downlight agar interior tampak rapi saat atap terpasang.
  for (const room of rooms) {
    const [rx, rz, rw, rd] = room.rect
    box(root, materials.ceiling, rx + rw / 2, wallH - 0.015, rz + rd / 2, rw - 0.08, 0.02, rd - 0.08)
    for (const [ox, oz] of [[0.28, 0.28], [0.72, 0.72]]) {
      cylinder(root, materials.glow, rx + rw * ox, wallH - 0.025, rz + rd * oz, 0.07, 0.012, 12)
    }
  }

  // 7. Talang air hujan (downspout) di sudut dinding luar.
  for (const [dx, dz] of [[-0.13, -0.13], [width + 0.13, -0.13], [-0.13, depth + 0.13], [width + 0.13, depth + 0.13]]) {
    cylinder(root, materials.darkFrame, dx, -0.25, dz, 0.04, 3.15, 10)
  }
  return root
}

// ---------------------------------------------------------------------------
// Tapak luar: pagar keliling, area parkir sesuai kapasitas, jalan akses, taman,
// lampu taman, totem, dan kendaraan ringan bergaya maket.

function createSiteTextures() {
  const makeTex = (w, h, draw) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    draw(c.getContext('2d'), w, h)
    const tex = new T.CanvasTexture(c)
    tex.colorSpace = T.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }

  const totemTex = makeTex(512, 512, (ctx) => {
    ctx.fillStyle = '#12343b'
    ctx.fillRect(0, 0, 512, 512)
    drawLogo(ctx, 196, 46, 120)
    ctx.fillStyle = '#f4f1ea'
    ctx.textAlign = 'center'
    ctx.font = '700 62px "Archivo", "Segoe UI", sans-serif'
    ctx.fillText('Arunika', 256, 232)
    ctx.fillStyle = '#f0b48a'
    ctx.font = '500 28px "Archivo", "Segoe UI", sans-serif'
    ctx.fillText('DENTAL CARE', 256, 276)
    ctx.fillStyle = '#2a8c82'
    ctx.fillRect(48, 326, 416, 4)
    ctx.fillStyle = '#f4f1ea'
    ctx.font = '700 40px "Archivo", "Segoe UI", sans-serif'
    ctx.fillText('P  Parkir Pasien', 256, 410)
  })

  const accessibleTex = makeTex(256, 512, (ctx) => {
    ctx.fillStyle = '#2b61a1'
    ctx.fillRect(0, 0, 256, 512)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 8
    ctx.strokeRect(10, 10, 236, 492)
    ctx.save()
    ctx.translate(128, 256)
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#ffffff'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.arc(-6, -74, 15, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 17
    ctx.beginPath()
    ctx.moveTo(-10, -48)
    ctx.lineTo(-2, 8)
    ctx.lineTo(44, 8)
    ctx.lineTo(60, 56)
    ctx.stroke()
    ctx.lineWidth = 13
    ctx.beginPath()
    ctx.moveTo(-6, -22)
    ctx.lineTo(34, -22)
    ctx.stroke()
    ctx.lineWidth = 11
    ctx.beginPath()
    ctx.arc(-8, 34, 46, -0.35 * Math.PI, 1.45 * Math.PI * 0.98)
    ctx.stroke()
    ctx.restore()
  })

  const hatchTex = makeTex(128, 512, (ctx) => {
    ctx.clearRect(0, 0, 128, 512)
    ctx.strokeStyle = '#f3f1ea'
    ctx.lineWidth = 12
    ctx.strokeRect(6, 6, 116, 500)
    for (let y = -128; y < 640; y += 48) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(128, y + 128)
      ctx.stroke()
    }
  })

  return {
    totem: new T.MeshStandardMaterial({ map: totemTex, roughness: 0.5 }),
    accessible: new T.MeshStandardMaterial({ map: accessibleTex, roughness: 0.78 }),
    hatch: new T.MeshStandardMaterial({ map: hatchTex, alphaTest: 0.45, roughness: 0.78 }),
  }
}

function buildStylizedCar(parent, materials, bodyMat, x, z, rotY) {
  const car = group(parent, x, -0.25, z, rotY)
  // Ban dan pelek.
  for (const wx of [-0.74, 0.74]) {
    for (const wz of [-1.25, 1.25]) {
      const wheel = cylinder(car, materials.rubber, wx, 0, wz, 0.28, 0.2, 14)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(wx, 0.28, wz)
    }
  }
  // Bodi utama + kabin kaca.
  box(car, bodyMat, 0, 0.24, 0, 1.66, 0.56, 3.85, 0.12)
  box(car, bodyMat, 0, 0.78, -0.2, 1.42, 0.48, 2.05, 0.14)
  box(car, materials.carGlass, 0, 0.82, -0.18, 1.44, 0.36, 1.75, 0.08)
  box(car, materials.glow, -0.58, 0.44, 1.92, 0.28, 0.12, 0.04, 0.02)
  box(car, materials.glow, 0.58, 0.44, 1.92, 0.28, 0.12, 0.04, 0.02)
}

function buildStylizedScooter(parent, materials, x, z, rotY) {
  const moto = group(parent, x, -0.25, z, rotY)
  for (const wz of [-0.48, 0.48]) {
    const wheel = cylinder(moto, materials.rubber, 0, 0, wz, 0.21, 0.11, 12)
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(0, 0.21, wz)
  }
  box(moto, materials.scooterDawn, 0, 0.26, -0.12, 0.42, 0.46, 0.92, 0.08)
  box(moto, materials.charcoal, 0, 0.68, -0.18, 0.32, 0.1, 0.58, 0.04)
  box(moto, materials.scooterDawn, 0, 0.35, 0.45, 0.34, 0.64, 0.22, 0.06)
  box(moto, materials.chrome, 0, 0.96, 0.44, 0.62, 0.05, 0.06, 0.02)
}

function buildTree(parent, materials, x, z, scale) {
  const tree = group(parent, x, -0.28, z)
  cylinder(tree, materials.treeBark, 0, 0, 0, 0.11 * scale, 2.15 * scale, 8, 0.075 * scale)
  ellipsoid(tree, materials.treeLeafA, 0, 2.35 * scale, 0, 0.95 * scale, 0.72 * scale, 0.92 * scale, 10)
  ellipsoid(tree, materials.treeLeafB, 0.32 * scale, 2.75 * scale, 0.18 * scale, 0.68 * scale, 0.55 * scale, 0.66 * scale, 9)
  ellipsoid(tree, materials.treeLeafA, -0.28 * scale, 2.55 * scale, -0.24 * scale, 0.64 * scale, 0.5 * scale, 0.62 * scale, 9)
}

export function buildSite(materials) {
  const root = new T.Group()
  const { width, depth } = building
  const S = siteLayout
  const { lot, landing, walkway, zebra, aisle, carRow, accessible, carBays, motorBays } = S
  const siteTextures = createSiteTextures()

  // Tanah dasar luas.
  const ground = new T.Mesh(new T.PlaneGeometry(115, 95), materials.ground)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(width / 2, -0.31, depth / 2 + 6)
  root.add(ground)

  // Hamparan rumput di dalam kapling.
  box(root, materials.lawn, (lot.x0 + lot.x1) / 2, -0.305, (lot.z0 + lot.z1) / 2, lot.x1 - lot.x0, 0.03, lot.z1 - lot.z0)

  // Teras pintu masuk, tangga, ramp landai, dan selasar keliling ke pintu samping/belakang.
  box(root, materials.paving, (landing.x0 + landing.x1) / 2, -0.3, (landing.z0 + landing.z1) / 2, landing.x1 - landing.x0, 0.296, landing.z1 - landing.z0)
  box(root, materials.paving, (landing.x0 + landing.x1) / 2, -0.3, 17.25, 3.6, 0.15, 0.5)
  // Ramp difabel di sisi kiri teras.
  const rampGeo = new T.BoxGeometry(1.15, 0.1, 1.95)
  rampGeo.rotateX(0.145)
  const rampMesh = new T.Mesh(rampGeo, materials.paving)
  rampMesh.position.set(3.45, -0.17, 17.95)
  root.add(rampMesh)

  // Jalur pejalan kaki utama + jalur samping kiri/kanan + jalur servis belakang.
  box(root, materials.paving, (walkway.x0 + walkway.x1) / 2, -0.285, (walkway.z0 + walkway.z1) / 2, walkway.x1 - walkway.x0, 0.03, walkway.z1 - walkway.z0)
  box(root, materials.paving, -1.05, -0.285, 8.6, 2.1, 0.03, 17.2)
  box(root, materials.paving, width + 1.05, -0.285, 10.9, 2.1, 0.03, 21.8)
  box(root, materials.paving, width / 2, -0.285, -0.95, width + 4.2, 0.03, 1.9)

  // Trotoar depan dan jalan raya.
  box(root, materials.paving, (lot.x0 + lot.x1) / 2, -0.28, (S.sidewalk.z0 + S.sidewalk.z1) / 2, lot.x1 - lot.x0 + 12, 0.05, S.sidewalk.z1 - S.sidewalk.z0)
  box(root, materials.curb, (lot.x0 + lot.x1) / 2, -0.28, S.sidewalk.z1 - 0.08, lot.x1 - lot.x0 + 12, 0.07, 0.16)
  box(root, materials.asphalt, (lot.x0 + lot.x1) / 2, -0.305, (S.street.z0 + S.street.z1) / 2, lot.x1 - lot.x0 + 16, 0.04, S.street.z1 - S.street.z0)

  // Akses masuk kendaraan, jalur manuver, petak parkir mobil (3 + 1 difabel), dan petak motor (4).
  const driveMidX = (S.drivewayGate[0] + S.drivewayGate[1]) / 2
  const driveWidth = S.drivewayGate[1] - S.drivewayGate[0]
  box(root, materials.asphalt, driveMidX, -0.285, 25.0, driveWidth, 0.032, 6.2)
  box(root, materials.asphalt, (aisle.x0 + aisle.x1) / 2, -0.285, (aisle.z0 + aisle.z1) / 2, aisle.x1 - aisle.x0, 0.032, aisle.z1 - aisle.z0)
  box(root, materials.asphalt, 10.7, -0.285, (carRow.z0 + carRow.z1) / 2, 6.4, 0.032, carRow.z1 - carRow.z0)
  box(root, materials.asphalt, 22.4, -0.285, (carRow.z0 + carRow.z1) / 2, 5.4, 0.032, carRow.z1 - carRow.z0)
  box(root, materials.asphalt, (motorBays.x0 + motorBays.x1) / 2, -0.285, (motorBays.z0 + motorBays.z1) / 2, motorBays.x1 - motorBays.x0 + 0.4, 0.032, motorBays.z1 - motorBays.z0 + 0.4)

  // Marka parkir mobil, difabel, motor, zebra cross, dan garis jalan.
  const markY = -0.252
  const stallLines = [accessible.x0, accessible.x1, accessible.hatch[1], ...new Set(carBays.flat())]
  for (const x of stallLines) {
    box(root, materials.roadLine, x, markY, (carRow.z0 + carRow.z1) / 2, 0.09, 0.008, carRow.z1 - carRow.z0 - 0.15)
  }
  box(root, materials.roadLine, accessible.x0, markY, carRow.z1 - 0.05, accessible.hatch[1] - accessible.x0, 0.008, 0.09)
  box(root, materials.roadLine, carBays[0][0], markY, carRow.z1 - 0.05, carBays[0][1] - carBays[0][0], 0.008, 0.09)
  box(root, materials.roadLine, carBays[1][0], markY, carRow.z1 - 0.05, carBays.at(-1)[1] - carBays[1][0], 0.008, 0.09)

  // Wheel stops beton di setiap petak mobil.
  for (const [x0, x1] of [[accessible.x0, accessible.x1], ...carBays]) {
    box(root, materials.curb, (x0 + x1) / 2, -0.255, S.wheelStopZ, 1.55, 0.11, 0.16, 0.02)
  }

  // Petak difabel biru + garis arsir transfer.
  const accPlane = new T.Mesh(new T.PlaneGeometry(accessible.x1 - accessible.x0 - 0.18, carRow.z1 - carRow.z0 - 0.25), siteTextures.accessible)
  accPlane.rotation.x = -Math.PI / 2
  accPlane.position.set((accessible.x0 + accessible.x1) / 2, -0.246, (carRow.z0 + carRow.z1) / 2)
  accPlane.receiveShadow = true
  root.add(accPlane)

  const hatchPlane = new T.Mesh(new T.PlaneGeometry(accessible.hatch[1] - accessible.hatch[0] - 0.12, carRow.z1 - carRow.z0 - 0.25), siteTextures.hatch)
  hatchPlane.rotation.x = -Math.PI / 2
  hatchPlane.position.set((accessible.hatch[0] + accessible.hatch[1]) / 2, -0.246, (carRow.z0 + carRow.z1) / 2)
  root.add(hatchPlane)

  // Marka parkir motor + kanopi motor ringan.
  const motoW = (motorBays.x1 - motorBays.x0) / motorBays.count
  for (let i = 0; i <= motorBays.count; i++) {
    box(root, materials.roadLine, motorBays.x0 + i * motoW, markY, (motorBays.z0 + motorBays.z1) / 2, 0.07, 0.008, motorBays.z1 - motorBays.z0 - 0.1)
  }
  for (const x of [motorBays.x0 + 0.1, (motorBays.x0 + motorBays.x1) / 2, motorBays.x1 - 0.1]) {
    cylinder(root, materials.fenceMetal, x, -0.26, motorBays.z1 - 0.15, 0.04, 2.25, 10)
  }
  const motoRoof = new T.Mesh(new T.BoxGeometry(motorBays.x1 - motorBays.x0 + 0.5, 0.05, motorBays.z1 - motorBays.z0 + 0.5), materials.roofMetal)
  motoRoof.rotation.x = 0.08
  motoRoof.position.set((motorBays.x0 + motorBays.x1) / 2, 2.02, (motorBays.z0 + motorBays.z1) / 2)
  root.add(motoRoof)

  // Zebra cross jalur pejalan kaki melintasi jalur kendaraan.
  for (let z = zebra.z0 + 0.35; z < zebra.z1 - 0.25; z += 0.72) {
    box(root, materials.roadLine, (zebra.x0 + zebra.x1) / 2, markY, z, zebra.x1 - zebra.x0 - 0.25, 0.008, 0.36)
  }
  // Garis putus-putus jalan raya depan.
  const streetMidZ = (S.street.z0 + S.street.z1) / 2
  for (let x = lot.x0 - 6; x < lot.x1 + 6; x += 3.8) {
    box(root, materials.roadLine, x + 0.9, -0.265, streetMidZ, 1.8, 0.006, 0.12)
  }

  // Pagar keliling khas Arunika: pilar plester krem + batu alam bawah + kisi besi horizontal dark-teal.
  const fenceRuns = [
    [lot.x0, S.pedestrianGate[0], lot.z1, 'x'],
    [S.pedestrianGate[1], S.drivewayGate[0], lot.z1, 'x'],
    [S.drivewayGate[1], lot.x1, lot.z1, 'x'],
    [lot.x0, lot.x1, lot.z0, 'x'],
    [lot.z0, lot.z1, lot.x0, 'z'],
    [lot.z0, lot.z1, lot.x1, 'z'],
  ]
  for (const [a0, a1, at, axis] of fenceRuns) {
    const length = a1 - a0
    const spans = Math.max(1, Math.round(length / 3.2))
    const mid = (a0 + a1) / 2
    // Tembok batu bawah (0.42 m).
    if (axis === 'x') box(root, materials.stonePlinth, mid, -0.3, at, length, 0.72, 0.16)
    else box(root, materials.stonePlinth, at, -0.3, mid, 0.16, 0.72, length)
    // Kisi horizontal dark-teal (5 bilah).
    for (let r = 0; r < 5; r++) {
      const ry = 0.54 + r * 0.18
      if (axis === 'x') box(root, materials.fenceMetal, mid, ry, at, length, 0.035, 0.04)
      else box(root, materials.fenceMetal, at, ry, mid, 0.04, 0.035, length)
    }
    // Pilar pagar tiap ~3,2 m dengan topi batu.
    for (let i = 0; i <= spans; i++) {
      const pos = a0 + length * (i / spans)
      const [px, pz] = axis === 'x' ? [pos, at] : [at, pos]
      box(root, materials.plasterExterior, px, -0.3, pz, 0.26, 1.72, 0.26)
      box(root, materials.stonePlinth, px, 1.42, pz, 0.32, 0.06, 0.32)
    }
  }

  // Totem papan nama di gerbang masuk kendaraan.
  box(root, materials.stonePlinth, 12.9, -0.3, 27.3, 1.28, 0.45, 0.38)
  box(root, materials.fenceMetal, 12.9, 0.15, 27.3, 1.18, 2.05, 0.28)
  const totemFace = new T.Mesh(new T.PlaneGeometry(1.06, 1.06), siteTextures.totem)
  totemFace.position.set(12.9, 1.45, 27.445)
  root.add(totemFace)

  // Bedeng tanaman dengan bingkai kayu & semak berfaset.
  const rand = ((seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 })(41)
  for (const bed of S.beds) {
    const baseY = bed.raised ? -0.28 : -0.3
    const h = bed.raised ? 0.28 : 0.06
    box(root, materials.mulch, (bed.x0 + bed.x1) / 2, baseY, (bed.z0 + bed.z1) / 2, bed.x1 - bed.x0, h, bed.z1 - bed.z0)
    box(root, materials.oak, (bed.x0 + bed.x1) / 2, baseY, bed.z0 - 0.03, bed.x1 - bed.x0 + 0.12, h + 0.04, 0.06)
    box(root, materials.oak, (bed.x0 + bed.x1) / 2, baseY, bed.z1 + 0.03, bed.x1 - bed.x0 + 0.12, h + 0.04, 0.06)
    const count = Math.max(2, Math.floor((bed.x1 - bed.x0) / 1.4))
    for (let i = 0; i < count; i++) {
      const sx = bed.x0 + 0.45 + (bed.x1 - bed.x0 - 0.9) * (count === 1 ? 0.5 : i / (count - 1))
      const sz = (bed.z0 + bed.z1) / 2 + (rand() - 0.5) * Math.min(0.4, (bed.z1 - bed.z0) * 0.35)
      if (S.trees.some(([tx, tz]) => Math.hypot(tx - sx, tz - sz) < 0.85)) continue
      const r = 0.24 + rand() * 0.12
      ellipsoid(root, i % 2 ? materials.treeLeafA : materials.treeLeafB, sx, baseY + h + r * 0.72, sz, r * 1.2, r * 0.85, r * 1.15, 7)
    }
  }

  // Pohon peneduh bergaya bersih & ringan.
  for (const [tx, tz, ts] of S.trees) buildTree(root, materials, tx, tz, ts)

  // Lampu taman (bollard).
  for (const [lx, lz] of S.lamps) {
    cylinder(root, materials.fenceMetal, lx, -0.28, lz, 0.065, 0.78, 10)
    cylinder(root, materials.glow, lx, 0.5, lz, 0.068, 0.1, 10)
  }

  // Kendaraan ringan terparkir (2 mobil + 2 motor) agar skala & kapasitas parkir langsung terbaca.
  buildStylizedCar(root, materials, materials.carSage, 12.5, 24.3, Math.PI)
  buildStylizedCar(root, materials, materials.carIvory, 21.1, 24.3, Math.PI)
  buildStylizedScooter(root, materials, motorBays.x0 + 0.65, (motorBays.z0 + motorBays.z1) / 2, Math.PI)
  buildStylizedScooter(root, materials, motorBays.x0 + 1.8, (motorBays.z0 + motorBays.z1) / 2, Math.PI)

  return root
}

// ---------------------------------------------------------------------------
// Papan nama: satu atlas kanvas untuk semua papan agar cukup satu material.

const ATLAS_COLUMNS = 4
const ATLAS_ROWS = 4
const CELL_WIDTH = 256
const CELL_HEIGHT = 128

function drawLogo(ctx, x, y, size) {
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
  return mesh
}

export function buildSigns(atlas, materials, height) {
  const root = new T.Group()
  const signHeight = Math.min(1.42, height - 0.16)
  for (const opening of openings) {
    if (!opening.room) continue
    const wall = walls.find(({ id }) => id === opening.wall)
    const constant = wallConstant(wall)
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
  // Papan nama klinik di fasad depan (di atas panel fasad kanan jendela ruang tunggu).
  signPlane(root, atlas, 'logo', 13.8, Math.min(1.85, height - 0.35), 15.115, 2.2, 0.55, '+z')
  // Lampu dinding kecil di kedua sisi pintu utama & pintu samping.
  for (const x of [3.8, 6.4]) cylinder(root, materials.darkFrame, x, Math.min(1.3, height - 0.3), 15.14, 0.04, 0.18, 12)
  cylinder(root, materials.darkFrame, -0.14, Math.min(1.3, height - 0.3), 7.25, 0.04, 0.18, 12)
  cylinder(root, materials.darkFrame, 24.14, Math.min(1.3, height - 0.3), 12.65, 0.04, 0.18, 12)
  return root
}
