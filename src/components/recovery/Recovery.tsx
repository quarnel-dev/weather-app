'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import s from './Recovery.module.css'

interface Props {
  message: string
  retryable?: boolean
  onRetry?: () => void
  compact?: boolean
}

export default function Recovery({ message, retryable = true, onRetry, compact = false }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function retry() {
    if (pending) return
    startTransition(() => {
      router.refresh()
      onRetry?.()
    })
  }

  return (
    <div className={`${s.panel} ${compact ? s.compact : ''}`}>
      <i className={`i-weather-unknown ${s.icon}`} aria-hidden="true" />
      <p className={s.message} role="alert">
        {message}
      </p>
      {retryable && (
        <button className={s.retry} type="button" disabled={pending} onClick={retry}>
          {pending ? 'Retrying...' : 'Try again'}
        </button>
      )}
      {pending && (
        <p className={s.pending} role="status">
          Trying again...
        </p>
      )}
    </div>
  )
}
