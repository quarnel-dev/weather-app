import s from './WeatherSkeleton.module.css'

export function SkeletonValue({ width = '4ch' }: { width?: string }) {
  return <span className={s.value} style={{ width }} aria-hidden="true" />
}
