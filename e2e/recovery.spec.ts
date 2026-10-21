import { test, expect } from './support/fixtures'

test('keeps search state while retrying a failed weather request', async ({ page, provider }) => {
  await provider.mode('http-503')
  await page.goto('/ru/moscow')
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Weather is temporarily unavailable. Try again.')
  const input = page.getByRole('combobox', { name: 'Search cities' })
  await input.fill('Suzhou')
  await expect(page.getByRole('option')).toHaveCount(2)
  await input.press('Tab')
  await expect(page.getByRole('button', { name: 'Try again' })).toBeFocused()
  await provider.mode('valid', 750)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('button', { name: 'Retrying...' })).toBeDisabled()
  await expect(input).toHaveValue('Suzhou')
  await expect(page.getByText('20°C', { exact: true })).toBeVisible()
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
  await expect(input).toHaveValue('Suzhou')
})

test('can search for a city from a real 404 response', async ({ page }) => {
  const response = await page.goto('/zz/unknown-city')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'City not found' })).toBeVisible()
  const input = page.getByRole('combobox', { name: 'Search cities' })
  await input.fill('Moscow')
  await expect(page.getByRole('listbox')).toBeVisible()
  await input.press('Enter')
  await expect(page).toHaveURL('/ru/moscow')
  await expect(page.getByText('20°C', { exact: true })).toBeVisible()
})

for (const [mode, message] of [
  ['network', 'Could not reach the weather provider. Try again.'],
  ['invalid', 'Weather data is temporarily unavailable. Try again.'],
  ['http-429', 'The weather provider is receiving too many requests. Try again later.'],
] as const) {
  test(`recovers from ${mode} without reloading the document`, async ({ page, provider }) => {
    await provider.mode(mode)
    await page.goto('/ru/moscow')
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(message)
    await page.evaluate(() => {
      document.documentElement.dataset.sessionMarker = 'preserved'
    })
    await provider.mode('valid', 300)
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByText('20°C', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.dataset.sessionMarker)).toBe('preserved')
  })
}

for (const mode of ['headers', 'body'] as const) {
  test(`times out stalled response ${mode} and can retry successfully`, async ({ page, provider }) => {
    await provider.mode(mode)
    await page.goto('/ru/moscow')
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('The weather request timed out. Try again.')
    expect((await provider.state()).requests.some((request) => request.aborted)).toBe(true)
    await provider.mode('valid')
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByText('20°C', { exact: true })).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })
}

for (const mode of ['http-401', 'missing-key'] as const) {
  test(`keeps configuration failure ${mode} private and offers search`, async ({ page, provider }) => {
    await provider.mode(mode)
    await page.goto('/ru/moscow')
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'Weather is currently unavailable. Please try again later.'
    )
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)
    await expect(page.getByRole('combobox')).toBeVisible()
    await expect(page.getByRole('main')).not.toContainText(/browser-test-key|appid|API key|401/)
    if (mode === 'missing-key') expect((await provider.state()).requests).toHaveLength(0)
  })
}

test('handles provider 404 as a weather failure for an existing city', async ({ page, provider }) => {
  await provider.mode('http-404')
  const response = await page.goto('/ru/moscow')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'Weather is unavailable for this location. Search for another city.'
  )
  await expect(page.getByRole('heading', { name: 'City not found' })).toHaveCount(0)
  await expect(page.getByRole('combobox')).toBeVisible()
})

test('contains an unexpected weather exception and recovers inside the weather boundary', async ({ page, provider }) => {
  await provider.mode('unexpected')
  await page.goto('/ru/moscow')
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'Weather could not be displayed. Try again or search for another city.'
  )
  await expect(page.getByRole('heading', { name: 'Something went wrong' })).toHaveCount(0)
  await expect(page.getByRole('main')).not.toContainText('Private unexpected failure')
  const input = page.getByRole('combobox')
  await input.fill('Suzhou')
  await expect(page.getByRole('option')).toHaveCount(2)
  await input.press('Tab')
  await provider.mode('valid', 300)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByText('20°C', { exact: true })).toBeVisible()
  await expect(input).toHaveValue('Suzhou')
})

test('allows another failed attempt before a successful retry', async ({ page, provider }) => {
  await provider.mode('http-503')
  await page.goto('/ru/moscow')
  const button = page.getByRole('button', { name: 'Try again' })
  await expect(button).toBeVisible()
  await provider.mode('http-503', 500)
  await button.click()
  await expect(page.getByRole('button', { name: 'Retrying...' })).toBeDisabled()
  await expect(button).toBeEnabled()
  await provider.mode('valid', 500)
  await button.click()
  await expect(page.getByText('20°C', { exact: true })).toBeVisible()
})

test('reuses validated weather after the provider becomes unavailable', async ({ page, provider }) => {
  await page.goto('/ru/moscow')
  await expect(page.getByText('20°C', { exact: true })).toBeVisible()
  await expect
    .poll(async () => (await page.context().cookies()).find((cookie) => cookie.name === 'lastCity')?.value)
    .toBe('524901')
  const initial = (await provider.state()).requests.length
  await provider.mode('http-503')
  await page.reload()
  await expect(page.getByText('20°C', { exact: true })).toBeVisible()
  expect((await provider.state()).requests).toHaveLength(initial)
})

test('shares one provider request between simultaneous cold page requests', async ({ request, provider }) => {
  await provider.mode('valid', 750)
  const responses = await Promise.all([request.get('/ru/moscow'), request.get('/ru/moscow')])
  for (const response of responses) {
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain('clear sky')
  }
  expect((await provider.state()).requests).toHaveLength(1)
})
