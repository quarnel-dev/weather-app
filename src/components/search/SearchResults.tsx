'use client'

import Link from 'next/link'
import { motion, useIsPresent } from 'motion/react'
import type { CitySearchResult } from '@/types/CitySearchResult.type'
import { dropdownVariants, itemVariants } from './Search.variants'
import s from './Search.module.css'

interface Props {
  results: CitySearchResult[]
  listId: string
  activeIndex: number
  onSelect: () => void
}

export default function SearchResults({ results, listId, activeIndex, onSelect }: Props) {
  const isPresent = useIsPresent()

  return (
    <motion.ul
      id={listId}
      className={s.dropdown}
      role="listbox"
      inert={!isPresent}
      aria-hidden={!isPresent}
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onMouseDown={(event) => event.preventDefault()}
    >
      {results.map((city, i) => (
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
          <Link
            href={city.url}
            className={s.itemLink}
            prefetch={false}
            onClick={(event) => {
              if (!isPresent) {
                event.preventDefault()
                return
              }
              onSelect()
            }}
          >
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
      ))}
    </motion.ul>
  )
}
