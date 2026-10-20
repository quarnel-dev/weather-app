import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import Search from '@/components/search/Search'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const results = [
  { id: 1886760, name: 'Suzhou', admin1: 'Jiangsu', country: 'CN', countryName: 'China', url: '/cn/suzhou-1886760' },
  { id: 1793743, name: 'Suzhou', admin1: 'Anhui', country: 'CN', countryName: 'China', url: '/cn/suzhou-1793743' },
]

beforeEach(() => {
  vi.useFakeTimers()
  push.mockReset()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

async function search() {
  const input = screen.getByRole('combobox')
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: 'Suzhou' } })
  return input
}

test('keeps region labels, canonical links, and accessible keyboard selection', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results }) }))
  render(<Search />)
  const input = await search()
  expect(screen.getByRole('status').textContent).toBe('Searching...')
  await act(async () => { await vi.advanceTimersByTimeAsync(250) })

  expect(screen.getAllByRole('option')).toHaveLength(2)
  expect(screen.getByText('· Jiangsu')).toBeTruthy()
  expect(screen.getByText('· Anhui')).toBeTruthy()
  expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(results.map((city) => city.url))

  fireEvent.keyDown(input, { key: 'ArrowDown' })
  expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0].id)
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(push).toHaveBeenCalledWith('/cn/suzhou-1886760')
  expect(input.getAttribute('aria-expanded')).toBe('false')
})

test('renders a plain error message when the server fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
  render(<Search />)
  await search()
  await act(async () => { await vi.advanceTimersByTimeAsync(250) })
  expect(screen.getByRole('alert').textContent).toContain('Search is unavailable')
  expect(screen.queryByRole('listbox')).toBeNull()
})

test('renders a plain empty message when no cities match', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) }))
  render(<Search />)
  await search()
  await act(async () => { await vi.advanceTimersByTimeAsync(250) })
  expect(screen.getByRole('status').textContent).toBe('No cities found.')
})


test('releases native input focus after keyboard selection so another search can start', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results }) }))
  render(<Search />)
  const input = screen.getByRole('combobox') as HTMLInputElement
  act(() => input.focus())
  fireEvent.change(input, { target: { value: 'Suzhou' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(250) })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(document.activeElement).not.toBe(input)
  act(() => input.focus())
  fireEvent.change(input, { target: { value: 'Moscow' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(250) })
  expect(input.getAttribute('aria-expanded')).toBe('true')
})
