import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { getGeoClient } from '@/services/geo/getGeo.service'

const getCurrentPosition = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  getCurrentPosition.mockReset()
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
})

afterEach(() => vi.useRealTimers())

test('returns coordinates with the existing browser accuracy and cache options', async () => {
  getCurrentPosition.mockImplementation((success) => success({ coords: { latitude: 55.75, longitude: 37.62 } }))
  expect(await getGeoClient()).toEqual({ lat: 55.75, lon: 37.62 })
  expect(getCurrentPosition.mock.calls[0][2]).toEqual({ maximumAge: 60000, timeout: 5000, enableHighAccuracy: true })
  expect(vi.getTimerCount()).toBe(0)
})

test.each([undefined, {}])('returns null when the browser has no geolocation API: %s', async (navigator) => {
  vi.stubGlobal('navigator', navigator)
  expect(await getGeoClient()).toBeNull()
})

test('handles a permission denial and clears its fallback timer', async () => {
  getCurrentPosition.mockImplementation((_, failure) => failure({ code: 1 }))
  expect(await getGeoClient()).toBeNull()
  expect(vi.getTimerCount()).toBe(0)
})

test('handles a synchronous browser error', async () => {
  getCurrentPosition.mockImplementation(() => {
    throw new Error('Unavailable')
  })
  expect(await getGeoClient()).toBeNull()
  expect(vi.getTimerCount()).toBe(0)
})

test('stops waiting even if the browser never calls either callback', async () => {
  const result = getGeoClient()
  await vi.advanceTimersByTimeAsync(5000)
  expect(await result).toBeNull()
  getCurrentPosition.mock.calls[0][0]({ coords: { latitude: 55.75, longitude: 37.62 } })
  expect(await result).toBeNull()
})

test.each([
  [NaN, 0],
  [0, Infinity],
  [91, 0],
  [0, -181],
])('ignores invalid browser coordinates: %s, %s', async (latitude, longitude) => {
  getCurrentPosition.mockImplementation((success) => success({ coords: { latitude, longitude } }))
  expect(await getGeoClient()).toBeNull()
})
