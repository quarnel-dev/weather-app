import { notFound } from 'next/navigation'

import { findCity } from '@/services/search.service'

import { WeatherCard } from '@/components/weather/WeatherCard'

import Search from '@/components/search/Search'

interface Props {
  params: Promise<{ country: string; city: string }>
}

export default async function Page({ params }: Props) {
  const { country, city } = await params

  const found = findCity(country, city)
  if (!found) notFound()

  return (
    <>
      <Search />
      <div>{found.name}</div>
      <WeatherCard city={found.name} />
    </>
  )
}
