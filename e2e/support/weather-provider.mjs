import { createServer } from 'node:http'
import { rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

if (process.env.E2E_TEST_MODE !== '1') throw new Error('The browser-test provider requires E2E_TEST_MODE=1')

const cache = fileURLToPath(new URL('../../.next-e2e/cache/fetch-cache/', import.meta.url))
const originalFetch = globalThis.fetch
const modes = new Set([
  'valid',
  'http-400',
  'http-401',
  'http-404',
  'http-429',
  'http-503',
  'invalid',
  'network',
  'headers',
  'body',
  'unexpected',
  'missing-key',
])
const active = new Set()
let settings = { mode: 'valid', delayMs: 0 }
let requests = []

function configure(value) {
  if (!value || !modes.has(value.mode) || !Number.isFinite(value.delayMs ?? 0) || value.delayMs < 0 || value.delayMs > 30000) {
    throw new Error('Invalid browser-test provider settings')
  }
  settings = { mode: value.mode, delayMs: value.delayMs ?? 0 }
  process.env.WEATHER_API_KEY = value.mode === 'missing-key' ? '' : 'browser-test-key'
}

const control = createServer(async (request, response) => {
  try {
    if (request.method === 'GET' && request.url === '/state') {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ ...settings, requests }))
      return
    }
    if (request.method !== 'POST' || !['/reset', '/mode'].includes(request.url)) {
      response.writeHead(404).end()
      return
    }
    let input = ''
    for await (const chunk of request) {
      input += chunk
      if (input.length > 4096) {
        response.writeHead(413).end()
        return
      }
    }
    const value = JSON.parse(input)
    if (request.url === '/reset') {
      for (const controller of active) controller.abort()
      await rm(cache, { recursive: true, force: true })
      requests = []
    }
    configure(value)
    response.writeHead(204).end()
  } catch {
    response.writeHead(400).end()
  }
})

control.listen(3101, '127.0.0.1')
process.on('SIGTERM', () => control.close())

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const finish = () => {
      signal.removeEventListener('abort', abort)
      resolve()
    }
    const timer = setTimeout(finish, ms)
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
}

globalThis.fetch = async function (input, options) {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
  if (url.hostname !== 'api.openweathermap.org') return originalFetch(input, options)

  const { mode, delayMs } = settings
  const entry = {
    endpoint: url.pathname,
    lat: url.searchParams.get('lat'),
    lon: url.searchParams.get('lon'),
    mode,
    aborted: false,
    completed: false,
  }
  requests.push(entry)
  if (url.pathname !== '/data/2.5/weather') throw new Error('Unexpected provider endpoint in browser tests')

  const controller = new AbortController()
  const abort = () => {
    entry.aborted = true
    controller.abort()
  }
  const finish = () => {
    entry.completed = true
    active.delete(controller)
    options?.signal?.removeEventListener('abort', abort)
  }
  active.add(controller)
  if (options?.signal?.aborted) abort()
  else options?.signal?.addEventListener('abort', abort, { once: true })

  if (mode === 'body') {
    return new Response(
      new ReadableStream({
        start(stream) {
          const fail = () => {
            stream.error(new DOMException('Aborted', 'AbortError'))
            finish()
          }
          if (controller.signal.aborted) fail()
          else controller.signal.addEventListener('abort', fail, { once: true })
        },
        cancel() {
          finish()
        },
      })
    )
  }

  try {
    if (mode === 'headers') await wait(30000, controller.signal)
    if (delayMs) await wait(delayMs, controller.signal)
    if (mode.startsWith('http-')) return new Response('Private provider response', { status: Number(mode.slice(5)) })
    if (mode === 'network') throw new TypeError('Private provider connection failure')

    const lat = Number(entry.lat)
    const name = lat > 50 ? 'Moscow' : lat > 32 ? 'Suzhou Anhui' : 'Suzhou Jiangsu'
    const payload = {
      cod: 200,
      name,
      sys: { country: lat > 50 ? 'RU' : 'CN', sunrise: 1761019200, sunset: 1761060000 },
      main: { temp: mode === 'invalid' ? 'invalid' : 20, temp_min: 19, temp_max: 21, feels_like: 20, humidity: 50 },
      weather: [{ description: 'clear sky', main: 'Clear', icon: '01d' }],
      wind: { speed: 2, deg: 90 },
      clouds: { all: 0 },
      coord: { lat, lon: Number(entry.lon) },
    }
    const response = Response.json(payload)
    if (mode === 'unexpected')
      Object.defineProperty(response, 'ok', {
        get() {
          throw new Error('Private unexpected failure')
        },
      })
    return response
  } finally {
    finish()
  }
}
