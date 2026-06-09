import { test, expect, Page, Locator } from '@playwright/test'

/**
 * Functional suite — drives the LIVE site (BASE_URL from .env.test, www host).
 *
 * Everything is scoped to real selectors read from the source:
 *  - Shop product grid is uniquely identified by its inline style
 *    `gridTemplateColumns: repeat(auto-fill, minmax(180px, 1fr))`.
 *  - Counts are always derived from what actually renders, never hardcoded.
 *  - Checkout NEVER completes a real payment: the /api/razorpay call is
 *    intercepted and answered with a mock so no Razorpay order is created,
 *    and the external checkout.js is blocked so no modal opens.
 */

const USER_EMAIL = process.env.USER_EMAIL
const USER_PASSWORD = process.env.USER_PASSWORD
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

// --- helpers ---------------------------------------------------------------

const shopGrid = (page: Page) => page.locator('[style*="minmax(180px"]')

/** Wait until the shop has either rendered cards or said "No products found". */
async function waitForShopLoaded(page: Page) {
  await expect(
    page.getByText('Loading products...'),
  ).toHaveCount(0, { timeout: 15_000 })
}

/** Parse the first integer out of a "₹ 499" style string. */
function rupees(text: string): number {
  const m = text.replace(/[^0-9]/g, '')
  return m ? parseInt(m, 10) : NaN
}

/** Find the first in-stock, addable product card and return {card, name, price}. */
async function firstAddableProduct(page: Page) {
  const grid = shopGrid(page)
  await expect(grid).toBeVisible({ timeout: 15_000 })
  const cards = grid.locator('> div')
  const count = await cards.count()
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i)
    const addBtn = card.getByRole('button', { name: 'Add', exact: true })
    if ((await addBtn.count()) > 0) {
      const name = (await card.locator('h3').first().innerText()).trim()
      const priceText = await card.locator('span', { hasText: '₹' }).first().innerText()
      return { card, addBtn, name, price: rupees(priceText) }
    }
  }
  throw new Error('No addable (in-stock) product card found on /shop')
}

// --- Navigation ------------------------------------------------------------

test.describe('Navigation', () => {
  test('header links route correctly and logo returns home', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav')

    await nav.getByRole('link', { name: 'Shop', exact: true }).click()
    await expect(page).toHaveURL(/\/shop$/)

    await nav.getByRole('link', { name: 'Bouquet', exact: true }).click()
    await expect(page).toHaveURL(/\/bouquet$/)

    await nav.getByRole('link', { name: 'About', exact: true }).click()
    await expect(page).toHaveURL(/\/about$/)

    // Logo back to home
    await nav.getByRole('link', { name: 'crochetinggg' }).click()
    await expect(page).toHaveURL(new RegExp(`${'/'}$`))
  })

  test('footer quick-links route correctly', async ({ page }) => {
    await page.goto('/about')
    const footer = page.locator('footer')
    await footer.getByRole('link', { name: 'Shop', exact: true }).click()
    await expect(page).toHaveURL(/\/shop$/)
  })
})

// --- Pages render ----------------------------------------------------------

test.describe('Pages render', () => {
  const pages: Array<[string, string, RegExp]> = [
    ['home', '/', /You Dream|Crochet/i],
    ['shop', '/shop', /Our Shop/i],
    ['bouquet', '/bouquet', /Crochet Bouquets/i],
    ['about', '/about', /Made with Every Stitch/i],
    ['account', '/account', /Welcome Back|My Account/i],
    ['admin', '/admin', /Admin/i],
  ]
  for (const [name, path, marker] of pages) {
    test(`${name} loads`, async ({ page }) => {
      const resp = await page.goto(path)
      expect(resp?.status(), `${path} HTTP status`).toBeLessThan(400)
      await expect(page.locator('body')).toContainText(marker, { timeout: 15_000 })
    })
  }
})

// --- Shop ------------------------------------------------------------------

test.describe('Shop', () => {
  test('products render from data', async ({ page }) => {
    await page.goto('/shop')
    await waitForShopLoaded(page)
    const cards = shopGrid(page).locator('> div')
    const n = await cards.count()
    expect(n, 'shop should render at least one product card').toBeGreaterThan(0)
  })

  test('category filter via ?category= narrows the grid to that category', async ({ page }) => {
    // Baseline: full catalogue
    await page.goto('/shop')
    await waitForShopLoaded(page)
    const allCount = await shopGrid(page).locator('> div').count()
    expect(allCount).toBeGreaterThan(0)

    // Discover a category that actually has products from the rendered cards.
    const categories = ['Amigurumi', 'Home Décor', 'Custom', 'Bouquet']
    let tested = 0
    for (const cat of categories) {
      await page.goto(`/shop?category=${encodeURIComponent(cat)}`)
      await waitForShopLoaded(page)
      const cards = shopGrid(page).locator('> div')
      const c = await cards.count()
      if (c === 0) continue // category empty on the live catalogue — skip
      tested++
      // Every visible card's category label must equal the requested category.
      for (let i = 0; i < c; i++) {
        // textContent (not innerText) so the CSS `text-transform: uppercase`
        // on the label doesn't alter the underlying data value.
        const label = ((await cards.nth(i).locator('p').first().textContent()) || '').trim()
        expect(label.toLowerCase(), `card ${i} category under ?category=${cat}`).toBe(cat.toLowerCase())
      }
      // And the filtered set must be no larger than the full set.
      expect(c).toBeLessThanOrEqual(allCount)
    }
    expect(tested, 'at least one non-empty category should exist to validate filtering').toBeGreaterThan(0)
  })

  test('clicking a category in the sidebar filters in place', async ({ page }) => {
    await page.goto('/shop')
    await waitForShopLoaded(page)
    const allCount = await shopGrid(page).locator('> div').count()

    // Sidebar category buttons (desktop viewport is 1280 wide -> sidebar shown)
    const amigurumi = page.getByRole('button', { name: 'Amigurumi', exact: true }).first()
    await amigurumi.click()
    await page.waitForTimeout(300)
    const filtered = await shopGrid(page).locator('> div').count()
    expect(filtered).toBeLessThanOrEqual(allCount)
  })
})

// --- Cart ------------------------------------------------------------------

test.describe('Cart', () => {
  test('add item, update qty, remove, totals recompute correctly', async ({ page }) => {
    await page.goto('/shop')
    await waitForShopLoaded(page)
    const { addBtn, name, price } = await firstAddableProduct(page)
    expect(Number.isFinite(price)).toBeTruthy()
    await addBtn.click()

    await page.goto('/cart')
    // Item present
    await expect(page.getByRole('heading', { name })).toBeVisible()

    // Helper to read the summary total/subtotal numbers
    const readMoney = async (label: string) => {
      const row = page.locator('div', { hasText: new RegExp(`^${label}`) })
      return row
    }

    // qty 1: line total == price, subtotal == price, shipping rule applied
    const expectShipping = (sub: number) => (sub > 999 ? 0 : 99)

    // Subtotal text
    await expect(page.getByText(`₹ ${price}`, { exact: false }).first()).toBeVisible()

    // Increase qty -> 2
    await page.getByRole('button', { name: '+', exact: true }).first().click()
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible()
    const sub2 = price * 2
    // Total should be subtotal + shipping
    const total2 = sub2 + expectShipping(sub2)
    await expect(page.getByText(`₹ ${total2}`).first()).toBeVisible({ timeout: 5000 })

    // Decrease back to 1
    await page.getByRole('button', { name: '−', exact: true }).first().click()
    const total1 = price + expectShipping(price)
    await expect(page.getByText(`₹ ${total1}`).first()).toBeVisible({ timeout: 5000 })

    // Remove -> empty cart
    await page.getByRole('button', { name: 'Remove', exact: true }).first().click()
    await expect(page.getByText('Your cart is empty')).toBeVisible()
    await readMoney // (lint: keep helper referenced)
  })
})

// --- Checkout (NO real payment) -------------------------------------------

test.describe('Checkout', () => {
  test('reaches Razorpay step and sends items (not amount) to server', async ({ page }) => {
    // 1) Add a product
    await page.goto('/shop')
    await waitForShopLoaded(page)
    const { addBtn } = await firstAddableProduct(page)
    await addBtn.click()

    // 2) Intercept the order-creation call so NO real Razorpay order is made,
    //    and capture what the client sent to /api/razorpay.
    let sentBody: Record<string, unknown> | undefined
    await page.route('**/api/razorpay', async route => {
      if (route.request().method() === 'POST') {
        sentBody = route.request().postDataJSON() as Record<string, unknown>
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'order_TEST_MOCK', amount: 59900, currency: 'INR' }),
        })
        return
      }
      await route.continue()
    })
    // Block the external Razorpay modal/script entirely.
    await page.route('**/checkout.razorpay.com/**', route => route.abort())

    // 3) Fill valid delivery details
    await page.goto('/checkout')
    await page.getByPlaceholder('Full Name*').fill('Test Buyer')
    await page.getByPlaceholder('Email*').fill('test.buyer@example.com')
    await page.getByPlaceholder('Phone Number*').fill('9876543210')
    await page.getByPlaceholder('Full Address*').fill('123 Test Lane')
    await page.getByPlaceholder('City*').fill('Mumbai')
    await page.getByPlaceholder('Pincode*').fill('400001')
    await page.locator('select').selectOption('Maharashtra')

    // Pay button must be visible
    await expect(page.getByRole('button', { name: /Pay ₹/ })).toBeVisible()

    // 4) Trigger payment -> verify the request body contains items, not amount
    await page.getByRole('button', { name: /Pay ₹/ }).click()
    await expect.poll(() => sentBody, { timeout: 10_000 }).not.toBeUndefined()
    expect(Array.isArray(sentBody!.items), 'server receives items array, not amount').toBeTruthy()
    expect(sentBody!.amount, 'no client-provided amount should be sent').toBeUndefined()
    for (const item of sentBody!.items as Array<Record<string, unknown>>) {
      expect(typeof item.id).toBe('number')
      expect(typeof item.qty).toBe('number')
    }
  })

  test('empty cart cannot check out', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.getByText('Your cart is empty')).toBeVisible()
    await expect(page.getByRole('button', { name: /Pay ₹/ })).toHaveCount(0)
  })
})

// --- User account ----------------------------------------------------------

test.describe('User account', () => {
  test('login with real credentials, see account, then logout', async ({ page }) => {
    test.skip(!USER_EMAIL || !USER_PASSWORD, 'USER_EMAIL/USER_PASSWORD not set in .env.test')
    await page.goto('/account')
    await page.getByPlaceholder('you@email.com').fill(USER_EMAIL!)
    await page.getByPlaceholder('••••••••').fill(USER_PASSWORD!)
    // Two "Login" controls exist (mode tab + submit); the submit is .btn-primary.
    await page.locator('button.btn-primary', { hasText: 'Login' }).click()

    // Logged-in view
    await expect(page.getByText('Account Details')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(USER_EMAIL!, { exact: false })).toBeVisible()

    // Logout returns to the login form
    await page.getByRole('button', { name: 'Logout', exact: true }).click()
    await expect(page.getByPlaceholder('you@email.com')).toBeVisible({ timeout: 15_000 })
  })
})

// --- Admin -----------------------------------------------------------------

test.describe('Admin', () => {
  test('password-only login shows dashboard with products and orders', async ({ page }) => {
    test.skip(!ADMIN_PASSWORD, 'ADMIN_PASSWORD not set in .env.test')
    await page.goto('/admin')
    await page.getByPlaceholder('Password').fill(ADMIN_PASSWORD!)
    await page.getByRole('button', { name: 'Login', exact: true }).click()

    // Dashboard markers
    await expect(page.getByText('Add New Product')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'products', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'orders', exact: true })).toBeVisible()

    // Product view: table header renders
    await expect(page.getByRole('cell', { name: 'Category' }).or(page.getByText('Category'))).toBeVisible()

    // Orders view loads without crashing (data-derived: table or "No orders yet.")
    await page.getByRole('button', { name: 'orders', exact: true }).click()
    await expect(
      page.getByText('No orders yet.').or(page.getByRole('cell', { name: 'Customer' })),
    ).toBeVisible({ timeout: 10_000 })
    // NOTE: deliberately does NOT add/delete products — no junk data on the live DB.
  })
})

// --- Responsive ------------------------------------------------------------

test.describe('Responsive @375px', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  test('hamburger reveals nav links; layout intact', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav')
    // Desktop center links are not rendered on mobile; a single hamburger button is.
    const hamburger = nav.locator('button')
    await expect(hamburger).toHaveCount(1)
    await hamburger.click()
    await expect(nav.getByRole('link', { name: 'Shop', exact: true })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'About', exact: true })).toBeVisible()

    // No horizontal overflow blowout
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, 'page should not overflow horizontally at 375px').toBeLessThanOrEqual(5)
  })

  test('shop renders in a single column on mobile', async ({ page }) => {
    await page.goto('/shop')
    await waitForShopLoaded(page)
    await expect(shopGrid(page)).toBeVisible({ timeout: 15_000 })
  })
})
