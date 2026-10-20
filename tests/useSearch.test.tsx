import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useSearch } from '@/components/search/Search.hook'
import type { CitySearchResult } from '@/types/CitySearchResult.type'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const moscow: CitySearchResult = {
  id: 524901, name: 'Moscow', admin1: 'Moscow', country: 'RU', countryName: 'Russia', url: '/ru/moscow',
}
const suzhou: CitySearchResult = {
  id: 1886760, name: 'Suzhou', admin1: 'Jiangsu', country: 'CN', countryName: 'China', url: '/cn/suzhou-1886760',
}
const response = (results: CitySearchResult[]) => ({ ok: true, json: async () => ({ results }) })
const change = (value: string) => ({ target: { value } }) as ChangeEvent<HTMLInputElement>
const key = (value: string) => ({ key: value, preventDefault: vi.fn() }) as unknown as KeyboardEvent
const fetchMock = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock.mockReset().mockResolvedValue(response([moscow, suzhou]))
  push.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

async function waitForSearch() {
  await act(async () => { await vi.advanceTimersByTimeAsync(250) })
}

describe('asynchronous city search', () => {
  test('waits for focus and at least two characters', async () => {
    const { result } = renderHook(useSearch)
    act(() => result.current.handleChange(change('London')))
    await waitForSearch()
    expect(fetchMock).not.toHaveBeenCalled()
    act(() => {
      result.current.handleChange(change('L'))
      result.current.handleFocus()
    })
    await waitForSearch()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
  })

  test('debounces typing and sends only the latest normalized query', async () => {
    const { result } = renderHook(useSearch)
    act(() => {
      result.current.handleFocus()
      result.current.handleChange(change('Lo'))
    })
    expect(result.current.message).toBe('Searching...')
    await act(async () => { await vi.advanceTimersByTimeAsync(200) })
    act(() => result.current.handleChange(change(' LON ')))
    await act(async () => { await vi.advanceTimersByTimeAsync(249) })
    expect(fetchMock).not.toHaveBeenCalled()
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/cities?q=lon')
    expect(result.current.results).toEqual([moscow, suzhou])
    expect(result.current.open).toBe(true)
  })

  test('cancels old requests and ignores their late responses', async () => {
    let resolveOld!: (value: ReturnType<typeof response>) => void
    fetchMock.mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve }))
    const { result } = renderHook(useSearch)
    act(() => {
      result.current.handleFocus()
      result.current.handleChange(change('Suzhou'))
    })
    await waitForSearch()
    const oldSignal = fetchMock.mock.calls[0][1].signal as AbortSignal
    act(() => result.current.handleChange(change('Moscow')))
    expect(oldSignal.aborted).toBe(true)
    expect(result.current.results).toEqual([])
    fetchMock.mockResolvedValueOnce(response([moscow]))
    await waitForSearch()
    await act(async () => { resolveOld(response([suzhou])) })
    expect(result.current.results).toEqual([moscow])
  })

  test('clears results immediately when the query becomes too short', async () => {
    const { result } = renderHook(useSearch)
    act(() => {
      result.current.handleFocus()
      result.current.handleChange(change('Moscow'))
    })
    await waitForSearch()
    act(() => result.current.handleChange(change('M')))
    expect(result.current.open).toBe(false)
    expect(result.current.message).toBe('')
    await waitForSearch()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('reports empty results', async () => {
    fetchMock.mockResolvedValueOnce(response([]))
    const { result } = renderHook(useSearch)
    act(() => {
      result.current.handleFocus()
      result.current.handleChange(change('Unknown'))
    })
    await waitForSearch()
    expect(result.current.message).toBe('No cities found.')
    expect(result.current.open).toBe(false)
  })

  test('allows retry after an HTTP error by refocusing the field', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 })
    const { result } = renderHook(useSearch)
    act(() => {
      result.current.handleFocus()
      result.current.handleChange(change('Moscow'))
    })
    await waitForSearch()
    expect(result.current.status).toBe('error')
    expect(result.current.message).toContain('Search is unavailable')
    act(() => result.current.handleBlur())
    act(() => result.current.handleFocus())
    await waitForSearch()
    expect(result.current.status).toBe('success')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('Escape cancels a pending search even when the list is not open', async () => {
    const { result } = renderHook(useSearch)
    act(() => {
      result.current.handleFocus()
      result.current.handleChange(change('Moscow'))
    })
    act(() => result.current.handleKeyDown(key('Escape')))
    await waitForSearch()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.isFocused).toBe(false)
    expect(result.current.message).toBe('')
  })

  test('blur and unmount abort requests without showing an error', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    const { result, unmount } = renderHook(useSearch)
    act(() => {
      result.current.handleFocus()
      result.current.handleChange(change('Moscow'))
    })
    await waitForSearch()
    const firstSignal = fetchMock.mock.calls[0][1].signal as AbortSignal
    act(() => result.current.handleBlur())
    expect(firstSignal.aborted).toBe(true)
    expect(result.current.message).toBe('')
    act(() => result.current.handleFocus())
    await waitForSearch()
    const secondSignal = fetchMock.mock.calls[1][1].signal as AbortSignal
    unmount()
    expect(secondSignal.aborted).toBe(true)
  })

  test('navigates with keyboard arrows and the server-provided URL', async () => {
    const { result } = renderHook(useSearch)
    act(() => {
      result.current.handleFocus()
      result.current.handleChange(change('city'))
    })
    await waitForSearch()
    act(() => result.current.handleKeyDown(key('ArrowDown')))
    act(() => result.current.handleKeyDown(key('ArrowDown')))
    expect(result.current.activeIndex).toBe(1)
    act(() => result.current.handleKeyDown(key('Enter')))
    expect(push).toHaveBeenCalledWith('/cn/suzhou-1886760')
    expect(result.current.open).toBe(false)
  })

  test('Enter selects the first result when no option is highlighted', async () => {
    const { result } = renderHook(useSearch)
    act(() => {
      result.current.handleFocus()
      result.current.handleChange(change('city'))
    })
    await waitForSearch()
    act(() => result.current.handleKeyDown(key('Enter')))
    expect(push).toHaveBeenCalledWith('/ru/moscow')
  })

  test('does not send overlong queries', async () => {
    const { result } = renderHook(useSearch)
    act(() => {
      result.current.handleFocus()
      result.current.handleChange(change('x'.repeat(81)))
    })
    await waitForSearch()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.message).toBe('Use up to 80 characters.')
  })
})


test.each(['Enter', 'Escape', 'ArrowDown', 'ArrowUp'])('does not intercept %s during IME composition', async (pressed) => {
  const { result } = renderHook(useSearch)
  act(() => {
    result.current.handleFocus()
    result.current.handleChange(change('city'))
  })
  await waitForSearch()
  const event = { ...key(pressed), nativeEvent: { isComposing: true } } as unknown as KeyboardEvent
  act(() => result.current.handleKeyDown(event))
  expect(push).not.toHaveBeenCalled()
  expect(event.preventDefault).not.toHaveBeenCalled()
  expect(result.current.open).toBe(true)
})

test('preserves IME input when the browser reports legacy key code 229', async () => {
  const { result } = renderHook(useSearch)
  act(() => {
    result.current.handleFocus()
    result.current.handleChange(change('city'))
  })
  await waitForSearch()
  const event = { ...key('Enter'), nativeEvent: { isComposing: false, keyCode: 229 } } as unknown as KeyboardEvent
  act(() => result.current.handleKeyDown(event))
  expect(push).not.toHaveBeenCalled()
  expect(result.current.open).toBe(true)
})

