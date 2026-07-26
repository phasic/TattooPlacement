import React from 'react'

interface BodyOutlineProps {
  side?: 'front' | 'back'
  onClick?: (x: number, y: number) => void
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

/**
 * Front-facing or back-facing human body silhouette.
 * ViewBox: 0 0 200 500
 * Clicking fires onClick with normalized (0–1) coordinates.
 */
export const BodyOutline: React.FC<BodyOutlineProps> = ({
  side = 'front',
  onClick,
  children,
  style,
  className,
}) => {
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onClick) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal
    const scaleX = viewBox.width / rect.width
    const scaleY = viewBox.height / rect.height
    const svgX = (e.clientX - rect.left) * scaleX + viewBox.x
    const svgY = (e.clientY - rect.top) * scaleY + viewBox.y
    onClick(
      Math.max(0, Math.min(1, svgX / viewBox.width)),
      Math.max(0, Math.min(1, svgY / viewBox.height))
    )
  }

  return (
    <svg
      viewBox="0 0 200 500"
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: onClick ? 'crosshair' : 'default', ...style }}
      className={className}
      onClick={handleClick}
    >
      {/* ── Head ── */}
      <ellipse cx="100" cy="38" rx="26" ry="32" />

      {/* ── Neck ── */}
      <path d="M88,66 Q100,72 112,66 L112,82 Q100,88 88,82 Z" />

      {/* ── Torso ── */}
      <path
        d="
          M88,82
          Q80,83 68,86
          Q55,90 50,100
          L46,110
          L38,160
          L36,200
          Q36,210 40,215
          Q55,218 65,216
          L68,280
          Q68,300 70,320
          L74,360
          L80,390
          L84,430
          L88,460
          L92,460
          L96,420
          L100,395
          L104,420
          L108,460
          L112,460
          L116,430
          L120,390
          L126,360
          L130,320
          Q132,300 132,280
          L135,216
          Q145,218 160,215
          Q164,210 164,200
          L162,160
          L154,110
          L150,100
          Q145,90 132,86
          Q120,83 112,82
          Q100,88 88,82
          Z
        "
      />

      {/* ── Left arm — abducted ~20° ── */}
      <path
        d="
          M50,100 Q42,105 36,115 L22,170
          Q18,190 20,205 Q22,218 28,222
          Q30,224 32,222 L36,210 L40,160 L46,110 Z
        "
      />
      <path
        d="
          M28,222 Q24,240 22,260 L20,285
          Q20,298 24,305 Q28,312 32,308
          Q34,305 34,300 L36,280 L38,260
          Q38,240 36,225 L32,222 Z
        "
      />
      <ellipse cx="28" cy="313" rx="9" ry="12" />

      {/* ── Right arm — abducted ~20° ── */}
      <path
        d="
          M150,100 Q158,105 164,115 L178,170
          Q182,190 180,205 Q178,218 172,222
          Q170,224 168,222 L164,210 L160,160 L154,110 Z
        "
      />
      <path
        d="
          M172,222 Q176,240 178,260 L180,285
          Q180,298 176,305 Q172,312 168,308
          Q166,305 166,300 L164,280 L162,260
          Q162,240 164,225 L168,222 Z
        "
      />
      <ellipse cx="172" cy="313" rx="9" ry="12" />

      {/* ── Front / back detail lines ── */}
      {side === 'front' ? (
        <g className="body-detail" style={{ pointerEvents: 'none' }}>
          {/* eyes — simple arcs, same style as body lines */}
          <path d="M88,34 Q91,31 94,34" fill="none" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
          <path d="M106,34 Q109,31 112,34" fill="none" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
          {/* nose */}
          <path d="M100,38 Q98,44 100,46 Q102,44 100,38" fill="none" strokeWidth="1.1" strokeLinecap="round" opacity="0.4" />
          {/* mouth */}
          <path d="M94,52 Q100,56 106,52" fill="none" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
          {/* collarbone hints */}
          <path d="M88,90 Q100,94 112,90" fill="none" strokeWidth="1" opacity="0.4" />
          {/* sternum */}
          <line x1="100" y1="94" x2="100" y2="200" strokeWidth="0.8" opacity="0.25" />
        </g>
      ) : (
        <g className="body-detail" style={{ pointerEvents: 'none' }}>
          {/* spine */}
          <line x1="100" y1="88" x2="100" y2="280" strokeWidth="1.2" opacity="0.35" />
          {/* shoulder blade hints */}
          <path d="M78,110 Q72,130 78,150" fill="none" strokeWidth="1" opacity="0.3" />
          <path d="M122,110 Q128,130 122,150" fill="none" strokeWidth="1" opacity="0.3" />
        </g>
      )}

      {children}
    </svg>
  )
}
