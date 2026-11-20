// Pemuat model GLB dari registry `assets.js`. File dimuat paralel; model yang
// gagal dimuat dilewati supaya maket memakai pengganti prosedural.
import { Box3, Color, Group, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { assetUrl, models } from './assets.js'

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)

function normalize(scene, entry) {
  const [rx, ry, rz] = entry.rotation ?? [0, 0, 0]
  scene.rotation.set(rx, ry, rz)
  scene.updateMatrixWorld(true)

  let bounds = new Box3().setFromObject(scene, true)
  const size = bounds.getSize(new Vector3())
  let factor = entry.scale ?? 1
  if (entry.fit?.height) factor = entry.fit.height / size.y
  if (entry.fit?.length) factor = entry.fit.length / Math.max(size.x, size.z)
  scene.scale.setScalar(factor)
  scene.updateMatrixWorld(true)

  bounds = new Box3().setFromObject(scene, true)
  const center = bounds.getCenter(new Vector3())
  const [ox, oy, oz] = entry.offset ?? [0, 0, 0]
  scene.position.set(-center.x + ox, -bounds.min.y + oy, -center.z + oz)

  const wrapper = new Group()
  wrapper.add(scene)
  return wrapper
}

const HUMAN_KEYS = new Set(['dentist', 'nurse', 'receptionist', 'visitor-seated', 'visitor-standing'])

function prepareMaterials(scene, entry, key) {
  const tint = entry.tint ? new Color(entry.tint) : null
  const isHuman = HUMAN_KEYS.has(key)
  scene.traverse((node) => {
    if (!node.isMesh) return
    node.castShadow = true
    node.receiveShadow = true
    const list = Array.isArray(node.material) ? node.material : [node.material]
    for (const material of list) {
      if ('envMapIntensity' in material) {
        material.envMapIntensity = isHuman ? 0.52 : Math.min(material.envMapIntensity ?? 1, 0.9)
      }
      if (isHuman && 'roughness' in material) {
        material.roughness = Math.max(material.roughness ?? 0.65, 0.62)
      }
      if (tint && material.color) {
        material.color.copy(tint)
        material.map = null
        material.roughness = 0.5
        material.metalness = 0.35
        material.needsUpdate = true
      }
    }
  })
}

// Memuat kunci-kunci tertentu (atau semua dengan tier tertentu).
export async function loadModels({ tier = 'core', onProgress = () => {} } = {}) {
  const entries = Object.entries(models).filter(([, entry]) => entry?.file && (entry.tier ?? 'core') === tier)
  const progress = new Map(entries.map(([key]) => [key, 0]))

  const report = () => {
    let sum = 0
    for (const value of progress.values()) sum += value
    onProgress(entries.length ? sum / entries.length : 1)
  }

  const results = await Promise.allSettled(entries.map(async ([key, entry]) => {
    const gltf = await loader.loadAsync(assetUrl(entry.file), (event) => {
      if (event.total) {
        progress.set(key, Math.min(event.loaded / event.total, 1))
        report()
      }
    })
    progress.set(key, 1)
    report()
    prepareMaterials(gltf.scene, entry, key)
    return [key, normalize(gltf.scene, entry)]
  }))

  const loaded = new Map()
  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') loaded.set(result.value[0], result.value[1])
    else console.warn('Arunika: model "' + entries[index][0] + '" gagal dimuat.', result.reason)
  }
  onProgress(1)
  return loaded
}
