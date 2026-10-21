import { describe, expect, test, vi, beforeEach } from 'vitest'
import { resolveRememberedCity, REMEMBERED_CITY_MAX_AGE } from '@/services/geo/rememberedCity.server'
import { rememberCity } from '@/services/geo/rememberCity.action'
import { resolveLocation } from '@/services/geo/resolveLocation.action'
import { cityById } from '@/services/cities.index'

const { get, set } = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get, set }) }))

beforeEach(() => {
  get.mockReset()
  set.mockReset()
})

describe('remembered city resolution', () => {
  test('restores an exact ID even when its city name is ambiguous', () => {
    expect(resolveRememberedCity('1886760')?.admin1).toBe('Jiangsu')
    expect(resolveRememberedCity('1793743')?.admin1).toBe('Anhui')
  })

  test.each([
    undefined, '', '0', '-524901', '524901.5', '0524901', '999999999', '9007199254740992',
    'null', '[]', '{}', 'true', '"524901"', '{', 'x'.repeat(513),
    '{"country":"//evil.test","city":"moscow"}', '{"country":"ru","city":"//evil.test"}',
    '{"country":"ru","city":{}}', '{"country":12,"city":"moscow"}',
    '{"country":"ru","city":"moscow?next=https://evil.test"}',
    '{"country":"ru","city":"moscow%2Fother"}', '{"country":"ru","city":"unknown-city"}',
  ])('ignores an invalid cookie: %s', (value) => {
    expect(resolveRememberedCity(value)).toBeNull()
  })

  test.each([
    ['ru', 'moscow', 524901],
    ['RU', 'Moscow', 524901],
    ['us', 'New York City', 5128581],
    ['cn', 'suzhou-1886760', 1886760],
  ])('accepts a legacy cookie only when it resolves uniquely: %s/%s', (country, city, id) => {
    expect(resolveRememberedCity(JSON.stringify({ country, city }))?.id).toBe(id)
  })

  test('does not guess which city an ambiguous legacy cookie meant', () => {
    expect(resolveRememberedCity('{"country":"cn","city":"suzhou"}')).toBeNull()
  })
})

describe('remembering a city', () => {
  test('stores only its database ID with a bounded, HTTP-only cookie', async () => {
    await rememberCity(1886760)
    expect(set).toHaveBeenCalledWith('lastCity', '1886760', {
      httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: REMEMBERED_CITY_MAX_AGE,
    })
  })

  test.each([NaN, Infinity, -1, 1.5, 999999999, '524901', null, {}])('does not save an invalid or unknown ID: %s', async (id) => {
    await rememberCity(id as number)
    expect(set).not.toHaveBeenCalled()
  })

  test('does not rewrite a cookie that already contains the current ID', async () => {
    get.mockReturnValue({ value: '524901' })
    await rememberCity(524901)
    expect(set).not.toHaveBeenCalled()
  })

  test('replaces a legacy cookie when the resolved city is visited', async () => {
    get.mockReturnValue({ value: '{"country":"ru","city":"moscow"}' })
    await rememberCity(524901)
    expect(set.mock.calls[0].slice(0, 2)).toEqual(['lastCity', '524901'])
  })

  test('uses a secure cookie in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      await rememberCity(524901)
      expect(set.mock.calls[0][2].secure).toBe(true)
    } finally {
      vi.unstubAllEnvs()
    }
  })
})

describe('coordinate resolution with the real database', () => {
  test.each([
    [1886760, '/cn/suzhou-1886760'],
    [1793743, '/cn/suzhou-1793743'],
    [524901, '/ru/moscow'],
  ])('resolves the exact coordinates of city %s to its canonical URL', async (id, url) => {
    const city = cityById.get(id)!
    expect(await resolveLocation(Number(city.lat), Number(city.lon))).toBe(url)
  })

  test('returns no location for an ocean position or invalid coordinates', async () => {
    expect(await resolveLocation(0, 0)).toBeNull()
    expect(await resolveLocation(NaN, 0)).toBeNull()
    expect(await resolveLocation(0, 181)).toBeNull()
  })
})
