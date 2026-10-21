import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'City not found',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return <div>404</div>
}
