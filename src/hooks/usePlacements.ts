import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

export type BodySide = 'front' | 'back'

export interface Placement {
  x: number
  y: number
  side: BodySide
}

const COLLECTION = 'placements'
const LS_KEY = 'tattoo_submitted_at'
const COOLDOWN_MS = import.meta.env.DEV ? 0 : 3 * 60 * 60 * 1000

export function usePlacements() {
  const [placements, setPlacements] = useState<Placement[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useCallback((): boolean => {
    const last = localStorage.getItem(LS_KEY)
    if (!last) return true
    return Date.now() - parseInt(last, 10) > COOLDOWN_MS
  }, [])

  const cooldownRemaining = useCallback((): number => {
    const last = localStorage.getItem(LS_KEY)
    if (!last) return 0
    return Math.max(0, COOLDOWN_MS - (Date.now() - parseInt(last, 10)))
  }, [])

  const fetchPlacements = useCallback(async () => {
    try {
      setLoading(true)
      const q = query(collection(db, COLLECTION), orderBy('createdAt', 'asc'))
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => {
        const raw = d.data()
        return {
          x: raw.x as number,
          y: raw.y as number,
          // legacy docs without 'side' default to 'front'
          side: (raw.side as BodySide | undefined) ?? 'front',
        }
      })
      setPlacements(data)
    } catch (e) {
      setError('Failed to load placements.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlacements()
  }, [fetchPlacements])

  const submitPlacement = useCallback(
    async (placement: Placement): Promise<boolean> => {
      if (!canSubmit()) {
        setError('You can submit once per hour. Come back later!')
        return false
      }
      try {
        setSubmitting(true)
        setError(null)
        await addDoc(collection(db, COLLECTION), {
          x: placement.x,
          y: placement.y,
          side: placement.side,
          createdAt: serverTimestamp(),
        })
        localStorage.setItem(LS_KEY, String(Date.now()))
        setPlacements((prev) => [...prev, placement])
        return true
      } catch (e) {
        setError('Failed to save your pick. Please try again.')
        console.error(e)
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [canSubmit]
  )

  const frontPlacements = placements.filter((p) => p.side === 'front')
  const backPlacements = placements.filter((p) => p.side === 'back')

  return {
    placements,
    frontPlacements,
    backPlacements,
    loading,
    submitting,
    error,
    canSubmit,
    cooldownRemaining,
    submitPlacement,
    refetch: fetchPlacements,
  }
}
