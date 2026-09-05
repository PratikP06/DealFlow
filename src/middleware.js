import { NextResponse } from 'next/server'
import * as jose from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-demo'
const secret = new TextEncoder().encode(JWT_SECRET)

const INTERNAL_ROLES = ['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE']

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
    const { payload } = await jose.jwtVerify(token, secret)

    if (isAuthPage) {
      if (payload.type === 'internal') {
        const role = payload.role
        if (role === 'ADMIN') {
          return NextResponse.redirect(new URL('/dashboard/admin', request.url))
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
    }

    if (isDashboard && payload.type !== 'internal') {
      return NextResponse.redirect(new URL('/portal', request.url))
    }

    if (isPortal && payload.type !== 'customer') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (pathname === '/dashboard' && payload.type === 'internal') {
      const role = payload.role
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      }
      if (!INTERNAL_ROLES.includes(role)) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    if (pathname.startsWith('/dashboard/admin') && payload.type === 'internal') {
      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
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