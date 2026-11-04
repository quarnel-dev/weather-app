import { expect, test } from 'vitest'
import { groupForecastByDay } from '@/utils/groupForecastByDay'
import type { Forecast } from '@/types/Forecast.type'

function point(date: string, tempMin: number, tempMax: number, icon: Forecast['icon'] = 'clouds'): Forecast {
  return { date, temp: tempMin, tempMin, tempMax, icon, description: icon, humidity: 50, windSpeed: 2 }
}

test('groups by city-local dates across a year boundary and preserves partial days', () => {
  const forecast = [
    point('2026-12-31T18:00:00Z', -5, -2),
    point('2026-12-31T21:00:00Z', -7, -4),
    point('2027-01-01T00:00:00Z', -6, 0),
    point('2027-01-01T09:00:00Z', -1, 4, 'clearDay'),
  ]
  expect(groupForecastByDay(forecast, 10800)).toEqual([
    { date: '2026-12-31', tempMin: -5, tempMax: -2, description: 'clouds', icon: 'clouds' },
    { date: '2027-01-01', tempMin: -7, tempMax: 4, description: 'clearDay', icon: 'clearDay' },
  ])
})

test('handles negative offsets without using the UTC date as the local day', () => {
  const forecast = [point('2026-11-04T00:00:00Z', 10, 12), point('2026-11-04T06:00:00Z', 5, 8)]
  expect(groupForecastByDay(forecast, -18000).map((day) => day.date)).toEqual(['2026-11-03', '2026-11-04'])
})

test('uses fractional-hour offsets when choosing representative conditions near local noon', () => {
  const forecast = [point('2026-11-04T06:00:00Z', 10, 12, 'clearDay'), point('2026-11-04T09:00:00Z', 15, 18, 'rain')]
  expect(groupForecastByDay(forecast, 20700)).toEqual([
    { date: '2026-11-04', tempMin: 10, tempMax: 18, description: 'clearDay', icon: 'clearDay' },
  ])
})

test('sorts days and breaks equal-distance ties by the earlier point without mutating input', () => {
  const forecast = Object.freeze([
    Object.freeze(point('2026-11-05T12:00:00Z', 0, 0)),
    Object.freeze(point('2026-11-04T15:00:00Z', 12, 15, 'rain')),
    Object.freeze(point('2026-11-04T09:00:00Z', 8, 10, 'clearDay')),
  ])
  expect(groupForecastByDay(forecast, 0)).toEqual([
    { date: '2026-11-04', tempMin: 8, tempMax: 15, description: 'clearDay', icon: 'clearDay' },
    { date: '2026-11-05', tempMin: 0, tempMax: 0, description: 'clouds', icon: 'clouds' },
  ])
  expect(forecast.map((item) => item.date)).toEqual(['2026-11-05T12:00:00Z', '2026-11-04T15:00:00Z', '2026-11-04T09:00:00Z'])
})

test('keeps all available local dates without padding the forecast or limiting it to five rows', () => {
  const forecast = Array.from({ length: 40 }, (_, index) =>
    point(new Date(Date.UTC(2026, 10, 4, 18 + index * 3)).toISOString(), index, index + 1)
  )
  const days = groupForecastByDay(forecast, 0)
  expect(days).toHaveLength(6)
  expect(days[0]).toMatchObject({ date: '2026-11-04', tempMin: 0, tempMax: 2 })
  expect(days.at(-1)).toMatchObject({ date: '2026-11-09', tempMin: 34, tempMax: 40 })
})

test('keeps an empty forecast empty', () => {
  expect(groupForecastByDay([], 10800)).toEqual([])
})

test('does not invent a city-local day when its UTC offset is unavailable', () => {
  expect(groupForecastByDay([point('2026-11-04T12:00:00Z', 10, 15)], null)).toEqual([])
})
