'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { motion, AnimatePresence } from 'motion/react'

import s from './page.module.css'

import { getGeoClient } from '@/services/getGeo.service'
import { reverseGeo } from '@/services/reverseGeo.action'

type State = 'detecting' | 'search' | 'done'

export default function Page() {
  const router = useRouter()
  const [state, setState] = useState<State>('detecting')
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  useEffect(() => {
    async function detect() {
      const coords = await getGeoClient()
      if (!coords) {
        setState('search')
        return
      }

      const geo = await reverseGeo(coords.lat, coords.lon)
      if (!geo) {
        setState('search')
        return
      }

      document.cookie = `lastCity=${JSON.stringify(geo)}; path=/; max-age=2592000`
      setRedirectTo(`/${geo.country}/${geo.city}`)
      setState('done')
    }
    detect()
  }, [router])

  function onExitComplete() {
    if (redirectTo) router.push(redirectTo)
  }

  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      {state === 'detecting' && (
        <motion.div
          key="loader"
          className={s.containerLoader}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.2 }}
        >
          <i className={`i-spinner ${s.iLoader}`}></i>
          <p>Detecting your location...</p>
        </motion.div>
      )}
      {state === 'search' && (
        <motion.div
          key="search"
          layoutId="citySearch"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.2 }}
        >
          <div>Search</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
