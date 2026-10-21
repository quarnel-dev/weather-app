import type { ReactNode } from 'react'
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import Home from '@/components/home/Home'

const { router, getGeoClient, resolveLocation } = vi.hoisted(() => ({
  router: { replace: vi.fn() }, getGeoClient: vi.fn(), resolveLocation: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/services/geo/getGeo.service', () => ({ getGeoClient }))
vi.mock('@/services/geo/resolveLocation.action', () => ({ resolveLocation }))
vi.mock('@/components/search/Search', () => ({ default: () => <input aria-label="Search cities" /> }))
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: { div: ({ children }: { children: ReactNode }) => <div>{children}</div> },
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

beforeEach(() => {
  vi.useFakeTimers()
  router.replace.mockReset()
  getGeoClient.mockReset()
  resolveLocation.mockReset()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test('replaces the homepage with the resolved canonical URL', async () => {
  getGeoClient.mockResolvedValue({ lat: 31.30408, lon: 120.59538 })
  resolveLocation.mockResolvedValue('/cn/suzhou-1886760')
  await act(async () => { render(<Home />) })
  expect(resolveLocation).toHaveBeenCalledWith(31.30408, 120.59538)
  expect(router.replace).toHaveBeenCalledWith('/cn/suzhou-1886760')
  expect(screen.queryByLabelText('Search cities')).toBeNull()
})

test('offers search when geolocation is unavailable or denied', async () => {
  getGeoClient.mockResolvedValue(null)
  await act(async () => { render(<Home />) })
  expect(screen.getByLabelText('Search cities')).toBeTruthy()
  expect(resolveLocation).not.toHaveBeenCalled()
})

test('offers search when no nearby database city is found', async () => {
  getGeoClient.mockResolvedValue({ lat: 0, lon: 0 })
  resolveLocation.mockResolvedValue(null)
  await act(async () => { render(<Home />) })
  expect(screen.getByLabelText('Search cities')).toBeTruthy()
  expect(router.replace).not.toHaveBeenCalled()
})

test.each(['browser', 'server'])('offers search after a %s error', async (source) => {
  getGeoClient.mockResolvedValue({ lat: 51, lon: 0 })
  if (source === 'browser') getGeoClient.mockRejectedValue(new Error('Unavailable'))
  else resolveLocation.mockRejectedValue(new Error('Offline'))
  await act(async () => { render(<Home />) })
  expect(screen.getByLabelText('Search cities')).toBeTruthy()
})

test('ends a stalled browser lookup and ignores its eventual coordinates', async () => {
  const geo = deferred<{ lat: number; lon: number }>()
  getGeoClient.mockReturnValue(geo.promise)
  render(<Home />)
  expect(screen.getByRole('status').textContent).toBe('Detecting your location...')
  await act(async () => { await vi.advanceTimersByTimeAsync(10000) })
  expect(screen.getByLabelText('Search cities')).toBeTruthy()
  await act(async () => { geo.resolve({ lat: 51, lon: 0 }) })
  expect(resolveLocation).not.toHaveBeenCalled()
})

test('does not redirect away from search when a server result arrives after the deadline', async () => {
  const location = deferred<string | null>()
  getGeoClient.mockResolvedValue({ lat: 51, lon: 0 })
  resolveLocation.mockReturnValue(location.promise)
  await act(async () => { render(<Home />) })
  await act(async () => { await vi.advanceTimersByTimeAsync(10000) })
  expect(screen.getByLabelText('Search cities')).toBeTruthy()
  await act(async () => { location.resolve('/gb/london') })
  expect(router.replace).not.toHaveBeenCalled()
})

test('makes search available if navigation itself stalls', async () => {
  getGeoClient.mockResolvedValue({ lat: 51, lon: 0 })
  resolveLocation.mockResolvedValue('/gb/london')
  await act(async () => { render(<Home />) })
  await act(async () => { await vi.advanceTimersByTimeAsync(10000) })
  expect(screen.getByLabelText('Search cities')).toBeTruthy()
})

test('ignores coordinates received after unmounting', async () => {
  const geo = deferred<{ lat: number; lon: number }>()
  getGeoClient.mockReturnValue(geo.promise)
  const view = render(<Home />)
  view.unmount()
  await act(async () => { geo.resolve({ lat: 51, lon: 0 }) })
  expect(resolveLocation).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})

test('ignores a server result after navigating away', async () => {
  const location = deferred<string | null>()
  getGeoClient.mockResolvedValue({ lat: 51, lon: 0 })
  resolveLocation.mockReturnValue(location.promise)
  await act(async () => { render(<Home />) })
  fireEvent(window, new Event('pagehide'))
  await act(async () => { location.resolve('/gb/london') })
  expect(router.replace).not.toHaveBeenCalled()
})

test('shows search on a bfcache return without repeating automatic geolocation', async () => {
  getGeoClient.mockReturnValue(new Promise(() => {}))
  render(<Home />)
  fireEvent(window, new Event('pagehide'))
  fireEvent(window, new PageTransitionEvent('pageshow', { persisted: true }))
  expect(screen.getByLabelText('Search cities')).toBeTruthy()
  expect(getGeoClient).toHaveBeenCalledTimes(1)
})

test('ignores the discarded effect during a React Strict Mode restart', async () => {
  const first = deferred<{ lat: number; lon: number }>()
  getGeoClient.mockReturnValueOnce(first.promise).mockResolvedValue(null)
  await act(async () => { render(<StrictMode><Home /></StrictMode>) })
  await act(async () => { first.resolve({ lat: 51, lon: 0 }) })
  expect(screen.getByLabelText('Search cities')).toBeTruthy()
  expect(resolveLocation).not.toHaveBeenCalled()
})
