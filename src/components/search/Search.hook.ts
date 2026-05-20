'use client'

import { useState, useId, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { searchCities } from '@/services/search.service'

import { cityUrl } from '@/utils/cityUrl'

import type { City } from '@/types/City.type'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<City[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const router = useRouter()
  const open = results.length > 0

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setResults(searchCities(e.target.value))
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    const actions: Record<string, () => void> = {
      ArrowDown: () => setActiveIndex((i) => Math.min(i + 1, results.length - 1)),

      ArrowUp: () => setActiveIndex((i) => Math.max(i - 1, 0)),

      Escape: () => {
        setResults([])
        setActiveIndex(-1)
        inputRef.current?.blur()
      },

      Enter: () => {
        if (activeIndex >= 0) {
          router.push(cityUrl(results[activeIndex]))
        }
      },
    }
    actions[e.key]?.()
    if (e.key in actions) e.preventDefault()
  }

  function handleBlur() {
    setIsFocused(false)
    setResults([])
    setActiveIndex(-1)
  }

  function handleFocus() {
    setIsFocused(true)
    if (query) setResults(searchCities(query))
  }

  return {
    query,
    results,
    activeIndex,
    isFocused,
    open,
    inputRef,
    listId,
    handleChange,
    handleFocus,
    handleKeyDown,
    handleBlur,
  }
}
