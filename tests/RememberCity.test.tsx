import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import RememberCity from '@/components/remembercity/RememberCity'

const { rememberCity } = vi.hoisted(() => ({ rememberCity: vi.fn() }))
vi.mock('@/services/geo/rememberCity.action', () => ({ rememberCity }))

beforeEach(() => {
  rememberCity.mockReset().mockResolvedValue(undefined)
})
afterEach(cleanup)

test('remembers an opened city and updates the ID on client-side navigation', async () => {
  const view = render(<RememberCity id={1886760} />)
  expect(rememberCity).toHaveBeenLastCalledWith(1886760)
  view.rerender(<RememberCity id={1793743} />)
  expect(rememberCity).toHaveBeenLastCalledWith(1793743)
  view.rerender(<RememberCity id={1793743} />)
  expect(rememberCity).toHaveBeenCalledTimes(2)
})

test('does not prevent rendering when saving the preference fails', async () => {
  rememberCity.mockRejectedValue(new Error('Offline'))
  await act(async () => { render(<RememberCity id={524901} />) })
  expect(rememberCity).toHaveBeenCalledWith(524901)
})
