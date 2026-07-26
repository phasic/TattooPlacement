import { useEffect, useRef } from 'react'
import type { Placement } from '../hooks/usePlacements'

interface HeatmapOverlayProps {
  placements: Placement[]
  svgWidth: number
  svgHeight: number
}

const RADIUS_RATIO = 0.07  // hotspot radius as fraction of the larger dimension
const MAX_OPACITY = 0.82

/**
 * Canvas-based heatmap rendered over the body SVG.
 * Uses a two-pass technique: draw radial Gaussian blobs onto an offscreen
 * canvas, then map the alpha channel to a colour gradient on the visible canvas.
 */
export function HeatmapOverlay({ placements, svgWidth, svgHeight }: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || svgWidth === 0 || svgHeight === 0 || placements.length === 0) {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    canvas.width = svgWidth
    canvas.height = svgHeight

    const radius = Math.max(svgWidth, svgHeight) * RADIUS_RATIO

    // ── Pass 1: draw intensity blobs onto an offscreen canvas ──
    const offscreen = document.createElement('canvas')
    offscreen.width = svgWidth
    offscreen.height = svgHeight
    const off = offscreen.getContext('2d')!

    for (const p of placements) {
      const cx = p.x * svgWidth
      const cy = p.y * svgHeight
      const grad = off.createRadialGradient(cx, cy, 0, cx, cy, radius)
      grad.addColorStop(0, 'rgba(0,0,0,0.25)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      off.fillStyle = grad
      off.beginPath()
      off.arc(cx, cy, radius, 0, Math.PI * 2)
      off.fill()
    }

    // ── Pass 2: map intensity → colour gradient ──
    const imageData = off.getImageData(0, 0, svgWidth, svgHeight)
    const src = imageData.data

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, svgWidth, svgHeight)

    // Build a 256-entry colour lookup from the gradient
    const grad = ctx.createLinearGradient(0, 0, 255, 0)
    grad.addColorStop(0.0,  '#2563eb')   // blue
    grad.addColorStop(0.25, '#06b6d4')   // cyan
    grad.addColorStop(0.5,  '#22c55e')   // green
    grad.addColorStop(0.75, '#eab308')   // yellow
    grad.addColorStop(1.0,  '#dc2626')   // red

    const lutCanvas = document.createElement('canvas')
    lutCanvas.width = 256
    lutCanvas.height = 1
    const lutCtx = lutCanvas.getContext('2d')!
    lutCtx.fillStyle = grad
    lutCtx.fillRect(0, 0, 256, 1)
    const lut = lutCtx.getImageData(0, 0, 256, 1).data  // 256×4 RGBA

    // Write coloured pixels onto the visible canvas
    const out = ctx.createImageData(svgWidth, svgHeight)
    const dst = out.data

    for (let i = 0; i < src.length; i += 4) {
      const alpha = src[i + 3]   // intensity stored in alpha channel
      if (alpha === 0) continue
      const t = Math.min(255, alpha * 3)  // amplify so sparse dots still show
      const li = Math.floor(t) * 4
      dst[i]     = lut[li]
      dst[i + 1] = lut[li + 1]
      dst[i + 2] = lut[li + 2]
      dst[i + 3] = Math.round((t / 255) * 255 * MAX_OPACITY)
    }

    ctx.putImageData(out, 0, 0)
  }, [placements, svgWidth, svgHeight])

  return (
    <canvas
      ref={canvasRef}
      width={svgWidth}
      height={svgHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
