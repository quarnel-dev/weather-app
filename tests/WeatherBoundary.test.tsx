import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import WeatherBoundary from '@/components/weathercard/WeatherBoundary'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

function Broken(): never {
  throw new Error('Private internal detail')
}

beforeEach(() => {
  refresh.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(cleanup)

test('contains an unexpected weather error and leaves the surrounding search input intact', () => {
  render(
    <>
      <input aria-label="Search cities" defaultValue="Moscow" />
      <WeatherBoundary>
        <Broken />
      </WeatherBoundary>
    </>
  )
  expect(screen.getByRole('alert').textContent).toBe('Weather could not be displayed. Try again or search for another city.')
  expect(screen.getByLabelText('Search cities').getAttribute('value')).toBe('Moscow')
  expect(screen.queryByText('Private internal detail')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(refresh).toHaveBeenCalledOnce()
})

test('recovers when a server refresh supplies new successful content', () => {
  const view = render(
    <WeatherBoundary>
      <Broken />
    </WeatherBoundary>
  )
  expect(screen.getByRole('alert')).toBeTruthy()
  view.rerender(
    <WeatherBoundary>
      <p>20°C</p>
    </WeatherBoundary>
  )
  expect(screen.getByText('20°C')).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
})

test('remains recoverable when refreshed content still fails', () => {
  const view = render(
    <WeatherBoundary>
      <Broken />
    </WeatherBoundary>
  )
  view.rerender(
    <WeatherBoundary>
      <Broken />
    </WeatherBoundary>
  )
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
})

test('renders successful weather without a recovery message', () => {
  render(
    <WeatherBoundary>
      <p>20°C</p>
    </WeatherBoundary>
  )
  expect(screen.getByText('20°C')).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
})
