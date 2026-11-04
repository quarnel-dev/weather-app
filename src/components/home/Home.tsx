'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { getGeoClient } from '@/services/geo/getGeo.service'
import { resolveLocation } from '@/services/geo/resolveLocation.action'
import Search from '@/components/search/Search'
import s from '@/app/page.module.css'
import styles from './Home.module.css'
import loading from '@/components/weatherskeleton/WeatherSkeleton.module.css'

type State = 'detecting' | 'search'

export default function Home() {
  const router = useRouter()
  const [state, setState] = useState<State>('detecting')
  const cancelDetection = useRef<() => void>(() => {})

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
      {state === 'detecting' ? (
        <div key="detecting" className={`${styles.detecting} ${loading.reveal}`}>
          <span className={styles.badge} aria-hidden="true">
            <i className={`i-spinner ${styles.spinner}`} />
            <i className={`i-location ${styles.staticIcon}`} />
          </span>
          <p className={styles.status} role="status">
            Detecting your location...
          </p>
          <p className={styles.hint}>Find nearby weather, or search for a city yourself.</p>
          <button className={styles.action} type="button" onClick={() => cancelDetection.current()}>
            Search manually
          </button>
        </div>
      ) : (
        <div key="search" className={`${styles.search} ${loading.reveal}`}>
          <Search />
        </div>
      )}
    </main>
  )
}
