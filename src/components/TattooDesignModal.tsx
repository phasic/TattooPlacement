import { useEffect, useRef } from 'react'

interface TattooDesignModalProps {
  onClose: () => void
}

export function TattooDesignModal({ onClose }: TattooDesignModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }

  return (
    <dialog ref={dialogRef} className="design-dialog" onClick={handleBackdropClick}>
      <div className="design-dialog-inner">
        <button className="design-close" onClick={onClose} aria-label="Close">✕</button>

        <p className="design-eyebrow">Tieke's tattoo design</p>
        <h2 className="design-title">The design she wants 🌸</h2>

        <div className="design-img-wrap">
          <img
            src={`${import.meta.env.BASE_URL}tattoo-design.png`}
            alt="Tieke's tattoo design"
            className="design-img"
          />
        </div>

        <p className="design-caption">
          Help Tieke pick the perfect spot for this piece of art on her body!
        </p>
      </div>
    </dialog>
  )
}
