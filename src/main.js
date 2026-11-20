// Titik masuk aplikasi: panel kontrol, denah 2D, dan pemuatan lazy maket 3D.
import './style.css'
import { flows, roomLabels, rooms, workZoneTypes, zones } from './layout.js'
import { drawPlan } from './plan.js'
import { captureModel, capturePlan, downloadPng } from './screenshot.js'

const get = (id) => document.getElementById(id)
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

const stage = get('stage')
const viewport = get('viewport')
const labelHost = get('labels')
const planHost = get('plan')
const viewButtons = [...document.querySelectorAll('[data-view]')]
const presetButtons = [...document.querySelectorAll('[data-preset]')]
const roofButtons = [...document.querySelectorAll('[data-roof]')]
const cutButtons = [...document.querySelectorAll('[data-cut]')]

const state = {
  view: 'plan',
  userChoseView: false,
  selected: null,
  roof: true,
  flows: new Set(['pasien']),
  zones: false,
  viewer: null,
  viewerFailed: false,
}

// --- Denah 2D (langsung tampil) ---

const plan = drawPlan(planHost, { onSelect: (id) => selectRoom(id) })

// --- Panel: alur ---

const flowList = get('flow-toggles')
for (const flow of flows) {
  const item = document.createElement('li')
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'toggle'
  button.setAttribute('role', 'switch')
  button.dataset.flow = flow.id
  button.style.setProperty('--flow', flow.color)
  button.innerHTML = `
    <span class="toggle-swatch" aria-hidden="true"></span>
    <span class="toggle-text">
      <span class="toggle-name"></span>
      <span class="toggle-note"></span>
    </span>
    <span class="toggle-switch" aria-hidden="true"></span>`
  button.querySelector('.toggle-name').textContent = flow.label
  button.querySelector('.toggle-note').textContent = flow.note
  button.addEventListener('click', () => setFlow(flow.id, !state.flows.has(flow.id)))
  item.append(button)
  flowList.append(item)
}

function setFlow(id, visible) {
  if (visible) state.flows.add(id)
  else state.flows.delete(id)
  const button = flowList.querySelector(`[data-flow="${id}"]`)
  button.setAttribute('aria-checked', String(visible))
  plan.setFlow(id, visible)
  state.viewer?.setFlow(id, visible)
}

// --- Panel: zona kerja ---

const zoneToggle = get('zone-toggle')
const zoneLegend = get('zone-legend')
for (const zone of [...workZoneTypes, { label: 'Pasien', color: '#f4f1ea' }]) {
  const item = document.createElement('li')
  const swatch = document.createElement('span')
  swatch.style.background = zone.color
  item.append(swatch, zone.label + (zone.from !== undefined ? ` (jam ${zone.from % 12 || 12}–${zone.to % 12 || 12})` : ''))
  zoneLegend.append(item)
}

function setZones(visible) {
  state.zones = visible
  zoneToggle.setAttribute('aria-checked', String(visible))
  zoneLegend.hidden = !visible
  plan.setWorkZones(visible)
  state.viewer?.setWorkZones(visible)
}
zoneToggle.addEventListener('click', () => setZones(!state.zones))

// --- Panel: daftar ruang ---

const roomList = get('room-list')
for (const room of rooms) {
  const item = document.createElement('li')
  item.dataset.room = room.id
  item.style.setProperty('--zone', zones[room.zone].tint)
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'room-button'
  button.setAttribute('aria-expanded', 'false')
  button.setAttribute('aria-controls', 'ruang-' + room.id)
  button.innerHTML = '<span class="room-number"></span><span class="room-name"></span><span class="room-area"></span>'
  button.querySelector('.room-number').textContent = room.id
  button.querySelector('.room-name').textContent = room.name
  button.querySelector('.room-area').textContent = String(Math.round(room.rect[2] * room.rect[3] * 10) / 10).replace('.', ',') + ' m²'
  button.addEventListener('click', () => {
    if (state.selected === room.id) selectRoom(null)
    else selectRoom(room.id, { focus: true })
  })

  const detail = document.createElement('div')
  detail.className = 'room-detail'
  detail.id = 'ruang-' + room.id
  detail.hidden = true
  const zone = document.createElement('p')
  zone.className = 'room-zone'
  zone.textContent = zones[room.zone].label
  const description = document.createElement('p')
  description.textContent = room.description
  const equipment = document.createElement('ul')
  equipment.className = 'room-equipment'
  for (const entry of room.equipment) {
    const li = document.createElement('li')
    li.textContent = entry
    equipment.append(li)
  }
  detail.append(zone, description, equipment)
  item.append(button, detail)
  roomList.append(item)
}

function roomAreaText(room) {
  return String(Math.round(room.rect[2] * room.rect[3] * 10) / 10).replace('.', ',') + ' m²'
}

function updateFocusBar() {
  const bar = get('room-focus-bar')
  const room = state.selected ? rooms.find((item) => item.id === state.selected) : null
  const show = state.view === 'model' && Boolean(room)
  bar.hidden = !show
  if (!show) return
  get('focus-room-badge').textContent = room.id
  get('focus-room-title').textContent = room.name
  get('focus-room-area').textContent = roomAreaText(room)
}

function syncShellButtons({ roof, cut }) {
  state.roof = roof
  for (const button of roofButtons) {
    button.setAttribute('aria-pressed', String((button.dataset.roof === 'pasang') === roof))
  }
  for (const button of cutButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.cut === cut))
  }
}

function selectRoom(id, { focus = false } = {}) {
  state.selected = id
  for (const item of roomList.children) {
    const open = item.dataset.room === id
    item.classList.toggle('selected', open)
    item.querySelector('.room-button').setAttribute('aria-expanded', String(open))
    item.querySelector('.room-detail').hidden = !open
    if (open && !focus) item.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' })
  }
  plan.select(id)
  state.viewer?.select(id)
  if (id && focus && state.view === 'model') state.viewer?.focusRoom(id)
  updateFocusBar()
  updateHint()
}

// --- Tampilan ---

function updateHint() {
  const hint = get('hint')
  if (state.view === 'plan') {
    hint.textContent = state.selected
      ? roomLabels[state.selected].short + ' dipilih. Pilih ruang lain pada denah atau daftar.'
      : 'Pilih ruang pada denah untuk membaca fungsi dan isinya.'
  } else {
    hint.textContent = state.selected
      ? 'Mode fokus ruang · Seret untuk memutar, gunakan Foto bukti untuk mengambil gambar ruang.'
      : 'Seret untuk memutar, gulir untuk zoom, klik ruang untuk membuka atap dan fokus.'
  }
}

function setView(view) {
  if (view === 'model' && !state.viewer) return
  state.view = view
  planHost.hidden = view !== 'plan'
  viewport.hidden = view !== 'model'
  labelHost.hidden = view !== 'model'
  get('camera-tools').hidden = view !== 'model'
  get('model-options').hidden = view !== 'model'
  stage.dataset.view = view
  for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.view === view))
  state.viewer?.show(view === 'model')
  updateFocusBar()
  updateHint()
}

for (const button of viewButtons) {
  button.addEventListener('click', () => {
    state.userChoseView = true
    setView(button.dataset.view)
  })
}

for (const button of presetButtons) {
  button.addEventListener('click', () => {
    for (const other of presetButtons) other.setAttribute('aria-pressed', String(other === button))
    state.viewer?.preset(button.dataset.preset)
  })
}

for (const button of roofButtons) {
  button.addEventListener('click', () => {
    state.viewer?.setRoof(button.dataset.roof === 'pasang')
  })
}

for (const button of cutButtons) {
  button.addEventListener('click', () => {
    state.viewer?.setCut(button.dataset.cut === 'utuh')
  })
}

get('zoom-in').addEventListener('click', () => state.viewer?.zoom(1.25))
get('zoom-out').addEventListener('click', () => state.viewer?.zoom(1 / 1.25))
get('reset').addEventListener('click', () => state.viewer?.reset())
get('focus-clear').addEventListener('click', () => {
  selectRoom(null)
  state.viewer?.reset()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.selected) selectRoom(null)
  else if ((event.key === 'r' || event.key === 'R') && state.view === 'model' && !event.ctrlKey && !event.metaKey) {
    state.viewer?.setRoof(!state.roof)
  }
})

// --- Unduh gambar ---

async function captureAndDownload() {
  const background = getComputedStyle(stage).backgroundColor
  const room = state.selected ? rooms.find((item) => item.id === state.selected) : null
  if (state.view === 'model') {
    const captionText = room
      ? `Arunika Dental Care · ${room.id} ${room.name} (${roomAreaText(room)})`
      : 'Arunika Dental Care, maket 3D. Ukuran konseptual.'
    const filename = room
      ? `arunika-ruang-${room.id}-${room.key}.png`
      : 'arunika-dental-care-maket.png'
    downloadPng(captureModel(state.viewer.capture(), labelHost, captionText), filename)
    return
  }
  const image = await capturePlan(plan.svg, planHost, background)
  downloadPng(image, 'arunika-dental-care-denah.png')
}

const screenshotButton = get('screenshot')
const focusCaptureButton = get('focus-capture')
for (const button of [screenshotButton, focusCaptureButton]) {
  button.addEventListener('click', async () => {
    screenshotButton.disabled = true
    focusCaptureButton.disabled = true
    try {
      await captureAndDownload()
    } catch (error) {
      console.warn('Arunika: gambar gagal dibuat.', error)
      get('hint').textContent = 'Gambar gagal dibuat. Coba lagi setelah tampilan selesai dimuat.'
    } finally {
      screenshotButton.disabled = false
      focusCaptureButton.disabled = false
    }
  })
}

// --- Status awal ---

for (const flow of flows) setFlow(flow.id, state.flows.has(flow.id))
setView('plan')

// --- Maket 3D (lazy) ---

const loading = get('loading')
const loadingText = get('loading-text')
const loadingFill = get('loading-fill')

function showProgress(fraction) {
  const percent = Math.round(fraction * 100)
  loadingFill.style.width = percent + '%'
  loadingText.textContent = 'Memuat maket 3D ' + percent + '%'
}

async function startViewer() {
  try {
    const { createViewer } = await import('./viewer.js')
    const viewer = await createViewer({
      host: viewport,
      labelHost,
      reducedMotion,
      onSelect: (id, options) => selectRoom(id, options),
      onShellChange: syncShellButtons,
      onProgress: showProgress,
    })
    state.viewer = viewer
    viewer.canvas.addEventListener('webglcontextlost', () => {
      state.viewer = null
      state.viewerFailed = true
      viewButtons.find((button) => button.dataset.view === 'model').disabled = true
      setView('plan')
      get('hint').textContent = 'Maket 3D berhenti karena memori grafis habis. Denah tetap bisa dipakai; muat ulang halaman untuk mencoba lagi.'
    })
    for (const flow of flows) viewer.setFlow(flow.id, state.flows.has(flow.id))
    viewer.setWorkZones(state.zones)
    viewer.select(state.selected)
    viewButtons.find((button) => button.dataset.view === 'model').disabled = false
    loading.hidden = true
    if (!state.userChoseView) setView('model')
  } catch (error) {
    console.warn('Arunika: maket 3D tidak tersedia.', error)
    state.viewerFailed = true
    loadingText.textContent = 'Maket 3D tidak bisa dibuka di perangkat ini. Denah tetap lengkap.'
    loading.classList.add('failed')
  }
}

startViewer()
