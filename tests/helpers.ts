import { Page, expect } from '@playwright/test'

/**
 * Shared helpers used by both functional.spec.ts and crash.spec.ts.
 * Kept plain and well-commented so a non-tester can follow what each does.
 */

// ---------------------------------------------------------------------------
// Credentials (read from .env.test, loaded by playwright.config.ts)
// ---------------------------------------------------------------------------
export const ENV = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  userEmail: process.env.USER_EMAIL || '',
  userPassword: process.env.USER_PASSWORD || '',
}

/** The admin login page. Falls back to <baseUrl>/admin when ADMIN_URL is blank. */
export function adminPath(): string {
  return ENV.adminUrl || '/admin'
}

// Every page on the site that should load. Used by the navigation sweep.
export const PUBLIC_ROUTES = ['/', '/shop', '/bouquet', '/about', '/cart', '/checkout', '/account', '/order-success']

// ---------------------------------------------------------------------------
// Cart seeding
// ---------------------------------------------------------------------------
// The cart lives in localStorage under the key "cart" as an array of items.
// Seeding it directly lets us test cart math / checkout deterministically
// without depending on which products happen to exist in the database.
export type SeedItem = {
  id: number
  name: string
  category: string
  price: number
  qty: number
  images?: string[]
}

export const SAMPLE_ITEM: SeedItem = {
  id: 990001,
  name: 'Test Crochet Bunny',
  category: 'Amigurumi',
  price: 500,
  qty: 1,
  images: [],
}

/** Put a known set of items into the cart, then leave you on the homepage. */
export async function seedCart(page: Page, items: SeedItem[] = [SAMPLE_ITEM]) {
  await page.goto('/')
  await page.evaluate((data) => {
    localStorage.setItem('cart', JSON.stringify(data))
  }, items)
}

/** Empty the cart (and any admin session) for a clean slate. */
export async function clearStorage(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
}

// ---------------------------------------------------------------------------
// Page-health tracking (console errors + crashes)
// ---------------------------------------------------------------------------
// Noise we don't want to fail tests over: third-party scripts, analytics,
// favicon, browser quirks, and plain network/resource 404s (broken images are
// checked separately and more precisely by findBrokenImages()).
const IGNORED_ERROR_PATTERNS = [
  /favicon/i,
  /razorpay/i,
  /checkout\.razorpay/i,
  /googletagmanager|gtag|google-analytics/i,
  /ResizeObserver loop/i,
  /Failed to load resource/i, // resource 404s — handled by findBrokenImages
  /net::ERR_/i,
  /supabase/i, // backend connectivity is environmental, not a page bug
]

function isRealError(text: string): boolean {
  return !IGNORED_ERROR_PATTERNS.some((re) => re.test(text))
}

/**
 * Start collecting genuine JavaScript errors for a page.
 * Returns an array that fills up as the page runs — assert it stays empty.
 */
export function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && isRealError(msg.text())) errors.push(msg.text())
  })
  page.on('pageerror', (err) => {
    if (isRealError(err.message)) errors.push(err.message)
  })
  return errors
}

// ---------------------------------------------------------------------------
// Broken-image detection
// ---------------------------------------------------------------------------
/** Returns the src of every <img> that failed to render (0 natural width). */
export async function findBrokenImages(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const broken: string[] = []
    document.querySelectorAll('img').forEach((img) => {
      const el = img as HTMLImageElement
      // complete + naturalWidth 0 means the browser tried and failed to load it.
      if (el.complete && el.naturalWidth === 0 && el.src) broken.push(el.src)
    })
    return broken
  })
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------
/** Log in a customer through the /account login form. */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/account')
  await page.getByPlaceholder('you@email.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Login', exact: true }).click()
}

/** Log in to the admin panel (password-only). */
export async function loginAdmin(page: Page, password: string) {
  await page.goto(adminPath())
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: /login/i }).click()
}

/** A very long string for input-overflow / fuzzing tests. */
export const LONG_STRING = 'A'.repeat(10_000)
export const EMOJI_STRING = '🧶🪡🌸💖🐰 crochet 你好 مرحبا 🎉'.repeat(20)
export const SQLI_STRING = "' OR 1=1; --"
export const XSS_STRING = '<script>window.__xssFired = true; alert(1)</script>'
