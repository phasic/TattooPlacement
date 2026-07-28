import { useEffect, useRef } from 'react'

interface WelcomeModalProps {
  onClose: () => void
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog ref={dialogRef} className="design-dialog welcome-dialog">
      <div className="design-dialog-inner">
        <p className="design-eyebrow">Hey there! 👋</p>
        <h2 className="design-title">Help Tieke place her first tattoo</h2>
        <p className="design-caption" style={{ marginBottom: '0.25rem' }}>
          Tieke is getting her first tattoo, this beautiful piece of art below.
          She wants your opinion on where it should go!
        </p>

        <div className="design-img-wrap">
          <img
            src={`${import.meta.env.BASE_URL}tattoo-design.png`}
            alt="Tieke's tattoo design"
            className="design-img"
          />
        </div>

        <p className="design-caption">
          After closing this, tap anywhere on the body to cast your vote.
          Once you confirm, you'll see a heatmap of where everyone thinks it should go. 🔥
        </p>

        <button className="primary-btn" onClick={onClose} style={{ marginTop: '0.5rem' }}>
          Let me vote! →
        </button>
      </div>
    </dialog>
  )
}
