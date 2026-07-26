import React, { useEffect, useRef } from 'react'
import h337 from 'heatmap.js'
import type { Placement } from '../hooks/usePlacements'

interface HeatmapOverlayProps {
  placements: Placement[]
  svgWidth: number
  svgHeight: number
}

/**
 * Renders a canvas-based heatmap absolutely positioned over the body SVG.
 * Coordinates from Firestore (0–1 normalized) are scaled to pixel dimensions.
 */
export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  placements,
  svgWidth,
  svgHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<ReturnType<typeof h337.create> | null>(null)

  useEffect(() => {
    if (!containerRef.current || svgWidth === 0 || svgHeight === 0) return

    if (instanceRef.current) {
      try {
        // heatmap.js doesn't expose a destroy, so clear the canvas
        instanceRef.current.setData({ min: 0, max: 1, data: [] })
      } catch {
        // ignore
      }
    }

    instanceRef.current = h337.create({
      container: containerRef.current,
      radius: Math.max(svgWidth, svgHeight) * 0.06,
      maxOpacity: 0.75,
      minOpacity: 0,
      blur: 0.85,
      gradient: {
        '0.0': 'blue',
        '0.25': 'cyan',
        '0.5': 'lime',
        '0.75': 'yellow',
        '1.0': 'red',
      },
    })

    if (placements.length === 0) return

    const points = placements.map((p) => ({
      x: Math.round(p.x * svgWidth),
      y: Math.round(p.y * svgHeight),
      value: 1,
    }))

    instanceRef.current.setData({
      min: 0,
      max: Math.max(1, Math.ceil(placements.length / 10)),
      data: points,
    })
  }, [placements, svgWidth, svgHeight])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: svgWidth,
        height: svgHeight,
        pointerEvents: 'none',
      }}
    />
  )
}
