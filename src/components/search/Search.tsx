'use client'

import s from './Search.module.css'

import { useSearch } from './Search.hook'

import { motion, AnimatePresence } from 'motion/react'
import SearchResults from './SearchResults'

import { MAX_SEARCH_LENGTH } from '@/services/search.constants'

export default function Search() {
  const { query, results, status, message, activeIndex, isFocused, open, inputRef, listId, handleChange, handleFocus, handleKeyDown, handleBlur, handleSelect } =
    useSearch()

  return (
    <>
      <div className={s.containerSearch}>
        <motion.i
          className={`i-search ${s.iconSearch}`}
          animate={{
            scale: isFocused ? 1.1 : 1,
            rotate: isFocused ? -5 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        <input
          ref={inputRef}
          className={s.inputSearch}
          type="text"
          role="combobox"
          maxLength={MAX_SEARCH_LENGTH}
          autoComplete="off"
          placeholder="Search for cities..."
          aria-label="Search cities"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-busy={status === 'loading'}
          aria-describedby={message ? `${listId}-status` : undefined}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        <AnimatePresence>
          {open && (
            <SearchResults results={results} listId={listId} activeIndex={activeIndex} onSelect={handleSelect} />
          )}
        </AnimatePresence>
      </div>
      {message && <p id={`${listId}-status`} role={status === 'error' ? 'alert' : 'status'}>{message}</p>}
    </>
  )
}
