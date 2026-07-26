import { useState, useRef, useEffect, useCallback } from 'react'
import { BodyOutline } from './components/BodyOutline'
import { ClickMarker } from './components/ClickMarker'
import { HeatmapOverlay } from './components/HeatmapOverlay'
import { ConfirmButton } from './components/ConfirmButton'
import { usePlacements } from './hooks/usePlacements'
import './App.css'

type View = 'select' | 'success' | 'heatmap'

export default function App() {
  const [view, setView] = useState<View>('select')
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null)
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })

  const { placements, loading, submitting, error, canSubmit, cooldownRemaining, submitPlacement, refetch } =
    usePlacements()

  // Measure the rendered SVG size for the heatmap overlay
  useEffect(() => {
    const measure = () => {
      if (!svgContainerRef.current) return
      const svg = svgContainerRef.current.querySelector('svg')
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      setSvgDimensions({ width: rect.width, height: rect.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [view])

  const handleBodyClick = useCallback((x: number, y: number) => {
    if (view !== 'select') return
    setPendingPoint({ x, y })
  }, [view])

  const handleConfirm = useCallback(async () => {
    if (!pendingPoint) return
    const ok = await submitPlacement(pendingPoint)
    if (ok) {
      setView('success')
    }
  }, [pendingPoint, submitPlacement])

  const handleViewHeatmap = useCallback(async () => {
    await refetch()
    setView('heatmap')
  }, [refetch])

  const handleReset = useCallback(() => {
    setPendingPoint(null)
    setView('select')
  }, [])

  const formatCooldown = (ms: number) => {
    const mins = Math.ceil(ms / 60000)
    return mins === 1 ? '1 minute' : `${mins} minutes`
  }

  const alreadySubmitted = !canSubmit()

  return (
    <div className="app">
      <header className="app-header">
        <h1>TattooPlacement</h1>
        <p className="subtitle">Where would you put your tattoo?</p>
      </header>

      <main className="app-main">
        {view === 'select' && (
          <div className="select-view">
            <p className="instruction">
              {alreadySubmitted
                ? `You've already submitted. You can submit again in ${formatCooldown(cooldownRemaining())}.`
                : pendingPoint
                ? 'Happy with this spot? Confirm your placement below.'
                : 'Click anywhere on the body to mark your ideal tattoo spot.'}
            </p>

            <div className="body-container" ref={svgContainerRef}>
              <BodyOutline onClick={alreadySubmitted ? undefined : handleBodyClick} className="body-svg">
                {pendingPoint && <ClickMarker x={pendingPoint.x} y={pendingPoint.y} />}
              </BodyOutline>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div className="actions">
              {!alreadySubmitted && pendingPoint && (
                <ConfirmButton onClick={handleConfirm} loading={submitting} />
              )}
              <button className="secondary-btn" onClick={handleViewHeatmap}>
                View Heatmap ({placements.length} picks)
              </button>
            </div>

            <p className="fine-print">
              One submission per hour per browser. No account needed.
            </p>
          </div>
        )}

        {view === 'success' && (
          <div className="success-view">
            <div className="success-icon">🎉</div>
            <h2>Your pick has been added!</h2>
            <p>Your placement is now part of the heatmap.</p>
            <div className="actions">
              <button className="primary-btn" onClick={handleViewHeatmap}>
                See the Heatmap
              </button>
              <button className="secondary-btn" onClick={handleReset}>
                Submit Another
              </button>
            </div>
          </div>
        )}

        {view === 'heatmap' && (
          <div className="heatmap-view">
            <p className="instruction">
              {loading
                ? 'Loading placements…'
                : `${placements.length} placement${placements.length === 1 ? '' : 's'} submitted so far.`}
            </p>

            <div className="body-container heatmap-container" ref={svgContainerRef}>
              <BodyOutline className="body-svg">
                {/* empty — no click handler in heatmap view */}
              </BodyOutline>
              {!loading && svgDimensions.width > 0 && (
                <HeatmapOverlay
                  placements={placements}
                  svgWidth={svgDimensions.width}
                  svgHeight={svgDimensions.height}
                />
              )}
            </div>

            <div className="legend">
              <span className="legend-label">Low</span>
              <div className="legend-gradient" />
              <span className="legend-label">High</span>
            </div>

            <div className="actions">
              <button className="primary-btn" onClick={handleReset}>
                {alreadySubmitted ? 'Back' : 'Submit My Pick'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
