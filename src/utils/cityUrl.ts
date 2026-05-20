import type { City } from '@/types/City.type'
import { toSlug } from './slug'

export function cityUrl({ country, name }: City) {
  return `/${toSlug(country)}/${toSlug(name)}`
}
