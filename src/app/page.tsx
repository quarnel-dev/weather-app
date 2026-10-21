import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Home from '@/components/home/Home'
import { REMEMBERED_CITY_COOKIE, resolveRememberedCity } from '@/services/geo/rememberedCity.server'
import { cityUrl } from '@/utils/cityUrl'

export default async function Page() {
  const store = await cookies()
  const city = resolveRememberedCity(store.get(REMEMBERED_CITY_COOKIE)?.value)
  if (city) redirect(cityUrl(city))

  return <Home />
}
