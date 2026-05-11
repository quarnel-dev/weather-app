'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { motion, AnimatePresence } from 'motion/react'

import s from './page.module.css'

import { getGeoClient } from '@/services/getGeo.service'
import { reverseGeo } from '@/services/reverseGeo.action'

import Search from '@/components/search/Search'

type State = 'detecting' | 'exiting' | 'search'

const TRANSITION = { duration: 0.2 }
const VISIBLE = { opacity: 1, filter: 'blur(0px)' }
const HIDDEN = { opacity: 0, filter: 'blur(10px)' }

export default function Page() {
  const router = useRouter()
  const [state, setState] = useState<State>('detecting')
  const redirectTo = useRef<string | null>(null)

  useEffect(() => {
    async function detect() {
      const coords = await getGeoClient()
      if (!coords) return setState('search')

      const geo = await reverseGeo(coords.lat, coords.lon)
      if (!geo) return setState('search')

      document.cookie = `lastCity=${JSON.stringify(geo)}; path=/; max-age=2592000`
      redirectTo.current = `/${geo.country}/${geo.city}`
      setState('exiting')
    }

    detect()

    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        redirectTo.current = null
        setState('detecting')
        detect()
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  return (
    <AnimatePresence mode="wait">
      {state === 'detecting' && (
        <motion.div key="loader" className={s.container} initial={HIDDEN} animate={VISIBLE} exit={HIDDEN} transition={TRANSITION}>
          <i className={`i-spinner ${s.iLoader}`} />
          <p>Detecting your location...</p>
        </motion.div>
      )}

      {state === 'exiting' && (
        <motion.div
          key="exiting"
          className={s.container}
          initial={VISIBLE}
          animate={HIDDEN}
          transition={TRANSITION}
          onAnimationComplete={() => {
            if (redirectTo.current) router.push(redirectTo.current)
          }}
        />
      )}

      {state === 'search' && (
        <motion.div key="search" className={s.container} initial={HIDDEN} animate={VISIBLE} transition={TRANSITION}>
          <Search />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
