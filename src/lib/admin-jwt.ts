import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export const COOKIE_NAME = 'admin_token'
const JWT_ALG = 'HS256'
const SESSION_SECS = 60 * 60 * 8 // 8 hours

function getSecret(): Uint8Array {
  const raw = process.env.ADMIN_JWT_SECRET
  if (!raw) throw new Error('ADMIN_JWT_SECRET is not set.')
  return new TextEncoder().encode(raw)
}

export interface AdminJWTPayload extends JWTPayload {
  admin: true
}

export async function signAdminJWT(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECS}s`)
    .sign(getSecret())
}

export async function verifyAdminJWT(token: string): Promise<AdminJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [JWT_ALG] })
    if (!payload.admin) return null
    return payload as AdminJWTPayload
  } catch {
    return null
  }
}

export function buildCookieHeader(token: string): string {
  const isProd = process.env.NODE_ENV === 'production'
  const parts = [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${SESSION_SECS}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Strict`,
  ]
  if (isProd) parts.push('Secure')
  return parts.join('; ')
}

export function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict`
}
