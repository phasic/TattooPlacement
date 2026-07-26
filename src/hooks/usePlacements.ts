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

export interface Placement {
  x: number
  y: number
}

const COLLECTION = 'placements'
const LS_KEY = 'tattoo_submitted_at'
const COOLDOWN_MS = 60 * 60 * 1000 // 1 hour cooldown per browser

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
    const elapsed = Date.now() - parseInt(last, 10)
    return Math.max(0, COOLDOWN_MS - elapsed)
  }, [])

  const fetchPlacements = useCallback(async () => {
    try {
      setLoading(true)
      const q = query(collection(db, COLLECTION), orderBy('createdAt', 'asc'))
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => {
        const raw = d.data()
        return { x: raw.x as number, y: raw.y as number }
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
          ...placement,
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

  return {
    placements,
    loading,
    submitting,
    error,
    canSubmit,
    cooldownRemaining,
    submitPlacement,
    refetch: fetchPlacements,
  }
}
