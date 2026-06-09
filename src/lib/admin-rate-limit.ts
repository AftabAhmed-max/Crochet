const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

export function checkLoginRateLimit(key: string): { blocked: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) return { blocked: false }
  if (entry.count >= MAX_ATTEMPTS) return { blocked: true, retryAfterMs: entry.resetAt - now }
  return { blocked: false }
}

export function recordLoginFailure(key: string): void {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
  } else {
    entry.count += 1
  }
}

export function clearLoginAttempts(key: string): void {
  store.delete(key)
}
