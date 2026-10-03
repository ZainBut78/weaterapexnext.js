// ─────────────────────────────────────────────────────────────
//  SHARE IMAGE (1200×630)  →  /og-image?title=...&kicker=...
//
//  Jab koi link WhatsApp / Facebook / X par share kare to yeh tasveer
//  dikhti hai (og:image). `next/og` Next.js ke andar hai — nayi library
//  nahi. Brand colors #002244 / #0077b6, Navbar wala logo (badal + ✓),
//  WeatherApex naam aur page ka title. (Owner: round 2, 2.2-a option A.)
//
//  Final design aane par sirf yeh file badalni hogi.
// ─────────────────────────────────────────────────────────────
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { getCityPhoto } from '@/services/cityPhoto';

// Title/brand ke liye Inter Bold (latin, woff ~31 KB) — sirf server par,
// browser ko nahi jata. License: Inter-OFL-LICENSE.txt (SIL OFL 1.1).
// Source: @fontsource/inter 5.2.8 (owner, round 3 A5).
let interBold;
const loadInterBold = () =>
  (interBold ??= readFile(join(process.cwd(), 'app/og-image/Inter-Bold-latin.woff')));

const clean = (v, max) => (v || '').replace(/\s+/g, ' ').trim().slice(0, max);

// Shehar ki photo (Pexels) — wahi `image_url` jo backend current weather
// ke saath bhejta hai (Popular Destinations bhi yahi dikhata hai).
// Sirf whitelist wale shehar; services/cityPhoto.js (3 ghante cache, wahi
// cache jo city page ka hai) — koi share kare tab hi
// call, build par koi loop nahi. Na mile to neela gradient.
const cityPhoto = (slug) => getCityPhoto(slug);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = clean(searchParams.get('title'), 110) || 'Weather Forecasts, Trip Planning & Climate Guides';
  const kicker = clean(searchParams.get('kicker'), 40);
  const [photo, fontData] = await Promise.all([cityPhoto(searchParams.get('city')), loadInterBold()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #002244 0%, #0077b6 65%, #00a8e8 100%)',
          color: 'white',
          position: 'relative',
        }}
      >
        {photo ? (
          <img
            src={photo}
            width={1200}
            height={630}
            style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' }}
          />
        ) : null}
        {photo ? (
          // Photo par gehra brand-rang parda — text har photo par saaf parha jaye
          <div
            style={{
              position: 'absolute', top: 0, left: 0, width: 1200, height: 630,
              background: 'linear-gradient(90deg, rgba(0,34,68,0.88) 0%, rgba(0,34,68,0.55) 50%, rgba(0,34,68,0.10) 100%)',
            }}
          />
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0077b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19.125A5.5 5.5 0 0 0 19 8.5a7 7 0 0 0-13.187 2.086A4.5 4.5 0 0 0 5.5 19.5h12" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>
          <div style={{ marginLeft: 24, fontSize: 44, fontFamily: 'Inter', fontWeight: 700, letterSpacing: -1 }}>WeatherApex</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {kicker ? (
            <div style={{ fontSize: 28, fontWeight: 600, color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 16 }}>
              {kicker}
            </div>
          ) : null}
          <div style={{ fontSize: title.length > 60 ? 60 : 72, fontFamily: 'Inter', fontWeight: 700, lineHeight: 1.1, letterSpacing: -2, maxWidth: 1000 }}>
            {title}
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 26, color: '#dbeafe' }}>weatherapex.com</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Inter', data: fontData, weight: 700, style: 'normal' }],
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' },
    },
  );
}
