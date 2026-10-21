import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import Recovery from '@/components/recovery/Recovery'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

beforeEach(() => {
  refresh.mockReset()
})
afterEach(cleanup)

test('announces a failure and refreshes server content on a manual retry', () => {
  render(<Recovery message="Weather is temporarily unavailable." />)
  expect(screen.getByRole('alert').textContent).toBe('Weather is temporarily unavailable.')
  expect(refresh).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(refresh).toHaveBeenCalledOnce()
})

test('offers no retry for failures that require another location or server configuration', () => {
  render(<Recovery message="Search for another city." retryable={false} />)
  expect(screen.getByRole('alert').textContent).toBe('Search for another city.')
  expect(screen.queryByRole('button')).toBeNull()
})

test('resets an enclosing page boundary together with refreshing server content', () => {
  const reset = vi.fn()
  render(<Recovery message="Please try again." onRetry={reset} />)
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(refresh).toHaveBeenCalledOnce()
  expect(reset).toHaveBeenCalledOnce()
})
