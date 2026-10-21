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
