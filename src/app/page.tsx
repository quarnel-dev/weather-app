'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { motion, AnimatePresence } from 'motion/react'

import s from './page.module.css'

import { getGeoClient } from '@/services/getGeo.service'
import { reverseGeo } from '@/services/reverseGeo.action'

import Search from '@/components/search/Search'

type State = 'detecting' | 'search'

const TRANSITION = { duration: 0.1 }
const VISIBLE = { opacity: 1, filter: 'blur(0px)' }
const HIDDEN = { opacity: 0, filter: 'blur(6px)' }

export default function Page() {
  const router = useRouter()
  const [state, setState] = useState<State>('detecting')

  useEffect(() => {
    async function detect() {
      const coords = await getGeoClient()
      if (!coords) return setState('search')

      const geo = await reverseGeo(coords.lat, coords.lon)
      if (!geo) return setState('search')

      document.cookie = `lastCity=${JSON.stringify(geo)}; path=/; max-age=2592000`
      router.push(`/${geo.country}/${geo.city}`)
    }

    detect()

    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        setState('detecting')
        detect()
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [router])

  return (
    <AnimatePresence mode="wait">
      {state === 'detecting' && (
        <motion.div key="loader" className={s.container} initial={HIDDEN} animate={VISIBLE} transition={TRANSITION}>
          <i className={`i-spinner ${s.iLoader}`} />
          <p>Detecting your location...</p>
        </motion.div>
      )}

      {state === 'search' && (
        <motion.div key="search" className={s.container} initial={HIDDEN} animate={VISIBLE} transition={TRANSITION}>
          <Search />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
