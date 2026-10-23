import { test, expect } from './support/fixtures'
import { denyGeolocation, rememberedCity } from './support/navigation'

test('keeps same-name city links distinct and restores the selected record before geolocation', async ({ page, context }) => {
  await denyGeolocation(page)
  await page.goto('/cn/suzhou')
  await expect(page.getByRole('heading', { name: 'Which Suzhou?' })).toBeVisible()
  const input = page.getByRole('combobox')
  await input.fill('Suzhou')
  const links = page.getByRole('listbox').getByRole('link')
  await expect(links).toHaveCount(2)
  expect(await links.evaluateAll((items) => items.map((item) => item.getAttribute('href')))).toEqual([
    '/cn/suzhou-1886760',
    '/cn/suzhou-1793743',
  ])
  await input.press('ArrowDown')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(page).toHaveURL('/cn/suzhou-1793743')
  await expect(page.getByText('Suzhou Anhui', { exact: true })).toBeVisible()
  await rememberedCity(context, 1793743)
  await page.goto('/')
  await expect(page).toHaveURL('/cn/suzhou-1793743')
  expect(await page.evaluate(() => Reflect.get(window, 'geolocationCalls'))).toBe(0)
})

test('can search again after selecting the current city and navigate with mouse or touch', async ({ page, context }, info) => {
  await page.goto('/ru/moscow')
  await expect(page.getByText('20°C', { exact: true })).toBeVisible()
  const input = page.getByRole('combobox')
  await input.fill('Moscow')
  await expect(page.getByRole('listbox')).toBeVisible()
  await input.press('Enter')
  await expect(input).not.toBeFocused()
  await input.fill('Suzhou')
  const link = page.getByRole('listbox').getByRole('link', { name: 'Suzhou · Jiangsu China' })
  await expect(link).toBeVisible()
  if (info.project.name === 'mobile-chromium') await link.tap()
  else await link.click()
  await expect(page).toHaveURL('/cn/suzhou-1886760')
  await expect(page.getByText('Suzhou Jiangsu', { exact: true })).toBeVisible()
  await rememberedCity(context, 1886760)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('migrates an unambiguous legacy preference to a secure HTTP-only ID cookie', async ({ page, context }) => {
  await context.addCookies([
    { name: 'lastCity', value: JSON.stringify({ country: 'ru', city: 'moscow' }), url: 'http://127.0.0.1:3100' },
  ])
  await page.goto('/')
  await expect(page).toHaveURL('/ru/moscow')
  const cookie = await rememberedCity(context, 524901)
  expect(cookie.httpOnly).toBe(true)
  expect(cookie.secure).toBe(true)
  expect(cookie.sameSite).toBe('Lax')
  expect(Math.abs(cookie.expires - Date.now() / 1000 - 30 * 86400)).toBeLessThan(120)
  expect(await page.evaluate(() => document.cookie.includes('lastCity'))).toBe(false)
})

for (const value of ['{', '999999999', '{"country":"cn","city":"suzhou"}', '{"country":"//evil.test","city":"moscow"}']) {
  test(`ignores an unusable preference without redirecting away: ${value}`, async ({ page, context }) => {
    await denyGeolocation(page)
    await context.addCookies([{ name: 'lastCity', value, url: 'http://127.0.0.1:3100' }])
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('combobox')).toBeVisible()
  })
}

test('canonicalizes valid IDs and does not remember ambiguous or invalid routes', async ({ page, context, request }) => {
  const redirect = await request.get('/ru/moscow-524901', { maxRedirects: 0 })
  expect(redirect.status()).toBe(308)
  expect(redirect.headers().location).toBe('/ru/moscow')
  await page.goto('/ru/moscow-524901')
  await expect(page).toHaveURL('/ru/moscow')
  await rememberedCity(context, 524901)
  await page.goto('/cn/suzhou')
  await expect(page.getByRole('heading', { name: 'Which Suzhou?' })).toBeVisible()
  expect((await context.cookies()).find((cookie) => cookie.name === 'lastCity')?.value).toBe('524901')
  const invalid = await page.goto('/gb/moscow-524901')
  expect(invalid?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'City not found' })).toBeVisible()
  expect((await context.cookies()).find((cookie) => cookie.name === 'lastCity')?.value).toBe('524901')
})

test('ignores old weather content after switching cities during a slow request', async ({ page, provider, context }) => {
  await provider.mode('valid', 2500)
  await page.goto('/ru/moscow', { waitUntil: 'commit' })
  const input = page.getByRole('combobox')
  await input.fill('Suzhou')
  await expect(page.getByRole('listbox')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Loading weather...' })).toBeVisible()
  await provider.mode('valid')
  await input.press('ArrowDown')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(page).toHaveURL('/cn/suzhou-1793743')
  await expect(page.getByText('Suzhou Anhui', { exact: true })).toBeVisible()
  await expect
    .poll(async () =>
      (await provider.state()).requests.filter((request) => request.lat === '55.7520400').every((request) => request.completed)
    )
    .toBe(true)
  await rememberedCity(context, 1793743)
  await expect(page).toHaveURL('/cn/suzhou-1793743')
  await expect(page.getByText('Moscow', { exact: true })).toHaveCount(0)
})

test('keeps browser back and forward navigation aligned with the remembered city', async ({ page, context }) => {
  await page.goto('/ru/moscow')
  await rememberedCity(context, 524901)
  const input = page.getByRole('combobox')
  await input.fill('Suzhou')
  await expect(page.getByRole('option')).toHaveCount(2)
  await input.press('Enter')
  await expect(page).toHaveURL('/cn/suzhou-1886760')
  await rememberedCity(context, 1886760)
  await page.goBack()
  await expect(page).toHaveURL('/ru/moscow')
  await expect(page.getByText('Moscow', { exact: true })).toBeVisible()
  await rememberedCity(context, 524901)
  await page.goForward()
  await expect(page).toHaveURL('/cn/suzhou-1886760')
  await expect(page.getByText('Suzhou Jiangsu', { exact: true })).toBeVisible()
  await rememberedCity(context, 1886760)
})
