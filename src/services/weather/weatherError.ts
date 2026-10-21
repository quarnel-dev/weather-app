import 'server-only'

export type WeatherErrorCode = 'missing_api_key' | 'invalid_coordinates' | 'network' | 'timeout' | 'http' | 'invalid_response'

const messages: Record<WeatherErrorCode, string> = {
  missing_api_key: 'The weather service is not configured.',
  invalid_coordinates: 'The weather location has invalid coordinates.',
  network: 'The weather provider could not be reached.',
  timeout: 'The weather provider did not respond in time.',
  http: 'The weather provider returned an unsuccessful response.',
  invalid_response: 'The weather provider returned invalid data.',
}

export class WeatherServiceError extends Error {
  constructor(readonly code: WeatherErrorCode, readonly status?: number) {
    super(messages[code])
    this.name = 'WeatherServiceError'
  }
}
