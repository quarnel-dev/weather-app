import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { WeatherDetails } from '@/components/weatherdetails/WeatherDetails'
import { parseWeather } from '@/services/weather/payload.server'
import { weatherPayload } from './fixtures/weather'

afterEach(cleanup)

test('converts wind and visibility while preserving pressure and humidity units', () => {
  render(<WeatherDetails weather={parseWeather(weatherPayload())} />)
  for (const [name, value, unit] of [
    ['Wind', '9', 'km/h'],
    ['Humidity', '50', '%'],
    ['Pressure', '1013', 'hPa'],
    ['Visibility', '10', 'km'],
  ]) {
    const card = within(screen.getByRole('region', { name }))
    expect(card.getByText(value)).toBeTruthy()
    expect(card.getByText(unit)).toBeTruthy()
  }
})

test('uses the city offset for solar times across midnight independently of browser timezone', () => {
  const weather = {
    ...parseWeather(weatherPayload()),
    sunrise: Date.UTC(2026, 10, 4, 21) / 1000,
    sunset: Date.UTC(2026, 10, 5, 9) / 1000,
    timezoneOffset: 20700,
  }
  render(<WeatherDetails weather={weather} />)
  expect(within(screen.getByRole('region', { name: 'Sunrise' })).getByText('02:45')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: 'Sunset' })).getByText('14:45')).toBeTruthy()
})

test('keeps zero measurements and shows missing values without inventing solar times', () => {
  const weather = {
    ...parseWeather(weatherPayload()),
    windSpeed: 0,
    humidity: 0,
    visibility: 0,
    pressure: null,
    timezoneOffset: null,
  }
  render(<WeatherDetails weather={weather} />)
  for (const name of ['Wind', 'Humidity', 'Visibility'])
    expect(within(screen.getByRole('region', { name })).getByText('0')).toBeTruthy()
  for (const name of ['Pressure', 'Sunrise', 'Sunset'])
    expect(within(screen.getByRole('region', { name })).getByText('—')).toBeTruthy()
})
