// ─────────────────────────────────────────────────────────────
//  Playwright (Group 4) — end-to-end tests
//
//  Chalana:
//    npm run build           (pehle production build)
//    npm run test:e2e        (khud `next start -p 3100` chalata hai,
//                             ya pehle se chal raha ho to wahi use karta hai)
//  Django backend (127.0.0.1:8000) chal raha hona chahiye — server par
//  banne wale pages (blog, city) asli backend se aate hain. Browser ki
//  rate-limited calls (/api/weather/current/ wagera) tests mein MOCK hain.
//
//  Doosra server:  PW_BASE_URL=http://localhost:3001 npm run test:e2e
// ─────────────────────────────────────────────────────────────
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PW_BASE_URL || 'http://localhost:3100';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    locale: 'en-GB', // °C default (en-US → °F; alag test mein)
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: 'npx next start -p 3100',
        url: `${BASE_URL}/about`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
