// ─────────────────────────────────────────────────────────────
//  Blog post page (blog editor round 2): TOC, table scroll, FAQ accordion,
//  FAQPage JSON-LD, Further reading, Sources, featured image (no CLS).
//  Asli backend ki post use hoti hai (server par banta page) — FAQ wali
//  koi live post na ho to test skip (jaise purana blog test).
// ─────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';
import { blockThirdParty } from './helpers.mjs';

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

async function findRichPost(request) {
  const list = await request.get('/api/blog/posts/?page=1');
  if (!list.ok()) return null;
  for (const p of (await list.json()).posts || []) {
    const d = await request.get(`/api/blog/posts/${p.slug}/`);
    if (!d.ok()) continue;
    const post = await d.json();
    if ((post.faqs || []).length) return post;
  }
  return null;
}

test.beforeEach(async ({ page }) => {
  await blockThirdParty(page);
});

for (const vp of [PHONE, DESKTOP]) {
  test(`blog post: FAQ, TOC, links and table render at ${vp.width}px`, async ({ page, request }) => {
    const post = await findRichPost(request);
    test.skip(!post, 'No live blog post with FAQs on this backend');

    await page.setViewportSize(vp);
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(`/blog/${post.slug}`);
    await expect(page.locator('h1')).toHaveText(post.title);

    // FAQ: jawab HTML mein hai, band; click → khule, dobara click → band
    const first = page.locator('#blog-faq-heading ~ div details').first();
    const answer = first.locator('p');
    await expect(answer).toBeHidden();
    await first.locator('summary').click();
    await expect(answer).toBeVisible();
    await first.locator('summary').click();
    await expect(answer).toBeHidden();
    expect(await page.content()).toContain(post.faqs[0].question);

    // FAQPage JSON-LD = API ke FAQ
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqLd = ld.map((t) => JSON.parse(t)).find((j) => j['@type'] === 'FAQPage');
    expect(faqLd.mainEntity).toHaveLength(post.faqs.length);
    expect(faqLd.mainEntity[0].acceptedAnswer.text).toBe(post.faqs[0].answer);

    // TOC: content ke har H2 ka link + anchor maujood
    const h2ids = await page.locator('.blog-content h2[id]').evaluateAll((hs) => hs.map((h) => h.id));
    if (h2ids.length >= 2) {
      const toc = page.locator('nav[aria-label="Table of contents"]');
      if (vp.width < 1024) await toc.locator('summary').click();
      await expect(toc.locator(`a[href="#${h2ids[0]}"]:visible`)).toBeVisible();
    }

    // Further reading (andar ke links) + Sources (naya tab, admin ka rel)
    for (const l of post.further_reading || []) {
      await expect(page.locator(`#further-reading-heading ~ ul a[href="${l.url}"]`)).toBeVisible();
    }
    const src = page.locator('#sources-heading + ol a');
    await expect(src).toHaveCount((post.sources || []).length);
    for (const [i, s] of (post.sources || []).entries()) {
      await expect(src.nth(i)).toHaveAttribute('target', '_blank');
      await expect(src.nth(i)).toHaveAttribute('rel', s.rel);
    }

    // Table: scroll box; mobile par page bahar nahi phailta
    if (await page.locator('.blog-content .table-scroll').count()) {
      const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(o).toBeLessThanOrEqual(0);
    }

    // Featured image: alt admin se, width/height ho to CLS nahi
    if (post.featured_image) {
      const img = page.locator('article img').first();
      await expect(img).toHaveAttribute('alt', post.featured_image_alt || post.title);
      if (post.featured_image_width) await expect(img).toHaveAttribute('width', String(post.featured_image_width));
    }
    expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.1);
  });
}
