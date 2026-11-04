'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { getGeoClient } from '@/services/geo/getGeo.service'
import { resolveLocation } from '@/services/geo/resolveLocation.action'
import Search from '@/components/search/Search'
import s from '@/app/page.module.css'
import styles from './Home.module.css'

type State = 'detecting' | 'search'

const TRANSITION = { duration: 0.1 }
const VISIBLE = { opacity: 1, filter: 'blur(0px)' }
const HIDDEN = { opacity: 0, filter: 'blur(6px)' }

export default function Home() {
  const router = useRouter()
  const [state, setState] = useState<State>('detecting')
  const cancelDetection = useRef<() => void>(() => {})
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    let active = true
    const timeout = setTimeout(showSearch, 10000)

    function showSearch() {
      if (!active) return
      active = false
      clearTimeout(timeout)
      setState('search')
    }

    cancelDetection.current = showSearch

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
    <main className={s.container}>
      <AnimatePresence mode="wait">
        {state === 'detecting' && (
          <motion.div
            key="loader"
            className={styles.detecting}
            initial={reducedMotion ? false : HIDDEN}
            animate={VISIBLE}
            transition={reducedMotion ? { duration: 0 } : TRANSITION}
          >
            <span className={styles.badge} aria-hidden="true">
              <i className={reducedMotion ? 'i-location' : 'i-spinner'} />
            </span>
            <p className={styles.status} role="status">
              Detecting your location...
            </p>
            <p className={styles.hint}>Find nearby weather, or search for a city yourself.</p>
            <button className={styles.action} type="button" onClick={() => cancelDetection.current()}>
              Search manually
            </button>
          </motion.div>
        )}

        {state === 'search' && (
          <motion.div
            key="search"
            className={styles.search}
            initial={reducedMotion ? false : HIDDEN}
            animate={VISIBLE}
            transition={reducedMotion ? { duration: 0 } : TRANSITION}
          >
            <Search />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
