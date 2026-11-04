import { test, expect } from './support/fixtures'

for (const { query, text } of [
  { query: 'Skopje', text: 'Macedonia, The Former Yugoslav Republic of' },
  { query: 'Turisticheskogo', text: 'Poselok Turisticheskogo pansionata "Klyazminskoe vodohranilische"' },
]) {
  test(`keeps long result text within the search width: ${query}`, async ({ page }) => {
    await page.goto('/cn/suzhou')
    await page.getByRole('combobox').fill(query)
    const option = page.getByRole('option').first()
    await expect(option).toContainText(text)
    await expect(option).toHaveCSS('opacity', '1')
    const link = option.getByRole('link')
    expect(await link.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('keeps keyboard-selected search results inside a short viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 320 })
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: undefined }))
  await page.goto('/')
  const input = page.getByRole('combobox')
  await input.fill('United States')
  const options = page.getByRole('option')
  await expect(options).toHaveCount(8)
  for (let index = 0; index < 8; index++) await input.press('ArrowDown')
  const last = options.last()
  await expect(last).toBeInViewport({ ratio: 1 })
  await expect(last).toHaveAttribute('aria-selected', 'true')
  expect(await page.getByRole('listbox').evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  for (let index = 0; index < 8; index++) await input.press('ArrowUp')
  await expect(options.first()).toBeInViewport({ ratio: 1 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
