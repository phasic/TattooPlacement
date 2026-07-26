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
    if (ok) setView('success')
  }, [pendingPoint, submitPlacement])

  const handleViewHeatmap = useCallback(async () => {
    if (canSubmit()) return
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

      {/* ── Selection view ── */}
      {view === 'select' && (
        <>
          <header className="app-header">
            <h1>Help Tieke decide where to place her first tattoo 🖊️</h1>
            <p className="instruction">
              {alreadySubmitted
                ? `You've already voted! Come back in ${formatCooldown(cooldownRemaining())} to vote again.`
                : pendingPoint
                ? 'Ooh, nice choice! Lock it in below 👇'
                : 'Tap the body where you think the tattoo should go'}
            </p>
          </header>

          <main className="app-main">
            <div className="body-container" ref={svgContainerRef}>
              <BodyOutline onClick={alreadySubmitted ? undefined : handleBodyClick} className="body-svg">
                {pendingPoint && <ClickMarker x={pendingPoint.x} y={pendingPoint.y} />}
              </BodyOutline>
            </div>
          </main>

          <footer className="sticky-footer">
            {error && <p className="error-msg">{error}</p>}
            {!alreadySubmitted && pendingPoint && (
              <ConfirmButton onClick={handleConfirm} loading={submitting} />
            )}
            {alreadySubmitted && (
              <button className="primary-btn" onClick={handleViewHeatmap}>
                🔥 See the heatmap ({placements.length} votes)
              </button>
            )}
            <p className="fine-print">
              {alreadySubmitted
                ? "Vote to unlock the heatmap and see the crowd's verdict."
                : 'One vote per hour · no account needed'}
            </p>
          </footer>
        </>
      )}

      {/* ── Success view ── */}
      {view === 'success' && (
        <>
          <main className="app-main success-view">
            <div className="success-icon">🎉</div>
            <h2>Vote locked in!</h2>
            <p>Your pick is in. See where everyone else thinks Tieke should get inked.</p>
          </main>
          <footer className="sticky-footer">
            <button className="primary-btn" onClick={handleViewHeatmap}>
              🔥 See the heatmap
            </button>
            <button className="ghost-btn" onClick={handleReset}>
              Vote again
            </button>
          </footer>
        </>
      )}

      {/* ── Heatmap view ── */}
      {view === 'heatmap' && (
        <>
          <header className="app-header">
            <h1>Here's the verdict 🗳️</h1>
            <p className="instruction">
              {loading
                ? 'Loading votes…'
                : `${placements.length} ${placements.length === 1 ? 'person has' : 'people have'} voted so far`}
            </p>
          </header>

          <main className="app-main">
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
          </main>

          <footer className="sticky-footer">
            <div className="legend">
              <span className="legend-label">Few votes</span>
              <div className="legend-gradient" />
              <span className="legend-label">Most votes</span>
            </div>
            <button className="primary-btn" onClick={handleReset}>
              ← Back
            </button>
          </footer>
        </>
      )}
    </div>
  )
}
