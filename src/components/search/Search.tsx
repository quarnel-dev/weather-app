'use client'

import s from './Search.module.css'

import { useSearch } from './Search.hook'

import { motion, AnimatePresence } from 'motion/react'
import SearchResults from './SearchResults'

import { MAX_SEARCH_LENGTH } from '@/services/search.constants'

export default function Search() {
  const {
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
    retrySearch,
  } = useSearch()

  return (
    <div
      className={s.containerSearch}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) handleBlur()
      }}
      onKeyDown={handleKeyDown}
    >
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
        onFocus={handleFocus}
      />

      <AnimatePresence>
        {open && <SearchResults results={results} listId={listId} activeIndex={activeIndex} onSelect={handleSelect} />}
      </AnimatePresence>
      {message && (
        <div className={`${s.dropdown} ${s.feedback}`}>
          <i
            className={`${status === 'loading' ? 'i-spinner' : 'i-search'} ${s.feedbackIcon} ${status === 'error' ? s.errorIcon : ''}`}
            aria-hidden="true"
          />
          <div className={s.feedbackText}>
            <p id={`${listId}-status`} role={status === 'error' ? 'alert' : 'status'}>
              {message}
            </p>
            {status === 'success' && <p className={s.hint}>Try another city or country.</p>}
          </div>
          {status === 'error' && (
            <button type="button" className={s.retry} onClick={retrySearch}>
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  )
}
