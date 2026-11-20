// Ekspor tampilan ke PNG: denah (SVG → kanvas) atau maket (kanvas WebGL +
// label ruang digambar ulang), ditambah keterangan kecil di pojok.
const SVG_STYLES = [
  'display', 'visibility', 'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray',
  'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-family', 'font-size', 'font-weight',
  'font-stretch', 'text-anchor', 'dominant-baseline', 'paint-order',
]

function caption(ctx, width, height, text) {
  ctx.save()
  ctx.font = '600 13px "Archivo", "Segoe UI", sans-serif'
  const padding = 8
  const textWidth = ctx.measureText(text).width
  ctx.fillStyle = 'rgba(244, 241, 234, 0.92)'
  ctx.fillRect(12, height - 12 - 28, textWidth + padding * 2, 28)
  ctx.fillStyle = '#12343b'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 12 + padding, height - 12 - 14)
  ctx.restore()
}

export async function capturePlan(svg, host, background) {
  const bounds = svg.getBoundingClientRect()
  const area = host.getBoundingClientRect()
  const copy = svg.cloneNode(true)
  copy.setAttribute('width', bounds.width)
  copy.setAttribute('height', bounds.height)
  // Salin gaya terhitung agar CSS eksternal ikut terbawa ke gambar.
  const sourceNodes = svg.querySelectorAll('*')
  copy.querySelectorAll('*').forEach((node, index) => {
    const style = getComputedStyle(sourceNodes[index])
    for (const name of SVG_STYLES) node.style.setProperty(name, style.getPropertyValue(name))
    node.style.setProperty('animation', 'none')
  })

  const image = new Image()
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copy))
  await image.decode()
  const scale = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3)
  const output = document.createElement('canvas')
  output.width = Math.round(area.width * scale)
  output.height = Math.round(area.height * scale)
  const ctx = output.getContext('2d')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, output.width, output.height)
  ctx.scale(scale, scale)
  ctx.drawImage(image, bounds.left - area.left, bounds.top - area.top, bounds.width, bounds.height)
  caption(ctx, area.width, area.height, 'Arunika Dental Care, denah. Ukuran konseptual.')
  return output
}

export function captureModel(canvas, labelHost, labelText = 'Arunika Dental Care, maket 3D. Ukuran konseptual.') {
  const output = document.createElement('canvas')
  output.width = canvas.width
  output.height = canvas.height
  const ctx = output.getContext('2d')
  ctx.drawImage(canvas, 0, 0)
  const area = canvas.getBoundingClientRect()
  ctx.save()
  ctx.scale(output.width / area.width, output.height / area.height)
  ctx.textBaseline = 'middle'

  for (const tag of labelHost.querySelectorAll('.room-tag:not([hidden])')) {
    const rect = tag.getBoundingClientRect()
    const x = rect.left - area.left
    const y = rect.top - area.top
    const style = getComputedStyle(tag)
    ctx.beginPath()
    ctx.roundRect(x, y, rect.width, rect.height, parseFloat(style.borderRadius) || 4)
    ctx.fillStyle = style.backgroundColor
    ctx.fill()
    ctx.strokeStyle = style.borderColor
    ctx.lineWidth = 1
    ctx.stroke()
    for (const part of tag.children) {
      const partRect = part.getBoundingClientRect()
      const partStyle = getComputedStyle(part)
      if (partStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        ctx.beginPath()
        ctx.roundRect(partRect.left - area.left, partRect.top - area.top, partRect.width, partRect.height, parseFloat(partStyle.borderRadius) || 0)
        ctx.fillStyle = partStyle.backgroundColor
        ctx.fill()
      }
      ctx.fillStyle = partStyle.color
      ctx.font = `${partStyle.fontWeight} ${partStyle.fontSize} ${partStyle.fontFamily}`
      ctx.textAlign = 'center'
      ctx.fillText(part.textContent, partRect.left - area.left + partRect.width / 2, partRect.top - area.top + partRect.height / 2 + 0.5)
    }
  }
  caption(ctx, area.width, area.height, labelText)
  ctx.restore()
  return output
}

export function downloadPng(canvas, filename) {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  if (link.href === 'data:,') throw new Error('Gambar kosong')
  link.click()
}
