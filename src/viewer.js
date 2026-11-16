// Penampil maket 3D. Dimuat lazy dari main.js agar denah 2D tampil lebih dulu.
// Prinsip performa: render hanya saat ada perubahan (tanpa loop rAF saat diam),
// bayangan diperbarui hanya saat adegan berubah, dan ambient occlusion (GTAO)
// hanya dihitung pada frame diam di perangkat yang mampu.
import * as T from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { Pass } from 'three/addons/postprocessing/Pass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { buildArchitecture, buildSigns, createSignAtlas } from './architecture.js'
import { buildFurniture } from './furniture.js'
import { bake, clearGeometryCache, placeAssets } from './kit.js'
import { building, roomAt, roomLabels, rooms, wallSpec } from './layout.js'
import { loadModels } from './loader.js'
import { createMaterials } from './materials.js'
import { createFlowOverlay, createRoomHighlight, createWorkZoneOverlay } from './overlays.js'

const FOV = 32
const TARGET = new T.Vector3(building.width / 2, 0, building.depth / 2 - 0.3)

// Pass kecil untuk menyembunyikan objek transparan/overlay saat GTAO
// menghitung normal dan kedalaman, lalu menampilkannya kembali.
class VisibilityPass extends Pass {
  // `saved` dipakai bersama oleh pass sembunyikan dan pass tampilkan.
  constructor(objects, visible, saved) {
    super()
    this.objects = objects
    this.visible = visible
    this.saved = saved
    this.needsSwap = false
  }

  render() {
    for (const object of this.objects) {
      if (!this.visible) {
        this.saved.set(object, object.visible)
        object.visible = false
      } else {
        if (this.saved.has(object)) object.visible = this.saved.get(object)
      }
    }
  }
}

function detectQuality(renderer) {
  const params = new URLSearchParams(location.search)
  const forced = params.get('kualitas')
  const coarse = matchMedia('(pointer: coarse)').matches
  const small = Math.min(screen.width, screen.height) < 700
  const mobile = coarse || small
  const cores = navigator.hardwareConcurrency || 4
  const memory = navigator.deviceMemory || 8
  let software = false
  try {
    const gl = renderer.getContext()
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    software = /swiftshader|llvmpipe|software|basic render/i.test(name)
  } catch {
    software = false
  }
  const capable = !mobile && !software && cores > 4 && memory >= 4 && renderer.capabilities.isWebGL2
  if (forced === 'rendah') return { mobile: true, ao: false, shadowSize: 1024, pixelRatio: 1 }
  if (forced === 'tinggi') return { mobile: false, ao: true, shadowSize: 2048, pixelRatio: 2 }
  return {
    mobile,
    ao: capable,
    shadowSize: mobile || software ? 1024 : 2048,
    pixelRatio: mobile ? 1.5 : 2,
  }
}

export async function createViewer({ host, labelHost, onSelect, onProgress = () => {}, reducedMotion = false }) {
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  const canvas = renderer.domElement
  try {
    const quality = detectQuality(renderer)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio))
    renderer.outputColorSpace = T.SRGBColorSpace
    renderer.toneMapping = T.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = T.PCFShadowMap
    renderer.shadowMap.autoUpdate = false

    const modelsPromise = loadModels({ tier: 'core', onProgress })
    const scene = new T.Scene()
    scene.background = new T.Color('#e4ded2')

    // Environment map dari RoomEnvironment: pantulan lembut tanpa unduhan.
    const pmrem = new T.PMREMGenerator(renderer)
    const studio = new RoomEnvironment()
    scene.environment = pmrem.fromScene(studio, 0.04).texture
    scene.environmentIntensity = 0.5
    studio.dispose()
    pmrem.dispose()

    // Matahari pagi hangat, miring dari depan-kiri bangunan.
    const sun = new T.DirectionalLight('#ffe2c4', 2.5)
    sun.position.set(TARGET.x - 13, 15, TARGET.z + 12)
    sun.target.position.copy(TARGET)
    sun.castShadow = true
    sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize)
    Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 16, bottom: -16, near: 2, far: 60 })
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.025
    sun.shadow.radius = quality.mobile ? 2 : 3
    const fill = new T.HemisphereLight('#e9eef1', '#c7b79f', 0.6)
    scene.add(sun, sun.target, fill)

    // Tekstur foto dimuat asinkron; render ulang saat tiap tekstur siap.
    // Sebelum penampil siap, pemanggilan ini diabaikan (render pertama menyusul).
    let refresh = () => {}
    const materials = createMaterials(renderer, () => refresh())
    const assets = await modelsPromise

    // Benda transparan/overlay tidak ikut dihitung GTAO.
    const aoExcluded = []
    const noShadow = (material) => material.name.startsWith('permukaan-') || material.name === 'tanah'

    // Perabot: dibangun sekali lalu digabung per material.
    const furnitureSource = buildFurniture(materials, assets)
    const furniture = bake(furnitureSource, { noShadow })
    const assetGroup = new T.Group()
    placeAssets(furniture.markers, assets, assetGroup)
    scene.add(furniture.group, assetGroup)
    for (const mesh of furniture.group.children) if (mesh.material.transparent) aoExcluded.push(mesh)

    // Arsitektur dibangun ulang saat tinggi potongan berubah.
    const atlas = createSignAtlas()
    let architecture = null
    function buildWalls(height) {
      if (architecture) {
        scene.remove(architecture)
        architecture.traverse((node) => node.geometry?.dispose())
        for (const mesh of architecture.children) {
          const index = aoExcluded.indexOf(mesh)
          if (index >= 0) aoExcluded.splice(index, 1)
        }
      }
      const source = buildArchitecture(materials, height)
      source.add(buildSigns(atlas, materials, height))
      architecture = bake(source, { noShadow }).group
      scene.add(architecture)
      for (const mesh of architecture.children) if (mesh.material.transparent) aoExcluded.push(mesh)
      clearGeometryCache()
    }
    buildWalls(wallSpec.cut)
    clearGeometryCache()

    const flowOverlay = createFlowOverlay()
    const workZones = createWorkZoneOverlay()
    const highlight = createRoomHighlight()
    scene.add(flowOverlay.root, workZones, highlight.root)
    aoExcluded.push(flowOverlay.root, workZones, highlight.root)

    // Kamera perspektif lensa panjang.
    const camera = new T.PerspectiveCamera(FOV, 1, 0.5, 220)
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = !reducedMotion
    controls.dampingFactor = 0.12
    controls.minDistance = 4
    controls.maxDistance = 95
    controls.minPolarAngle = 0
    controls.maxPolarAngle = 1.32
    controls.screenSpacePanning = false
    controls.zoomToCursor = true

    // Pascaproses GTAO, hanya untuk frame diam.
    let composer = null
    let aoEnabled = quality.ao
    function setupComposer() {
      const target = new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: 4 })
      composer = new EffectComposer(renderer, target)
      composer.addPass(new RenderPass(scene, camera))
      const savedVisibility = new Map()
      composer.addPass(new VisibilityPass(aoExcluded, false, savedVisibility))
      const gtao = new GTAOPass(scene, camera, 1, 1)
      gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.4, thickness: 1.2, scale: 1.15, samples: 12 })
      gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 12 })
      gtao.blendIntensity = 0.9
      composer.addPass(gtao)
      composer.addPass(new VisibilityPass(aoExcluded, true, savedVisibility))
      composer.addPass(new OutputPass())
    }
    if (aoEnabled) setupComposer()

    // Label ruang (HTML) mengikuti proyeksi titik jangkar.
    const labels = rooms.map((room) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'room-tag'
      button.dataset.room = room.id
      button.setAttribute('aria-pressed', 'false')
      button.setAttribute('aria-label', room.id + ' ' + room.name)
      const number = document.createElement('span')
      number.className = 'room-tag-number'
      number.textContent = room.id
      const name = document.createElement('span')
      name.className = 'room-tag-name'
      name.textContent = roomLabels[room.id].short
      button.append(number, name)
      button.addEventListener('click', () => onSelect(room.id))
      labelHost.append(button)
      const [anchorX, anchorZ] = roomLabels[room.id].at
      const anchor = new T.Vector3(anchorX, 0.15, anchorZ)
      return { room, button, anchor, size: null }
    })

    let active = false
    let width = 0
    let height = 0
    let selected = null
    let frameRequested = false
    let idleTimer = 0
    let shadowsDirty = true
    let tween = null
    let flowClockStart = performance.now()
    let lastInteraction = performance.now()
    const slowFrames = []
    let lastFrameTime = 0
    const projected = new T.Vector3()

    function updateLabels() {
      const occupied = []
      const ordered = [...labels].sort((a, b) => Number(b.room.id === selected) - Number(a.room.id === selected))
      for (const label of ordered) {
        projected.copy(label.anchor).project(camera)
        const x = (projected.x + 1) * width / 2
        const y = (1 - projected.y) * height / 2
        const behind = projected.z > 1
        if (!label.size) label.size = [label.button.offsetWidth || 120, label.button.offsetHeight || 26]
        const [labelWidth, labelHeight] = label.size
        const box = [x - labelWidth / 2, y - labelHeight / 2, x + labelWidth / 2, y + labelHeight / 2]
        const clash = occupied.some((other) => box[0] < other[2] + 4 && box[2] > other[0] - 4 && box[1] < other[3] + 3 && box[3] > other[1] - 3)
        const outside = box[0] < 6 || box[2] > width - 6 || box[1] < 6 || box[3] > height - 6
        const hidden = behind || outside || clash
        label.button.hidden = hidden
        if (hidden) continue
        occupied.push(box)
        label.button.style.transform = `translate(${Math.round(box[0])}px, ${Math.round(box[1])}px)`
      }
    }

    function renderQuick() {
      if (shadowsDirty) {
        renderer.shadowMap.needsUpdate = true
        shadowsDirty = false
      }
      renderer.render(scene, camera)
      updateLabels()
    }

    function renderFinal() {
      if (!active || !width || !height) return
      if (aoEnabled && composer) {
        if (shadowsDirty) {
          renderer.shadowMap.needsUpdate = true
          shadowsDirty = false
        }
        composer.render()
        updateLabels()
      } else {
        renderQuick()
      }
    }

    function scheduleFinal() {
      clearTimeout(idleTimer)
      if (!aoEnabled) return
      idleTimer = setTimeout(renderFinal, 160)
    }

    function flowsAnimating() {
      if (reducedMotion || !flowOverlay.anyVisible()) return false
      // Animasi berhenti sendiri 12 detik setelah interaksi terakhir.
      return performance.now() - lastInteraction < 12000
    }

    // Menurunkan resolusi dan mematikan AO jika frame interaktif terlalu lambat.
    function watchPerformance(now) {
      if (lastFrameTime && now - lastFrameTime < 200) {
        slowFrames.push(now - lastFrameTime)
        if (slowFrames.length > 40) slowFrames.shift()
        const average = slowFrames.reduce((sum, value) => sum + value, 0) / slowFrames.length
        if (slowFrames.length === 40 && average > 45 && renderer.getPixelRatio() > 1) {
          renderer.setPixelRatio(1)
          aoEnabled = false
          resize()
          slowFrames.length = 0
          console.info('Arunika: kualitas diturunkan agar tetap lancar.')
        }
      }
      lastFrameTime = now
    }

    function frame(now) {
      frameRequested = false
      if (!active || !width || !height) return
      let moving = controls.update()
      if (tween) {
        const progress = Math.min((now - tween.start) / tween.duration, 1)
        const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
        camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased)
        controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased)
        camera.lookAt(controls.target)
        if (progress >= 1) {
          tween = null
          controls.update()
        }
        moving = true
      }
      const animating = flowsAnimating()
      if (animating) flowOverlay.animate((now - flowClockStart) / 1000)
      renderQuick()
      if (moving || animating) {
        watchPerformance(now)
        requestRender()
        clearTimeout(idleTimer)
      } else {
        lastFrameTime = 0
        scheduleFinal()
      }
    }

    function requestRender() {
      if (active && !frameRequested) {
        frameRequested = true
        requestAnimationFrame(frame)
      }
    }

    function touch() {
      lastInteraction = performance.now()
      requestRender()
    }

    function resize() {
      width = host.clientWidth
      height = host.clientHeight
      if (!width || !height) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      if (composer) {
        composer.setPixelRatio(renderer.getPixelRatio())
        composer.setSize(width, height)
      }
      for (const label of labels) label.size = null
      requestRender()
    }

    // Jarak kamera agar persegi [lebar × panjang] terlihat utuh dari sudut polar tertentu.
    function fitDistance(spanX, spanZ, polar) {
      const vertical = T.MathUtils.degToRad(FOV) / 2
      const horizontal = Math.atan(Math.tan(vertical) * (camera.aspect || 1.5))
      const projectedDepth = spanZ * Math.cos(polar) + 2.8 * Math.sin(polar)
      const byHeight = (projectedDepth / 2) / Math.tan(vertical) + spanZ * Math.sin(polar) / 2
      const byWidth = (spanX / 2) / Math.tan(horizontal) + spanZ * Math.sin(polar) / 2
      return Math.max(byHeight, byWidth)
    }

    function viewFrom(target, polar, azimuth, distance) {
      const position = new T.Vector3().setFromSphericalCoords(distance, polar, azimuth).add(target)
      return { position, target: target.clone() }
    }

    function presetView(name) {
      if (name === 'atas') {
        return viewFrom(TARGET, 0.0001, 0, fitDistance(building.width + 2.6, building.depth + 3.4, 0) * 1.04)
      }
      // Bola pembatas bangunan harus masuk ke sudut pandang tersempit.
      const vertical = T.MathUtils.degToRad(FOV) / 2
      const horizontal = Math.atan(Math.tan(vertical) * (camera.aspect || 1.5))
      const radius = Math.hypot(building.width, building.depth) / 2 + 0.6
      const distance = radius / Math.sin(Math.min(vertical, horizontal)) * 0.97
      // Sisi kiri-depan lebih dekat ke kamera dan tampak lebih besar, jadi titik tuju digeser ke kiri.
      return viewFrom(new T.Vector3(TARGET.x - 0.4, 0, TARGET.z + 0.3), 0.86, -0.5, distance)
    }

    function moveTo(view, animate = true) {
      clearTimeout(idleTimer)
      if (!animate || reducedMotion) {
        tween = null
        camera.position.copy(view.position)
        controls.target.copy(view.target)
        camera.lookAt(view.target)
        controls.update()
        requestRender()
        return
      }
      tween = {
        start: performance.now(),
        duration: 850,
        fromPosition: camera.position.clone(),
        toPosition: view.position,
        fromTarget: controls.target.clone(),
        toTarget: view.target,
      }
      requestRender()
    }

    let currentPreset = 'maket'

    function clampTarget() {
      controls.target.x = T.MathUtils.clamp(controls.target.x, -3, building.width + 3)
      controls.target.z = T.MathUtils.clamp(controls.target.z, -3, building.depth + 4)
      controls.target.y = 0
    }

    controls.addEventListener('change', () => {
      clampTarget()
      requestRender()
    })
    controls.addEventListener('start', () => {
      tween = null
      touch()
    })

    canvas.tabIndex = 0
    canvas.setAttribute('aria-label', 'Maket 3D. Tombol panah memutar kamera, plus dan minus memperbesar atau memperkecil.')
    canvas.addEventListener('keydown', (event) => {
      const offset = camera.position.clone().sub(controls.target)
      const spherical = new T.Spherical().setFromVector3(offset)
      if (event.key === '+' || event.key === '=') spherical.radius /= 1.15
      else if (event.key === '-' || event.key === '_') spherical.radius *= 1.15
      else if (event.key.startsWith('Arrow')) {
        spherical.theta += { ArrowLeft: -0.12, ArrowRight: 0.12 }[event.key] ?? 0
        spherical.phi += { ArrowUp: -0.08, ArrowDown: 0.08 }[event.key] ?? 0
      } else return
      event.preventDefault()
      spherical.radius = T.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance)
      spherical.phi = T.MathUtils.clamp(spherical.phi, 0.0001, controls.maxPolarAngle)
      camera.position.setFromSpherical(spherical).add(controls.target)
      camera.lookAt(controls.target)
      touch()
    })

    // Klik/ketuk lantai untuk memilih ruang.
    let pointerStart = null
    const raycaster = new T.Raycaster()
    const floorPlane = new T.Plane(new T.Vector3(0, 1, 0), 0)
    canvas.addEventListener('pointerdown', (event) => {
      lastInteraction = performance.now()
      if (event.isPrimary && event.button === 0) pointerStart = [event.clientX, event.clientY]
    })
    canvas.addEventListener('pointercancel', () => { pointerStart = null })
    canvas.addEventListener('pointerup', (event) => {
      if (!event.isPrimary || !pointerStart) return
      const [startX, startY] = pointerStart
      pointerStart = null
      if (Math.hypot(startX - event.clientX, startY - event.clientY) > 6) return
      const bounds = canvas.getBoundingClientRect()
      const pointer = new T.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.ray.intersectPlane(floorPlane, new T.Vector3())
      const room = hit && roomAt(hit.x, hit.z)
      if (room) onSelect(room.id)
    })

    host.append(canvas)
    new ResizeObserver(resize).observe(host)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) requestRender()
    })

    refresh = requestRender

    // Tahap kedua: figur manusia, tanaman, dan aksesori dimuat setelah maket tampil.
    const saveData = navigator.connection?.saveData === true
    if (!saveData) {
      loadModels({ tier: 'detail' }).then((detail) => {
        placeAssets(furniture.markers.filter(({ key }) => detail.has(key)), detail, assetGroup)
        shadowsDirty = true
        requestRender()
      })
    }

    return {
      canvas,
      quality: () => ({ ...quality, ao: aoEnabled }),
      show(visible) {
        active = visible
        if (!active) {
          clearTimeout(idleTimer)
          return
        }
        resize()
        if (!camera.userData.placed) {
          camera.userData.placed = true
          moveTo(presetView('maket'), false)
        }
        requestRender()
      },
      preset(name) {
        currentPreset = name
        moveTo(presetView(name))
      },
      reset() {
        moveTo(presetView(currentPreset))
      },
      focusRoom(id) {
        const room = rooms.find((item) => item.id === id)
        if (!room) return
        const [x, z, roomWidth, roomDepth] = room.rect
        const target = new T.Vector3(x + roomWidth / 2, 0, z + roomDepth / 2)
        const polar = currentPreset === 'atas' ? 0.0001 : 0.82
        const azimuth = currentPreset === 'atas' ? 0 : -0.42
        const distance = Math.max(fitDistance(roomWidth + 1.6, roomDepth + 1.6, polar), 9)
        moveTo(viewFrom(target, polar, azimuth, distance))
      },
      zoom(factor) {
        const offset = camera.position.clone().sub(controls.target)
        const length = T.MathUtils.clamp(offset.length() / factor, controls.minDistance, controls.maxDistance)
        camera.position.copy(controls.target).add(offset.setLength(length))
        touch()
      },
      select(id) {
        selected = id
        highlight.show(id)
        for (const label of labels) label.button.setAttribute('aria-pressed', String(label.room.id === id))
        requestRender()
      },
      setFlow(id, visible) {
        flowOverlay.setVisible(id, visible)
        flowClockStart = performance.now()
        touch()
      },
      setWorkZones(visible) {
        workZones.visible = visible
        touch()
      },
      setCut(full) {
        buildWalls(full ? wallSpec.height : wallSpec.cut)
        shadowsDirty = true
        touch()
      },
      // Render satu frame kualitas penuh lalu kembalikan kanvas untuk diunduh.
      capture() {
        if (!active || !width || !height || renderer.getContext().isContextLost()) {
          throw new Error('Maket 3D tidak tersedia')
        }
        renderFinal()
        return canvas
      },
    }
  } catch (error) {
    renderer.dispose()
    throw error
  }
}
