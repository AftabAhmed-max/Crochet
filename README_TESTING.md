# Testing the Crochetinggg Store

This project has an automated test suite built with [Playwright](https://playwright.dev).
It clicks through the store exactly like a real shopper (and a few like an attacker)
and tells you, in plain English, what works and what doesn't.

You do **not** need to be a tester to use this. Follow the steps below.

---

## 1. One-time setup

Already done if you installed the project, but to be sure:

```bash
npm install            # installs Playwright
npx playwright install # downloads the test browser (Chromium)
```

## 2. Fill in your test details

Open the file **`.env.test`** in the project root and fill in the blanks:

```
BASE_URL=http://localhost:3000   # leave as-is for local testing
ADMIN_URL=                       # leave blank — it defaults to BASE_URL/admin
ADMIN_PASSWORD=                  # your admin panel password
USER_EMAIL=                      # a real customer account email
USER_PASSWORD=                   # that account's password
```

- `.env.test` is **git-ignored**, so your passwords are never committed.
- Any field you leave blank simply **skips** the tests that need it (they show
  as "skipped", not "failed").

## 3. Start the store (if it isn't already running)

In one terminal:

```bash
npm run dev
```

> You can skip this — the tests will start the dev server automatically if one
> isn't already running, and stop it when finished.

## 4. Run the tests

In another terminal:

```bash
npx playwright test
```

You'll see a live list scroll by, one line per check:

```
  ✓  Cart total updates correctly when quantity changes (1.2s)
  ✓  Logged-out user cannot see the admin dashboard via direct URL (0.8s)
  ✘  [CRITICAL] A tampered negative quantity cannot produce a negative total (0.9s)
  -  Customer can log in with valid credentials (skipped)
```

### Run just one of the two suites

```bash
npx playwright test functional   # the everyday shopping flows
npx playwright test crash        # the adversarial / security flows
```

### Run a single test by name

```bash
npx playwright test -g "Cart total updates correctly"
```

---

## 5. Read the report

After a run, open the rich, clickable report:

```bash
npx playwright show-report
```

This opens a web page where you can:

- See every test grouped by pass / fail / skipped.
- Click a failed test to see a **screenshot**, a **video**, and the exact step
  that failed.

---

## How to read pass / fail

| Symbol | Meaning |
|--------|---------|
| ✓ green | The store behaved correctly. Nothing to do. |
| ✘ red | Something is wrong. Click it in the report to see what. |
| `-` skipped | The test needs a credential you left blank in `.env.test`. |

### Severity labels in the crash suite

The adversarial tests (`crash.spec.ts`) are prefixed by how much a failure matters:

| Prefix | What a failure means | Urgency |
|--------|----------------------|---------|
| `[CRITICAL]` | A money, login, or customer-data hole. | Fix before launch. |
| `[WARNING]` | Notable, usually handled, but worth a look. | Review soon. |
| `[MINOR]` | Cosmetic or low-impact edge case. | Nice to fix. |

A **green `[CRITICAL]`** test is good news — it means the store **defended itself**
against that attack (e.g. rejected a forged payment, blocked admin access).

---

## What's covered

**`tests/functional.spec.ts` — everyday shopping**

- Navigation: every nav & footer link works, no 404s, logo returns home.
- Page health: every page loads with no JavaScript errors and no broken images.
- Products: the shop listing loads; cards show name, price and an Add button.
- Cart: add, change quantity, remove, totals add up, and it survives a refresh.
- Checkout: reachable from the cart; rejects empty / invalid fields.
- Accounts: login, logout, "stays logged in", and login form when logged out.
- Admin: password login, viewing orders, and lock-out when logged out.
- Forms: sign-up validation.
- Responsive: key pages at 375px mobile and on desktop.

**`tests/crash.spec.ts` — trying to break it (money / auth / data first)**

- Cart: negative, zero, huge and decimal quantities; tampered prices; out-of-stock.
- Checkout: empty-cart, double-submit race, mid-flow refresh, fake success page.
- Auth: direct-URL access while logged out; SQL-injection and `<script>` payloads
  in every form; duplicate email; empty password; rapid repeated logins.
- Input fuzzing: very long strings, emoji, and HTML/JS payloads in fields & URLs.
- Payment (Razorpay test mode): rejects bad amounts and **forged payment
  signatures**, so an order can only be created from a genuine successful payment.
- Broken states: unknown URLs, invalid categories, back-button after checkout,
  deep-linking into checkout with no cart.

---

## A note on price integrity (please read)

Two crash tests deliberately tamper with the **price** and **quantity** stored in
the browser, because those values currently come from the client. The browser-side
display is only a convenience — the **real defence has to be on the server**: the
order amount and line prices should be **recomputed from the database** at payment
time, never trusted from the request body. If those tests surface a tampered value
reaching the UI, treat it as a prompt to confirm the server is recomputing the
charge rather than accepting the client's number.
