import { test, expect } from './support/fixtures'

test('recovers search after a failed API request without losing the query', async ({ page }, info) => {
  await page.route('**/api/cities?**', (route) => route.fulfill({ status: 503, json: { error: 'Unavailable' } }))
  await page.goto('/cn/suzhou')
  const input = page.getByRole('combobox')
  await input.fill('Moscow')
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Search is temporarily unavailable.')
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await input.press('Tab')
  const retry = page.getByRole('button', { name: 'Try again' })
  await expect(retry).toBeFocused()
  await retry.press('Escape')
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
  await expect(retry).toHaveCount(0)
  await input.focus()
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
  await input.press('Tab')
  await expect(retry).toBeFocused()
  await page.unroute('**/api/cities?**')
  if (info.project.name === 'mobile-chromium') await retry.tap()
  else await retry.press('Enter')
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('Moscow')
  await expect(page.getByRole('option').first()).toContainText('Moscow')
  await input.press('Enter')
  await expect(page).toHaveURL('/ru/moscow')
})

test('rejects malformed search links and recovers after editing the query', async ({ page }) => {
  await page.route('**/api/cities?**', (route) =>
    route.fulfill({
      json: {
        results: [{ id: 1, name: 'Unsafe', admin1: '', country: 'RU', countryName: 'Russia', url: '//evil.test/city' }],
      },
    })
  )
  await page.goto('/cn/suzhou')
  const input = page.getByRole('combobox')
  await input.fill('Moscow')
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await input.press('Enter')
  await expect(page).toHaveURL('/cn/suzhou')
  await page.unroute('**/api/cities?**')
  await input.fill('Suzhou')
  await expect(page.getByRole('option')).toHaveCount(2)
})

test('ends a stalled search and ignores its response after a new query', async ({ page }) => {
  let release = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let finished = false
  await page.route('**/api/cities?q=moscow', async (route) => {
    const response = await route.fetch()
    await gate
    await route.fulfill({ response })
    finished = true
  })
  try {
    await page.goto('/cn/suzhou')
    const input = page.getByRole('combobox')
    await input.fill('Moscow')
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible({ timeout: 15000 })
    await expect(input).toHaveAttribute('aria-busy', 'false')
    await input.fill('Suzhou')
    await expect(page.getByRole('option')).toHaveCount(2)
    release()
    await expect.poll(() => finished).toBe(true)
    await expect(input).toHaveValue('Suzhou')
    await expect(page.getByRole('option')).toHaveCount(2)
    await expect(page.getByRole('option').first()).toContainText('Jiangsu')
  } finally {
    release()
  }
})

test('announces an empty result and closes subsequent suggestions with Escape', async ({ page }) => {
  await page.goto('/cn/suzhou')
  const input = page.getByRole('combobox')
  await input.fill('zzzzzzzzzzzzzzzz')
  await expect(page.getByRole('status')).toHaveText('No cities found.')
  await expect(page.getByText('Try another city or country.')).toBeVisible()
  await input.press('Escape')
  await expect(page.getByRole('status')).toHaveCount(0)
  await input.fill('Suzhou')
  await expect(page.getByRole('option')).toHaveCount(2)
  await input.press('Escape')
  await expect(input).not.toBeFocused()
  await expect(input).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await expect(page).toHaveURL('/cn/suzhou')
})
