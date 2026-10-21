'use client'

import { useEffect } from 'react'
import { rememberCity } from '@/services/geo/rememberCity.action'

export default function RememberCity({ id }: { id: number }) {
  useEffect(() => {
    void rememberCity(id).catch(() => {})
  }, [id])

  return null
}
