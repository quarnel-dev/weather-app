const assert = require('node:assert/strict')
const { test } = require('node:test')
const cities = require('../src/data/cities.json')
const { findCities, searchCities } = require('../src/services/search.service.ts')
const { cityUrl } = require('../src/utils/cityUrl.ts')
const { getWeather, getForecast } = require('../src/services/weather.service.ts')

test('unique city keeps its short URL', () => {
  const [moscow] = findCities('ru', 'moscow')
  assert.equal(moscow.id, 524901)
  assert.equal(cityUrl(moscow), '/ru/moscow')
})

test('ambiguous short URL preserves both Suzhou locations', () => {
  const matches = findCities('cn', 'suzhou')
  assert.deepEqual(new Set(matches.map((city) => city.admin1)), new Set(['Jiangsu', 'Anhui']))
  for (const city of matches) {
    const url = cityUrl(city)
    assert.equal(url, `/cn/suzhou-${city.id}`)
    assert.equal(findCities('cn', url.split('/')[2])[0].id, city.id)
  }
})

test('ID routes cannot select a different country or a mismatched name', () => {
  assert.deepEqual(findCities('ru', 'suzhou-1886760'), [])
  assert.deepEqual(findCities('cn', 'london-1886760'), [])
  assert.deepEqual(findCities('cn', 'suzhou-999999999'), [])
  assert.deepEqual(findCities('zz', 'nonexistent-city'), [])
})

test('explicit unique-city ID resolves to the short canonical URL', () => {
  const [moscow] = findCities('ru', 'moscow-524901')
  assert.equal(cityUrl(moscow), '/ru/moscow')
})

test('search retains same-name cities with different IDs', () => {
  const results = searchCities('Suzhou').filter((city) => city.name === 'Suzhou' && city.country === 'CN')
  assert.equal(results.length, 2)
  assert.equal(new Set(results.map(cityUrl)).size, 2)
})

test('every database record has a unique URL that resolves to that exact ID', () => {
  const urls = new Set()
  for (const city of cities) {
    const url = cityUrl(city)
    assert.ok(!urls.has(url), `Duplicate URL for city ${city.id}: ${url}`)
    urls.add(url)
    const [, country, slug] = url.split('/')
    const resolved = findCities(country, slug)
    assert.equal(resolved.length, 1, `Ambiguous canonical URL: ${url}`)
    assert.equal(resolved[0].id, city.id, `Wrong city at ${url}`)
  }
})

test('weather and forecast use the exact selected coordinates, never the city name', async (t) => {
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    requests.push(new URL(url))
    if (new URL(url).pathname.endsWith('/forecast')) {
      return { ok: true, json: async () => ({ list: [] }) }
    }
    return {
      ok: true,
      json: async () => ({
        name: 'Suzhou', sys: { country: 'CN', sunrise: 1, sunset: 2 },
        main: { temp: 20, temp_min: 19, temp_max: 21, feels_like: 20, humidity: 50 },
        weather: [{ description: 'clear sky', main: 'Clear', icon: '01d' }],
        wind: { speed: 2, deg: 90 }, clouds: { all: 0 }, coord: { lat: 1, lon: 2 },
      }),
    }
  })
  for (const city of findCities('cn', 'suzhou')) {
    await getWeather(city)
    await getForecast(city)
    for (const url of requests.slice(-2)) {
      assert.equal(url.searchParams.get('lat'), city.lat)
      assert.equal(url.searchParams.get('lon'), city.lon)
      assert.equal(url.searchParams.has('q'), false)
    }
  }
  assert.equal(requests.length, 4)
  assert.notEqual(requests[0].searchParams.get('lat'), requests[2].searchParams.get('lat'))
})
