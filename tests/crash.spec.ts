import { test, expect, Page } from '@playwright/test'

/**
 * Crash / abuse / security suite — LIVE site.
 *
 * Severity is encoded in each test title: [CRITICAL] / [WARNING] / [MINOR].
 *
 * Safety rules honoured here:
 *  - No real payment is ever completed and no real Razorpay order is created
 *    (we only probe input validation + the HMAC signature gate, which reject
 *    before any order is written).
 *  - No persistent junk is written to the live DB (we never POST a valid admin
 *    product, never submit a real checkout).
 */

const BASE_URL = (process.env.BASE_URL || 'https://www.cozycrochets.site').replace(/\/$/, '')
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const USER_EMAIL = process.env.USER_EMAIL

const shopGrid = (page: Page) => page.locator('[style*="minmax(180px"]')

// =========================================================================
// [CRITICAL] Price / payment integrity
// =========================================================================

test.describe('[CRITICAL] Payment integrity', () => {
  test('verify endpoint rejects a FORGED signature (cannot confirm a payment)', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/razorpay/verify`, {
      data: {
        razorpay_payment_id: 'pay_FORGED123',
        razorpay_order_id: 'order_FORGED123',
        razorpay_signature: 'totally-bogus-signature-deadbeef',
        customerData: { name: 'Mallory', email: 'm@x.com', phone: '9999999999', address: 'a', city: 'b', state: 'Goa', pincode: '400001' },
        items: [{ id: 1, name: 'Hack', price: 1, qty: 1 }],
        subtotal: 1,
        shipping: 0,
        total: 1,
      },
    })
    // Must NOT succeed. Signature mismatch -> 400, never an order id.
    expect(res.status(), 'forged signature must be rejected').toBe(400)
    const body = await res.json()
    expect(body.success).toBeFalsy()
    expect(JSON.stringify(body)).toMatch(/signature/i)
  })

  test('verify endpoint rejects missing payment fields', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/razorpay/verify`, {
      data: { customerData: {}, items: [], total: 5000 },
    })
    expect(res.status()).toBe(400)
    expect((await res.json()).success).toBeFalsy()
  })

  test('order-creation endpoint rejects missing or empty items', async ({ request }) => {
    // These are rejected BEFORE any Razorpay order is created -> safe to probe.
    for (const body of [{ items: [] }, { items: null }, {}]) {
      const res = await request.post(`${BASE_URL}/api/razorpay`, { data: body })
      expect(res.status(), `${JSON.stringify(body)} should be rejected`).toBe(400)
    }
  })

  test('tampered price in cart is NOT sent to server — only item IDs and quantities are', async ({ page }) => {
    // After BUG-004 fix: the client no longer sends an amount field.
    // The server computes the order total from DB prices, not from client input.
    let capturedBody: Record<string, unknown> | undefined
    await page.route('**/api/razorpay', async route => {
      capturedBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'order_TEST_MOCK', amount: 10000, currency: 'INR' }) })
    })
    await page.route('**/checkout.razorpay.com/**', route => route.abort())

    // Seed a tampered cart with a forged price of 1 for a product.
    await page.addInitScript(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 999999, name: 'Tampered Item', category: 'Custom', price: 1, qty: 1 },
      ]))
    })
    await page.goto('/checkout')

    await page.getByPlaceholder('Full Name*').fill('Mallory')
    await page.getByPlaceholder('Email*').fill('m@x.com')
    await page.getByPlaceholder('Phone Number*').fill('9876543210')
    await page.getByPlaceholder('Full Address*').fill('1 St')
    await page.getByPlaceholder('City*').fill('City')
    await page.getByPlaceholder('Pincode*').fill('400001')
    await page.locator('select').selectOption('Goa')
    await page.getByRole('button', { name: /Pay ₹/ }).click()

    await expect.poll(() => capturedBody, { timeout: 10_000 }).not.toBeUndefined()
    // No amount field — server computes total from DB prices.
    expect(capturedBody!.amount, 'no amount field should be sent to server').toBeUndefined()
    // Items array is sent instead.
    expect(Array.isArray(capturedBody!.items), 'items array should be sent').toBeTruthy()
    for (const item of capturedBody!.items as Array<Record<string, unknown>>) {
      expect(typeof item.id, 'each item should have a numeric id').toBe('number')
      expect(typeof item.qty, 'each item should have a numeric qty').toBe('number')
      expect(item.price, 'client price must NOT be sent to server').toBeUndefined()
    }
  })
})

// =========================================================================
// [CRITICAL] Admin auth
// =========================================================================

test.describe('[CRITICAL] Admin auth', () => {
  test('login API rejects wrong password', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/login`, { data: { password: 'definitely-wrong' } })
    expect(res.status()).toBe(401)
    expect((await res.json()).success).toBeFalsy()
  })

  test('login API rejects empty / missing password', async ({ request }) => {
    const res1 = await request.post(`${BASE_URL}/api/admin/login`, { data: {} })
    expect(res1.status()).toBe(400)
    const res2 = await request.post(`${BASE_URL}/api/admin/login`, { data: { password: '' } })
    expect(res2.status()).toBe(400)
  })

  test('hitting /admin with no auth shows the password gate, not the dashboard', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByText('Enter Password')).toBeVisible()
    await expect(page.getByText('Add New Product')).toHaveCount(0)
  })
})

// =========================================================================
// [CRITICAL] XSS
// =========================================================================

test.describe('[CRITICAL] XSS', () => {
  const PAYLOADS = [
    '<script>window.__xss=1;alert(1)</script>',
    '"><img src=x onerror="window.__xss=1">',
    "<svg/onload=alert(1)>",
  ]

  test('checkout fields do not execute injected scripts', async ({ page }) => {
    let dialogFired = false
    page.on('dialog', async d => { dialogFired = true; await d.dismiss() })

    await page.addInitScript(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 1, name: 'X', category: 'Custom', price: 100, qty: 1 },
      ]))
    })
    await page.goto('/checkout')

    for (const payload of PAYLOADS) {
      await page.getByPlaceholder('Full Name*').fill(payload)
      await page.getByPlaceholder('Full Address*').fill(payload)
    }
    await page.waitForTimeout(500)

    expect(dialogFired, 'no alert() dialog should fire from injected payloads').toBeFalsy()
    const injected = await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)
    expect(injected, 'no injected script should have executed').toBeFalsy()
    // The value is held as literal text, proving it was treated as data.
    await expect(page.getByPlaceholder('Full Name*')).toHaveValue(PAYLOADS[PAYLOADS.length - 1])
  })

  test('account fields do not execute injected scripts', async ({ page }) => {
    let dialogFired = false
    page.on('dialog', async d => { dialogFired = true; await d.dismiss() })
    await page.goto('/account')
    await page.getByPlaceholder('you@email.com').fill('<script>alert(1)</script>@x.com')
    await page.getByPlaceholder('••••••••').fill('"><img src=x onerror=alert(1)>')
    await page.locator('button.btn-primary', { hasText: 'Login' }).click()
    await page.waitForTimeout(1500)
    expect(dialogFired).toBeFalsy()
  })
})

// =========================================================================
// [WARNING] Cart abuse
// =========================================================================

test.describe('[WARNING] Cart abuse', () => {
  async function seedCart(page: Page, items: unknown) {
    await page.addInitScript(payload => {
      localStorage.setItem('cart', JSON.stringify(payload))
    }, items)
  }

  test('huge quantity does not crash the cart', async ({ page }) => {
    await seedCart(page, [{ id: 1, name: 'Big', category: 'Custom', price: 500, qty: 999999 }])
    await page.goto('/cart')
    await expect(page.getByRole('heading', { name: 'Big' })).toBeVisible()
    // Total renders (free shipping kicks in above 999) — no crash / white screen.
    await expect(page.locator('body')).toContainText('Total')
  })

  test('zero quantity item renders without crashing', async ({ page }) => {
    await seedCart(page, [{ id: 1, name: 'Zero', category: 'Custom', price: 500, qty: 0 }])
    await page.goto('/cart')
    await expect(page.locator('body')).toContainText('Total')
  })

  test('negative quantity — does it produce a negative total? (logic probe)', async ({ page }) => {
    await seedCart(page, [{ id: 1, name: 'Neg', category: 'Custom', price: 500, qty: -3 }])
    await page.goto('/cart')
    await expect(page.getByRole('heading', { name: 'Neg' })).toBeVisible()
    const body = await page.locator('body').innerText()
    // We don't fail the suite on this; we surface whether a negative total is shown.
    const hasNegative = /₹\s*-?\s*-?\d/.test(body) && /-\d/.test(body)
    console.log(`[cart negative-qty] negative total visible: ${hasNegative}`)
    await expect(page.locator('body')).toContainText('Total') // must not crash
  })

  test('empty-cart checkout is blocked', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.getByText('Your cart is empty')).toBeVisible()
    await expect(page.getByRole('button', { name: /Pay ₹/ })).toHaveCount(0)
  })
})

// =========================================================================
// [WARNING] Auth abuse
// =========================================================================

test.describe('[WARNING] Auth abuse', () => {
  test('wrong password is rejected with an error and no session', async ({ page }) => {
    test.skip(!USER_EMAIL, 'USER_EMAIL not set')
    await page.goto('/account')
    await page.getByPlaceholder('you@email.com').fill(USER_EMAIL!)
    await page.getByPlaceholder('••••••••').fill('this-is-not-the-password')
    await page.locator('button.btn-primary', { hasText: 'Login' }).click()
    // Stays on login form; an error message appears; never shows account details.
    await expect(page.getByText(/Invalid|credentials|incorrect|error/i)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Account Details')).toHaveCount(0)
  })

  test('SQL-ish / malformed login input does not crash and does not authenticate', async ({ page }) => {
    await page.goto('/account')
    await page.getByPlaceholder('you@email.com').fill("' OR 1=1--@x.com")
    await page.getByPlaceholder('••••••••').fill("' OR '1'='1")
    await page.locator('button.btn-primary', { hasText: 'Login' }).click()
    await page.waitForTimeout(2000)
    await expect(page.getByText('Account Details')).toHaveCount(0)
    // page still alive
    await expect(page.locator('button.btn-primary', { hasText: 'Login' })).toBeVisible()
  })

  test('fresh visit to /account shows logged-out state (no leaked session)', async ({ page }) => {
    await page.goto('/account')
    await expect(page.getByPlaceholder('you@email.com')).toBeVisible()
    await expect(page.getByText('Account Details')).toHaveCount(0)
  })
})

// =========================================================================
// [MINOR] Edge cases & robustness
// =========================================================================

test.describe('[MINOR] Robustness', () => {
  test('non-existent route returns a 404 without a white screen', async ({ page }) => {
    const resp = await page.goto('/this-route-does-not-exist-xyz')
    expect(resp?.status()).toBe(404)
    // Next renders a 404 page with visible text, not a blank document.
    const text = (await page.locator('body').innerText()).trim()
    expect(text.length, 'a 404 page should still show content').toBeGreaterThan(0)
  })

  test('garbage ?category value yields "No products found", not a crash', async ({ page }) => {
    await page.goto('/shop?category=__nope__<script>')
    await expect(page.getByText('Loading products...')).toHaveCount(0, { timeout: 15_000 })
    const cards = await shopGrid(page).locator('> div').count()
    if (cards === 0) {
      await expect(page.getByText('No products found.')).toBeVisible()
    }
  })

  test('rapid double-click on Pay does not fire two order-create calls', async ({ page }) => {
    let calls = 0
    await page.route('**/api/razorpay', async route => {
      calls++
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'order_TEST_MOCK', amount: 10000, currency: 'INR' }) })
    })
    await page.route('**/checkout.razorpay.com/**', route => route.abort())

    await page.addInitScript(() => {
      localStorage.setItem('cart', JSON.stringify([{ id: 1, name: 'X', category: 'Custom', price: 100, qty: 1 }]))
    })
    await page.goto('/checkout')
    await page.getByPlaceholder('Full Name*').fill('Test')
    await page.getByPlaceholder('Email*').fill('t@x.com')
    await page.getByPlaceholder('Phone Number*').fill('9876543210')
    await page.getByPlaceholder('Full Address*').fill('1 St')
    await page.getByPlaceholder('City*').fill('City')
    await page.getByPlaceholder('Pincode*').fill('400001')
    await page.locator('select').selectOption('Goa')

    const pay = page.getByRole('button', { name: /Pay ₹/ })
    await pay.click()
    await pay.click({ force: true }).catch(() => {}) // 2nd click; button disables on loading
    await page.waitForTimeout(1500)
    expect(calls, 'order-create should not be triggered twice by a double-click').toBeLessThanOrEqual(1)
  })

  test('oversized input is accepted without crashing checkout', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cart', JSON.stringify([{ id: 1, name: 'X', category: 'Custom', price: 100, qty: 1 }]))
    })
    await page.goto('/checkout')
    const huge = 'A'.repeat(10000)
    await page.getByPlaceholder('Full Address*').fill(huge)
    // Validation still works (no required field bypass / crash)
    await page.getByRole('button', { name: /Pay ₹/ }).click()
    await expect(page.locator('body')).toContainText('Checkout')
  })
})

// =========================================================================
// Console / page errors per route
// =========================================================================

test.describe('Console & page errors', () => {
  const routes = ['/', '/shop', '/bouquet', '/about', '/cart', '/checkout', '/account', '/admin', '/order-success']

  // Third-party noise we don't control (analytics, payment SDK, image CDNs, font hosts).
  const IGNORE = /razorpay|google|gtag|gstatic|analytics|supabase|fonts|favicon|net::ERR|Failed to load resource|ResizeObserver/i

  for (const route of routes) {
    test(`no uncaught JS errors on ${route}`, async ({ page }) => {
      const pageErrors: string[] = []
      const consoleErrors: string[] = []
      page.on('pageerror', e => pageErrors.push(e.message))
      page.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) consoleErrors.push(m.text()) })

      await page.goto(route, { waitUntil: 'networkidle' }).catch(() => page.goto(route))
      await page.waitForTimeout(800)

      if (consoleErrors.length) console.log(`[console errors ${route}]`, consoleErrors)
      // Hard-fail only on genuine uncaught exceptions (page errors).
      expect(pageErrors, `uncaught JS errors on ${route}: ${pageErrors.join(' | ')}`).toHaveLength(0)
    })
  }
})
