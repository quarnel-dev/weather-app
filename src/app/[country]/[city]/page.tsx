import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import s from './page.module.css'

import { findCity } from '@/services/search.service'

import Search from '@/components/search/Search'
import { WeatherCardServer } from '@/components/weathercard/WeatherCard.server'



interface Props {
  params: Promise<{ country: string; city: string }>
}

export default async function Page({ params }: Props) {
  const { country, city } = await params

  const found = findCity(country, city)
  if (!found) notFound()


  return (
    <main className={s.main}>
      <Search />
      <Suspense fallback={<div>Loading...</div>}>
        <WeatherCardServer city={found.name} />
      </Suspense>
    </main>
  )
}
