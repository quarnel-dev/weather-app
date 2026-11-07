import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { DailyForecast } from '@/components/dailyforecast/DailyForecast'
import type { DailyForecast as Day } from '@/types/DailyForecast.type'

const days: Day[] = [
  { date: '2026-11-05', tempMin: -10, tempMax: 30, description: 'clear sky', icon: 'clearDay' },
  { date: '2026-11-06', tempMin: 0, tempMax: 10, description: 'light rain', icon: 'rain' },
]
afterEach(cleanup)

test('labels actual city-local today and weekdays with full dates, conditions, and ranges', () => {
  render(<DailyForecast days={days} today="2026-11-05" />)
  const rows = screen.getAllByRole('listitem')
  expect(within(rows[0]).getByText('Today').getAttribute('datetime')).toBe('2026-11-05')
  expect(within(rows[1]).getByText('Fri').getAttribute('title')).toBe('2026-11-06')
  expect(within(rows[1]).getByText('light rain')).toBeTruthy()
  expect(within(rows[0]).getByLabelText('Minimum -10 degrees Celsius').textContent).toBe('-10°')
  expect(within(rows[0]).getByLabelText('Maximum 30 degrees Celsius').textContent).toBe('30°')
})

test('positions temperature ranges on the common scale and handles equal temperatures', () => {
  const { container, rerender } = render(<DailyForecast days={days} today="2026-11-04" />)
  expect(screen.queryByText('Today')).toBeNull()
  const ranges = container.querySelectorAll('[style]')
  expect((ranges[1] as HTMLElement).style.getPropertyValue('--range-start')).toBe('25%')
  expect((ranges[1] as HTMLElement).style.width).toBe('25%')
  rerender(<DailyForecast days={[{ ...days[0], tempMin: 0, tempMax: 0 }]} today="2026-11-05" />)
  expect((container.querySelector('[style]') as HTMLElement).style.width).toBe('100%')
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
})

test('does not fabricate rows for an empty forecast', () => {
  render(<DailyForecast days={[]} today="2026-11-05" />)
  expect(screen.getByText('No daily forecast is available.')).toBeTruthy()
  expect(screen.queryByRole('list')).toBeNull()
})
