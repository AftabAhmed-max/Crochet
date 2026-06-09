import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { signAdminJWT, buildCookieHeader } from '@/lib/admin-jwt'
import { checkLoginRateLimit, recordLoginFailure, clearLoginAttempts } from '@/lib/admin-rate-limit'

function getRateLimitKey(request: NextRequest): string {
  const cf = request.headers.get('cf-connecting-ip')
  const xff = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
  return cf ?? xff ?? 'unknown'
}

export async function POST(request: NextRequest) {
  const key = getRateLimitKey(request)
  const rl = checkLoginRateLimit(key)

  if (rl.blocked) {
    const mins = Math.ceil((rl.retryAfterMs ?? 0) / 60_000)
    return NextResponse.json(
      { success: false, error: `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
    )
  }

  let body: { password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  const { password } = body
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH
  if (!passwordHash) {
    return NextResponse.json({ success: false }, { status: 500 })
  }

  const valid = await bcrypt.compare(password, passwordHash)
  if (!valid) {
    recordLoginFailure(key)
    return NextResponse.json({ success: false }, { status: 401 })
  }

  clearLoginAttempts(key)

  const token = await signAdminJWT()
  const response = NextResponse.json({ success: true })
  response.headers.set('Set-Cookie', buildCookieHeader(token))
  return response
}
