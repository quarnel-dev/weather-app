import type { Forecast } from '@/types/Forecast.type'
import type { DailyForecast } from '@/types/DailyForecast.type'

export function groupForecastByDay(forecast: readonly Forecast[], timezoneOffset: number | null): DailyForecast[] {
  if (timezoneOffset === null) return []

  const days = new Map<string, Forecast[]>()
  for (const item of forecast) {
    const date = new Date(Date.parse(item.date) + timezoneOffset * 1000).toISOString().slice(0, 10)
    const entries = days.get(date) ?? []
    entries.push(item)
    days.set(date, entries)
  }

  return [...days]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([date, entries]) => {
      const noon = Date.parse(`${date}T12:00:00Z`) - timezoneOffset * 1000
      const representative = entries.reduce((closest, item) => {
        const time = Date.parse(item.date)
        const closestTime = Date.parse(closest.date)
        const distance = Math.abs(time - noon)
        const closestDistance = Math.abs(closestTime - noon)
        return distance < closestDistance || (distance === closestDistance && time < closestTime) ? item : closest
      })

      return {
        date,
        tempMin: Math.min(...entries.map((item) => item.tempMin)),
        tempMax: Math.max(...entries.map((item) => item.tempMax)),
        description: representative.description,
        icon: representative.icon,
      }
    })
}
