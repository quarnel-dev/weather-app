import { notFound, permanentRedirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

import s from './page.module.css'

import { countryMap, findCities } from '@/services/search.service'
import { cityUrl } from '@/utils/cityUrl'
import searchStyles from '@/components/search/Search.module.css'

import Search from '@/components/search/Search'
import { WeatherCardServer } from '@/components/weathercard/WeatherCard.server'
import RememberCity from '@/components/remembercity/RememberCity'



interface Props {
  params: Promise<{ country: string; city: string }>
}

export default async function Page({ params }: Props) {
  const { country, city } = await params

  const matches = findCities(country, city)
  if (matches.length === 0) notFound()

  if (matches.length > 1) {
    return (
      <main className={s.main}>
        <Search />
        <section className={s.cityChoices} aria-labelledby="city-choice-title">
          <h1 id="city-choice-title">Which {matches[0].name}?</h1>
          <p>Several cities match this address. Choose a location.</p>
          <ul className={s.cityList}>
            {matches.map((candidate) => (
              <li key={candidate.id} className={searchStyles.item}>
                <Link href={cityUrl(candidate)} className={searchStyles.itemLink} prefetch={false}>
                  <span>
                    <span className={searchStyles.cityName}>{candidate.name}</span>
                    <span className={s.region}>{candidate.admin1 || 'Region unavailable'}</span>
                    <span className={s.region}>{candidate.lat}, {candidate.lon}</span>
                  </span>
                  <span className={searchStyles.countryName}>
                    {countryMap.get(candidate.country) ?? candidate.country}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    )
  }

  const found = matches[0]
  const canonicalUrl = cityUrl(found)
  if (`/${country}/${city}` !== canonicalUrl) permanentRedirect(canonicalUrl)


  return (
    <main className={s.main}>
      <RememberCity id={found.id} />
      <Search />
      <Suspense fallback={<div>Loading...</div>}>
        <WeatherCardServer city={found} />
      </Suspense>
    </main>
  )
}
