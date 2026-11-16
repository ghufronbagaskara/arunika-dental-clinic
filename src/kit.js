// Alat bantu pemodelan: primitif berbevel, grup, dan "bake" (penggabungan
// geometri statis per material supaya jumlah draw call kecil).
import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const geometryCache = new Map()

function cached(key, create) {
  if (!geometryCache.has(key)) geometryCache.set(key, create())
  return geometryCache.get(key)
}

const round3 = (value) => Math.round(value * 1000) / 1000

// Kotak dengan tepi dibulatkan (bevel). Radius 0 menghasilkan kotak biasa.
export function boxGeometry(width, height, depth, radius = 0) {
  const limit = Math.min(width, height, depth) / 2 - 0.0005
  const bevel = Math.min(radius, limit)
  const key = ['box', round3(width), round3(height), round3(depth), round3(bevel)].join('|')
  return cached(key, () => (bevel > 0.0015
    ? new RoundedBoxGeometry(width, height, depth, 2, bevel)
    : new T.BoxGeometry(width, height, depth)))
}

function cylinderGeometry(radiusTop, radiusBottom, height, segments) {
  const key = ['cyl', round3(radiusTop), round3(radiusBottom), round3(height), segments].join('|')
  return cached(key, () => new T.CylinderGeometry(radiusTop, radiusBottom, height, segments))
}

function sphereGeometry(segments) {
  return cached('sphere|' + segments, () => new T.SphereGeometry(1, segments, Math.max(6, Math.round(segments * 0.7))))
}

function torusGeometry(radius, tube, arc) {
  const key = ['torus', round3(radius), round3(tube), round3(arc)].join('|')
  return cached(key, () => new T.TorusGeometry(radius, tube, 8, 24, arc))
}

export function clearGeometryCache() {
  for (const geometry of geometryCache.values()) geometry.dispose()
  geometryCache.clear()
}

// Semua fungsi memakai y = alas benda (bukan titik tengah), lebih mudah dibaca
// untuk perabot yang berdiri di lantai atau di atas meja.
export function box(parent, material, x, y, z, width, height, depth, radius = 0) {
  const mesh = new T.Mesh(boxGeometry(width, height, depth, radius), material)
  mesh.position.set(x, y + height / 2, z)
  parent.add(mesh)
  return mesh
}

export function cylinder(parent, material, x, y, z, radius, height, segments = 18, radiusTop = radius) {
  const mesh = new T.Mesh(cylinderGeometry(radiusTop, radius, height, segments), material)
  mesh.position.set(x, y + height / 2, z)
  parent.add(mesh)
  return mesh
}

// Silinder rebah sepanjang sumbu x lokal (untuk palang, gagang, pipa).
export function bar(parent, material, x, y, z, length, radius, axis = 'x') {
  const mesh = new T.Mesh(cylinderGeometry(radius, radius, length, 10), material)
  mesh.position.set(x, y, z)
  if (axis === 'x') mesh.rotation.z = Math.PI / 2
  if (axis === 'z') mesh.rotation.x = Math.PI / 2
  parent.add(mesh)
  return mesh
}

export function ellipsoid(parent, material, x, y, z, radiusX, radiusY, radiusZ, segments = 14) {
  const mesh = new T.Mesh(sphereGeometry(segments), material)
  mesh.position.set(x, y, z)
  mesh.scale.set(radiusX, radiusY, radiusZ)
  parent.add(mesh)
  return mesh
}

export function torus(parent, material, x, y, z, radius, tube, arc = Math.PI * 2) {
  const mesh = new T.Mesh(torusGeometry(radius, tube, arc), material)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

export function group(parent, x = 0, y = 0, z = 0, rotationY = 0) {
  const node = new T.Group()
  node.position.set(x, y, z)
  node.rotation.y = rotationY
  parent.add(node)
  return node
}

// Penanda posisi model GLB. Setelah bake, penanda diganti klon model.
export function assetMarker(parent, key, x = 0, y = 0, z = 0, rotationY = 0) {
  const marker = new T.Object3D()
  marker.position.set(x, y, z)
  marker.rotation.y = rotationY
  marker.userData.assetKey = key
  parent.add(marker)
  return marker
}

function flipWinding(geometry) {
  const index = geometry.index.array
  for (let i = 0; i < index.length; i += 3) {
    const second = index[i + 1]
    index[i + 1] = index[i + 2]
    index[i + 2] = second
  }
  geometry.index.needsUpdate = true
}

function prepare(mesh) {
  let geometry = mesh.geometry.clone()
  for (const name of Object.keys(geometry.attributes)) {
    if (!['position', 'normal', 'uv'].includes(name)) geometry.deleteAttribute(name)
  }
  if (!geometry.attributes.uv) {
    geometry.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2))
  }
  if (!geometry.attributes.normal) geometry.computeVertexNormals()
  if (!geometry.index) {
    const count = geometry.attributes.position.count
    const indices = count > 65535 ? new Uint32Array(count) : new Uint16Array(count)
    for (let i = 0; i < count; i++) indices[i] = i
    geometry.setIndex(new T.BufferAttribute(indices, 1))
  }
  geometry.morphAttributes = {}
  geometry.clearGroups()
  geometry.applyMatrix4(mesh.matrixWorld)
  if (mesh.matrixWorld.determinant() < 0) flipWinding(geometry)
  return geometry
}

// UV proyeksi kotak dalam koordinat dunia: tekstur berskala sama di setiap
// permukaan, apa pun ukuran baloknya. `size` = meter per ulangan tekstur.
function projectWorldUV(geometry, size) {
  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  const uv = geometry.attributes.uv
  for (let i = 0; i < position.count; i++) {
    const nx = Math.abs(normal.getX(i))
    const ny = Math.abs(normal.getY(i))
    const nz = Math.abs(normal.getZ(i))
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    if (ny >= nx && ny >= nz) uv.setXY(i, x / size, z / size)
    else if (nx >= nz) uv.setXY(i, z / size, y / size)
    else uv.setXY(i, x / size, y / size)
  }
  uv.needsUpdate = true
}

// Menggabungkan semua mesh di `source` per material menjadi satu mesh per
// material. Penanda aset dikumpulkan agar bisa diganti klon GLB.
export function bake(source, options = {}) {
  const { noShadow = () => false } = options
  source.updateMatrixWorld(true)
  const buckets = new Map()
  const markers = []
  source.traverse((node) => {
    if (node.userData.assetKey) {
      markers.push({ key: node.userData.assetKey, matrix: node.matrixWorld.clone() })
      return
    }
    if (!node.isMesh) return
    if (!buckets.has(node.material)) buckets.set(node.material, [])
    buckets.get(node.material).push(prepare(node))
  })

  const output = new T.Group()
  for (const [material, geometries] of buckets) {
    const merged = mergeGeometries(geometries, false)
    for (const geometry of geometries) geometry.dispose()
    if (!merged) continue
    if (material.userData.worldUV) projectWorldUV(merged, material.userData.worldUV)
    merged.computeBoundingSphere()
    const mesh = new T.Mesh(merged, material)
    const transparent = material.transparent
    mesh.castShadow = !transparent && !noShadow(material)
    mesh.receiveShadow = true
    mesh.name = 'gabungan-' + material.name
    if (transparent) mesh.renderOrder = 2
    output.add(mesh)
  }
  return { group: output, markers }
}

// Mengganti penanda dengan klon model GLB (geometri dan material dipakai bersama).
export function placeAssets(markers, assets, target) {
  for (const { key, matrix } of markers) {
    const asset = assets.get(key)
    if (!asset) continue
    const clone = asset.clone(true)
    clone.applyMatrix4(matrix)
    target.add(clone)
  }
}
