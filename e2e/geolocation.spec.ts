import { test, expect } from './support/fixtures'
import { denyGeolocation, rememberedCity } from './support/navigation'

for (const city of [
  { latitude: 31.30408, longitude: 120.59538, id: 1886760, name: 'Suzhou Jiangsu' },
  { latitude: 33.63611, longitude: 116.97889, id: 1793743, name: 'Suzhou Anhui' },
]) {
  test(`resolves browser coordinates to the exact same-name record ${city.id}`, async ({ page, context, provider }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation(city)
    await page.goto('/')
    await expect(page).toHaveURL(`/cn/suzhou-${city.id}`)
    await expect(page.getByText(city.name, { exact: true })).toBeVisible()
    await rememberedCity(context, city.id)
    const requests = (await provider.state()).requests
    expect(requests.length).toBeGreaterThan(0)
    expect(requests.every((request) => Number(request.lat) === city.latitude && Number(request.lon) === city.longitude)).toBe(
      true
    )
  })
}

test('falls back to manual search after permission denial', async ({ page, context }) => {
  await denyGeolocation(page)
  await page.goto('/')
  const input = page.getByRole('combobox')
  await input.fill('Moscow')
  await expect(page.getByRole('listbox')).toBeVisible()
  await input.press('Enter')
  await expect(page).toHaveURL('/ru/moscow')
  await expect(page.getByText('20°C', { exact: true })).toBeVisible()
  await rememberedCity(context, 524901)
})

test('provides search when the browser has no geolocation API', async ({ page, provider }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: undefined }))
  await page.goto('/')
  await expect(page.getByRole('combobox')).toBeVisible()
  expect((await provider.state()).requests).toEqual([])
})

test('provides search when no database city is within the location radius', async ({ page, context, provider }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 0, longitude: 0 })
  await page.goto('/')
  await expect(page.getByRole('combobox')).toBeVisible()
  await expect(page).toHaveURL('/')
  expect((await provider.state()).requests).toEqual([])
  expect((await context.cookies()).find((cookie) => cookie.name === 'lastCity')).toBeUndefined()
})

test('times out a silent geolocation API and ignores its late callback', async ({ page, context, provider }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition(success: PositionCallback) {
          Reflect.set(window, 'finishGeolocation', () =>
            success({ coords: { latitude: 31.30408, longitude: 120.59538 } } as GeolocationPosition)
          )
        },
      },
    })
  })
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('Detecting your location...')
  const input = page.getByRole('combobox')
  await input.fill('Moscow', { timeout: 10000 })
  await page.evaluate(() => Reflect.get(window, 'finishGeolocation')())
  await expect(page.getByRole('listbox')).toBeVisible()
  expect((await provider.state()).requests).toEqual([])
  await input.press('Enter')
  await expect(page).toHaveURL('/ru/moscow')
  await rememberedCity(context, 524901)
})

test('ignores a stalled location action after manual navigation', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 31.30408, longitude: 120.59538 })
  let release = () => {}
  let intercepted = false
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('http://127.0.0.1:3100/', async (route) => {
    if (route.request().method() !== 'POST' || !route.request().headers()['next-action']) return route.continue()
    const response = await route.fetch()
    intercepted = true
    await gate
    await route.fulfill({ response })
  })
  try {
    await page.goto('/')
    await expect.poll(() => intercepted).toBe(true)
    const input = page.getByRole('combobox')
    await input.fill('Moscow', { timeout: 15000 })
    await expect(page.getByRole('listbox')).toBeVisible()
    await input.press('Enter')
    await expect(page).toHaveURL('/ru/moscow')
    await expect(page.getByText('20°C', { exact: true })).toBeVisible()
    release()
    await rememberedCity(context, 524901)
    await expect(page).toHaveURL('/ru/moscow')
  } finally {
    release()
  }
})
