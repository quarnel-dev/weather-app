'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { fetchCityResults } from '@/services/citySearch.client'
import { MAX_SEARCH_LENGTH, MIN_SEARCH_LENGTH } from '@/services/search.constants'
import type { CitySearchResult } from '@/types/CitySearchResult.type'
import { normalize } from '@/utils/normalize'

type SearchStatus = 'idle' | 'loading' | 'success' | 'error'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CitySearchResult[]>([])
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const listId = useId()
  const router = useRouter()
  const open = isFocused && results.length > 0

  useEffect(() => {
    const value = normalize(query)
    if (!isFocused || value.length < MIN_SEARCH_LENGTH || value.length > MAX_SEARCH_LENGTH) return

    const controller = new AbortController()
    requestRef.current = controller
    const timer = setTimeout(async () => {
      try {
        const matches = await fetchCityResults(value, controller.signal)
        if (controller.signal.aborted) return
        setResults(matches)
        setActiveIndex(-1)
        setStatus('success')
      } catch {
        if (!controller.signal.aborted) setStatus('error')
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, isFocused])

  function resetSearch(value: string) {
    requestRef.current?.abort()
    setResults([])
    setActiveIndex(-1)
    const length = normalize(value).length
    setStatus(length >= MIN_SEARCH_LENGTH && length <= MAX_SEARCH_LENGTH ? 'loading' : 'idle')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    resetSearch(value)
    setQuery(value)
  }

  function handleBlur() {
    requestRef.current?.abort()
    setIsFocused(false)
    setResults([])
    setActiveIndex(-1)
    setStatus('idle')
  }

  function handleFocus() {
    resetSearch(query)
    setIsFocused(true)
  }

  function handleSelect() {
    handleBlur()
    inputRef.current?.blur()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleSelect()
      return
    }
    if (!open) return

    const actions: Record<string, () => void> = {
      ArrowDown: () => setActiveIndex((i) => Math.min(i + 1, results.length - 1)),
      ArrowUp: () => setActiveIndex((i) => Math.max(i - 1, 0)),
      Enter: () => {
        const selected = results[activeIndex >= 0 ? activeIndex : 0]
        if (selected) {
          router.push(selected.url)
          handleSelect()
        }
      },
    }
    actions[e.key]?.()
    if (e.key in actions) e.preventDefault()
  }

  let message = ''
  if (isFocused) {
    if (normalize(query).length > MAX_SEARCH_LENGTH) message = `Use up to ${MAX_SEARCH_LENGTH} characters.`
    else if (status === 'loading') message = 'Searching...'
    else if (status === 'error') message = 'Search is unavailable. Try again by editing your query or refocusing the field.'
    else if (status === 'success' && results.length === 0) message = 'No cities found.'
  }

  return {
    query,
    results,
    status,
    message,
    activeIndex,
    isFocused,
    open,
    inputRef,
    listId,
    handleChange,
    handleFocus,
    handleKeyDown,
    handleBlur,
    handleSelect,
  }
}
