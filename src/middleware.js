import { NextResponse } from 'next/server'
import * as jose from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-demo'
const secret = new TextEncoder().encode(JWT_SECRET)

export async function middleware(request) {
  const token = request.cookies.get('dealflow_token')?.value
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isDashboard = pathname.startsWith('/dashboard')
  const isPortal = pathname.startsWith('/portal')

  if (!token) {
    if (isDashboard || isPortal) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  try {
    // Verify token using jose for Edge runtime compatibility
    const { payload } = await jose.jwtVerify(token, secret)

    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
      if (payload.type === 'internal') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
    }

    // Role-based protection
    if (isDashboard && payload.type !== 'internal') {
      return NextResponse.redirect(new URL('/portal', request.url))
    }

    if (isPortal && payload.type !== 'customer') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // Invalid token
    if (isDashboard || isPortal) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('dealflow_token')
      return response
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*', '/login', '/signup']
}
