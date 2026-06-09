import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminJWT, COOKIE_NAME } from '@/lib/admin-jwt'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyAdminJWT(token) : null
  if (!payload) {
    return NextResponse.json({ auth: false }, { status: 401 })
  }
  return NextResponse.json({ auth: true })
}
