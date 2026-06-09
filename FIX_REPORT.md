# Security Fix Report — Crochetinggg

## Summary

Six confirmed security findings from the June 2026 audit have been resolved.

---

## Files Changed

### New files

| File | Purpose |
|------|---------|
| `src/lib/admin-jwt.ts` | JWT sign/verify helpers + cookie header builder |
| `src/lib/admin-rate-limit.ts` | In-memory rate limiter for admin login (5 attempts / 15 min) |
| `src/proxy.ts` | Next.js 16 Proxy (formerly middleware) — protects `/api/admin/*` except login |
| `src/app/api/admin/logout/route.ts` | Clears the HttpOnly admin session cookie |
| `src/app/api/admin/verify/route.ts` | Server-side cookie check used by the admin page on load |

### Modified files

| File | Change |
|------|--------|
| `src/app/api/admin/login/route.ts` | Replaced plaintext compare with bcrypt; added rate limiting; issues JWT HttpOnly cookie on success |
| `src/app/admin/page.tsx` | Removed all `localStorage` auth references; page now checks `/api/admin/verify` on mount; logout calls `/api/admin/logout` |
| `src/app/api/razorpay/route.ts` | No longer accepts client-provided `amount`; accepts `items: [{id, qty}]`; fetches prices from Supabase and computes total server-side |
| `src/app/api/razorpay/verify/route.ts` | Fetches authoritative order amount from Razorpay SDK (`razorpay.orders.fetch`) — never trusts client-provided total; sends confirmation email server-side after order creation |
| `src/app/checkout/page.tsx` | Sends `items` (id + qty only) to `/api/razorpay`; removed client-side send-email call |
| `tests/crash.spec.ts` | Updated payment integrity tests to match new items-based API contract |
| `tests/functional.spec.ts` | Updated checkout test to assert that items (not amount) are sent to the server |

### Deleted files

| File | Reason |
|------|--------|
| `src/app/api/shiprocket/route.ts` | Feature abandoned; dead code removed entirely |
| `src/app/api/send-email/route.ts` | Email is now sent exclusively from the verify endpoint; public route eliminated |

---

## Findings Fixed

### BUG-001 — Admin authentication bypass via localStorage
**Before:** Login API returned `{ success: true }` and the client wrote `adminAuth=true` to localStorage. Any user could open DevTools and set that flag directly.  
**After:** Login API verifies bcrypt hash, then sets a signed JWT in an `HttpOnly; SameSite=Strict` cookie (+ `Secure` in production). The admin page checks `/api/admin/verify` on mount. The proxy guards all `/api/admin/*` routes (except login) at the network level.

### BUG-002 — Unauthenticated `/api/send-email`
**Before:** Any caller could POST to `/api/send-email` and trigger arbitrary outbound email via Resend.  
**After:** Route deleted. Email is sent directly inside `/api/razorpay/verify` after a successful, HMAC-verified payment — entirely server-side, never reachable externally.

### BUG-003 — Publicly accessible Shiprocket endpoint
**Before:** `/api/shiprocket` was a live route that would authenticate to Shiprocket and create shipping orders on behalf of the store with any caller's payload.  
**After:** Route and directory deleted. No remaining references.

### BUG-004 — Client-controlled payment amount
**Before:** The checkout page computed `total` and sent it to `/api/razorpay` as `{ amount: total }`. The server created a Razorpay order for exactly that amount — a tampered cart could produce any price.  
**After:** The order-creation endpoint accepts `{ items: [{id, qty}] }` only. It fetches current prices from Supabase and computes subtotal + shipping entirely server-side. The verify endpoint additionally calls `razorpay.orders.fetch(order_id)` to obtain the authoritative `amount` from Razorpay itself before storing the order — no client-provided total is trusted at any stage.

### BUG-006 — No rate limiting on admin login
**Before:** The login endpoint had no throttling; brute-force attacks were unrestricted.  
**After:** An in-memory rate limiter (`src/lib/admin-rate-limit.ts`) allows 5 failed attempts per IP per 15-minute window. On breach: HTTP 429 with `Retry-After` header. Counter resets on successful login.

---

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password. Generate with: `node -e "require('bcryptjs').hash('YOUR_PASSWORD', 12).then(console.log)"` |
| `ADMIN_JWT_SECRET` | Random secret ≥ 32 characters for signing JWT sessions. Generate with: `openssl rand -base64 32` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay publishable key (already required) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key (already required) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (already required) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (already required) |
| `RESEND_API_KEY` | Resend API key (already required) |

**Remove:** `ADMIN_PASSWORD` — replaced by `ADMIN_PASSWORD_HASH`.

---

## Deployment Steps

1. **Generate new env values:**
   ```bash
   # bcrypt hash (run locally, copy output to hosting dashboard)
   node -e "require('bcryptjs').hash('YOUR_ADMIN_PASSWORD', 12).then(console.log)"

   # JWT secret
   openssl rand -base64 32
   ```

2. **Set on hosting platform:**
   - Add `ADMIN_PASSWORD_HASH` and `ADMIN_JWT_SECRET`
   - Remove (or leave unused) `ADMIN_PASSWORD`

3. **Deploy** — `npm run build` passes cleanly; no database migrations required.

4. **Verify after deploy:**
   - Visit `/admin` → login form appears with no dashboard visible
   - Log in with correct password → dashboard loads; DevTools shows `admin_token` cookie as HttpOnly
   - Wrong password → error shown; 5 consecutive failures → 429 response
   - `POST /api/send-email` directly → 404 (route deleted)
   - `POST /api/shiprocket` directly → 404 (route deleted)
   - `POST /api/razorpay` with `{ amount: 1 }` → 400 (no items provided)

---

## Verification Performed

- `npx tsc --noEmit` — no type errors
- `npm run build` — clean production build, no warnings
- All six routes (`/api/admin/login`, `/api/admin/logout`, `/api/admin/verify`, `/api/razorpay`, `/api/razorpay/verify`, and the proxy) confirmed present in build output
- `/api/send-email` and `/api/shiprocket` absent from build output (deleted)
- Updated `tests/crash.spec.ts` and `tests/functional.spec.ts` to match new API contracts
