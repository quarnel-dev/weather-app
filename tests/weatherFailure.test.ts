import { expect, test } from 'vitest'
import { weatherFailure } from '@/services/weather/failure.server'
import { WeatherServiceError, type WeatherErrorCode } from '@/services/weather/weatherError'

test.each([
  ['timeout', undefined, true],
  ['network', undefined, true],
  ['invalid_response', undefined, true],
  ['missing_api_key', undefined, false],
  ['invalid_coordinates', undefined, false],
  ['http', 400, false],
  ['http', 401, false],
  ['http', 403, false],
  ['http', 404, false],
  ['http', 429, true],
  ['http', 500, true],
  ['http', 503, true],
  ['http', undefined, true],
] as const)('maps %s/%s to a safe recovery policy', (code: WeatherErrorCode, status, retryable) => {
  const failure = new WeatherServiceError(code, status)
  failure.message = 'private provider details https://example.test/?appid=private-key'
  const result = weatherFailure(failure)
  expect(result.retryable).toBe(retryable)
  expect(result.message).not.toContain('private')
  expect(result.message).not.toContain('appid')
  expect(result.message).not.toContain('401')
  expect(result.message).not.toContain('API key')
})
