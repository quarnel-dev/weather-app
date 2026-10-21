import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import ErrorPage from '@/app/error'
import NotFound, { metadata } from '@/app/not-found'

const { refresh, push } = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push }) }))

beforeEach(() => {
  refresh.mockReset()
  push.mockReset()
})
afterEach(cleanup)

test('gives an unknown city an accessible search field and a home link', () => {
  render(<NotFound />)
  expect(screen.getByRole('heading', { name: 'City not found' })).toBeTruthy()
  expect(screen.getByRole('combobox', { name: 'Search cities' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Go to home' }).getAttribute('href')).toBe('/')
  expect(metadata.robots).toEqual({ index: false, follow: false })
})

test('keeps search available for unexpected page failures without disclosing error details', () => {
  const reset = vi.fn()
  render(<ErrorPage error={new Error('Private server information')} reset={reset} />)
  expect(screen.getByRole('combobox', { name: 'Search cities' })).toBeTruthy()
  expect(screen.queryByText('Private server information')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(refresh).toHaveBeenCalledOnce()
  expect(reset).toHaveBeenCalledOnce()
})
