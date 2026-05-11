'use client'

import { useState, useId, useRef } from 'react'
import Link from 'next/link'

import { searchCities, countryMap, type City } from '@/services/search.service'
import { toSlug } from '@/utils/slug'

import s from './Search.module.css'

function cityUrl({ country, name }: City) {
  return `/${toSlug(country)}/${toSlug(name)}`
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<City[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
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
    }
    actions[e.key]?.()
    if (e.key in actions) e.preventDefault()
  }

  function handleBlur() {
    setTimeout(() => {
      setResults([])
      setActiveIndex(-1)
    }, 150)
  }

  return (
    <div
      className={s.containerSearch}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={listId}
      aria-owns={listId}
    >
      <i className={`i-search ${s.iconSearch}`}></i>

      <input
        ref={inputRef}
        className={s.inputSearch}
        type="text"
        placeholder="Search for cities..."
        aria-label="Search cities"
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />

      {open && (
        <ul id={listId} className={s.dropdown} role="listbox">
          {results.map((city, i) => {
            const countryName = countryMap.get(city.country) ?? city.country
            return (
              <li
                key={city.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`${s.item} ${i === activeIndex ? s.itemActive : ''}`}
              >
                <Link href={cityUrl(city)} className={s.itemLink}>
                  <span className={s.cityName}>
                    {city.name}
                    {city.admin1 && city.admin1 !== city.name && <span className={s.admin1}>, {city.admin1}</span>}
                  </span>
                  <span className={s.countryName}>{countryName}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
