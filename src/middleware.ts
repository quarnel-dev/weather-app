import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname !== '/') {
    return NextResponse.next()
  }

  const lastCity = req.cookies.get('lastCity')?.value

  if (!lastCity) {
    return NextResponse.next()
  }

  try {
    const geo = JSON.parse(lastCity)

    if (!geo?.country || !geo?.city) {
      const res = NextResponse.next()
      res.cookies.delete('lastCity')
      return res
    }

    const url = new URL(`/${geo.country}/${geo.city}`, req.url)
    return NextResponse.redirect(url)
  } catch {
    const res = NextResponse.next()
    res.cookies.delete('lastCity')
    return res
  }
}
