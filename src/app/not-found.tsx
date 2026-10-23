import type { Metadata } from 'next'
import Link from 'next/link'
import Search from '@/components/search/Search'
import s from './page.module.css'

export const metadata: Metadata = {
  title: 'City not found',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <main className={s.container}>
      <h1>City not found</h1>
      <p>Search for another city or return to the home page.</p>
      <Search />
      <Link href="/">Go to home</Link>
    </main>
  )
}
