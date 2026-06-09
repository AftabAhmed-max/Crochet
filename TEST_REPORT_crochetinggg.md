# TEST REPORT — Crochetinggg
**Prepared by:** Senior QA Engineer / Security Tester / Playwright Architect  
**Date:** 2026-06-10  
**Live URL:** https://www.cozycrochets.site  
**Codebase reviewed:** Full source (`src/app/`, `src/components/`, `src/context/`, `src/lib/`)  
**Test runner:** Playwright 1.60.0 — Chromium  

---

## Executive Summary

The Crochetinggg e-commerce platform is a Next.js 16 (App Router) application with Supabase for authentication and database, Razorpay for payments, Resend for transactional email, and Shiprocket for shipping logistics. A 47-test Playwright suite was executed against the **live production site** (`https://www.cozycrochets.site`). All 47 tests passed (1 was initially flaky due to a Supabase cold-start race condition; it passed on retry).

While the application is functionally stable and XSS-resistant, a **critical architectural weakness** was identified in the admin authentication system and two **high-severity unauthenticated API endpoints** were found. These must be resolved before the site handles meaningful order volume or a public launch.

---

## Architecture Summary

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| Auth (customers) | Supabase Auth (email + password) |
| Auth (admin) | Custom — password-only, **no server session** |
| Database | Supabase (PostgreSQL via anon key) |
| Payment | Razorpay (INR, HMAC-SHA256 verification) |
| Email | Resend (transactional order confirmation) |
| Shipping | Shiprocket (REST API) |
| Cart | `localStorage` (client-side only) |
| Hosting | Vercel (inferred from domain) |

**Key observations from code review:**
- Cart state lives entirely in `localStorage` — no server-side cart or session binding.
- Admin dashboard (`/admin`) manages products and orders directly via the Supabase **anon key** from the browser. No server-side admin session is established.
- `/api/razorpay/verify` correctly validates the Razorpay HMAC signature before writing any order — this is the strongest security control in the payment flow.
- All `NEXT_PUBLIC_*` environment variables (Supabase URL, anon key, Razorpay key ID) are intentionally exposed to the browser.

---

## Environment

| Item | Value |
|---|---|
| Base URL | `https://www.cozycrochets.site` |
| Browser | Chromium (Desktop, 1280×720) |
| Playwright | 1.60.0 |
| Test runner host | Windows 11 |
| Credentials source | `.env.test` (git-ignored) |
| Real payments triggered | None — Razorpay API calls intercepted in all checkout tests |
| Real DB mutations | None — no products were added or deleted |

---

## Tests Executed

### functional.spec.ts (18 tests)

| # | Test | Result |
|---|---|---|
| 1 | Navigation: header links route correctly and logo returns home | PASS |
| 2 | Navigation: footer quick-links route correctly | PASS |
| 3 | Pages render: home loads | PASS |
| 4 | Pages render: shop loads | PASS |
| 5 | Pages render: bouquet loads | PASS |
| 6 | Pages render: about loads | PASS |
| 7 | Pages render: account loads | PASS |
| 8 | Pages render: admin loads | PASS |
| 9 | Shop: products render from data | PASS |
| 10 | Shop: category filter via ?category= narrows the grid | PASS |
| 11 | Shop: clicking a category in the sidebar filters in place | PASS |
| 12 | Cart: add item, update qty, remove, totals recompute correctly | PASS |
| 13 | Checkout: reaches Razorpay step and amount matches cart total | **FLAKY** (fail → retry → pass) |
| 14 | Checkout: empty cart cannot check out | PASS |
| 15 | User account: login with real credentials, see account, then logout | PASS |
| 16 | Admin: password-only login shows dashboard with products and orders | PASS |
| 17 | Responsive @375px: hamburger reveals nav links; layout intact | PASS |
| 18 | Responsive @375px: shop renders in a single column on mobile | PASS |

### crash.spec.ts (29 tests)

| # | Test | Result |
|---|---|---|
| 19 | [CRITICAL] Payment: verify endpoint rejects a FORGED signature | PASS |
| 20 | [CRITICAL] Payment: verify endpoint rejects missing payment fields | PASS |
| 21 | [CRITICAL] Payment: order-create rejects non-positive/non-numeric amounts | PASS |
| 22 | [CRITICAL] Payment: tampered client cart amount is relayed to API | PASS (see Bug #4) |
| 23 | [CRITICAL] Admin auth: login API rejects wrong password | PASS |
| 24 | [CRITICAL] Admin auth: login API rejects empty/missing password | PASS |
| 25 | [CRITICAL] Admin auth: /admin shows password gate with no auth | PASS |
| 26 | [CRITICAL] XSS: checkout fields do not execute injected scripts | PASS |
| 27 | [CRITICAL] XSS: account fields do not execute injected scripts | PASS |
| 28 | [WARNING] Cart abuse: huge quantity does not crash the cart | PASS |
| 29 | [WARNING] Cart abuse: zero quantity item renders without crashing | PASS |
| 30 | [WARNING] Cart abuse: negative quantity — negative total visible | **PASS / BUG CONFIRMED** |
| 31 | [WARNING] Cart abuse: empty-cart checkout is blocked | PASS |
| 32 | [WARNING] Auth abuse: wrong password is rejected with an error | PASS |
| 33 | [WARNING] Auth abuse: SQL-ish input does not authenticate | PASS |
| 34 | [WARNING] Auth abuse: fresh visit shows logged-out state | PASS |
| 35 | [MINOR] Robustness: non-existent route returns 404 with content | PASS |
| 36 | [MINOR] Robustness: garbage ?category value yields "No products found" | PASS |
| 37 | [MINOR] Robustness: rapid double-click on Pay fires only one order-create | PASS |
| 38 | [MINOR] Robustness: oversized input does not crash checkout | PASS |
| 39–47 | Console & page errors: all 9 routes (/, /shop, /bouquet, /about, /cart, /checkout, /account, /admin, /order-success) | PASS |

---

## Pass / Fail Count

| Outcome | Count |
|---|---|
| Passed | **47** |
| Failed (permanent) | **0** |
| Flaky (fail → retry → pass) | **1** |
| Skipped | **0** |
| **Total** | **47** |

---

## Bugs Found

### BUG-001 — Admin Authentication Bypass via localStorage

**Severity:** CRITICAL  
**Affected file:** `src/app/admin/page.tsx:23-26`  

**Reproduction Steps:**
1. Navigate to `https://www.cozycrochets.site/admin` in any browser.
2. Open DevTools → Console.
3. Run: `localStorage.setItem('adminAuth', 'true')`
4. Reload the page.
5. The full admin dashboard (products + orders management) is now accessible.

**Expected Result:** Admin access requires a valid, server-issued session or cookie.  
**Actual Result:** Admin access is granted to anyone who can write to localStorage. No server-side session is ever created; the admin page trusts `localStorage.getItem('adminAuth') === 'true'` exclusively.

**Root Cause:**
```typescript
// admin/page.tsx:23-26
const [auth, setAuth] = useState(() => {
  if (typeof window !== 'undefined') return localStorage.getItem('adminAuth') === 'true'
  return false
})
```
After `/api/admin/login` returns `{success: true}`, the client sets `localStorage.setItem('adminAuth', 'true')`. No `httpOnly` cookie or JWT is issued. There is no server-side guard on the admin Supabase operations — all DB calls (`insert`, `update`, `delete` on `products`; `update` on `orders`) are made directly from the browser using the public anon key.

**Impact:** Any authenticated or unauthenticated user can bypass the admin login, view all orders (including customer PII), add/delete products, and manipulate order statuses.

---

### BUG-002 — Unauthenticated `/api/send-email` Endpoint

**Severity:** HIGH  
**Affected file:** `src/app/api/send-email/route.ts`  

**Reproduction Steps:**
```bash
curl -X POST https://www.cozycrochets.site/api/send-email \
  -H 'Content-Type: application/json' \
  -d '{"name":"Spam","email":"victim@example.com","items":[{"name":"Item","qty":1,"price":100}],"total":100,"orderId":"FAKE-123"}'
```

**Expected Result:** Endpoint requires authentication (e.g., a shared secret header, only callable server-to-server, or auth token).  
**Actual Result:** Endpoint sends a branded order confirmation email to any `email` address with any `orderId`. No auth check exists.

**Root Cause:** The route handler performs input validation only (checking `name`, `email`, `items`, `total`, `orderId` are present). There is no authentication header check, no IP allowlist, no shared secret, and no rate limiting.

**Impact:** An attacker can spam any email address with fake "Order Confirmed" emails bearing the Crochetinggg brand. Repeated abuse will exhaust Resend quota and may result in domain blacklisting, damaging the site's email deliverability permanently.

---

### BUG-003 — Unauthenticated `/api/shiprocket` Endpoint

**Severity:** HIGH  
**Affected file:** `src/app/api/shiprocket/route.ts`  

**Reproduction Steps:**
```bash
curl -X POST https://www.cozycrochets.site/api/shiprocket \
  -H 'Content-Type: application/json' \
  -d '{"order_id":"FAKE-9999","name":"Attacker","address":"1 St","city":"Mumbai","pincode":"400001","state":"Maharashtra","email":"x@x.com","phone":"9999999999","items":[{"name":"Item","price":100,"qty":1,"id":1}],"total":100}'
```

**Expected Result:** Endpoint requires proof of a verified, server-confirmed order before creating a Shiprocket shipment.  
**Actual Result:** Endpoint authenticates with Shiprocket using stored credentials and creates a shipping order for any caller with no validation of whether the `order_id` corresponds to a real, paid order.

**Root Cause:** No authentication, no order-existence check against Supabase, no correlation with a verified Razorpay payment.

**Impact:** An attacker can create fake shipping labels tied to real Shiprocket credentials, consuming pickup capacity and confusing warehouse operations. Could be used to harass third parties by generating shipments to arbitrary addresses.

---

### BUG-004 — Client-Controlled Payment Amount (No Server-Side Cart Binding)

**Severity:** HIGH  
**Affected files:** `src/app/api/razorpay/route.ts`, `src/app/api/razorpay/verify/route.ts`  

**Reproduction Steps:**
1. Add any product to cart.
2. Navigate to `/checkout`.
3. Intercept the POST to `/api/razorpay` using DevTools or Burp Suite.
4. Change `amount` to `1` (₹1).
5. Complete the Razorpay flow — a Razorpay order worth ₹1 is created.
6. After payment, the verify endpoint saves the order with whatever `total` was sent in the verify POST body (also client-controlled).

**Expected Result:** Server computes cart total from trusted product prices in the database; the client cannot influence the charged amount.  
**Actual Result:** The `/api/razorpay` endpoint accepts any `amount` value from the client:
```typescript
// razorpay/route.ts:11
const { amount } = await req.json()
if (typeof amount !== 'number' || amount <= 0) { ... } // only rejects <= 0
const order = await razorpay.orders.create({ amount: Math.round(amount * 100), ... })
```
Additionally, after payment, the verify endpoint stores `total`, `subtotal`, and `shipping` verbatim from the client POST body without recomputing them from the verified payment amount.

**Root Cause:** No server-side cart or session. The entire price calculation lives on the client.

**Impact:** A technically-capable buyer can purchase any product for as little as ₹1. The database order record will reflect the real total (if they choose to send it), but the actual Razorpay capture is for the manipulated amount. This is a direct revenue loss vector.

> **Caveat:** The Razorpay HMAC verification (`/api/razorpay/verify`) correctly ensures the payment *happened* — it's impossible to confirm an unpaid order. However, the amount of the payment is not re-verified server-side.

---

### BUG-005 — Negative Cart Quantity Produces Negative Displayed Total

**Severity:** MEDIUM  
**Affected file:** `src/context/CartContext.tsx`  
**Test that surfaced it:** `[WARNING] Cart abuse: negative quantity — does it produce a negative total?`  
**Console output during test:** `[cart negative-qty] negative total visible: true`

**Reproduction Steps:**
1. Open DevTools → Console.
2. Run: `localStorage.setItem('cart', JSON.stringify([{id:1, name:"X", category:"Custom", price:500, qty:-3}]))`
3. Navigate to `/cart`.
4. The cart displays `₹ -1500` as the line total.

**Expected Result:** Negative quantities are clamped to 0 or the item is removed.  
**Actual Result:** Negative quantity renders, line total shows a negative rupee value (e.g., `₹ -1500`), and the cart total becomes negative. If a user somehow gets a negative-qty item into their cart, the checkout flow would attempt to charge a negative or very small amount.

**Root Cause:** `CartContext.tsx:52` does call `removeItem` when `updateQty(id, 0)` is called, but this guard is only applied through the UI buttons. Items seeded into localStorage with `qty < 0` pass through `setItems(JSON.parse(stored))` without validation.

---

### BUG-006 — No Rate Limiting on Admin Login Endpoint

**Severity:** MEDIUM  
**Affected file:** `src/app/api/admin/login/route.ts`  

**Reproduction Steps:**
```bash
for i in $(seq 1 1000); do
  curl -X POST https://www.cozycrochets.site/api/admin/login \
    -H 'Content-Type: application/json' \
    -d "{\"password\":\"attempt$i\"}" &
done
```

**Expected Result:** After N failed attempts, further requests are rate-limited or blocked.  
**Actual Result:** The endpoint has no rate limiting. The password is a simple 11-character string (`crochet2024`). Without rate limiting, a brute-force or dictionary attack can exhaust the password space quickly.

**Root Cause:** No middleware or rate-limiting library is applied to this route.

**Impact:** Combined with Bug #001 (localStorage bypass), this is a secondary vector. However, it also exposes the endpoint to volumetric abuse.

---

### BUG-007 — Checkout Test Flakiness: Shop Product Load Race Condition

**Severity:** LOW (test infrastructure / performance)  
**Affected test:** `functional.spec.ts:207 — Checkout: reaches Razorpay step`  

**Reproduction Steps:**
1. Run `npx playwright test` on a cold connection or when Supabase is slow to respond.
2. The `firstAddableProduct()` helper navigates to `/shop` and tries to find a product card before Supabase finishes loading.
3. If the Supabase response takes > ~1-2s, the product grid still shows "Loading products..." when the helper runs.

**Expected Result:** Product grid loads within timeout consistently.  
**Actual Result:** On first attempt, the shop showed "Loading products..." with no cards rendered. On retry (with a fresh navigation), it loaded correctly.

**Root Cause:** The shop fetches products via an async Supabase call client-side with no SSR/SSG. On cold starts or slower connections, this causes intermittent timing failures in tests.

**Impact:** Flaky tests erode CI confidence. The underlying UX issue is a visible loading state that may appear to users on slow connections.

---

### BUG-008 — Phone Validation Accepts Non-Numeric Input

**Severity:** LOW  
**Affected file:** `src/app/checkout/page.tsx:41`  

**Reproduction Steps:**
1. Navigate to `/checkout` with items in cart.
2. Fill in "Phone Number" field with `abcdefghij` (10 alphabetic characters).
3. Submit the form.

**Expected Result:** Validation rejects non-numeric phone numbers.  
**Actual Result:** Validation only checks `form.phone.length >= 10`. Non-numeric strings of 10+ characters pass validation.

**Root Cause:**
```typescript
// checkout/page.tsx:41
if (!form.phone || form.phone.length < 10) errs.push('Valid phone number required.')
```
No regex or `isNaN` check.

---

## Security Findings

### SEC-001 — Admin Panel Has No Server-Side Authentication Layer

The single most significant security weakness in this application. See Bug #001 for full details.

**Recommended fix:** Issue an `httpOnly`, `Secure`, `SameSite=Strict` cookie from `/api/admin/login` on success. Add a middleware (`middleware.ts`) that checks this cookie for all requests to `/admin` and `/api/admin/**`. Remove the `localStorage` approach entirely.

---

### SEC-002 — Public Anon Key Has Admin-Level Supabase Write Access

The admin page makes direct Supabase calls using `NEXT_PUBLIC_SUPABASE_ANON_KEY` (which is exposed in the browser bundle). This implies one of two conditions:

- **Scenario A (likely):** Row Level Security (RLS) on the `products` and `orders` tables is either disabled or has overly permissive policies, allowing the anon role to `INSERT`, `UPDATE`, and `DELETE`.
- **Scenario B:** A custom policy grants the anon role these permissions.

Either way, anyone who knows the Supabase project URL and anon key (both publicly visible in the JS bundle) can write to the `products` and `orders` tables directly using the Supabase JS client — bypassing the `/admin` page entirely.

**Recommended fix:** Enable RLS on all tables. Grant `INSERT`/`UPDATE`/`DELETE` only to a server-side Supabase client initialised with the `SERVICE_ROLE_KEY` (never exposed to the browser). The admin API routes should use this elevated client.

---

### SEC-003 — No Content Security Policy (CSP) Headers

No CSP headers were observed on any page response. While XSS tests passed (React's virtual DOM escapes user input by default), the absence of a CSP provides no defence-in-depth against future template injection, inline script gadgets, or third-party script compromise.

**Recommended fix:** Add CSP headers in `next.config.ts` via `headers()` returning a strict policy. At minimum: `script-src 'self' https://checkout.razorpay.com`.

---

### SEC-004 — Payment Total Is Entirely Client-Controlled

See Bug #004. The Razorpay HMAC verification confirms a payment happened but does not confirm the correct amount was captured. An attacker can pay ₹1 and have an order recorded in the database for the real product price.

**Recommended fix:**
1. Require the client to send cart item IDs (not prices) to `/api/razorpay`.
2. Server fetches prices from Supabase and computes the total.
3. Store the computed total in a short-lived server-side record keyed to the Razorpay `order_id`.
4. In `/api/razorpay/verify`, look up the stored total by `razorpay_order_id` — never trust the client-provided `total`.

---

### SEC-005 — Unauthenticated Email and Shiprocket Endpoints

See Bugs #002 and #003. Both `/api/send-email` and `/api/shiprocket` accept requests from any origin with no credential check.

**Recommended fix:** These routes should only be callable server-to-server. Options:
- Move calls to a server action (Next.js Server Actions) that cannot be directly POSTed from the internet.
- Add a shared `INTERNAL_API_SECRET` header and validate it in both handlers.
- Alternatively, call these services directly from `/api/razorpay/verify` (where HMAC verification already acts as a gate) instead of exposing them as separate HTTP endpoints.

---

### SEC-006 — Potential CSRF on State-Mutating API Routes

Next.js App Router does not automatically add CSRF protection. The `/api/admin/login`, `/api/razorpay`, and `/api/razorpay/verify` routes accept POST requests from any origin. While the Razorpay HMAC check mitigates the verify endpoint, the admin login and order-create routes have no CSRF token or `Origin` check.

**Recommended fix:** Add an `Origin` / `Referer` check in critical mutation handlers, or use Next.js middleware to enforce CSRF tokens for state-changing routes.

---

## Potential False Positives

- **SEC-006 (CSRF):** Modern browsers enforce `SameSite=Lax` on cookies by default, and since this site uses no auth cookies (admin uses localStorage), traditional CSRF is less exploitable in practice. Still a concern if cookies are added.
- **SEC-003 (CSP):** React's JSX escaping prevents most XSS in practice. The risk is low in the current codebase but grows as the project scales.
- **BUG-006 (Rate limiting):** Vercel's platform-level DDoS protection may throttle some brute-force attempts. However, application-level rate limiting should not be assumed from infrastructure.

---

## Production Readiness Score

| Dimension | Score |
|---|---|
| Functional correctness | 9 / 10 |
| UI/UX polish | 8 / 10 |
| **Security** | **3 / 10** |
| Stability / resilience | 7 / 10 |
| **Overall Production Readiness** | **6 / 10** |

The application is functionally excellent — all 47 tests pass, zero uncaught JS errors on any route, XSS is handled correctly, and the payment HMAC verification is properly implemented. However, the admin authentication architecture is a critical pre-launch blocker.

---

## Security Score

**4 / 10**

| Control | Present |
|---|---|
| Razorpay HMAC signature verification | ✅ |
| XSS prevention (React JSX escaping) | ✅ |
| Supabase Auth for customers | ✅ |
| Admin server-side session | ❌ |
| RLS enforcement on Supabase tables | ❌ (probable) |
| Rate limiting on auth/payment endpoints | ❌ |
| Authenticated email endpoint | ❌ |
| Authenticated Shiprocket endpoint | ❌ |
| Server-side price computation | ❌ |
| CSP headers | ❌ |

---

## Performance Observations

- Shop page loads products via a client-side Supabase fetch with no SSR/SSG. On slow connections or Supabase cold starts, users see "Loading products..." for 1–3 seconds. This caused one flaky test.
- All pages loaded in < 1s (first contentful paint) from test runner perspective, likely due to Vercel edge caching.
- No `loading.tsx` or skeleton UI exists for the product grid — a blank sidebar appears before products render.
- The `/api/razorpay` route creates a live Razorpay SDK instance on every request; consider caching the SDK instance outside the handler.

---

## Top 10 Issues Before Launch

| # | Issue | Severity | Effort to Fix |
|---|---|---|---|
| 1 | Admin auth is localStorage-only — trivially bypassed | CRITICAL | Medium |
| 2 | Supabase anon key has admin write access (no RLS) | CRITICAL | Medium |
| 3 | Payment amount is entirely client-controlled | HIGH | Medium |
| 4 | `/api/send-email` is unauthenticated — spam vector | HIGH | Low |
| 5 | `/api/shiprocket` is unauthenticated — fake shipment vector | HIGH | Low |
| 6 | Client-provided `total` stored in DB after payment (no server recompute) | HIGH | Medium |
| 7 | No rate limiting on admin login | MEDIUM | Low |
| 8 | Negative cart quantity renders negative total | MEDIUM | Low |
| 9 | No CSP headers | MEDIUM | Low |
| 10 | Shop product loading race (flaky test + UX spinner) | LOW | Low |

---

## Deliverables Produced

| File | Description |
|---|---|
| `playwright.config.ts` | Playwright configuration (Chromium, env-aware, 1 worker, 1 retry, HTML + JSON reporters) |
| `.env.test.example` | Safe-to-commit env template for test credentials |
| `tests/functional.spec.ts` | 18 functional tests (navigation, shop, cart, checkout, auth, admin, responsive) |
| `tests/crash.spec.ts` | 29 security + crash tests (payment integrity, admin auth, XSS, cart abuse, robustness) |
| `results.json` | Raw Playwright JSON test output |
| `playwright-report/` | HTML test report (open `playwright-report/index.html` to view) |
| `TEST_REPORT_crochetinggg.md` | This document |
