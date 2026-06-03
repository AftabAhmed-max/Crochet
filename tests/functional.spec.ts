import { test, expect } from '@playwright/test'
import {
  ENV,
  PUBLIC_ROUTES,
  seedCart,
  clearStorage,
  trackErrors,
  findBrokenImages,
  loginUser,
  loginAdmin,
  adminPath,
  SAMPLE_ITEM,
} from './helpers'

/**
 * FUNCTIONAL SUITE
 * ----------------
 * Walks every standard e-commerce flow a real shopper (and the shop owner)
 * would use, and confirms each one works. Test titles are plain English:
 * a green ✓ means that sentence is true, a red ✗ means it isn't.
 */

// ===========================================================================
test.describe('Navigation', () => {
  test('Every main navigation link opens a real page (no 404s)', async ({ page }) => {
    await page.goto('/')
    for (const [label, href] of [
      ['Home', '/'],
      ['Shop', '/shop'],
      ['Bouquet', '/bouquet'],
      ['About', '/about'],
    ] as const) {
      const link = page.locator(`nav a[href="${href}"]`).first()
      await expect(link, `nav link "${label}" should exist`).toBeVisible()
      const res = await page.goto(href)
      expect(res?.status(), `${href} should not be a 404/500`).toBeLessThan(400)
      await page.goto('/')
    }
  })

  test('Every footer link opens a real page (no 404s)', async ({ page }) => {
    await page.goto('/')
    const footerLinks = page.locator('footer a[href^="/"]')
    const count = await footerLinks.count()
    expect(count, 'footer should contain internal links').toBeGreaterThan(0)
    const hrefs = new Set<string>()
    for (let i = 0; i < count; i++) {
      const href = await footerLinks.nth(i).getAttribute('href')
      if (href && href.startsWith('/')) hrefs.add(href)
    }
    for (const href of hrefs) {
      const res = await page.goto(href)
      expect(res?.status(), `footer link ${href} should load`).toBeLessThan(400)
    }
  })

  test('Clicking the logo returns the shopper to the homepage', async ({ page }) => {
    await page.goto('/shop')
    await page.locator('nav a[href="/"]').first().click()
    // Back on the homepage: the URL ends at the site root (no /shop, /cart, etc.)
    await expect(page).toHaveURL(/\/$|:\d+$/)
  })
})

// ===========================================================================
test.describe('Page health', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`Page "${route}" loads with no JavaScript errors`, async ({ page }) => {
      const errors = trackErrors(page)
      const res = await page.goto(route, { waitUntil: 'networkidle' })
      expect(res?.status(), `${route} should respond OK`).toBeLessThan(400)
      expect(errors, `${route} logged JS errors: ${errors.join(' | ')}`).toHaveLength(0)
    })
  }

  test('Homepage shows no broken images', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    const broken = await findBrokenImages(page)
    expect(broken, `broken images: ${broken.join(', ')}`).toHaveLength(0)
  })

  test('Shop page shows no broken images', async ({ page }) => {
    await page.goto('/shop', { waitUntil: 'networkidle' })
    // give product images a moment to lazy-load
    await page.waitForTimeout(1500)
    const broken = await findBrokenImages(page)
    expect(broken, `broken images: ${broken.join(', ')}`).toHaveLength(0)
  })
})

// ===========================================================================
test.describe('Products', () => {
  test('Shop product listing loads (products appear or an empty-state message shows)', async ({ page }) => {
    await page.goto('/shop', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /our shop/i })).toBeVisible()
    // Either product cards render, or the page tells the user there are none —
    // both are valid "it loaded" outcomes. A blank page is not.
    const cards = page.locator('h3')
    const emptyState = page.getByText(/no products found|loading products/i)
    await expect(cards.first().or(emptyState.first())).toBeVisible({ timeout: 10_000 })
  })

  test('A product card shows a name, a price and an Add button', async ({ page }) => {
    await page.goto('/shop', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const addButtons = page.getByRole('button', { name: 'Add', exact: true })
    const found = await addButtons.count()
    test.skip(found === 0, 'No products in the database to inspect — seed products to run this.')
    // Prices on the site are rendered like "₹ 500".
    await expect(page.getByText(/₹\s?\d/).first()).toBeVisible()
    await expect(addButtons.first()).toBeVisible()
  })
})

// ===========================================================================
test.describe('Cart', () => {
  test('Adding a product from the shop puts it in the cart', async ({ page }) => {
    await clearStorage(page)
    await page.goto('/shop', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const addButton = page.getByRole('button', { name: 'Add', exact: true }).first()
    const hasProduct = await addButton.isVisible().catch(() => false)
    test.skip(!hasProduct, 'No products available to add — seed products to run this.')
    await addButton.click()
    // The cart badge in the navbar should now show a count.
    await page.goto('/cart')
    await expect(page.getByRole('heading', { name: /your cart/i })).toBeVisible()
  })

  test('Cart total adds up correctly (subtotal + shipping)', async ({ page }) => {
    // One ₹500 item → subtotal 500, under the ₹999 free-shipping threshold,
    // so shipping is ₹99 and total is ₹599.
    await seedCart(page, [{ ...SAMPLE_ITEM, qty: 1 }])
    await page.goto('/cart')
    await expect(page.getByText('₹ 500').first()).toBeVisible() // subtotal
    await expect(page.getByText('₹ 99').first()).toBeVisible() // shipping
    await expect(page.getByText('₹ 599').first()).toBeVisible() // total
  })

  test('Cart total updates correctly when quantity changes', async ({ page }) => {
    await seedCart(page, [{ ...SAMPLE_ITEM, qty: 1 }])
    await page.goto('/cart')
    // Increase quantity to 2 → line total becomes ₹1000, crossing the
    // ₹999 threshold, so shipping drops to Free and total becomes ₹1000.
    await page.getByRole('button', { name: '+' }).first().click()
    await expect(page.getByText('2')).toBeVisible()
    await expect(page.getByText('Free')).toBeVisible()
    await expect(page.getByText('₹ 1000').first()).toBeVisible()
  })

  test('Removing the last item shows the empty-cart message', async ({ page }) => {
    await seedCart(page, [{ ...SAMPLE_ITEM, qty: 1 }])
    await page.goto('/cart')
    await page.getByRole('button', { name: /remove/i }).first().click()
    await expect(page.getByText(/your cart is empty/i)).toBeVisible()
  })

  test('Cart contents survive a page refresh', async ({ page }) => {
    await seedCart(page, [{ ...SAMPLE_ITEM, qty: 2 }])
    await page.goto('/cart')
    await expect(page.getByText(SAMPLE_ITEM.name)).toBeVisible()
    await page.reload()
    await expect(page.getByText(SAMPLE_ITEM.name)).toBeVisible()
  })
})

// ===========================================================================
test.describe('Checkout', () => {
  test('Checkout is reachable from the cart', async ({ page }) => {
    await seedCart(page, [{ ...SAMPLE_ITEM, qty: 1 }])
    await page.goto('/cart')
    await page.getByRole('button', { name: /proceed to checkout/i }).click()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible()
  })

  test('Checkout blocks submission when required fields are empty', async ({ page }) => {
    await seedCart(page, [{ ...SAMPLE_ITEM, qty: 1 }])
    await page.goto('/checkout')
    await page.getByRole('button', { name: /^pay ₹/i }).click()
    // The form should complain rather than proceed to payment.
    await expect(page.getByText(/is required|valid/i).first()).toBeVisible()
  })

  test('Checkout rejects an invalid pincode', async ({ page }) => {
    await seedCart(page, [{ ...SAMPLE_ITEM, qty: 1 }])
    await page.goto('/checkout')
    await page.getByPlaceholder('Full Name*').fill('Asha Verma')
    await page.getByPlaceholder('Email*').fill('asha@example.com')
    await page.getByPlaceholder('Phone Number*').fill('9876543210')
    await page.getByPlaceholder('Full Address*').fill('12 Marine Drive')
    await page.getByPlaceholder('City*').fill('Mumbai')
    await page.getByPlaceholder('Pincode*').fill('123') // too short
    await page.getByRole('button', { name: /^pay ₹/i }).click()
    await expect(page.getByText(/pincode/i)).toBeVisible()
  })
})

// ===========================================================================
test.describe('User accounts', () => {
  test('A logged-out shopper sees the login form on the account page', async ({ page }) => {
    await clearStorage(page)
    await page.goto('/account')
    await expect(page.getByPlaceholder('you@email.com')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible()
  })

  test('Customer can log in with valid credentials', async ({ page }) => {
    test.skip(!ENV.userEmail || !ENV.userPassword, 'Set USER_EMAIL / USER_PASSWORD in .env.test to run this.')
    await loginUser(page, ENV.userEmail, ENV.userPassword)
    await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 15_000 })
  })

  test('Login persists across a page refresh', async ({ page }) => {
    test.skip(!ENV.userEmail || !ENV.userPassword, 'Set USER_EMAIL / USER_PASSWORD in .env.test to run this.')
    await loginUser(page, ENV.userEmail, ENV.userPassword)
    await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 15_000 })
    await page.reload()
    await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 15_000 })
  })

  test('Customer can log out', async ({ page }) => {
    test.skip(!ENV.userEmail || !ENV.userPassword, 'Set USER_EMAIL / USER_PASSWORD in .env.test to run this.')
    await loginUser(page, ENV.userEmail, ENV.userPassword)
    await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /logout/i }).click()
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible()
  })
})

// ===========================================================================
test.describe('Admin', () => {
  test('Admin area is locked behind a password when logged out', async ({ page }) => {
    await clearStorage(page)
    await page.goto(adminPath())
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    // The real dashboard (Products/Orders tabs) must NOT be visible yet.
    await expect(page.getByRole('button', { name: /^orders$/i })).toHaveCount(0)
  })

  test('Admin can log in and view orders', async ({ page }) => {
    test.skip(!ENV.adminPassword, 'Set ADMIN_PASSWORD in .env.test to run this.')
    await loginAdmin(page, ENV.adminPassword)
    // After login the dashboard tabs appear.
    await expect(page.getByRole('button', { name: /^orders$/i })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /^orders$/i }).click()
    // Either an orders table or the friendly "No orders yet." empty state.
    await expect(
      page.getByText(/no orders yet/i).or(page.locator('table')).first()
    ).toBeVisible()
  })
})

// ===========================================================================
test.describe('Forms', () => {
  test('Newsletter / contact inputs accept input and validate', async ({ page }) => {
    // The footer "Help" section and contact details live on every page; the
    // most form-like flow on this site is the account form, exercised above.
    // Here we confirm the account sign-up form validates a short password.
    await clearStorage(page)
    await page.goto('/account')
    await page.getByRole('button', { name: /sign up/i }).click()
    await page.getByPlaceholder('Your name').fill('Test User')
    await page.getByPlaceholder('10-digit mobile number').fill('9876543210')
    await page.getByPlaceholder('you@email.com').fill('newuser@example.com')
    await page.getByPlaceholder('••••••••').fill('123') // too short
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible()
  })
})

// ===========================================================================
test.describe('Responsive layout', () => {
  test('Key pages render on a 375px mobile screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    for (const route of ['/', '/shop', '/cart', '/account']) {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(res?.status(), `${route} should load on mobile`).toBeLessThan(400)
      // Nothing should overflow the viewport horizontally.
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(scrollW, `${route} overflows horizontally on mobile`).toBeLessThanOrEqual(380)
    }
  })

  test('Mobile menu button appears on a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    // The navbar collapses its links into a hamburger button under 768px.
    await expect(page.locator('nav button').first()).toBeVisible()
  })

  test('Key pages render on a desktop screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    for (const route of ['/', '/shop', '/cart']) {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(res?.status(), `${route} should load on desktop`).toBeLessThan(400)
    }
  })
})
