import type { Metadata } from 'next'
import { sfUIText } from './fonts'

import '@/styles/main.global.css'
import '@/styles/icons.global.css'

export const metadata: Metadata = {
  title: 'Weather app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sfUIText.variable}>
      <body>{children}</body>
    </html>
  )
}
