'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  message: string
  retryable?: boolean
  onRetry?: () => void
}

export default function Recovery({ message, retryable = true, onRetry }: Props) {
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
    <div>
      <p role="alert">{message}</p>
      {retryable && (
        <button type="button" disabled={pending} onClick={retry}>
          {pending ? 'Retrying...' : 'Try again'}
        </button>
      )}
      {pending && <p role="status">Retrying weather...</p>}
    </div>
  )
}
