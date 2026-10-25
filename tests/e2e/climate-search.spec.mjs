// ─────────────────────────────────────────────────────────────
//  Climate Guides search → naya shehar (owner, Oct 2026)
//  Pehle anjaan shehar /weather/<slug> par 404 deta tha. Ab /api/places/open
//  (DB pehle, phir Open-Meteo) — yahan us ka jawab MOCK hai (koi DB/Open-Meteo nahi).
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';
import { blockThirdParty } from './helpers.mjs';

async function search(page, text) {
  await page.goto('/climate-guides');
  const box = page.getByRole('textbox', { name: 'Search any city' });
  await box.fill(text);
  await box.press('Enter');
}

test('unknown city: loading message, then its climate page (no 404)', async ({ page }) => {
  await blockThirdParty(page);
  const bodies = [];
  await page.route('**/api/places/open', async (r) => {
    bodies.push(r.request().postDataJSON());
    await new Promise((res) => setTimeout(res, 400));
    await r.fulfill({ json: { status: 'ok', path: '/weather/australia/brisbane', created: true, city: { slug: 'brisbane' } } });
  });
  await search(page, 'Tulum');
  await expect(page.getByText(/Loading climate data for Tulum/)).toBeVisible();
  await expect(page).toHaveURL(/\/weather\/australia\/brisbane$/);
  expect(bodies).toEqual([{ q: 'Tulum' }]);
});

test('same name in several countries: user chooses, choice sent by geoId', async ({ page }) => {
  await blockThirdParty(page);
  const bodies = [];
  await page.route('**/api/places/open', async (r) => {
    const body = r.request().postDataJSON();
    bodies.push(body);
    if (body.q) {
      await r.fulfill({ json: { status: 'choose', choices: [
        { geo_id: 1, name: 'Granada', admin1: 'Andalusia', country: 'Spain', population: 234325, slug: null },
        { geo_id: 2, name: 'Granada', admin1: 'Granada Department', country: 'Nicaragua', population: 89409, slug: null },
      ] } });
    } else {
      await r.fulfill({ json: { status: 'ok', path: '/weather/australia/brisbane' } });
    }
  });
  await search(page, 'Granada');
  await expect(page.getByText(/more than one “Granada”/)).toBeVisible();
  await page.getByRole('button', { name: /Granada, Granada Department, Nicaragua/ }).click();
  await expect(page).toHaveURL(/\/weather\/australia\/brisbane$/);
  expect(bodies[1]).toEqual({ geoId: 2 });
});

test('country name: explains it is not a city; not found: helpful hint', async ({ page }) => {
  await blockThirdParty(page);
  await page.route('**/api/places/open', async (r) => {
    const { q } = r.request().postDataJSON();
    if (q === 'Kenya') await r.fulfill({ json: { status: 'not_a_city', label: 'Kenya', country: 'Kenya', suggestions: [] } });
    else await r.fulfill({ status: 404, json: { status: 'not_found' } });
  });
  await search(page, 'Kenya');
  await expect(page.getByText(/Kenya is a country or region, not a city/)).toBeVisible();
  await search(page, 'Xqzville');
  await expect(page.getByText(/couldn't find a city called “Xqzville”/)).toBeVisible();
  await expect(page).toHaveURL(/\/climate-guides$/);
});

test('daily new-city cap: "try again tomorrow" message', async ({ page }) => {
  await blockThirdParty(page);
  await page.route('**/api/places/open', (r) => r.fulfill({ status: 429, json: { status: 'limit' } }));
  await search(page, 'Mombasa');
  await expect(page.getByText(/please try again tomorrow/)).toBeVisible();
  await expect(page).toHaveURL(/\/climate-guides$/);
});

test('whitelist city goes straight to its page without the API', async ({ page }) => {
  await blockThirdParty(page);
  let called = false;
  await page.route('**/api/places/open', (r) => { called = true; return r.abort(); });
  await search(page, 'Brisbane');
  await expect(page).toHaveURL(/\/weather\/australia\/brisbane$/);
  expect(called).toBe(false);
});

test('places API rejects empty queries', async ({ request }) => {
  const res = await request.post('/api/places/open', { data: { q: 'x' } });
  expect(res.status()).toBe(400);
});
