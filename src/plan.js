// Denah 2D (SVG) dari data `layout.js`. Tampil langsung saat halaman dibuka,
// sebelum maket 3D selesai dimuat. Satuan SVG = meter.
import {
  building, clockDirection, fixtures, flows, openings, roomArea,
  roomLabels, rooms, solidIntervals, sterilePartitionZ, sterileStations, wallAxis, wallConstant,
  wallRange, walls, workZoneRadius, workZoneSets, zones,
} from './layout.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const INK = '#12343b'
const VIEW = [-1.9, -2.3, building.width + 3.8, building.depth + 5.2]

function element(tag, attributes = {}, parent) {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value)
  parent?.append(node)
  return node
}

function text(parent, x, y, content, className, attributes = {}) {
  const node = element('text', { x, y, class: className, ...attributes }, parent)
  node.textContent = content
  return node
}

const format = (value) => value.toFixed(2).replace('.', ',')

// Persegi dinding antara dua koordinat sepanjang dinding.
function wallRect(wall, start, end, thickness = wall.thickness) {
  const constant = wallConstant(wall)
  return wallAxis(wall) === 'x'
    ? { x: start, y: constant - thickness / 2, width: end - start, height: thickness }
    : { x: constant - thickness / 2, y: start, width: thickness, height: end - start }
}

// Titik pada dinding: `along` sepanjang dinding, `across` tegak lurus.
function wallPoint(wall, along, across = 0) {
  const constant = wallConstant(wall)
  return wallAxis(wall) === 'x' ? [along, constant + across] : [constant + across, along]
}

function drawDefs(svg) {
  const defs = element('defs', {}, svg)
  const hatch = element('pattern', { id: 'arsir-timbal', width: 0.12, height: 0.12, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs)
  element('rect', { width: 0.12, height: 0.12, fill: INK }, hatch)
  element('line', { x1: 0, y1: 0, x2: 0, y2: 0.12, stroke: '#9aa3a6', 'stroke-width': 0.05 }, hatch)
  for (const flow of flows) {
    const marker = element('marker', {
      id: 'panah-' + flow.id, viewBox: '0 0 10 10', refX: 6, refY: 5,
      markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse', markerUnits: 'strokeWidth',
    }, defs)
    element('path', { d: 'M0 0 L10 5 L0 10 Z', fill: flow.color }, marker)
  }
}

function drawWalls(layer) {
  for (const wall of walls) {
    const [wallStart, wallEnd] = wallRange(wall)
    for (const [start, end] of solidIntervals(wall)) {
      const from = start === wallStart ? start - wall.thickness / 2 : start
      const to = end === wallEnd ? end + wall.thickness / 2 : end
      const fill = wall.kind === 'lead' ? 'url(#arsir-timbal)' : INK
      element('rect', { ...wallRect(wall, from, to), fill, class: 'plan-wall' }, layer)
    }
  }
}

function drawDoor(layer, wall, opening) {
  const hinges = opening.hinge === 'both' ? ['start', 'end'] : [opening.hinge ?? 'start']
  const leafWidth = (opening.end - opening.start) / hinges.length
  const swing = opening.swing ?? 1
  for (const hinge of hinges) {
    const along = hinge === 'start' ? opening.start : opening.end
    const closed = hinge === 'start' ? 1 : -1
    const [hx, hz] = wallPoint(wall, along)
    const [lx, lz] = wallPoint(wall, along, swing * leafWidth)
    const [cx, cz] = wallPoint(wall, along + closed * leafWidth)
    const cross = (lx - hx) * (cz - hz) - (lz - hz) * (cx - hx)
    const sweep = cross > 0 ? 1 : 0
    element('line', { x1: hx, y1: hz, x2: lx, y2: lz, class: 'plan-door-leaf' }, layer)
    element('path', { d: `M${lx} ${lz} A${leafWidth} ${leafWidth} 0 0 ${sweep} ${cx} ${cz}`, class: 'plan-door-swing' }, layer)
  }
}

function drawOpenings(layer) {
  for (const opening of openings) {
    const wall = walls.find(({ id }) => id === opening.wall)
    const rect = wallRect(wall, opening.start, opening.end)
    if (opening.type === 'jendela') {
      element('rect', { ...rect, class: 'plan-window' }, layer)
      const [x1, y1] = wallPoint(wall, opening.start)
      const [x2, y2] = wallPoint(wall, opening.end)
      element('line', { x1, y1, x2, y2, class: 'plan-window-line' }, layer)
    } else if (opening.type === 'pass-through') {
      element('rect', { ...rect, class: 'plan-pass plan-pass-' + opening.side }, layer)
    } else if (opening.type === 'loket') {
      element('rect', { ...rect, class: 'plan-counter' }, layer)
      element('rect', { ...wallRect(wall, opening.start - 0.06, opening.end + 0.06, 0.36), transform: 'translate(-0.14 0)', class: 'plan-counter-top' }, layer)
    } else if (opening.type === 'bukaan') {
      const [x1, y1] = wallPoint(wall, opening.start)
      const [x2, y2] = wallPoint(wall, opening.end)
      element('line', { x1, y1, x2, y2, class: 'plan-header-line' }, layer)
    } else {
      drawDoor(layer, wall, opening)
    }
  }
}

function drawFixtures(layer) {
  for (const fixture of fixtures) {
    if (fixture.stack || fixture.type.startsWith('person-')) continue
    const [x, z] = fixture.pos
    const [width, depth] = fixture.size
    const degrees = -fixture.rot * 180 / Math.PI
    const group = element('g', { transform: `translate(${x} ${z}) rotate(${degrees})`, class: 'plan-fixture' }, layer)
    if (fixture.type === 'operator-mark') {
      element('circle', { r: width / 2, class: 'plan-fixture-mark' }, group)
    } else if (fixture.shape === 'circle') {
      element('circle', { r: Math.min(width, depth) / 2 }, group)
    } else if (fixture.type === 'sterile-island') {
      element('rect', { x: -width / 2, y: -depth / 2, width, height: depth, rx: 0.04 }, group)
      // Strip stasiun (warna zona kotor/bersih) dan sekat kaca.
      for (const station of sterileStations) {
        const start = station.z[0] - z
        const end = station.z[1] - z
        element('rect', { x: -width / 2 + 0.08, y: start + 0.03, width: width - 0.16, height: end - start - 0.06, class: 'plan-station plan-station-' + station.side }, group)
        text(group, 0, (start + end) / 2, station.label, 'plan-station-text', { 'dominant-baseline': 'central' })
      }
      element('line', { x1: -width / 2 - 0.1, y1: sterilePartitionZ - z, x2: width / 2 + 0.1, y2: sterilePartitionZ - z, class: 'plan-partition' }, group)
    } else if (fixture.type === 'dental-unit') {
      // Kursi dental: kepala ke -z, ditandai sandaran kepala bulat.
      element('rect', { x: -width / 2, y: -depth / 2 + 0.25, width, height: depth - 0.25, rx: 0.2 }, group)
      element('circle', { cx: 0, cy: -depth / 2 + 0.22, r: 0.16 }, group)
    } else {
      element('rect', { x: -width / 2, y: -depth / 2, width, height: depth, rx: 0.03 }, group)
      // Garis tipis menandai sisi depan perabot.
      element('line', { x1: -width / 2 + 0.05, y1: depth / 2 - 0.06, x2: width / 2 - 0.05, y2: depth / 2 - 0.06, class: 'plan-fixture-front' }, group)
    }
    const title = element('title', {}, group)
    title.textContent = fixture.label ?? fixture.type
  }
}

function sectorPath(cx, cz, inner, outer, fromHour, toHour) {
  const point = (radius, hour) => {
    const [dx, dz] = clockDirection(hour)
    return [cx + dx * radius, cz + dz * radius]
  }
  const large = toHour - fromHour > 6 ? 1 : 0
  const [ax, az] = point(outer, fromHour)
  const [bx, bz] = point(outer, toHour)
  const [cxi, czi] = point(inner, toHour)
  const [dxi, dzi] = point(inner, fromHour)
  return `M${ax} ${az} A${outer} ${outer} 0 ${large} 1 ${bx} ${bz} L${cxi} ${czi} A${inner} ${inner} 0 ${large} 0 ${dxi} ${dzi} Z`
}

function drawWorkZones(layer) {
  const { inner, outer, patient } = workZoneRadius
  for (const set of workZoneSets) {
    const [cx, cz] = set.center
    for (const sector of set.sectors) {
      element('path', { d: sectorPath(cx, cz, inner, outer, sector.from, sector.to), fill: sector.color, class: 'plan-zone' }, layer)
      const [dx, dz] = clockDirection((sector.from + sector.to) / 2)
      const radius = (inner + outer) / 2
      text(layer, cx + dx * radius, cz + dz * radius, sector.label, 'plan-zone-text', { 'dominant-baseline': 'central' })
    }
    element('circle', { cx, cy: cz, r: patient, class: 'plan-zone-patient' }, layer)
    text(layer, cx, cz, 'Pasien', 'plan-zone-text', { 'dominant-baseline': 'central' })
  }
}

function drawFlows(layer) {
  const groups = new Map()
  for (const flow of flows) {
    const group = element('g', { class: 'plan-flow', 'data-flow': flow.id, style: `--flow: ${flow.color}` }, layer)
    for (const path of flow.paths) {
      const points = path.map(([x, z]) => x + ',' + z).join(' ')
      element('polyline', { points, class: 'plan-flow-halo' }, group)
      element('polyline', { points, class: 'plan-flow-line', 'marker-end': `url(#panah-${flow.id})` }, group)
      const [sx, sz] = path[0]
      element('circle', { cx: sx, cy: sz, r: 0.11, class: 'plan-flow-start' }, group)
    }
    group.setAttribute('visibility', 'hidden')
    groups.set(flow.id, group)
  }
  return groups
}

function drawAnnotations(layer) {
  const { width, depth } = building
  // Garis ukur keseluruhan.
  const dimension = element('g', { class: 'plan-dimension' }, layer)
  element('line', { x1: 0, y1: -1.2, x2: width, y2: -1.2 }, dimension)
  for (const x of [0, width]) element('line', { x1: x, y1: -1.45, x2: x, y2: -0.95 }, dimension)
  text(dimension, width / 2, -1.42, format(width) + ' m', 'plan-dimension-text')
  element('line', { x1: -1.2, y1: 0, x2: -1.2, y2: depth }, dimension)
  for (const z of [0, depth]) element('line', { x1: -1.45, y1: z, x2: -0.95, y2: z }, dimension)
  text(dimension, -1.42, depth / 2, format(depth) + ' m', 'plan-dimension-text', { transform: `rotate(-90 -1.42 ${depth / 2})` })

  // Pintu masuk utama.
  const entry = element('g', { class: 'plan-entry' }, layer)
  element('path', { d: 'M5.1 17.35 L5.1 15.75 M4.8 16.1 L5.1 15.75 L5.4 16.1' }, entry)
  text(entry, 5.1, 17.85, 'Masuk', 'plan-note')

  // Arah cahaya pagi (dari depan-kiri).
  const sun = element('g', { class: 'plan-sun' }, layer)
  element('circle', { cx: -0.75, cy: 17.0, r: 0.28 }, sun)
  element('path', { d: 'M-0.3 16.55 L0.75 15.5 M0.35 15.55 L0.75 15.5 L0.7 15.9' }, sun)
  text(sun, -0.75, 17.75, 'Cahaya pagi', 'plan-note', { 'text-anchor': 'start', x: -1.03 })

  // Batang skala 5 m.
  const scale = element('g', { class: 'plan-scale', transform: `translate(${width - 5} 16.6)` }, layer)
  for (let i = 0; i < 5; i++) {
    element('rect', { x: i, y: 0, width: 1, height: 0.16, fill: i % 2 ? '#f4f1ea' : INK }, scale)
  }
  element('rect', { x: 0, y: 0, width: 5, height: 0.16, fill: 'none', stroke: INK, 'stroke-width': 0.03 }, scale)
  text(scale, 0, 0.62, '0', 'plan-note')
  text(scale, 5, 0.62, '5 m', 'plan-note')
}

export function drawPlan(host, { onSelect }) {
  const svg = element('svg', {
    viewBox: VIEW.join(' '),
    role: 'group',
    'aria-label': 'Denah Arunika Dental Care. Pintu masuk di sisi bawah. Pilih ruang untuk melihat keterangan.',
    preserveAspectRatio: 'xMidYMid meet',
  })
  drawDefs(svg)
  element('rect', { x: VIEW[0], y: VIEW[1], width: VIEW[2], height: VIEW[3], class: 'plan-paper' }, svg)
  element('rect', { x: -0.1, y: -0.1, width: building.width + 0.2, height: building.depth + 0.2, class: 'plan-slab' }, svg)

  const roomLayer = element('g', { class: 'plan-rooms' }, svg)
  const roomNodes = new Map()
  for (const room of rooms) {
    const [x, z, width, depth] = room.rect
    const node = element('rect', {
      x, y: z, width, height: depth, fill: zones[room.zone].tint,
      class: 'plan-room', tabindex: '0', role: 'button',
      'aria-label': room.id + ' ' + room.name, 'aria-pressed': 'false', 'data-room': room.id,
    }, roomLayer)
    node.addEventListener('click', () => onSelect(room.id))
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onSelect(room.id)
      }
    })
    roomNodes.set(room.id, node)
  }

  const zoneLayer = element('g', { class: 'plan-zones', visibility: 'hidden' }, svg)
  drawWorkZones(zoneLayer)
  drawFixtures(element('g', { class: 'plan-fixtures' }, svg))
  drawWalls(element('g', { class: 'plan-walls' }, svg))
  drawOpenings(element('g', { class: 'plan-openings' }, svg))
  const flowGroups = drawFlows(element('g', { class: 'plan-flows' }, svg))

  const labelLayer = element('g', { class: 'plan-labels', 'aria-hidden': 'true' }, svg)
  for (const room of rooms) {
    const { short, at: [x, z] } = roomLabels[room.id]
    const tag = element('g', { class: 'plan-tag', 'data-room': room.id, transform: `translate(${x} ${z})` }, labelLayer)
    element('circle', { r: 0.36, class: 'plan-tag-circle' }, tag)
    text(tag, 0, 0, room.id, 'plan-tag-number', { 'dominant-baseline': 'central' })
    // Nama dan luas di kanan lingkaran nomor.
    text(tag, 0.5, -0.02, short, 'plan-tag-name')
    text(tag, 0.5, 0.34, format(roomArea(room)).replace(',00', '') + ' m²', 'plan-tag-area')
  }
  drawAnnotations(element('g', { class: 'plan-annotations', 'aria-hidden': 'true' }, svg))
  host.append(svg)

  return {
    svg,
    select(id) {
      for (const [roomId, node] of roomNodes) {
        node.classList.toggle('selected', roomId === id)
        node.setAttribute('aria-pressed', String(roomId === id))
      }
      for (const tag of labelLayer.children) tag.classList.toggle('selected', tag.dataset.room === id)
    },
    setFlow(id, visible) {
      flowGroups.get(id)?.setAttribute('visibility', visible ? 'visible' : 'hidden')
      flowGroups.get(id)?.classList.toggle('active', visible)
    },
    setWorkZones(visible) {
      zoneLayer.setAttribute('visibility', visible ? 'visible' : 'hidden')
    },
  }
}

