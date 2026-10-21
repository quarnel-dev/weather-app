import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { requestWeather } from '@/services/weather/request.server'

const city = { lat: '31.30408', lon: '120.59538' }
const fetch = vi.fn<typeof globalThis.fetch>()

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubEnv('WEATHER_API_KEY', 'test-weather-key')
  fetch.mockReset()
  vi.stubGlobal('fetch', fetch)
})

afterEach(() => vi.useRealTimers())

describe('weather request boundary', () => {
  test.each(['weather', 'forecast'] as const)(
    'uses exact coordinates, metric units, and a server-side key for %s',
    async (endpoint) => {
      fetch.mockResolvedValue(Response.json({ value: 42 }))
      expect(await requestWeather(endpoint, city)).toEqual({ value: 42 })
      const [input, options] = fetch.mock.calls[0]
      const url = new URL(String(input))
      expect(url.origin).toBe('https://api.openweathermap.org')
      expect(url.pathname).toBe(`/data/2.5/${endpoint}`)
      expect(Object.fromEntries(url.searchParams)).toEqual({ ...city, appid: 'test-weather-key', units: 'metric', lang: 'en' })
      expect(options?.signal).toBeInstanceOf(AbortSignal)
      expect(options?.cache).toBe('no-store')
      expect(vi.getTimerCount()).toBe(0)
    }
  )

  test.each([undefined, '', '  '])('does not call the provider without a configured key: %s', async (value) => {
    vi.stubEnv('WEATHER_API_KEY', value)
    await expect(requestWeather('weather', city)).rejects.toMatchObject({ code: 'missing_api_key' })
    expect(fetch).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  test.each([
    { lat: '', lon: '0' },
    { lat: ' ', lon: '0' },
    { lat: '91', lon: '0' },
    { lat: '-91', lon: '0' },
    { lat: '0', lon: '181' },
    { lat: '0', lon: '-181' },
    { lat: 'NaN', lon: '0' },
    { lat: '0', lon: 'Infinity' },
    { lat: 'no', lon: '0' },
    { lat: 51, lon: '0' },
    { lat: '0', lon: null },
    null,
  ])('does not send invalid coordinates: %j', async (value) => {
    await expect(requestWeather('weather', value as typeof city)).rejects.toMatchObject({ code: 'invalid_coordinates' })
    expect(fetch).not.toHaveBeenCalled()
  })

  test.each([400, 401, 403, 404, 429, 500, 503])('retains HTTP %s without exposing provider content', async (status) => {
    fetch.mockResolvedValue(new Response('private provider details', { status }))
    await expect(requestWeather('weather', city)).rejects.toMatchObject({ code: 'http', status })
    expect(vi.getTimerCount()).toBe(0)
  })

  test('discards the body of an unsuccessful response', async () => {
    const cancel = vi.fn()
    fetch.mockResolvedValue(new Response(new ReadableStream({ cancel }), { status: 503 }))
    await expect(requestWeather('weather', city)).rejects.toMatchObject({ code: 'http' })
    expect(cancel).toHaveBeenCalledOnce()
  })

  test('sanitizes network errors that contain credentials and request URLs', async () => {
    fetch.mockRejectedValue(new TypeError('Failed https://api.openweathermap.org/?appid=test-weather-key'))
    const error: unknown = await requestWeather('weather', city).catch((error: unknown) => error)
    expect(error).toMatchObject({ code: 'network', name: 'WeatherServiceError' })
    expect(String(error)).not.toContain('test-weather-key')
    expect(JSON.stringify(error)).not.toContain('appid')
    expect(error).not.toHaveProperty('cause')
    expect(vi.getTimerCount()).toBe(0)
  })

  test('classifies malformed JSON as an invalid response', async () => {
    fetch.mockResolvedValue(new Response('{broken json'))
    await expect(requestWeather('weather', city)).rejects.toMatchObject({ code: 'invalid_response' })
    expect(vi.getTimerCount()).toBe(0)
  })

  test('classifies a disconnected body as a network failure', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.error(new TypeError('Connection closed'))
      },
    })
    fetch.mockResolvedValue(new Response(body))
    await expect(requestWeather('weather', city)).rejects.toMatchObject({ code: 'network' })
  })

  test('aborts and rejects a stalled fetch at ten seconds even if fetch ignores its signal', async () => {
    fetch.mockImplementation(() => new Promise(() => {}))
    const failure = expect(requestWeather('weather', city)).rejects.toMatchObject({ code: 'timeout' })
    await vi.advanceTimersByTimeAsync(10000)
    await failure
    expect(fetch.mock.calls[0][1]?.signal?.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('bounds body reading by the same deadline as response headers', async () => {
    let finishBody!: (value: unknown) => void
    const response = new Response()
    vi.spyOn(response, 'json').mockImplementation(
      () =>
        new Promise((resolve) => {
          finishBody = resolve
        })
    )
    fetch.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 6000))
      return response
    })
    const failure = expect(requestWeather('weather', city)).rejects.toMatchObject({ code: 'timeout' })
    await vi.advanceTimersByTimeAsync(10000)
    await failure
    finishBody({ late: true })
    await Promise.resolve()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('does not read a response that arrives after the request deadline', async () => {
    let finish!: (value: Response) => void
    fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const response = Response.json({ late: true })
    const json = vi.spyOn(response, 'json')
    const failure = expect(requestWeather('weather', city)).rejects.toMatchObject({ code: 'timeout' })
    await vi.advanceTimersByTimeAsync(10000)
    await failure
    finish(response)
    await Promise.resolve()
    expect(json).not.toHaveBeenCalled()
  })

  test('reads configuration at request time', async () => {
    fetch.mockImplementation(async () => Response.json({}))
    await requestWeather('weather', city)
    vi.stubEnv('WEATHER_API_KEY', 'replacement-test-key')
    await requestWeather('weather', city)
    expect(new URL(String(fetch.mock.calls[1][0])).searchParams.get('appid')).toBe('replacement-test-key')
  })

  test('shares one pending provider request for simultaneous calls at the same coordinates', async () => {
    let finish!: (value: Response) => void
    fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const first = requestWeather('weather', city)
    const second = requestWeather('weather', { ...city })
    expect(fetch).toHaveBeenCalledOnce()
    finish(Response.json({ shared: true }))
    expect(await Promise.all([first, second])).toEqual([{ shared: true }, { shared: true }])
    expect(vi.getTimerCount()).toBe(0)
  })

  test('clears a failed shared request so the next call can retry', async () => {
    fetch.mockResolvedValueOnce(new Response('{}', { status: 503 })).mockResolvedValueOnce(Response.json({ recovered: true }))
    const outcomes = await Promise.allSettled([requestWeather('weather', city), requestWeather('weather', city)])
    expect(outcomes.every((outcome) => outcome.status === 'rejected')).toBe(true)
    expect(fetch).toHaveBeenCalledOnce()
    expect(await requestWeather('weather', city)).toEqual({ recovered: true })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test('does not share requests across different endpoints or coordinates', async () => {
    fetch.mockImplementation(async () => Response.json({}))
    await Promise.all([
      requestWeather('weather', city),
      requestWeather('forecast', city),
      requestWeather('weather', { ...city, lat: '33.63611' }),
      requestWeather('weather', { ...city, lon: '116.97889' }),
    ])
    expect(fetch).toHaveBeenCalledTimes(4)
  })
})
