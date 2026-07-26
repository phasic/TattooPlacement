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
    if (canSubmit()) return  // must have submitted at least once
    await refetch()
    setView('heatmap')
  }, [refetch, canSubmit])

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
        <h1>Help Tieke decide where to place her first tattoo</h1>
        <p className="subtitle">Tap the body where you think it should go ✨</p>
      </header>

      <main className="app-main">
        {view === 'select' && (
          <div className="select-view">
            <p className="instruction">
              {alreadySubmitted
                ? `You've already voted! Come back in ${formatCooldown(cooldownRemaining())} to vote again.`
                : pendingPoint
                ? `Ooh, nice choice! Lock it in? 👇`
                : `Where should Tieke get inked? Click the spot you think fits her best.`}
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
              {alreadySubmitted && (
                <button className="secondary-btn" onClick={handleViewHeatmap}>
                  View Heatmap ({placements.length} picks)
                </button>
              )}
            </div>

            <p className="fine-print">
              {alreadySubmitted
                ? 'Want to see where everyone voted? Check the heatmap!'
                : 'Vote to unlock the heatmap and see where everyone thinks the tattoo should go.'}
            </p>
          </div>
        )}

        {view === 'success' && (
          <div className="success-view">
            <div className="success-icon">🎉</div>
            <h2>Vote locked in!</h2>
            <p>Your pick is in. Now see where everyone else thinks Tieke should get inked.</p>
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
                ? 'Loading votes…'
                : `${placements.length} ${placements.length === 1 ? 'person has' : 'people have'} voted so far — here's the verdict!`}
            </p>

            <div className="body-container">
              <div className="svg-heatmap-wrapper" ref={svgContainerRef}>
                <BodyOutline className="body-svg" />
                {!loading && svgDimensions.width > 0 && (
                  <HeatmapOverlay
                    placements={placements}
                    svgWidth={svgDimensions.width}
                    svgHeight={svgDimensions.height}
                  />
                )}
              </div>
            </div>

            <div className="legend">
              <span className="legend-label">Low</span>
              <div className="legend-gradient" />
              <span className="legend-label">High</span>
            </div>

            <div className="actions">
              <button className="primary-btn" onClick={handleReset}>
                {alreadySubmitted ? '← Back' : 'Cast My Vote'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
