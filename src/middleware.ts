import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (pathname === '/') {
    const lastCity = req.cookies.get('lastCity')?.value
    if (lastCity) {
      const geo = JSON.parse(lastCity)
      return NextResponse.redirect(new URL(`/${geo.country}/${geo.city}`, req.url))
    }
  }

  return NextResponse.next()
}
