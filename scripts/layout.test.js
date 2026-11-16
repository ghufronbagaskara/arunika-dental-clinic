// Tes data denah: dijalankan dengan `npm test` (node --test).
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  building, fixtureBounds, fixtures, flows, openings, openingTypes, roomArea, rooms,
  wallById, wallAxis, wallConstant, wallRange, walls, workZoneSets, zones,
} from '../src/layout.js'

const EPSILON = 1e-6

function overlaps(first, second) {
  const [x1, z1, w1, d1] = first
  const [x2, z2, w2, d2] = second
  const overlapX = Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2)
  const overlapZ = Math.min(z1 + d1, z2 + d2) - Math.max(z1, z2)
  return overlapX > EPSILON && overlapZ > EPSILON
}

test('ID ruang unik dan setiap ruang punya zona yang dikenal', () => {
  assert.equal(new Set(rooms.map(({ id }) => id)).size, rooms.length)
  for (const room of rooms) assert.ok(zones[room.zone], room.name)
})

test('Ruang tidak tumpang tindih', () => {
  for (const [index, room] of rooms.entries()) {
    for (const other of rooms.slice(index + 1)) {
      assert.equal(overlaps(room.rect, other.rect), false, room.name + ' / ' + other.name)
    }
  }
})

test('Seluruh ruang menutup bangunan 24 × 15 m tanpa sisa', () => {
  const { width, depth } = building
  for (const { rect: [x, z, w, d], name } of rooms) {
    assert.ok(x >= -EPSILON && z >= -EPSILON && x + w <= width + EPSILON && z + d <= depth + EPSILON, name)
  }
  const total = rooms.reduce((sum, room) => sum + roomArea(room), 0)
  assert.ok(Math.abs(total - width * depth) < EPSILON, 'Luas total ' + total)
})

test('Setiap bukaan berada di dalam dinding pemiliknya dan tidak saling bertumpuk', () => {
  for (const opening of openings) {
    const wall = wallById(opening.wall)
    assert.ok(wall, 'Dinding ' + opening.wall + ' untuk ' + opening.id)
    assert.ok(openingTypes[opening.type], 'Jenis ' + opening.type)
    const [start, end] = wallRange(wall)
    assert.ok(opening.start < opening.end, opening.id)
    assert.ok(opening.start >= start - EPSILON && opening.end <= end + EPSILON, opening.id + ' di luar dinding')
  }
  for (const wall of walls) {
    const list = openings.filter((opening) => opening.wall === wall.id).sort((a, b) => a.start - b.start)
    for (let i = 1; i < list.length; i++) {
      assert.ok(list[i].start >= list[i - 1].end - EPSILON, list[i - 1].id + ' / ' + list[i].id)
    }
  }
})

test('Pintu ruang berada pada dinding batas ruang yang dilayaninya', () => {
  for (const opening of openings.filter((item) => item.room)) {
    const wall = wallById(opening.wall)
    const room = rooms.find(({ id }) => id === opening.room)
    const [x, z, w, d] = room.rect
    const constant = wallConstant(wall)
    const middle = (opening.start + opening.end) / 2
    if (wallAxis(wall) === 'x') {
      assert.ok(Math.abs(constant - z) < EPSILON || Math.abs(constant - (z + d)) < EPSILON, opening.id)
      assert.ok(middle > x && middle < x + w, opening.id)
    } else {
      assert.ok(Math.abs(constant - x) < EPSILON || Math.abs(constant - (x + w)) < EPSILON, opening.id)
      assert.ok(middle > z && middle < z + d, opening.id)
    }
  }
})

// Mencari titik potong segmen alur dengan garis dinding. Mengembalikan
// koordinat sepanjang dinding, atau null jika tidak memotong.
function crossing(wall, [x1, z1], [x2, z2]) {
  const axis = wallAxis(wall)
  const constant = wallConstant(wall)
  const [start, end] = wallRange(wall)
  const across1 = axis === 'x' ? z1 : x1
  const across2 = axis === 'x' ? z2 : x2
  const along1 = axis === 'x' ? x1 : z1
  const along2 = axis === 'x' ? x2 : z2
  if ((across1 - constant) * (across2 - constant) > 0) return null
  if (Math.abs(across1 - across2) < EPSILON) {
    // Segmen sejajar dinding: hanya masalah jika berimpit dengan garis dinding.
    if (Math.abs(across1 - constant) > EPSILON) return null
    const low = Math.max(Math.min(along1, along2), start)
    const high = Math.min(Math.max(along1, along2), end)
    return high > low + EPSILON ? (low + high) / 2 : null
  }
  const t = (constant - across1) / (across2 - across1)
  const along = along1 + (along2 - along1) * t
  if (along < start - EPSILON || along > end + EPSILON) return null
  return along
}

test('Alur tidak menembus dinding, hanya lewat bukaan', () => {
  for (const flow of flows) {
    for (const path of flow.paths) {
      assert.ok(path.length >= 2, flow.id)
      for (let i = 1; i < path.length; i++) {
        for (const wall of walls) {
          const along = crossing(wall, path[i - 1], path[i])
          if (along === null) continue
          const through = openings.find((opening) => opening.wall === wall.id
            && along >= opening.start - EPSILON && along <= opening.end + EPSILON)
          assert.ok(through, `Alur ${flow.id} menembus dinding ${wall.id} di ${along.toFixed(2)} (segmen ${i})`)
          // Orang dan troli limbah hanya boleh lewat pintu/bukaan; baki instrumen boleh lewat pass-through.
          if (flow.level === 'lantai') {
            assert.ok(openingTypes[through.type].passable, `Alur ${flow.id} lewat ${through.id} yang bukan pintu`)
          }
        }
      }
    }
  }
})

test('Perabot berada di dalam ruangnya dan tidak saling bertabrakan', () => {
  const wallClearance = 0.055
  for (const fixture of fixtures) {
    const room = rooms.find(({ id }) => id === fixture.room)
    assert.ok(room, fixture.type)
    const [x, z, w, d] = room.rect
    const [minX, minZ, maxX, maxZ] = fixtureBounds(fixture)
    const label = fixture.type + ' di ' + room.name
    assert.ok(minX >= x + wallClearance - EPSILON && maxX <= x + w - wallClearance + EPSILON, label + ' (x)')
    assert.ok(minZ >= z + wallClearance - EPSILON && maxZ <= z + d - wallClearance + EPSILON, label + ' (z)')
  }
  const solid = fixtures.filter((fixture) => !fixture.stack)
  for (const [index, fixture] of solid.entries()) {
    const [ax1, az1, ax2, az2] = fixtureBounds(fixture)
    for (const other of solid.slice(index + 1)) {
      if (other.room !== fixture.room) continue
      const [bx1, bz1, bx2, bz2] = fixtureBounds(other)
      const hit = Math.min(ax2, bx2) - Math.max(ax1, bx1) > EPSILON && Math.min(az2, bz2) - Math.max(az1, bz1) > EPSILON
      assert.equal(hit, false, fixture.type + ' bertabrakan dengan ' + other.type + ' di ruang ' + fixture.room)
    }
  }
})

test('Ruang praktik 2 adalah cermin persis Ruang praktik 1', () => {
  // Figur manusia tidak termasuk perabot yang dicerminkan.
  const furnitureIn = (id) => fixtures.filter(({ room, type }) => room === id && !type.startsWith('person-'))
  const one = furnitureIn('05')
  const two = furnitureIn('07')
  assert.equal(one.length, two.length)
  for (const [index, fixture] of one.entries()) {
    assert.ok(Math.abs(17.7 - fixture.pos[0] - two[index].pos[0]) < EPSILON, fixture.type)
    assert.equal(fixture.pos[1], two[index].pos[1])
  }
})

test('Zona kerja menutup 12 jam penuh di kedua ruang praktik', () => {
  for (const set of workZoneSets) {
    const total = set.sectors.reduce((sum, sector) => sum + (sector.to - sector.from), 0)
    assert.equal(total, 12, set.room)
  }
})
