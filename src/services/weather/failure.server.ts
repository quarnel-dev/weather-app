import 'server-only'

import type { WeatherServiceError } from './weatherError'

export function weatherFailure(error: WeatherServiceError): { message: string; retryable: boolean } {
  if (error.code === 'timeout') return { message: 'The weather request timed out. Try again.', retryable: true }
  if (error.code === 'network') return { message: 'Could not reach the weather provider. Try again.', retryable: true }
  if (error.code === 'invalid_response')
    return { message: 'Weather data is temporarily unavailable. Try again.', retryable: true }
  if (error.code === 'invalid_coordinates' || (error.code === 'http' && [400, 404].includes(error.status ?? 0))) {
    return { message: 'Weather is unavailable for this location. Search for another city.', retryable: false }
  }
  if (error.code === 'http' && error.status === 429) {
    return { message: 'The weather provider is receiving too many requests. Try again later.', retryable: true }
  }
  if (error.code === 'missing_api_key' || (error.code === 'http' && error.status !== undefined && error.status < 500)) {
    return { message: 'Weather is currently unavailable. Please try again later.', retryable: false }
  }
  return { message: 'Weather is temporarily unavailable. Try again.', retryable: true }
}
