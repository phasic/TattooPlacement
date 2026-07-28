import React from 'react'

interface BodyOutlineProps {
  side?: 'front' | 'back'
  onClick?: (x: number, y: number) => void
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const IMG_SRC = `${import.meta.env.BASE_URL}body-silhouette.png`

// Original image: 805×1024, two figures side by side.
// Each figure occupies ~half the width (402.5 × 1024).
// Scaled to fill the 200-wide viewBox: factor = 200/402.5 ≈ 0.497
//   → full image displayed at width=400, height≈509 (slightly taller than 500)
// Front = left half  → x=0
// Back  = right half → x=-200 (shifts image left so right half is in view)

export const BodyOutline: React.FC<BodyOutlineProps> = ({
  side = 'front',
  onClick,
  children,
  style,
  className,
}) => {
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onClick) return
    const rect = e.currentTarget.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width
    const ny = (e.clientY - rect.top) / rect.height
    onClick(Math.max(0, Math.min(1, nx)), Math.max(0, Math.min(1, ny)))
  }

  const imgX = side === 'front' ? 0 : -200

  return (
    <svg
      viewBox="0 0 200 500"
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: onClick ? 'crosshair' : 'default', overflow: 'hidden', ...style }}
      className={className}
      onClick={handleClick}
    >
      <defs>
        {/*
          feColorMatrix to strip white background:
          A_out = -4·R + 3  (clipped to [0,1])
          white  (R≈1.0) → A≈-1 → 0 (transparent)
          gray   (R≈0.5) → A≈ 1      (opaque)
          dark   (R≈0.27)→ A≈ 1.9→ 1 (opaque)
        */}
        <filter id="rm-white" colorInterpolationFilters="sRGB" x="0" y="0" width="1" height="1">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    1 0 0 0 0
                    1 0 0 0 0
                   -4 0 0 0 3"
          />
        </filter>
      </defs>

      {/* Body silhouette — clip implicitly via SVG overflow:hidden */}
      <image
        href={IMG_SRC}
        x={imgX}
        y="-5"
        width="400"
        height="510"
        filter="url(#rm-white)"
        style={{ imageRendering: 'auto' }}
      />

      {children}
    </svg>
  )
}
