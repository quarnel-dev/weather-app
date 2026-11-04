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
      <i className={`i-location ${s.locationIcon}`} aria-hidden="true" />
      <h1 className={s.title}>City not found</h1>
      <p className={s.description}>Search for another city or return to the home page.</p>
      <Search />
      <Link className={s.homeLink} href="/">
        Go to home
      </Link>
    </main>
  )
}
