'use server'

import { cookies } from 'next/headers'
import { cityById } from '@/services/cities.index'
import { REMEMBERED_CITY_COOKIE, REMEMBERED_CITY_MAX_AGE } from './rememberedCity.server'

export async function rememberCity(id: number): Promise<void> {
  if (!Number.isSafeInteger(id) || !cityById.has(id)) return

  const store = await cookies()
  const value = String(id)
  if (store.get(REMEMBERED_CITY_COOKIE)?.value === value) return

  store.set(REMEMBERED_CITY_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REMEMBERED_CITY_MAX_AGE,
  })
}
