import { useState, useRef, useEffect, useCallback } from 'react'
import { BodyOutline } from './components/BodyOutline'
import { ClickMarker } from './components/ClickMarker'
import { HeatmapOverlay } from './components/HeatmapOverlay'
import { ConfirmButton } from './components/ConfirmButton'
import { TattooDesignModal } from './components/TattooDesignModal'
import { WelcomeModal } from './components/WelcomeModal'
import { usePlacements, type BodySide } from './hooks/usePlacements'
import './App.css'

type View = 'select' | 'success' | 'heatmap'

function useSvgSize(ref: React.RefObject<HTMLDivElement | null>, dep: unknown) {
  const [dims, setDims] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const measure = () => {
      if (!ref.current) return
      const svg = ref.current.querySelector('svg')
      if (!svg) return
      const r = svg.getBoundingClientRect()
      setDims({ width: r.width, height: r.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [ref, dep])
  return dims
}

export default function App() {
  const [view, setView] = useState<View>('select')
  const [activeSide, setActiveSide] = useState<BodySide>('front')
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null)
  const [showDesign, setShowDesign] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [hasVotedThisSession, setHasVotedThisSession] = useState(false)

  const svgRef = useRef<HTMLDivElement>(null)
  const frontHeatRef = useRef<HTMLDivElement>(null)
  const backHeatRef = useRef<HTMLDivElement>(null)

  const { frontPlacements, backPlacements, placements, loading, submitting, error,
    canSubmit, cooldownRemaining, submitPlacement, refetch } = usePlacements()

  useSvgSize(svgRef, view) // kept to trigger re-measure on view change
  const frontDims = useSvgSize(frontHeatRef, view)
  const backDims = useSvgSize(backHeatRef, view)

  const handleBodyClick = useCallback((x: number, y: number) => {
    if (view !== 'select') return
    setPendingPoint({ x, y })
  }, [view])

  const handleConfirm = useCallback(async () => {
    if (!pendingPoint) return
    const ok = await submitPlacement({ x: pendingPoint.x, y: pendingPoint.y, side: activeSide })
    if (ok) {
      setHasVotedThisSession(true)
      setView('success')
    }
  }, [pendingPoint, activeSide, submitPlacement])

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

  const alreadySubmitted = !canSubmit() || hasVotedThisSession

  const SideToggle = () => (
    <div className="side-toggle">
      <button
        className={`toggle-btn ${activeSide === 'front' ? 'active' : ''}`}
        onClick={() => { setActiveSide('front'); setPendingPoint(null) }}
      >
        Front
      </button>
      <button
        className={`toggle-btn ${activeSide === 'back' ? 'active' : ''}`}
        onClick={() => { setActiveSide('back'); setPendingPoint(null) }}
      >
        Back
      </button>
    </div>
  )

  return (
    <div className="app">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      {showDesign && <TattooDesignModal onClose={() => setShowDesign(false)} />}

      {/* ── Selection view ── */}
      {view === 'select' && (
        <>
          <header className="app-header">
            <div className="header-card">
              <button className="design-peek-btn" onClick={() => setShowDesign(true)}>
                🌸 See the tattoo design
              </button>
              <h1>Help Tieke decide where to place her first tattoo 🖊️</h1>
              <p className="instruction">
                {alreadySubmitted
                  ? `You've already voted! Come back in ${formatCooldown(cooldownRemaining())} to vote again.`
                  : pendingPoint
                  ? 'Ooh, nice choice! Lock it in below 👇'
                  : 'Tap the body where you think the tattoo should go'}
              </p>
            </div>
          </header>

          <main className="app-main">
            <SideToggle />
            <div className="body-container" ref={svgRef}>
              <BodyOutline
                side={activeSide}
                onClick={alreadySubmitted ? undefined : handleBodyClick}
                className="body-svg"
              >
                {pendingPoint && <ClickMarker x={pendingPoint.x} y={pendingPoint.y} />}
              </BodyOutline>
            </div>
          </main>

          <footer className="sticky-footer">
            {error && <p className="error-msg">{error}</p>}
            {!alreadySubmitted && pendingPoint && (
              <ConfirmButton onClick={handleConfirm} loading={submitting} />
            )}
            <button className="primary-btn" onClick={handleViewHeatmap}>
              🔥 See the heatmap ({placements.length} votes)
            </button>
            <p className="fine-print">
              {alreadySubmitted
                ? `You've already voted! Come back in ${formatCooldown(cooldownRemaining())} to vote again.`
                : 'One vote per 3 hours · no account needed'}
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
            <div className="header-card">
              <button className="design-peek-btn" onClick={() => setShowDesign(true)}>
                🌸 See the tattoo design
              </button>
              <h1>Here's the verdict</h1>
              <p className="instruction">
                {loading
                  ? 'Loading votes…'
                  : `${placements.length} ${placements.length === 1 ? 'person has' : 'people have'} voted so far`}
              </p>
            </div>
          </header>

          <main className="app-main heatmap-main">
            <div className="dual-heatmap">

              <div className="heat-panel">
                <span className="heat-panel-label">Front</span>
                <div className="body-container">
                  <div className="svg-heatmap-wrapper" ref={frontHeatRef}>
                    <BodyOutline side="front" className="body-svg" />
                    {!loading && frontDims.width > 0 && (
                      <HeatmapOverlay
                        placements={frontPlacements}
                        svgWidth={frontDims.width}
                        svgHeight={frontDims.height}
                      />
                    )}
                  </div>
                </div>
                <span className="heat-panel-count">{frontPlacements.length} votes</span>
              </div>

              <div className="heat-divider" />

              <div className="heat-panel">
                <span className="heat-panel-label">Back</span>
                <div className="body-container">
                  <div className="svg-heatmap-wrapper" ref={backHeatRef}>
                    <BodyOutline side="back" className="body-svg" />
                    {!loading && backDims.width > 0 && (
                      <HeatmapOverlay
                        placements={backPlacements}
                        svgWidth={backDims.width}
                        svgHeight={backDims.height}
                      />
                    )}
                  </div>
                </div>
                <span className="heat-panel-count">{backPlacements.length} votes</span>
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
