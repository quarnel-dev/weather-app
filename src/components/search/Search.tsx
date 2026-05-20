'use client'

import s from './Search.module.css'

import Link from 'next/link'

import { useSearch } from './Search.hook'

import { motion, AnimatePresence } from 'framer-motion'
import { dropdownVariants, itemVariants } from './Search.variants'

import { countryMap } from '@/services/search.service'

import { cityUrl } from '@/utils/cityUrl'

export default function Search() {
  const { query, results, activeIndex, isFocused, open, inputRef, listId, handleChange, handleFocus, handleKeyDown, handleBlur } =
    useSearch()

  return (
    <div
      className={s.containerSearch}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={listId}
      aria-owns={listId}
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
        placeholder="Search for cities..."
        aria-label="Search cities"
        aria-autocomplete="list"
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
              const countryName = countryMap.get(city.country) ?? city.country
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
                  <Link href={cityUrl(city)} className={s.itemLink}>
                    <span className={s.cityName}>{city.name}</span>
                    <motion.span
                      className={s.countryName}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 + 0.1 }}
                    >
                      {countryName}
                    </motion.span>
                  </Link>
                </motion.li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
