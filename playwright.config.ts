import { defineConfig, devices } from '@playwright/test'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Load credentials from .env.test (kept out of git).
 * We parse it by hand so we don't need an extra `dotenv` dependency.
 * Anything already set in the real environment wins over the file.
 */
function loadEnvTest() {
  try {
    const raw = readFileSync(resolve(__dirname, '.env.test'), 'utf-8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!(key in process.env)) process.env[key] = value
    }
  } catch {
    // .env.test missing — tests that need creds will skip themselves.
  }
}
loadEnvTest()

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  // One test at a time keeps the console report easy to read for a non-tester.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },

  /* Two reporters:
   *  - "list" prints a clear ✓/✗ line per test in the terminal as it runs.
   *  - "html" builds a clickable report you open with `npx playwright show-report`.
   */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],

  /*
   * Convenience: if a dev server isn't already running on BASE_URL, Playwright
   * starts `npm run dev` for you and shuts it down afterwards. If you already
   * have `npm run dev` running in another terminal, it's reused automatically.
   * Set PW_NO_SERVER=1 to disable this entirely.
   */
  webServer: process.env.PW_NO_SERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
