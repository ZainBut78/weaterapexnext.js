// ─────────────────────────────────────────────────────────────
//  /weather/<slug>  — sirf MULK ka page (country hub).
//
//  <slug> = MULK (/weather/united-kingdom) → country page (Phase C2).
//  Sirf 2+ shehar wale mulk (1-shehar wale → proxy.js 308 → /weather/<country>/<city>).
//
//  <slug> = SHEHAR (/weather/london) — purana Section 1 climate page. SEO
//  fixes (Oct 2026, owner option 1): woh /weather/<country>/<city> mein
//  merge ho gaya; proxy.js 301 karta hai. Proxy kisi wajah se na chale to
//  yahan bhi permanentRedirect (page kabhi 200 nahi deta → duplicate nahi).
//  Dono na hon → 404 (backend call se pehle).
// ─────────────────────────────────────────────────────────────
import { notFound, permanentRedirect } from 'next/navigation';
import CountryClimate from '@/components/climate/CountryClimate';
import { isKnownCity } from '@/data/cities';
import { getCountry, cityPath, countryPath } from '@/data/countries';
import { getCityRegistry } from '@/services/cityRegistry';
import { pageMetadata } from '@/utils/seo';
import { getCityPhoto } from '@/services/cityPhoto';
import { getClimateSummary, getHistories } from '@/services/history';
import { localePath } from '@/i18n/config';
import { currentLang, getT } from '@/i18n/server';
import ClientMessages from '@/i18n/ClientMessages';
import { countryName } from '@/i18n/places';
import { climateText } from '@/components/climate/text';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

// Shehar registry se (static + DB ke mukammal shehar). 2+ → hub; 1 → us
// shehar par 308 (proxy static list se pehle hi karta hai; yeh DB ke naye
// shehron ke liye); 0 → 404.
async function resolve(rawSlug) {
  const slug = decodeURIComponent(rawSlug).toLowerCase();
  const lang = await currentLang();   // i18n: redirect usi zaban mein
  // Purana city URL (original 160) → merged page (proxy.js 301 pehle hi kar deta hai)
  if (isKnownCity(slug)) permanentRedirect(localePath(lang, cityPath(slug)));
  const country = getCountry(slug);
  if (!country) notFound();
  const reg = await getCityRegistry();
  const list = reg.citiesOfCountry(country.slug);
  if (list.length === 1) permanentRedirect(localePath(lang, reg.cityPath(list[0].slug)));
  if (list.length === 0) notFound();
  return { kind: 'country', country, list, reg };
}

export async function generateMetadata({ params }) {
  const { slug, lang } = await params;
  const r = await resolve(slug);

  if (r.kind === 'country') {
    const n = r.list.length;
    const meta = climateText(lang).countryMeta({ countryN: countryName(lang, r.country), country: r.country, n });
    return pageMetadata({
      // English: `title` (+ " — WeatherApex"); doosri zabanein poora absoluteTitle de sakti hain
      ...(meta.absoluteTitle ? { absoluteTitle: meta.absoluteTitle } : { title: meta.title }),
      description: meta.description,
      path: countryPath(r.country.slug),
      kicker: meta.kicker,
      lang,
    });
  }

  return {};
}

export default async function WeatherSlugPage({ params }) {
  const { slug, lang } = await params;
  const r = await resolve(slug);
  const t = await getT(lang);

  // ── MULK (preview) ──────────────────────────────────────────
  if (r.kind === 'country') {
    // Registry: sirf mukammal data wale shehar (static + DB)
    const list = r.list;
    // Backend round C2: saare shehar EK climate-summary call mein (koi 6 wali
    // hadd nahi). Summary na mile (purana backend) → purana rasta (≤ 6 calls).
    const summary = await getClimateSummary({ cities: list.map((c) => c.slug) });
    const histories = summary || (await getHistories(list.map((c) => c.slug))).data;
    // Photos: cities index (1 call, 1 h cache) — sirf jin ka data aaya
    const photos = new Map(await Promise.all([...histories.keys()].map(async (s) => [s, await getCityPhoto(s)])));
    const cities = list.map((c) => ({ slug: c.slug, name: c.name, names: c.names, href: r.reg.cityPath(c.slug), photo: photos.get(c.slug) || null }));
    return (
      <ClientMessages lang={lang} ns={['climate']}>
        <CountryClimate
          country={r.country}
          cities={cities}
          histories={histories}
          crumbs={[
            { name: t('nav.home'), path: '/' },
            { name: t('weatherHub.crumb'), path: '/weather' },
            { name: countryName(lang, r.country), path: countryPath(r.country.slug) },
          ]}
          lang={lang}
        />
      </ClientMessages>
    );
  }
  notFound();
}
