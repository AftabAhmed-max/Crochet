import { NextResponse, type NextRequest } from 'next/server'
import { verifyAdminJWT, COOKIE_NAME } from '@/lib/admin-jwt'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all admin API routes except the login endpoint itself.
  const isProtectedAdminApi =
    pathname.startsWith('/api/admin/') && pathname !== '/api/admin/login'

  if (isProtectedAdminApi) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const payload = token ? await verifyAdminJWT(token) : null
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorised.' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/admin/:path*'],
}
