import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { ForecastTimeline } from '@/components/forecasttimeline/ForecastTimeline'
import type { Forecast } from '@/types/Forecast.type'

const weather = { temp: 20, icon: 'clouds' as const, description: 'current conditions' }
const now = Date.UTC(2026, 10, 4, 18)

function point(hour: number): Forecast {
  return {
    date: new Date(Date.UTC(2026, 10, 4, hour)).toISOString(),
    temp: hour,
    tempMin: hour - 1,
    tempMax: hour + 1,
    description: 'future conditions',
    icon: 'clearDay',
    humidity: 50,
    windSpeed: 2,
  }
}

afterEach(cleanup)

test('shows Now and the next seven points in time order without repeating past or current points', () => {
  const forecast = [point(15), point(18), ...Array.from({ length: 10 }, (_, index) => point(21 + index * 3))].reverse()
  const original = forecast.map((item) => item.date)
  const { container } = render(<ForecastTimeline forecast={forecast} weather={weather} timezoneOffset={10800} now={now} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(8)
  expect(screen.getAllByRole('listitem')[0].textContent).toBe('Now20°')
  expect(screen.getByRole('img', { name: 'current conditions' })).toBeTruthy()
  const times = [...container.querySelectorAll('time')]
  expect(times.map((time) => time.textContent)).toEqual(['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00'])
  expect(times[0].dateTime).toBe('2026-11-04T21:00:00.000Z')
  expect(times[0].title).toBe('2026-11-05')
  expect(forecast.map((item) => item.date)).toEqual(original)
})

test.each([
  [-12600, '17:30', '2026-11-04'],
  [20700, '02:45', '2026-11-05'],
] as const)('formats city time using the signed offset %s instead of the browser timezone', (offset, time, date) => {
  const { container } = render(<ForecastTimeline forecast={[point(21)]} weather={weather} timezoneOffset={offset} now={now} />)
  expect(container.querySelector('time')?.textContent).toBe(time)
  expect(container.querySelector('time')?.title).toBe(date)
})

test('shows an empty state when no future forecast points are available', () => {
  render(<ForecastTimeline forecast={[point(15), point(18)]} weather={weather} timezoneOffset={0} now={now} />)
  expect(screen.getByText('No upcoming forecast is available.')).toBeTruthy()
  expect(screen.queryByRole('list')).toBeNull()
})
