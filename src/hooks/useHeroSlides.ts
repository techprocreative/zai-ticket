'use client'

import { useCallback, useEffect, useState } from 'react'
import type { HeroSlide } from '@/types/hero-slide'

export function useHeroSlides(includeInactive = false) {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSlides = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/slides${includeInactive ? '?all=true' : ''}`)
      if (!response.ok) throw new Error('Gagal memuat slider')
      const data = await response.json()
      setSlides(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [includeInactive])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  return { slides, loading, error, refresh: fetchSlides }
}
