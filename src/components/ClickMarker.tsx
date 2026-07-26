import React from 'react'

interface ClickMarkerProps {
  x: number
  y: number
}

/**
 * Renders a pin/dot marker at normalized (0–1) SVG coordinates.
 * Must be used as a child of BodyOutline (inside the SVG viewBox 0 0 200 500).
 */
export const ClickMarker: React.FC<ClickMarkerProps> = ({ x, y }) => {
  const svgX = x * 200
  const svgY = y * 500

  return (
    <g transform={`translate(${svgX}, ${svgY})`} style={{ pointerEvents: 'none' }}>
      {/* outer pulse ring */}
      <circle r="10" fill="rgba(220,38,38,0.2)" stroke="none">
        <animate attributeName="r" values="8;14;8" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
      </circle>
      {/* pin body */}
      <circle r="6" fill="#dc2626" stroke="white" strokeWidth="1.5" />
      {/* pin stem */}
      <line x1="0" y1="6" x2="0" y2="14" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
      {/* pin tip shadow */}
      <circle cx="0" cy="14" r="2" fill="#dc2626" />
    </g>
  )
}
