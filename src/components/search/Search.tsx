'use client'

import s from './Search.module.css'

import Link from 'next/link'

import { useSearch } from './Search.hook'

import { motion, AnimatePresence } from 'motion/react'
import { dropdownVariants, itemVariants } from './Search.variants'

import { MAX_SEARCH_LENGTH } from '@/services/search.constants'

export default function Search() {
  const { query, results, status, message, activeIndex, isFocused, open, inputRef, listId, handleChange, handleFocus, handleKeyDown, handleBlur, handleSelect } =
    useSearch()

  return (
    <>
    <div
      className={s.containerSearch}
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
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            className={s.dropdown}
            role="listbox"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onMouseDown={(e) => e.preventDefault()}
          >
            {results.map((city, i) => {
              return (
                <motion.li
                  key={city.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`${s.item} ${i === activeIndex ? s.itemActive : ''}`}
                  variants={itemVariants}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Link href={city.url} className={s.itemLink} onClick={handleSelect} prefetch={false}>
                    <span>
                      <span className={s.cityName}>{city.name}</span>
                      {city.admin1 && <span className={s.admin1}> · {city.admin1}</span>}
                    </span>
                    <motion.span
                      className={s.countryName}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 + 0.1 }}
                    >
                      {city.countryName}
                    </motion.span>
                  </Link>
                </motion.li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
    {message && <p id={`${listId}-status`} role={status === 'error' ? 'alert' : 'status'}>{message}</p>}
    </>
  )
}
