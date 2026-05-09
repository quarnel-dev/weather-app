'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getGeoClient } from '@/services/getGeo.service'
import { reverseGeo } from '@/services/reverseGeo.action'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    async function detect() {
      const coords = await getGeoClient()
      if (!coords) return

      const geo = await reverseGeo(coords.lat, coords.lon)
      if (!geo) return

      router.push(`/${geo.country}/${geo.city}`)
    }

    detect()
  }, [router])

  return <div>Detecting</div>
}
