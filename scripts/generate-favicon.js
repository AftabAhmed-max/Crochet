/**
 * Generates a branded crochetinggg favicon.ico (16×16 + 32×32 in one file).
 * Design: charcoal rounded-square background, gold yarn-ball with darker stripe bands.
 * Zero external dependencies — only built-in Node.js zlib.
 */
'use strict'
const fs   = require('fs')
const path = require('path')
const zlib = require('zlib')

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  TRANS:     [0x00, 0x00, 0x00, 0x00],
  BG:        [0x1A, 0x1A, 0x1A, 0xFF],  // charcoal
  GOLD:      [0xC9, 0xA9, 0x6E, 0xFF],  // main gold
  STRIPE:    [0x7A, 0x5D, 0x2F, 0xFF],  // dark stripe
  HIGHLIGHT: [0xE0, 0xCB, 0x98, 0xB0],  // subtle highlight
}

// ─── Image buffer ─────────────────────────────────────────────────────────────
function makeImage(w, h) {
  const buf = new Uint8Array(w * h * 4)   // all transparent

  function blend(x, y, color, alpha) {
    if (x < 0 || x >= w || y < 0 || y >= h) return
    const i   = (y * w + x) * 4
    const a   = alpha / 255
    const ia  = 1 - a
    const da  = buf[i + 3] / 255
    const oa  = a + da * ia
    if (oa < 1e-6) return
    buf[i + 0] = Math.round((color[0] * a + buf[i + 0] * da * ia) / oa)
    buf[i + 1] = Math.round((color[1] * a + buf[i + 1] * da * ia) / oa)
    buf[i + 2] = Math.round((color[2] * a + buf[i + 2] * da * ia) / oa)
    buf[i + 3] = Math.round(oa * 255)
  }

  function circle(cx, cy, r, color) {
    const x0 = Math.floor(cx - r - 1), x1 = Math.ceil(cx + r + 1)
    const y0 = Math.floor(cy - r - 1), y1 = Math.ceil(cy + r + 1)
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x - cx, y - cy)
        const a = Math.max(0, Math.min(1, r + 0.6 - d))
        if (a > 0) blend(x, y, color, Math.round(a * (color[3] ?? 255)))
      }
    }
  }

  function roundedRect(x0, y0, x1, y1, cr, color) {
    const corners = [
      [x0 + cr, y0 + cr], [x1 - cr, y0 + cr],
      [x0 + cr, y1 - cr], [x1 - cr, y1 - cr],
    ]
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        let inside = true
        for (const [cx, cy] of corners) {
          if (x < cx && Math.abs(x - cx) < cr + 1 &&
              y < cy && Math.abs(y - cy) < cr + 1) {
            inside = false; break
          }
          if (x < cx && x >= cx - cr &&
              y < cy && y >= cy - cr) {
            const d = Math.hypot(x - cx, y - cy)
            if (d > cr + 0.6) { inside = false; break }
          }
          if (x > cx && x <= cx + cr &&
              y < cy && y >= cy - cr) {
            const d = Math.hypot(x - cx, y - cy)
            if (d > cr + 0.6) { inside = false; break }
          }
          if (x < cx && x >= cx - cr &&
              y > cy && y <= cy + cr) {
            const d = Math.hypot(x - cx, y - cy)
            if (d > cr + 0.6) { inside = false; break }
          }
          if (x > cx && x <= cx + cr &&
              y > cy && y <= cy + cr) {
            const d = Math.hypot(x - cx, y - cy)
            if (d > cr + 0.6) { inside = false; break }
          }
        }
        if (inside) blend(x, y, color, color[3] ?? 255)
      }
    }
  }

  return { buf, w, h, blend, circle, roundedRect }
}

// ─── Draw one size ────────────────────────────────────────────────────────────
function drawFavicon(size) {
  const sc = size / 32
  const img = makeImage(size, size)
  const { blend, circle, roundedRect } = img

  const cx = size / 2
  const cy = size / 2

  // Rounded-square background
  const pad = Math.max(0, Math.round(0.5 * sc))
  const cr  = Math.round(6 * sc)
  roundedRect(pad, pad, size - 1 - pad, size - 1 - pad, cr, C.BG)

  // Main yarn-ball circle
  const r = Math.round(11 * sc)
  circle(cx, cy, r, C.GOLD)

  // Darker stripe bands clipped to the ball
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const d  = Math.hypot(dx, dy)
      if (d >= r - 0.5) continue

      // Normalised position within the sphere (-1..1)
      const nx = dx / r
      const ny = dy / r

      // Three horizontal bands, curved to follow the sphere's equator
      // band = ny adjusted by a sine-based curve that simulates 3D wrapping
      const curve = nx * 0.25 * Math.sqrt(Math.max(0, 1 - nx * nx))
      const band  = ny - curve

      const bands = [-0.42, -0.02, 0.38]
      const bw    = 0.11 * sc          // half-width of each band in normalised units
      for (const bCenter of bands) {
        const t = 1 - Math.abs(band - bCenter) / bw
        if (t > 0) {
          const alpha = Math.round(Math.min(1, t) * 0.65 * 255)
          blend(x, y, C.STRIPE, alpha)
        }
      }
    }
  }

  // Soft highlight ellipse (top-left of ball)
  const hr = Math.round(2.5 * sc)
  const hx = cx - Math.round(4 * sc)
  const hy = cy - Math.round(4 * sc)
  circle(hx, hy, hr, C.HIGHLIGHT)

  return img
}

// ─── PNG encoder (no deps) ────────────────────────────────────────────────────
function crc32Table() {
  if (crc32Table._t) return crc32Table._t
  const t = crc32Table._t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
}
function crc32(data) {
  const t = crc32Table()
  let c = -1
  for (const b of data) c = (c >>> 8) ^ t[(c ^ b) & 0xFF]
  return (c ^ -1) >>> 0
}
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])))
  return Buffer.concat([len, typeBytes, data, crcBuf])
}
function encodePNG(img) {
  const { buf, w, h } = img
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6  // 8-bit RGBA

  // Add filter byte (0 = None) before each scanline
  const raw = Buffer.alloc(h * (1 + w * 4))
  for (let y = 0; y < h; y++) {
    const row = y * (1 + w * 4)
    raw[row] = 0
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4
      const d = row + 1 + x * 4
      raw[d] = buf[s]; raw[d+1] = buf[s+1]; raw[d+2] = buf[s+2]; raw[d+3] = buf[s+3]
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 })
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ─── ICO encoder ─────────────────────────────────────────────────────────────
function encodeICO(entries) {
  // entries: [{ size, png }]
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)                  // type = 1 (icon)
  header.writeUInt16LE(entries.length, 4)

  let dataOffset = 6 + entries.length * 16
  const dirs = entries.map(({ size, png }) => {
    const dir = Buffer.alloc(16)
    dir[0] = size === 256 ? 0 : size           // width  (0 means 256)
    dir[1] = size === 256 ? 0 : size           // height
    dir[2] = 0                                  // colour count
    dir[3] = 0                                  // reserved
    dir.writeUInt16LE(1, 4)                    // planes
    dir.writeUInt16LE(32, 6)                   // bits per pixel
    dir.writeUInt32LE(png.length, 8)
    dir.writeUInt32LE(dataOffset, 12)
    dataOffset += png.length
    return dir
  })

  return Buffer.concat([header, ...dirs, ...entries.map(e => e.png)])
}

// ─── Generate & write ─────────────────────────────────────────────────────────
const sizes   = [16, 32]
const entries = sizes.map(size => ({ size, png: encodePNG(drawFavicon(size)) }))
const ico     = encodeICO(entries)

const root    = path.join(__dirname, '..')
const outIco  = path.join(root, 'public', 'favicon.ico')
const appIco  = path.join(root, 'src', 'app', 'favicon.ico')

fs.writeFileSync(outIco, ico)
fs.writeFileSync(appIco, ico)

console.log(`✓ ${outIco}  (${ico.length} bytes)`)
console.log(`✓ ${appIco}  (${ico.length} bytes)`)
