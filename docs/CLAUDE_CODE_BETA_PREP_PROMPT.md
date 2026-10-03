# WeatherApex — Prepare the frontend for Hostinger beta deploy (for Claude Code)

**Status:** the backend round 2 is deployed and verified on CapRover. All 155 cities are seeded, and normals are rebuilt (156 complete). Next, the Next.js app goes to **Hostinger Node.js Web App** on `beta.weatherapex.com`, then later to the main domain.

Standing rules:
- Backend and the old React project are read-only.
- No git commit or push: Zain does that.
- Explain in simple Roman Urdu.
- Log everything in `docs/PROGRESS.md`.

## What Hostinger does (from docs.hostinger.com, Node.js → Next.js)
- Next.js runs in **server mode**, and the platform **automatically applies `output: 'standalone'`**.
- Settings: application type `next`, build script `build`, output `.next`. Node 22.
- **Env vars are injected at build time AND at runtime.** Saving them triggers a redeploy.
- `next.config.*` must export an object (ours does: `export default nextConfig`).

## 1. Risk: files read at runtime may be missing in standalone output
In standalone mode, only files that Next's tracer can find are copied. These two are read with dynamic paths:
- `services/guides.js` reads `content/guides/{city}/{month}.md` via `process.cwd()`. If these files are missing, **all 120 travel notes silently disappear** on the live site.
- `app/og-image/route.js` reads `app/og-image/Inter-Bold-latin.woff`.

**Fix:**
1. In `next.config.mjs`, add `outputFileTracingIncludes` so that `./content/guides/**/*` and `./app/og-image/*.woff` are always included, for all routes that need them. Use the safe pattern `'/**'` if you are unsure of the route keys.
2. **Prove it locally** with a real standalone build, the same way Hostinger does it:
   1. Build with `output: 'standalone'`. Use an env switch for the test only (for example `NEXT_OUTPUT=standalone`), or set it permanently if `next start` still works for our local workflow. Explain which option you chose.
   2. Copy `public/` and `.next/static` into `.next/standalone/`, as the Next.js docs describe.
   3. Run `node .next/standalone/server.js` from **a different working directory** and check these pages:
      - `/weather/united-kingdom/london/october`: the "Travel notes" section is present
      - `/og-image?...` for London: returns a PNG
      - `/sitemap.xml`
      - `/robots.txt`
      - one blog page
   4. Report the size of `.next/standalone`.

## 2. Beta must NOT be indexed by Google
Add an env flag `SITE_NOINDEX` (server-side, no `NEXT_PUBLIC_` prefix needed). When it is `1`:
- Send an **`X-Robots-Tag: noindex, nofollow`** header on **every** response, via `headers()` in `next.config.mjs`. Env vars exist at build time on Hostinger.
- **Keep `robots.txt` allowing crawling.** If robots.txt blocks the site, Google cannot see the noindex header.
- When it is unset or `0`, everything behaves exactly as today.

Add a test to `seo-check` and/or e2e:
- with the flag on, the header is present on `/`, a month page and `/sitemap.xml`
- with the flag off, the header is absent

Document the flag in `.env.example`.

## 3. Production env values (write them into `.env.example` comments, no secrets)
For **beta**:
```
NEXT_PUBLIC_API_BASE_URL=https://api.weatherapex.com/api
API_INTERNAL_URL=https://api.weatherapex.com/api
NEXT_PUBLIC_SITE_URL=https://beta.weatherapex.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same as now>
BACKEND_INTERNAL_KEY=<secret, set only in Hostinger>
SITE_NOINDEX=1
# NOT set: API_PROXY_TARGET, HISTORY_READY_LOCAL
```
For **main** (at cutover):
- `NEXT_PUBLIC_SITE_URL=https://weatherapex.com`
- remove `SITE_NOINDEX`

Confirm in the code that with `API_PROXY_TARGET` unset:
- the `/api` rewrites are off
- the favicon rewrite still works
- browser calls go directly to `https://api.weatherapex.com/api` (CORS is handled on the backend)

## 4. Checks
1. Run `npm run build` (normal), `seo-check`, `test:e2e` and `check:icons`. All must still pass.
2. Run the standalone test from section 1.
3. Run `git status`, then `git add .`, then show the staged list. **No commit:** Zain commits and pushes.

## 5. Report to Zain (Roman Urdu, short)
- what changed (files)
- standalone test results (travel notes yes/no, OG yes/no, size)
- noindex test results
- the exact env list for Hostinger beta
