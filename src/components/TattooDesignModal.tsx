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
          {/* Replace src with the real tattoo design image */}
          <img
            src="https://placehold.co/480x480/fce4d6/d4a89a?text=Tattoo+design"
            alt="Tattoo design placeholder"
            className="design-img"
          />
        </div>

        <p className="design-caption">
          Help Tieke pick the perfect spot for this design on her body!
        </p>
      </div>
    </dialog>
  )
}
