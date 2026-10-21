import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { City } from '@/types/City.type'
import { findNearestCity } from '@/services/geo/nearestCity.server'

const { cityById } = vi.hoisted(() => ({ cityById: new Map<number, City>() }))
vi.mock('@/services/cities.index', () => ({ cityById }))

function addCity(id: number, lat: number, lon: number) {
  cityById.set(id, { id, name: `City ${id}`, country: 'GB', admin1: null, lat: String(lat), lon: String(lon), pop: '1' })
}

beforeEach(() => cityById.clear())

describe('nearest database city', () => {
  test('selects by coordinates rather than name or population', () => {
    addCity(1, 51.5, -0.1)
    addCity(2, 51.51, -0.12)
    expect(findNearestCity(51.51, -0.12)?.id).toBe(2)
  })

  test('does not select a distant settlement when there is no nearby city', () => {
    addCity(1, 0.46, 0)
    expect(findNearestCity(0, 0)).toBeNull()
    addCity(2, 0.44, 0)
    expect(findNearestCity(0, 0)?.id).toBe(2)
  })

  test('handles the antimeridian', () => {
    addCity(1, 0, -179.9)
    addCity(2, 0, 179.5)
    expect(findNearestCity(0, 179.99)?.id).toBe(1)
  })

  test('compares longitude distances correctly near a pole', () => {
    addCity(1, 89.9, 100)
    addCity(2, 89.5, 0)
    expect(findNearestCity(89.9, 0)?.id).toBe(1)
  })

  test('breaks equal-distance ties by stable database ID', () => {
    addCity(20, 0, 0)
    addCity(10, 0, 0)
    expect(findNearestCity(0, 0)?.id).toBe(10)
  })

  test.each([
    [NaN, 0], [0, Infinity], [91, 0], [-91, 0], [0, 181], [0, -181],
    ['51', 0], [null, 0], [0, undefined], [[], 0],
  ])('rejects invalid coordinates: %s, %s', (lat, lon) => {
    expect(findNearestCity(lat as number, lon as number)).toBeNull()
  })

  test('handles an empty database', () => {
    expect(findNearestCity(0, 0)).toBeNull()
  })
})
