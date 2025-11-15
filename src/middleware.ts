import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Define role requirements per route
    const roleChecks: Array<{ pattern: RegExp; roles: UserRole[] }> = [
      { pattern: /^\/admin/, roles: ['ADMIN'] },
      { pattern: /^\/staff/, roles: ['ADMIN', 'STAFF'] },
      { pattern: /^\/gate/, roles: ['ADMIN', 'STAFF', 'GATE_OPERATOR'] },
      { pattern: /^\/api\/events/, roles: ['ADMIN', 'STAFF'] },
      { pattern: /^\/api\/orders/, roles: ['ADMIN', 'STAFF'] },
      { pattern: /^\/api\/gate-entries/, roles: ['ADMIN', 'STAFF', 'GATE_OPERATOR'] }
    ]

    // Check if route requires specific roles
    for (const { pattern, roles } of roleChecks) {
      if (pattern.test(path)) {
        const userRole = token?.role as UserRole
        if (!roles.includes(userRole)) {
          // Return 403 Forbidden
          return NextResponse.json(
            { error: 'Anda tidak memiliki akses ke halaman ini' },
            { status: 403 }
          )
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: '/login'
    }
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/staff/:path*',
    '/gate/:path*',
    '/my-tickets/:path*',
    '/api/events/:path*',
    '/api/orders/:path*',
    '/api/gate-entries/:path*'
  ]
}
