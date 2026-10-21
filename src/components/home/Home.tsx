'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { getGeoClient } from '@/services/geo/getGeo.service'
import { resolveLocation } from '@/services/geo/resolveLocation.action'
import Search from '@/components/search/Search'
import s from '@/app/page.module.css'

type State = 'detecting' | 'search'

const TRANSITION = { duration: 0.1 }
const VISIBLE = { opacity: 1, filter: 'blur(0px)' }
const HIDDEN = { opacity: 0, filter: 'blur(6px)' }

export default function Home() {
  const router = useRouter()
  const [state, setState] = useState<State>('detecting')

  useEffect(() => {
    let active = true
    const timeout = setTimeout(showSearch, 10000)

    function showSearch() {
      if (!active) return
      active = false
      clearTimeout(timeout)
      setState('search')
    }

    async function detect() {
      try {
        const coords = await getGeoClient()
        if (!active) return
        if (coords) {
          const url = await resolveLocation(coords.lat, coords.lon)
          if (!active) return
          if (url) {
            router.replace(url)
            return
          }
        }
      } catch {
        showSearch()
        return
      }

      showSearch()
    }

    void detect()

    function handlePageHide() {
      active = false
      clearTimeout(timeout)
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) setState('search')
    }

    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)
    return () => {
      handlePageHide()
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [router])

  return (
    <AnimatePresence mode="wait">
      {state === 'detecting' && (
        <motion.div key="loader" className={s.container} initial={HIDDEN} animate={VISIBLE} transition={TRANSITION}>
          <i className={`i-spinner ${s.iLoader}`} />
          <p role="status">Detecting your location...</p>
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
