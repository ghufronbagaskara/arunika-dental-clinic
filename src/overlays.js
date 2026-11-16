// Lapisan informasi di maket 3D: pita alur di lantai/meja, zona kerja
// four-handed, dan sorotan ruang terpilih. Semua dari data `layout.js`.
import * as T from 'three'
import { clockDirection, flows, rooms, workZoneRadius, workZoneSets } from './layout.js'

const RIBBON_WIDTH = 0.12
const DASH_LENGTH = 0.5 // meter per siklus garis putus
const LEVEL_HEIGHT = { lantai: 0.018, meja: 1.02 }

function dashTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 4
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 40, 4)
  const texture = new T.CanvasTexture(canvas)
  texture.wrapS = T.RepeatWrapping
  texture.wrapT = T.ClampToEdgeWrapping
  texture.magFilter = T.LinearFilter
  texture.generateMipmaps = false
  texture.minFilter = T.LinearFilter
  return texture
}

// Pita datar sepanjang polyline. U = jarak kumulatif / DASH_LENGTH.
function ribbonGeometry(points, y, width) {
  const positions = []
  const uvs = []
  const indices = []
  let distance = 0
  for (let i = 1; i < points.length; i++) {
    const [x1, z1] = points[i - 1]
    const [x2, z2] = points[i]
    const length = Math.hypot(x2 - x1, z2 - z1)
    if (length < 1e-6) continue
    const dx = (x2 - x1) / length
    const dz = (z2 - z1) / length
    const nx = -dz * width / 2
    const nz = dx * width / 2
    // Ujung segmen diperpanjang setengah lebar agar sudut tertutup.
    const ex = dx * width / 2
    const ez = dz * width / 2
    const base = positions.length / 3
    const start = [x1 - (i > 1 ? ex : 0), z1 - (i > 1 ? ez : 0)]
    const end = [x2 + (i < points.length - 1 ? ex : 0), z2 + (i < points.length - 1 ? ez : 0)]
    positions.push(start[0] + nx, y, start[1] + nz, start[0] - nx, y, start[1] - nz, end[0] + nx, y, end[1] + nz, end[0] - nx, y, end[1] - nz)
    const u1 = distance / DASH_LENGTH
    const u2 = (distance + length) / DASH_LENGTH
    uvs.push(u1, 1, u1, 0, u2, 1, u2, 0)
    indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3)
    distance += length
  }
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

// Mata panah di ujung alur dan di tengah segmen panjang.
function arrowGeometry(paths, y) {
  const positions = []
  const addArrow = (x, z, dx, dz, size) => {
    const nx = -dz
    const nz = dx
    positions.push(
      x + dx * size, y + 0.001, z + dz * size,
      x - dx * size * 0.6 - nx * size * 0.75, y + 0.001, z - dz * size * 0.6 - nz * size * 0.75,
      x - dx * size * 0.6 + nx * size * 0.75, y + 0.001, z - dz * size * 0.6 + nz * size * 0.75,
    )
  }
  for (const points of paths) {
    for (let i = 1; i < points.length; i++) {
      const [x1, z1] = points[i - 1]
      const [x2, z2] = points[i]
      const length = Math.hypot(x2 - x1, z2 - z1)
      if (length < 1e-6) continue
      const dx = (x2 - x1) / length
      const dz = (z2 - z1) / length
      if (i === points.length - 1) addArrow(x2 - dx * 0.12, z2 - dz * 0.12, dx, dz, 0.2)
      else if (length > 2.2) addArrow((x1 + x2) / 2, (z1 + z2) / 2, dx, dz, 0.15)
    }
  }
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3))
  // Urutan titik bisa searah/berlawanan jarum jam, jadi material dua sisi.
  geometry.computeVertexNormals()
  return geometry
}

export function createFlowOverlay() {
  const root = new T.Group()
  root.name = 'alur'
  const baseTexture = dashTexture()
  const entries = new Map()

  flows.forEach((flow, index) => {
    const y = LEVEL_HEIGHT[flow.level] + index * 0.003
    const onTop = flow.level === 'meja'
    const texture = baseTexture.clone()
    texture.needsUpdate = true
    const ribbonMaterial = new T.MeshBasicMaterial({
      color: flow.color, map: texture, alphaTest: 0.5, side: T.DoubleSide,
      depthTest: !onTop, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false,
    })
    const underlayMaterial = new T.MeshBasicMaterial({
      color: flow.color, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false,
      depthTest: !onTop, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, toneMapped: false,
    })
    const arrowMaterial = new T.MeshBasicMaterial({
      color: flow.color, side: T.DoubleSide, depthTest: !onTop,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, toneMapped: false,
    })

    const group = new T.Group()
    group.name = 'alur-' + flow.id
    for (const points of flow.paths) {
      const underlay = new T.Mesh(ribbonGeometry(points, y - 0.001, RIBBON_WIDTH * 1.9), underlayMaterial)
      const ribbon = new T.Mesh(ribbonGeometry(points, y, RIBBON_WIDTH), ribbonMaterial)
      underlay.renderOrder = onTop ? 20 : 3
      ribbon.renderOrder = onTop ? 21 : 4
      group.add(underlay, ribbon)
    }
    const arrows = new T.Mesh(arrowGeometry(flow.paths, y), arrowMaterial)
    arrows.renderOrder = onTop ? 22 : 5
    group.add(arrows)
    group.visible = false
    root.add(group)
    entries.set(flow.id, { group, texture })
  })

  return {
    root,
    setVisible(id, visible) {
      const entry = entries.get(id)
      if (entry) entry.group.visible = visible
    },
    anyVisible() {
      return [...entries.values()].some(({ group }) => group.visible)
    },
    // Menggeser pola garis putus searah alur (detik → offset).
    animate(seconds) {
      for (const { texture } of entries.values()) texture.offset.x = -seconds * 0.9
    },
  }
}

// Sektor zona kerja sebagai cincin datar di lantai.
export function createWorkZoneOverlay() {
  const root = new T.Group()
  root.name = 'zona-kerja'
  const materials = new Map()
  const material = (color, opacity) => {
    const key = color + opacity
    if (!materials.has(key)) {
      materials.set(key, new T.MeshBasicMaterial({
        color, transparent: true, opacity, depthWrite: false, side: T.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, toneMapped: false,
      }))
    }
    return materials.get(key)
  }
  const { inner, outer, patient } = workZoneRadius

  for (const set of workZoneSets) {
    const [cx, cz] = set.center
    for (const sector of set.sectors) {
      const start = sector.from * Math.PI / 6
      const end = sector.to * Math.PI / 6
      // Konversi sudut jam (searah jarum jam dari -z) ke sudut RingGeometry.
      const geometry = new T.RingGeometry(inner, outer, 48, 1, Math.PI / 2 - end, end - start)
      const ring = new T.Mesh(geometry, material(sector.color, 0.34))
      ring.rotation.x = -Math.PI / 2
      ring.position.set(cx, 0.012, cz)
      ring.renderOrder = 2
      root.add(ring)
      // Garis batas sektor.
      const [dx, dz] = clockDirection(sector.from)
      const edge = new T.Mesh(new T.PlaneGeometry(0.025, outer - inner), material('#12343b', 0.5))
      edge.rotation.x = -Math.PI / 2
      edge.rotation.z = -Math.atan2(dx, -dz)
      const mid = (inner + outer) / 2
      edge.position.set(cx + dx * mid, 0.013, cz + dz * mid)
      root.add(edge)
    }
    const disc = new T.Mesh(new T.CircleGeometry(patient, 36), material('#f4f1ea', 0.5))
    disc.rotation.x = -Math.PI / 2
    disc.position.set(cx, 0.012, cz)
    root.add(disc)
  }
  root.visible = false
  return root
}

// Sorotan lantai dan garis tepi ruang terpilih.
export function createRoomHighlight() {
  const material = new T.MeshBasicMaterial({
    color: '#2a8c82', transparent: true, opacity: 0.16, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, toneMapped: false,
  })
  const plane = new T.Mesh(new T.PlaneGeometry(1, 1), material)
  plane.rotation.x = -Math.PI / 2
  plane.renderOrder = 1
  const lineMaterial = new T.LineBasicMaterial({ color: '#1d6f67', transparent: true, opacity: 0.9 })
  const outline = new T.LineLoop(new T.BufferGeometry(), lineMaterial)
  const root = new T.Group()
  root.add(plane, outline)
  root.visible = false
  return {
    root,
    show(id) {
      const room = rooms.find((item) => item.id === id)
      if (!room) {
        root.visible = false
        return
      }
      const [x, z, width, depth] = room.rect
      plane.scale.set(width - 0.14, depth - 0.14, 1)
      plane.position.set(x + width / 2, 0.01, z + depth / 2)
      const inset = 0.09
      outline.geometry.dispose()
      outline.geometry = new T.BufferGeometry().setFromPoints([
        new T.Vector3(x + inset, 0.02, z + inset), new T.Vector3(x + width - inset, 0.02, z + inset),
        new T.Vector3(x + width - inset, 0.02, z + depth - inset), new T.Vector3(x + inset, 0.02, z + depth - inset),
      ])
      root.visible = true
    },
  }
}
