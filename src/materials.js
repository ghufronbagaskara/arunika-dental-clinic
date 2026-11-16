// Katalog material PBR. Warna mengikuti material nyata (plester putih hangat,
// aluminium, kaca, stainless, kayu), bukan warna jenuh.
// Tekstur lantai memakai file dari registry `assets.js` bila tersedia; jika
// tidak, dibuat secara prosedural di kanvas (ringan, tanpa unduhan).
import * as T from 'three'
import { assetUrl, textures as textureRegistry } from './assets.js'

// Bilangan acak deterministik supaya tekstur sama di setiap kunjungan.
function seededRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function makeCanvas(size) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

// Menggambar bentuk di posisi (x, y) beserta salinannya di tepi seberang,
// sehingga tekstur bisa diulang tanpa sambungan terlihat.
function drawWrapped(size, x, y, radius, draw) {
  for (const dx of [-size, 0, size]) {
    for (const dy of [-size, 0, size]) {
      const px = x + dx
      const py = y + dy
      if (px + radius < 0 || px - radius > size || py + radius < 0 || py - radius > size) continue
      draw(px, py)
    }
  }
}

function speckle(ctx, size, random, count, colors, minRadius, maxRadius, alpha = 1) {
  ctx.globalAlpha = alpha
  for (let i = 0; i < count; i++) {
    const x = random() * size
    const y = random() * size
    const radius = minRadius + random() * (maxRadius - minRadius)
    ctx.fillStyle = colors[Math.floor(random() * colors.length)]
    const corners = 4 + Math.floor(random() * 3)
    const rotation = random() * Math.PI
    drawWrapped(size, x, y, radius, (px, py) => {
      ctx.beginPath()
      for (let c = 0; c < corners; c++) {
        const angle = rotation + c / corners * Math.PI * 2
        const r = radius * (0.65 + random() * 0.35)
        const vx = px + Math.cos(angle) * r
        const vy = py + Math.sin(angle) * r
        if (c === 0) ctx.moveTo(vx, vy)
        else ctx.lineTo(vx, vy)
      }
      ctx.closePath()
      ctx.fill()
    })
  }
  ctx.globalAlpha = 1
}

const proceduralPainters = {
  // Terrazzo publik: dasar krem hangat, serpihan batu, dan nat kuningan tiap 1,2 m.
  terrazzo(ctx, size) {
    const random = seededRandom(11)
    ctx.fillStyle = '#e8e2d7'
    ctx.fillRect(0, 0, size, size)
    speckle(ctx, size, random, 1800, ['#d7cebf', '#cbc2b3', '#efe9df'], 1, 3, 0.8)
    speckle(ctx, size, random, 520, ['#b4aa9b', '#9b958d', '#c8b79c', '#f6f2ea', '#8c8a86'], 2, 6)
    speckle(ctx, size, random, 40, ['#b98d6c', '#7f8a86', '#a99a82'], 5, 10)
    ctx.fillStyle = 'rgba(150, 120, 70, 0.55)'
    ctx.fillRect(0, 0, size, 2)
    ctx.fillRect(0, 0, 2, size)
  },
  // Vinyl lembaran klinis: abu kehijauan sangat lembut, bintik halus, sambungan las tiap 2 m.
  vinyl(ctx, size) {
    const random = seededRandom(23)
    ctx.fillStyle = '#d9dfdb'
    ctx.fillRect(0, 0, size, size)
    speckle(ctx, size, random, 2600, ['#cfd6d2', '#e3e8e4', '#c4ccc8'], 0.6, 1.8, 0.7)
    ctx.fillStyle = 'rgba(120, 135, 128, 0.35)'
    ctx.fillRect(0, 0, 1.5, size)
  },
  // Ubin keramik toilet 30 × 60 cm: 2 kolom × 4 baris per ulangan 1,2 m.
  tile(ctx, size) {
    const random = seededRandom(37)
    ctx.fillStyle = '#b9b5ad'
    ctx.fillRect(0, 0, size, size)
    const columns = 2
    const rows = 4
    const grout = 3
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const shade = 214 + Math.floor(random() * 8)
        ctx.fillStyle = `rgb(${shade}, ${shade - 3}, ${shade - 8})`
        const width = size / columns
        const height = size / rows
        ctx.fillRect(column * width + grout / 2, row * height + grout / 2, width - grout, height - grout)
      }
    }
    speckle(ctx, size, random, 900, ['#cfcac2', '#e2ddd5'], 0.5, 1.5, 0.5)
  },
  // Vinyl motif kayu oak untuk ruang staf: papan 20 cm × 120 cm, sambungan berselang.
  wood(ctx, size) {
    const random = seededRandom(53)
    const rows = 12
    const plankHeight = size / rows
    for (let row = 0; row < rows; row++) {
      const offset = (row % 3) * size / 3
      for (let start = -size; start < size; start += size / 2) {
        const tone = 0.9 + random() * 0.18
        const r = Math.round(176 * tone)
        const g = Math.round(140 * tone)
        const b = Math.round(102 * tone)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        const x = start + offset
        ctx.fillRect(x, row * plankHeight, size / 2, plankHeight)
        ctx.strokeStyle = `rgba(${r - 40}, ${g - 36}, ${b - 30}, 0.25)`
        ctx.lineWidth = 1
        for (let line = 0; line < 6; line++) {
          const y = row * plankHeight + random() * plankHeight
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.bezierCurveTo(x + size / 6, y + random() * 4 - 2, x + size / 3, y + random() * 4 - 2, x + size / 2, y)
          ctx.stroke()
        }
        ctx.fillStyle = 'rgba(70, 50, 30, 0.35)'
        ctx.fillRect(x, row * plankHeight, 1.5, plankHeight)
      }
      ctx.fillStyle = 'rgba(70, 50, 30, 0.3)'
      ctx.fillRect(0, row * plankHeight, size, 1.2)
    }
  },
  // Lantai epoxy gudang: abu netral dengan bintik halus.
  epoxy(ctx, size) {
    const random = seededRandom(71)
    ctx.fillStyle = '#b8b9b4'
    ctx.fillRect(0, 0, size, size)
    speckle(ctx, size, random, 2200, ['#acadaa', '#c6c7c2', '#9fa09c'], 0.6, 1.6, 0.6)
  },
}

const surfaceRoughness = { terrazzo: 0.42, vinyl: 0.48, tile: 0.3, wood: 0.58, epoxy: 0.4, plaster: 0.92, veneer: 0.55 }

function configureTexture(texture, anisotropy, isColor) {
  texture.wrapS = T.RepeatWrapping
  texture.wrapT = T.RepeatWrapping
  texture.anisotropy = anisotropy
  if (isColor) texture.colorSpace = T.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function surfaceMaterial(key, anisotropy, textureLoader, onLoad) {
  const entry = textureRegistry[key] ?? {}
  const material = new T.MeshStandardMaterial({ roughness: surfaceRoughness[key] ?? 0.6, metalness: 0 })
  material.name = 'permukaan-' + key
  // Ukuran satu ulangan tekstur (meter). UV ditulis dalam meter / size.
  material.userData.textureSize = entry.size ?? 1
  const load = (path, isColor) => configureTexture(textureLoader.load(assetUrl(path), onLoad), anisotropy, isColor)

  if (entry.map) {
    material.map = load(entry.map, true)
    if (entry.normalMap) {
      material.normalMap = load(entry.normalMap, false)
      material.normalScale.set(0.6, 0.6)
    }
    if (entry.roughnessMap) {
      material.roughnessMap = load(entry.roughnessMap, false)
      material.roughness = 1
    }
  } else if (proceduralPainters[key]) {
    const canvas = makeCanvas(512)
    proceduralPainters[key](canvas.getContext('2d'), 512)
    material.map = configureTexture(new T.CanvasTexture(canvas), anisotropy, true)
  } else {
    material.color.set('#efebe4')
  }
  return material
}

export function createMaterials(renderer, onTextureLoad = () => {}) {
  const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
  const textureLoader = new T.TextureLoader()
  const standard = (name, parameters) => {
    const material = new T.MeshStandardMaterial(parameters)
    material.name = name
    return material
  }

  const materials = {
    // Arsitektur
    plasterExterior: standard('plester-luar', { color: '#e9e3d9', roughness: 0.95 }),
    cap: standard('potongan-dinding', { color: '#c9c2b6', roughness: 1 }),
    leadCap: standard('potongan-timbal', { color: '#a9adb0', roughness: 0.9 }),
    skirting: standard('plint', { color: '#8f877c', roughness: 0.55 }),
    slab: standard('pelat-lantai', { color: '#d6d0c6', roughness: 0.95 }),
    ground: standard('tanah', { color: '#d9d4ca', roughness: 1 }),
    paving: standard('paving', { color: '#cbc5ba', roughness: 0.9 }),
    lawn: standard('rumput', { color: '#9aa486', roughness: 1 }),
    aluminium: standard('aluminium', { color: '#b9b7b2', metalness: 0.85, roughness: 0.38 }),
    darkFrame: standard('kusen-gelap', { color: '#55524d', metalness: 0.6, roughness: 0.45 }),
    glass: standard('kaca', {
      color: '#cfe0df', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22,
      depthWrite: false, envMapIntensity: 1.4,
    }),
    frostedGlass: standard('kaca-buram', {
      color: '#e6ecea', roughness: 0.35, transparent: true, opacity: 0.55, depthWrite: false,
    }),

    // Perabot dan alat
    steel: standard('stainless', { color: '#c8cbcd', metalness: 1, roughness: 0.3 }),
    brushedSteel: standard('stainless-sikat', { color: '#babdbf', metalness: 1, roughness: 0.42 }),
    chrome: standard('krom', { color: '#e3e5e6', metalness: 1, roughness: 0.12 }),
    laminate: standard('laminasi-putih', { color: '#f1efea', roughness: 0.42 }),
    laminateWarm: standard('laminasi-krem', { color: '#e3dccf', roughness: 0.5 }),
    solidSurface: standard('solid-surface', { color: '#eeeae3', roughness: 0.28 }),
    walnut: standard('walnut', { color: '#7a5a42', roughness: 0.55 }),
    plasticWhite: standard('plastik-putih', { color: '#f3f2ee', roughness: 0.38 }),
    plasticGrey: standard('plastik-abu', { color: '#9a9c9c', roughness: 0.5 }),
    rubber: standard('karet', { color: '#2e2f30', roughness: 0.82 }),
    charcoal: standard('arang', { color: '#3a3b3c', roughness: 0.6 }),
    ceramic: standard('keramik', { color: '#f6f5f1', roughness: 0.14 }),
    mirror: standard('cermin', { color: '#dfe3e4', metalness: 1, roughness: 0.03 }),
    screen: standard('layar', { color: '#15191b', roughness: 0.18, metalness: 0.2 }),
    upholstery: standard('jok-kursi', { color: '#6f8e88', roughness: 0.82 }),
    upholsterySand: standard('jok-pasir', { color: '#c3ae93', roughness: 0.9 }),
    leadPanel: standard('panel-timbal', { color: '#9aa0a3', roughness: 0.48, metalness: 0.3 }),
    powderCoat: standard('besi-cat', { color: '#d8d6d0', roughness: 0.5, metalness: 0.2 }),
    lockerSage: standard('loker', { color: '#a9b5ad', roughness: 0.48, metalness: 0.2 }),
    binYellow: standard('tong-kuning', { color: '#dcae2f', roughness: 0.45 }),
    binGrey: standard('tong-abu', { color: '#7f8384', roughness: 0.5 }),
    cardboard: standard('kardus', { color: '#b58e62', roughness: 0.92 }),
    pouch: standard('pouch', { color: '#eef1f0', roughness: 0.6 }),
    leaf: standard('daun', { color: '#55704a', roughness: 0.75 }),
    leafLight: standard('daun-muda', { color: '#6f8a58', roughness: 0.75 }),
    pot: standard('pot', { color: '#a59d92', roughness: 0.85 }),
    soil: standard('tanah-pot', { color: '#4a3b30', roughness: 1 }),
    water: standard('air-galon', { color: '#bcd8e2', roughness: 0.08, transparent: true, opacity: 0.6, depthWrite: false }),
    // Aksen zona sterilisasi: merah muda (kotor) dan teal muda (bersih), lembut.
    accentDirty: standard('aksen-kotor', { color: '#e5b9b0', roughness: 0.5 }),
    accentClean: standard('aksen-bersih', { color: '#a9d3cb', roughness: 0.5 }),
    radiation: standard('tanda-radiasi', { color: '#e8c33a', roughness: 0.5 }),
  }

  for (const key of ['terrazzo', 'vinyl', 'tile', 'wood', 'epoxy']) {
    materials['floor-' + key] = surfaceMaterial(key, anisotropy, textureLoader, onTextureLoad)
  }

  // Dinding plester dan veneer kayu memakai UV dunia (diproyeksikan saat bake),
  // sehingga skala tekstur sama di semua balok.
  const plaster = surfaceMaterial('plaster', anisotropy, textureLoader, onTextureLoad)
  plaster.name = 'plester'
  plaster.color.set(textureRegistry.plaster?.map ? '#fbf7f0' : '#f0ece5')
  plaster.userData.worldUV = plaster.userData.textureSize
  materials.plaster = plaster

  for (const [name, tint] of [['oak', '#d9b892'], ['oakDoor', '#e4c9a6']]) {
    const veneer = surfaceMaterial('veneer', anisotropy, textureLoader, onTextureLoad)
    veneer.name = 'veneer-' + name
    if (textureRegistry.veneer?.map) veneer.color.set(tint)
    else veneer.color.set(name === 'oak' ? '#b48e66' : '#b89a74')
    veneer.roughness = textureRegistry.veneer?.map ? 1 : 0.55
    veneer.userData.worldUV = veneer.userData.textureSize
    materials[name] = veneer
  }
  return materials
}
