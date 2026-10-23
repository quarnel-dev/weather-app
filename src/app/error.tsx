'use client'

import Search from '@/components/search/Search'
import Recovery from '@/components/recovery/Recovery'
import s from './page.module.css'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ reset }: Props) {
  return (
    <main className={s.container}>
      <h1>Something went wrong</h1>
      <Search />
      <Recovery message="This page is temporarily unavailable. Try again or search for another city." onRetry={reset} />
    </main>
  )
}
