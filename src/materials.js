// Katalog material PBR. Warna mengikuti material nyata (plester mineral,
// terrazzo, vinyl medis seamless, keramik, aluminium, kaca, stainless, kayu).
// Tekstur memakai peta PBR foto dari `assets.js` atau generator PBR prosedural
// (peta warna + normal + roughness) di kanvas agar permukaan terasa nyata.
import * as T from 'three'
import { assetUrl, textures as textureRegistry } from './assets.js'

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

// Konversi heightfield grayscale menjadi peta normal tangent-space (OpenGL).
function heightToNormalCanvas(heightCanvas, strength = 2.0) {
  const size = heightCanvas.width
  const src = heightCanvas.getContext('2d').getImageData(0, 0, size, size).data
  const outCanvas = makeCanvas(size)
  const outCtx = outCanvas.getContext('2d')
  const img = outCtx.createImageData(size, size)
  const dst = img.data
  const sample = (x, y) => {
    const wx = ((x % size) + size) % size
    const wy = ((y % size) + size) % size
    return src[(wy * size + wx) * 4] / 255
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const idx = (y * size + x) * 4
      dst[idx] = Math.round(((-dx / len) * 0.5 + 0.5) * 255)
      dst[idx + 1] = Math.round(((dy / len) * 0.5 + 0.5) * 255)
      dst[idx + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255)
      dst[idx + 3] = 255
    }
  }
  outCtx.putImageData(img, 0, 0)
  return outCanvas
}

function paintNoiseHeight(ctx, size, seed, minVal = 118, maxVal = 138) {
  const img = ctx.createImageData(size, size)
  const data = img.data
  const random = seededRandom(seed)
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.round(minVal + random() * (maxVal - minVal))
    data[i] = data[i + 1] = data[i + 2] = v
    data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
}

function buildVinylPBR(size = 512) {
  const color = makeCanvas(size)
  const c = color.getContext('2d')
  const random = seededRandom(23)
  c.fillStyle = '#dde5e1'
  c.fillRect(0, 0, size, size)
  speckle(c, size, random, 3400, ['#d0dad5', '#e7ede9', '#c7d3cd', '#b7c6bf'], 0.6, 1.9, 0.72)
  c.fillStyle = 'rgba(130, 146, 140, 0.28)'
  c.fillRect(0, 0, 2, size)
  c.fillStyle = 'rgba(255, 255, 255, 0.22)'
  c.fillRect(2, 0, 1.5, size)

  const height = makeCanvas(size)
  const h = height.getContext('2d')
  paintNoiseHeight(h, size, 24, 124, 134)
  h.fillStyle = '#505050'
  h.fillRect(0, 0, 2, size)

  const rough = makeCanvas(size)
  const r = rough.getContext('2d')
  r.fillStyle = 'rgb(112, 112, 112)'
  r.fillRect(0, 0, size, size)
  speckle(r, size, seededRandom(25), 900, ['rgb(100,100,100)', 'rgb(126,126,126)'], 1, 3, 0.5)
  r.fillStyle = 'rgb(175, 175, 175)'
  r.fillRect(0, 0, 2, size)

  return { color, normal: heightToNormalCanvas(height, 1.4), rough }
}

function buildEpoxyPBR(size = 512) {
  const color = makeCanvas(size)
  const c = color.getContext('2d')
  const random = seededRandom(71)
  c.fillStyle = '#b9bbb6'
  c.fillRect(0, 0, size, size)
  speckle(c, size, random, 2800, ['#a9aca7', '#c8cac4', '#989a95'], 0.6, 1.8, 0.65)
  c.fillStyle = 'rgba(92, 95, 92, 0.42)'
  c.fillRect(0, 0, 2, size)
  c.fillRect(0, 0, size, 2)

  const height = makeCanvas(size)
  const h = height.getContext('2d')
  paintNoiseHeight(h, size, 72, 122, 134)
  h.fillStyle = '#484848'
  h.fillRect(0, 0, 2, size)
  h.fillRect(0, 0, size, 2)

  const rough = makeCanvas(size)
  const r = rough.getContext('2d')
  r.fillStyle = 'rgb(102, 102, 102)'
  r.fillRect(0, 0, size, size)
  r.fillStyle = 'rgb(185, 185, 185)'
  r.fillRect(0, 0, 2, size)
  r.fillRect(0, 0, size, 2)
  return { color, normal: heightToNormalCanvas(height, 1.8), rough }
}

function buildPlasterExteriorPBR(size = 512) {
  const color = makeCanvas(size)
  const c = color.getContext('2d')
  const random = seededRandom(91)
  c.fillStyle = '#eae3d6'
  c.fillRect(0, 0, size, size)
  speckle(c, size, random, 3600, ['#dfd7c8', '#f2ede3', '#d6cebe'], 0.8, 2.8, 0.55)
  // Garis nad/alur fasad horizontal tipis tiap 50 cm (170 px untuk 1.5 m).
  c.fillStyle = 'rgba(130, 120, 106, 0.25)'
  for (const y of [0, Math.round(size / 2)]) c.fillRect(0, y, size, 2)

  const height = makeCanvas(size)
  const h = height.getContext('2d')
  paintNoiseHeight(h, size, 92, 108, 148)
  h.fillStyle = '#383838'
  for (const y of [0, Math.round(size / 2)]) h.fillRect(0, y, size, 2)

  const rough = makeCanvas(size)
  const r = rough.getContext('2d')
  r.fillStyle = 'rgb(228, 228, 228)'
  r.fillRect(0, 0, size, size)
  return { color, normal: heightToNormalCanvas(height, 2.1), rough }
}

function buildWallTilePBR(size = 512) {
  const color = makeCanvas(size)
  const c = color.getContext('2d')
  const height = makeCanvas(size)
  const h = height.getContext('2d')
  const rough = makeCanvas(size)
  const r = rough.getContext('2d')
  const random = seededRandom(105)

  c.fillStyle = '#c9c4ba'
  c.fillRect(0, 0, size, size)
  h.fillStyle = '#303030'
  h.fillRect(0, 0, size, size)
  r.fillStyle = 'rgb(220, 220, 220)'
  r.fillRect(0, 0, size, size)

  const cols = 4
  const rows = 8
  const cw = size / cols
  const rh = size / rows
  const grout = 3
  for (let row = 0; row < rows; row++) {
    const offset = (row % 2) * (cw / 2)
    for (let col = -1; col <= cols; col++) {
      const x = col * cw + offset
      const y = row * rh
      const shade = 238 + Math.floor(random() * 10)
      c.fillStyle = `rgb(${shade}, ${shade + 1}, ${shade - 3})`
      c.fillRect(x + grout / 2, y + grout / 2, cw - grout, rh - grout)
      h.fillStyle = '#e0e0e0'
      h.fillRect(x + grout / 2 + 1, y + grout / 2 + 1, cw - grout - 2, rh - grout - 2)
      r.fillStyle = 'rgb(64, 64, 64)'
      r.fillRect(x + grout / 2, y + grout / 2, cw - grout, rh - grout)
    }
  }
  return { color, normal: heightToNormalCanvas(height, 2.4), rough }
}

function buildFlutedOakPBR(size = 512) {
  const color = makeCanvas(size)
  const c = color.getContext('2d')
  const height = makeCanvas(size)
  const h = height.getContext('2d')
  const rough = makeCanvas(size)
  const r = rough.getContext('2d')
  const random = seededRandom(119)

  const slats = 12
  const sw = size / slats
  const gap = Math.round(sw * 0.24)
  for (let i = 0; i < slats; i++) {
    const x = i * sw
    // Celah bayangan gelap antar bilah kayu.
    c.fillStyle = '#2d2219'
    c.fillRect(x, 0, gap, size)
    h.fillStyle = '#202020'
    h.fillRect(x, 0, gap, size)
    r.fillStyle = 'rgb(230, 230, 230)'
    r.fillRect(x, 0, gap, size)

    const tone = 0.88 + random() * 0.22
    const cr = Math.round(182 * tone)
    const cg = Math.round(136 * tone)
    const cb = Math.round(92 * tone)
    c.fillStyle = `rgb(${cr}, ${cg}, ${cb})`
    c.fillRect(x + gap, 0, sw - gap, size)
    c.fillStyle = `rgba(${cr - 36}, ${cg - 28}, ${cb - 22}, 0.28)`
    for (let g = 0; g < 6; g++) {
      c.fillRect(x + gap + Math.floor(random() * (sw - gap)), 0, 1.5, size)
    }
    h.fillStyle = '#dcdcdc'
    h.fillRect(x + gap + 1, 0, sw - gap - 2, size)
    r.fillStyle = 'rgb(138, 138, 138)'
    r.fillRect(x + gap, 0, sw - gap, size)
  }
  return { color, normal: heightToNormalCanvas(height, 2.8), rough }
}

function buildPavingPBR(size = 512) {
  const color = makeCanvas(size)
  const c = color.getContext('2d')
  const height = makeCanvas(size)
  const h = height.getContext('2d')
  const random = seededRandom(131)

  c.fillStyle = '#9a9387'
  c.fillRect(0, 0, size, size)
  h.fillStyle = '#3c3c3c'
  h.fillRect(0, 0, size, size)

  const cols = 4
  const rows = 8
  const cw = size / cols
  const rh = size / rows
  const gap = 4
  const shades = ['#d8d1c4', '#cfc8ba', '#dfd9cd', '#c7c0b2']
  for (let row = 0; row < rows; row++) {
    const offset = (row % 2) * (cw / 2)
    for (let col = -1; col <= cols; col++) {
      const x = col * cw + offset
      const y = row * rh
      c.fillStyle = shades[Math.floor(random() * shades.length)]
      c.fillRect(x + gap / 2, y + gap / 2, cw - gap, rh - gap)
      h.fillStyle = '#d4d4d4'
      h.fillRect(x + gap / 2 + 1, y + gap / 2 + 1, cw - gap - 2, rh - gap - 2)
    }
  }
  speckle(c, size, random, 1200, ['#bab3a6', '#e6e0d4'], 0.6, 1.8, 0.35)
  return { color, normal: heightToNormalCanvas(height, 2.2) }
}

function buildAsphaltPBR(size = 512) {
  const color = makeCanvas(size)
  const c = color.getContext('2d')
  const random = seededRandom(149)
  c.fillStyle = '#4c5154'
  c.fillRect(0, 0, size, size)
  speckle(c, size, random, 4800, ['#3d4144', '#5c6165', '#686d70', '#333739'], 0.7, 2.0, 0.75)

  const height = makeCanvas(size)
  paintNoiseHeight(height.getContext('2d'), size, 150, 96, 160)
  return { color, normal: heightToNormalCanvas(height, 1.8) }
}

function buildStonePlinthPBR(size = 512) {
  const color = makeCanvas(size)
  const c = color.getContext('2d')
  const random = seededRandom(163)
  c.fillStyle = '#7e786f'
  c.fillRect(0, 0, size, size)
  speckle(c, size, random, 3200, ['#6a645c', '#918b81', '#5a554e', '#a39d93'], 0.9, 3.2, 0.65)
  c.fillStyle = 'rgba(45, 42, 38, 0.35)'
  c.fillRect(0, size / 2, size, 2)

  const height = makeCanvas(size)
  const h = height.getContext('2d')
  paintNoiseHeight(h, size, 164, 98, 158)
  h.fillStyle = '#383838'
  h.fillRect(0, size / 2, size, 2)
  return { color, normal: heightToNormalCanvas(height, 2.2) }
}

function buildLawnPBR(size = 512) {
  const color = makeCanvas(size)
  const c = color.getContext('2d')
  const random = seededRandom(179)
  c.fillStyle = '#8b9d76'
  c.fillRect(0, 0, size, size)
  speckle(c, size, random, 5000, ['#7b8d67', '#9cad86', '#6f815c', '#a8b792'], 0.8, 2.4, 0.7)
  return { color }
}

const proceduralPBRBuilders = {
  vinyl: buildVinylPBR,
  epoxy: buildEpoxyPBR,
  plasterExterior: buildPlasterExteriorPBR,
  wallTile: buildWallTilePBR,
  flutedOak: buildFlutedOakPBR,
  paving: buildPavingPBR,
  asphalt: buildAsphaltPBR,
  stonePlinth: buildStonePlinthPBR,
  lawn: buildLawnPBR,
}

const surfaceRoughness = {
  terrazzo: 0.66,
  vinyl: 0.44,
  tile: 0.74,
  wood: 0.82,
  epoxy: 0.38,
  plaster: 0.86,
  plasterExterior: 0.92,
  wallTile: 0.25,
  flutedOak: 0.62,
  paving: 0.86,
  asphalt: 0.9,
  stonePlinth: 0.88,
  lawn: 0.98,
  veneer: 0.55,
}

function configureTexture(texture, anisotropy, isColor) {
  texture.wrapS = T.RepeatWrapping
  texture.wrapT = T.RepeatWrapping
  texture.anisotropy = anisotropy
  if (isColor) texture.colorSpace = T.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function surfaceMaterial(key, anisotropy, textureLoader, onLoad, options = {}) {
  const entry = textureRegistry[key] ?? {}
  const material = new T.MeshStandardMaterial({
    roughness: surfaceRoughness[key] ?? 0.6,
    metalness: 0,
    envMapIntensity: options.envMapIntensity ?? 0.65,
  })
  material.name = 'permukaan-' + key
  material.userData.textureSize = options.size ?? entry.size ?? 1
  const load = (path, isColor) => configureTexture(textureLoader.load(assetUrl(path), onLoad), anisotropy, isColor)

  if (entry.map) {
    material.map = load(entry.map, true)
    if (entry.normalMap) {
      material.normalMap = load(entry.normalMap, false)
      const ns = options.normalScale ?? 0.85
      material.normalScale.set(ns, ns)
    }
    if (entry.roughnessMap) {
      material.roughnessMap = load(entry.roughnessMap, false)
      material.roughness = surfaceRoughness[key] ?? 1
    }
  } else if (proceduralPBRBuilders[key]) {
    const maps = proceduralPBRBuilders[key](512)
    material.map = configureTexture(new T.CanvasTexture(maps.color), anisotropy, true)
    if (maps.normal) {
      material.normalMap = configureTexture(new T.CanvasTexture(maps.normal), anisotropy, false)
      const ns = options.normalScale ?? 0.85
      material.normalScale.set(ns, ns)
    }
    if (maps.rough) {
      material.roughnessMap = configureTexture(new T.CanvasTexture(maps.rough), anisotropy, false)
      material.roughness = 1
    }
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

  const plasterExterior = surfaceMaterial('plasterExterior', anisotropy, textureLoader, onTextureLoad, { size: 1.5, normalScale: 0.9, envMapIntensity: 0.45 })
  plasterExterior.userData.worldUV = plasterExterior.userData.textureSize

  const wallTile = surfaceMaterial('wallTile', anisotropy, textureLoader, onTextureLoad, { size: 0.9, normalScale: 0.95, envMapIntensity: 0.8 })
  wallTile.userData.worldUV = wallTile.userData.textureSize

  const flutedOak = surfaceMaterial('flutedOak', anisotropy, textureLoader, onTextureLoad, { size: 0.72, normalScale: 1.15, envMapIntensity: 0.55 })
  flutedOak.userData.worldUV = flutedOak.userData.textureSize

  const stonePlinth = surfaceMaterial('stonePlinth', anisotropy, textureLoader, onTextureLoad, { size: 1.2, normalScale: 0.95, envMapIntensity: 0.45 })
  stonePlinth.userData.worldUV = stonePlinth.userData.textureSize

  const paving = surfaceMaterial('paving', anisotropy, textureLoader, onTextureLoad, { size: 1.6, normalScale: 0.9, envMapIntensity: 0.45 })
  paving.userData.worldUV = paving.userData.textureSize

  const asphalt = surfaceMaterial('asphalt', anisotropy, textureLoader, onTextureLoad, { size: 2.4, normalScale: 0.8, envMapIntensity: 0.35 })
  asphalt.userData.worldUV = asphalt.userData.textureSize

  const lawn = surfaceMaterial('lawn', anisotropy, textureLoader, onTextureLoad, { size: 3.0, envMapIntensity: 0.3 })
  lawn.userData.worldUV = lawn.userData.textureSize

  const materials = {
    // Arsitektur & tapak
    plasterExterior,
    wallTile,
    flutedOak,
    stonePlinth,
    cap: standard('potongan-dinding', { color: '#7d776d', roughness: 0.95 }),
    leadCap: standard('potongan-timbal', { color: '#8f969a', roughness: 0.88 }),
    skirting: standard('plint', { color: '#415052', roughness: 0.52 }),
    wallRail: standard('pelindung-dinding', { color: '#cfd4d1', roughness: 0.48, metalness: 0.1 }),
    slab: standard('pelat-lantai', { color: '#bcb6ab', roughness: 0.92 }),
    ground: standard('tanah', { color: '#dbd5ca', roughness: 1 }),
    paving,
    asphalt,
    lawn,
    mulch: standard('mulsa', { color: '#6b513e', roughness: 0.96 }),
    curb: standard('kanstin', { color: '#cbc4b8', roughness: 0.85 }),
    roadLine: standard('marka-jalan', { color: '#f3f1ea', roughness: 0.7 }),
    accessibleBlue: standard('parkir-difabel', { color: '#2b61a1', roughness: 0.72 }),
    fenceMetal: standard('pagar-besi', { color: '#12343b', metalness: 0.45, roughness: 0.48 }),
    roofMetal: standard('atap-metal', { color: '#253d42', metalness: 0.45, roughness: 0.42, envMapIntensity: 0.85 }),
    roofAccent: standard('aksen-atap', { color: '#c46b37', metalness: 0.35, roughness: 0.45, envMapIntensity: 0.75 }),
    ceiling: standard('plafon', { color: '#f3efe7', roughness: 0.9, envMapIntensity: 0.35 }),
    glow: standard('lampu-sorot', { color: '#fff4de', emissive: '#ffdaa0', emissiveIntensity: 1.25, roughness: 0.3 }),
    aluminium: standard('aluminium', { color: '#b9b7b2', metalness: 0.85, roughness: 0.38 }),
    darkFrame: standard('kusen-gelap', { color: '#3b4040', metalness: 0.55, roughness: 0.42 }),
    glass: standard('kaca', {
      color: '#cbe0de', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.24,
      depthWrite: false, envMapIntensity: 1.45,
    }),
    frostedGlass: standard('kaca-buram', {
      color: '#e6ecea', roughness: 0.35, transparent: true, opacity: 0.58, depthWrite: false,
    }),

    // Pohon, taman & kendaraan
    treeBark: standard('batang-pohon', { color: '#6d5746', roughness: 0.92 }),
    treeLeafA: standard('daun-pohon-a', { color: '#5f7e55', roughness: 0.82 }),
    treeLeafB: standard('daun-pohon-b', { color: '#759467', roughness: 0.82 }),
    carSage: standard('mobil-sage', { color: '#7a948c', metalness: 0.35, roughness: 0.32, envMapIntensity: 0.9 }),
    carIvory: standard('mobil-krem', { color: '#e6dfd1', metalness: 0.3, roughness: 0.34, envMapIntensity: 0.9 }),
    carGlass: standard('kaca-mobil', { color: '#2b393d', metalness: 0.2, roughness: 0.12, envMapIntensity: 1.2 }),
    scooterDawn: standard('motor-fajar', { color: '#c8713b', metalness: 0.28, roughness: 0.38 }),

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
    accentDirty: standard('aksen-kotor', { color: '#e5b9b0', roughness: 0.5 }),
    accentClean: standard('aksen-bersih', { color: '#a9d3cb', roughness: 0.5 }),
    radiation: standard('tanda-radiasi', { color: '#e8c33a', roughness: 0.5 }),
    skinTone: standard('kulit-figur', { color: '#d8ad8e', roughness: 0.72 }),
    scrubTeal: standard('seragam-teal', { color: '#2a8c82', roughness: 0.78 }),
    coatWhite: standard('jas-dokter', { color: '#f3f1eb', roughness: 0.78 }),
  }

  for (const key of ['terrazzo', 'vinyl', 'tile', 'wood', 'epoxy']) {
    const envMapIntensity = { terrazzo: 0.78, vinyl: 0.65, tile: 0.75, wood: 0.58, epoxy: 0.68 }[key]
    materials['floor-' + key] = surfaceMaterial(key, anisotropy, textureLoader, onTextureLoad, {
      normalScale: key === 'vinyl' ? 0.55 : 0.9,
      envMapIntensity,
    })
  }

  // Dinding plester interior memakai UV dunia dengan warna hangat terang.
  const plaster = surfaceMaterial('plaster', anisotropy, textureLoader, onTextureLoad, { normalScale: 0.75, envMapIntensity: 0.45 })
  plaster.name = 'plester'
  plaster.color.set('#f6f3ec')
  plaster.userData.worldUV = plaster.userData.textureSize
  materials.plaster = plaster

  for (const [name, tint] of [['oak', '#d9b892'], ['oakDoor', '#e4c9a6']]) {
    const veneer = surfaceMaterial('veneer', anisotropy, textureLoader, onTextureLoad, { normalScale: 0.85, envMapIntensity: 0.55 })
    veneer.name = 'veneer-' + name
    if (textureRegistry.veneer?.map) veneer.color.set(tint)
    else veneer.color.set(name === 'oak' ? '#b48e66' : '#b89a74')
    veneer.roughness = textureRegistry.veneer?.map ? 0.82 : 0.55
    veneer.userData.worldUV = veneer.userData.textureSize
    materials[name] = veneer
  }
  return materials
}
