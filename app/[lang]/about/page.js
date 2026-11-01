// ─────────────────────────────────────────────────────────────
//  ABOUT  →  URL: /about
//  Purana src/pages/AboutUs.jsx — wahi design, wahi text.
//  Server component (koi state/click nahi) — sirf Navbar browser mein chalta hai.
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';
import {
  Cloud, Target, Eye, Users, Globe, Code2, Layers, Smartphone,
  Server, PenTool, ShieldCheck, ArrowRight, Mail, Phone, MapPin, Link2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { pageMetadata } from '@/utils/seo';
import { getT } from '@/i18n/server';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  return pageMetadata({ title: t('about.metaTitle'), description: t('about.metaDescription'), path: '/about', lang });
}

// ══════════════════════════════════════════════════════════════════════
// YAHAN SE EDIT KAREIN — poore page ki company details ek hi jagah
//
// Contact details abhi placeholder hain. Jab tak aap asli email/phone
// nahi bharte, page un ki jagah "contact details coming soon" dikhata
// hai — nakli email live site par dikhana us se bura hai, kyunke koi
// international client us par mail kar ke intezar karta rahega.
//
// Bharne ke baad kuch aur karne ki zaroorat nahi, page khud badal jayega.
// ══════════════════════════════════════════════════════════════════════
// Text (tagline, services, values, bios…) ab messages/<lang>.json ke `about`
// namespace mein — har zaban ka apna. Yahan sirf naam, icons aur contact.
const COMPANY = {
  name: '360 Business Consultant',
  founded: '2025',

  // TODO: yahan asli details daalein
  email: '',          // e.g. 'hello@360businessconsultant.com'
  phone: '',          // e.g. '+92 300 0000000'
  location: '',       // e.g. 'Lahore, Pakistan — working with clients worldwide'
  linkedin: '',       // e.g. 'https://linkedin.com/company/...'
};

const hasContact = Boolean(COMPANY.email || COMPANY.phone);

// Text messages ke `about.services` / `about.values` mein — isi tarteeb mein
const SERVICE_ICONS = [Code2, Layers, Server, Smartphone, PenTool, ShieldCheck];
const VALUE_ICONS = [Target, Eye, Users, Globe];
const FOUNDERS = [
  { key: 'zain', name: 'Zain Butt', initials: 'ZB' },
  { key: 'sarim', name: 'Syed Sarim', initials: 'SS' },
];

export default async function AboutUs({ params }) {
  const { lang } = await params;
  const t = await getT(lang);
  const SERVICES = t.raw('about.services').map((x, i) => ({ ...x, icon: SERVICE_ICONS[i] }));
  const VALUES = t.raw('about.values').map((x, i) => ({ ...x, icon: VALUE_ICONS[i] }));
  const DISCIPLINES = t.raw('about.disciplines');
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <header className="relative bg-gradient-to-br from-[#002244] via-[#004a7c] to-[#0077b6] text-white overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/20 text-xs font-bold uppercase tracking-widest text-blue-200 mb-5">
            {t('about.badge')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-5 max-w-3xl">
            {COMPANY.name}
          </h1>
          <p className="text-lg sm:text-xl text-blue-100/90 max-w-2xl leading-relaxed">
            {t('about.tagline')}
          </p>
          <p className="text-blue-200/80 max-w-2xl leading-relaxed mt-4">
            {t('about.intro')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-9">
            <a
              href="#work-with-us"
              className="inline-flex items-center justify-center gap-2 min-h-12 px-7 rounded-full bg-white text-[#002244] text-sm font-bold hover:bg-blue-50 transition-colors"
            >
              {t('about.startProject')} <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#what-we-do"
              className="inline-flex items-center justify-center min-h-12 px-7 rounded-full ring-1 ring-white/30 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              {t('about.whatWeDo')}
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16">

        {/* ── WHO WE ARE ─────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002244] mb-5">
            {t('about.whoWeAre')}
          </h2>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4 text-gray-600 leading-relaxed">
              {t.raw('about.whoParagraphs').map((para, i) => (
                <p key={i}>{para.replace('{company}', COMPANY.name)}</p>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                {t('about.atAGlance')}
              </p>
              <dl className="space-y-4 text-sm">
                {[
                  [t('about.glance.founded'), COMPANY.founded],
                  [t('about.glance.focus'), t('about.glance.focusValue')],
                  [t('about.glance.clients'), t('about.glance.clientsValue')],
                  [t('about.glance.product'), 'WeatherApex'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-gray-400 text-xs">{k}</dt>
                    <dd className="font-semibold text-[#002244]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── WHAT WE DO ─────────────────────────────────────── */}
        <section id="what-we-do" className="scroll-mt-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002244] mb-2">
            {t('about.whatWeDo')}
          </h2>
          <p className="text-gray-500 mb-7 max-w-2xl">
            {t('about.whatWeDoText')}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#0077b6] hover:shadow-md transition-all"
              >
                <span className="inline-flex w-11 h-11 rounded-xl bg-blue-50 items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#0077b6]" />
                </span>
                <h3 className="font-bold text-[#002244] mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── OUR PRODUCT ────────────────────────────────────── */}
        <section>
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0077b6] to-[#002244] text-white">
            <div className="relative p-7 sm:p-10 lg:p-12">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/20 text-xs font-bold uppercase tracking-widest text-blue-200 mb-5">
                <Cloud className="w-3.5 h-3.5" /> {t('about.ourProduct')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">WeatherApex</h2>
              <p className="text-blue-100/90 leading-relaxed max-w-2xl mb-4">
                {t('about.productText1')}
              </p>
              <p className="text-blue-200/80 leading-relaxed max-w-2xl mb-7 text-sm">
                {t('about.productText2')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/trip-planner"
                  className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-full bg-white text-[#002244] text-sm font-bold hover:bg-blue-50 transition-colors"
                >
                  {t('about.tryTripPlanner')} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/api-docs"
                  className="inline-flex items-center justify-center min-h-12 px-6 rounded-full ring-1 ring-white/30 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  {t('about.readApiDocs')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── LEADERSHIP ─────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002244] mb-2">
            {t('about.leadership')}
          </h2>
          <p className="text-gray-500 mb-7">{t('about.leadershipText')}</p>

          <div className="grid md:grid-cols-2 gap-5">
            {FOUNDERS.map((p) => (
              <article key={p.name} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7">
                <div className="flex items-center gap-4 mb-5">
                  <span className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0077b6] to-[#002244] text-white text-xl font-extrabold flex items-center justify-center">
                    {p.initials}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold text-[#002244] leading-tight">{p.name}</h3>
                    <p className="text-sm font-semibold text-[#0077b6]">{t(`about.founders.${p.key}.role`)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">{t(`about.founders.${p.key}.bio`)}</p>
                <div className="flex flex-wrap gap-2">
                  {t.raw(`about.founders.${p.key}.focus`).map((f) => (
                    <span key={f} className="px-2.5 py-1 rounded-full bg-[#f0f5ff] text-[#0077b6] text-xs font-semibold">
                      {f}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6 sm:p-7">
            <h3 className="font-bold text-[#002244] mb-1">{t('about.widerTeam')}</h3>
            <p className="text-sm text-gray-500 mb-5">
              {t('about.widerTeamText')}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DISCIPLINES.map((d) => (
                <div key={d.title} className="border border-gray-100 rounded-xl p-4 bg-[#fafcff]">
                  <p className="font-semibold text-[#002244] text-sm">{d.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VALUES ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002244] mb-7">
            {t('about.howWeWork')}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <span className="shrink-0 w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#0077b6]" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#002244] mb-1">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── WORK WITH US ───────────────────────────────────── */}
        <section id="work-with-us" className="scroll-mt-6">
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#f0f5ff] to-white px-7 py-8 sm:px-10 sm:py-10 border-b border-gray-100">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002244] mb-3">
                {t('about.ctaTitle')}
              </h2>
              <p className="text-gray-600 leading-relaxed max-w-2xl">
                {t('about.ctaText')}
              </p>
            </div>

            <div className="px-7 py-8 sm:px-10">
              {hasContact ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {COMPANY.email && (
                    <a
                      href={`mailto:${COMPANY.email}`}
                      className="flex items-center gap-4 rounded-2xl border border-gray-200 p-5 hover:border-[#0077b6] hover:bg-[#fafcff] transition-colors"
                    >
                      <span className="shrink-0 w-11 h-11 rounded-xl bg-[#0077b6] flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">{t('about.contact.email')}</span>
                        <span className="block font-semibold text-[#002244] break-all">{COMPANY.email}</span>
                      </span>
                    </a>
                  )}
                  {COMPANY.phone && (
                    <a
                      href={`tel:${COMPANY.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-4 rounded-2xl border border-gray-200 p-5 hover:border-[#0077b6] hover:bg-[#fafcff] transition-colors"
                    >
                      <span className="shrink-0 w-11 h-11 rounded-xl bg-[#0077b6] flex items-center justify-center">
                        <Phone className="w-5 h-5 text-white" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">{t('about.contact.phone')}</span>
                        <span className="block font-semibold text-[#002244]">{COMPANY.phone}</span>
                      </span>
                    </a>
                  )}
                  {COMPANY.location && (
                    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 p-5">
                      <span className="shrink-0 w-11 h-11 rounded-xl bg-[#f0f5ff] flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#0077b6]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">{t('about.contact.location')}</span>
                        <span className="block font-semibold text-[#002244]">{COMPANY.location}</span>
                      </span>
                    </div>
                  )}
                  {COMPANY.linkedin && (
                    <a
                      href={COMPANY.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 rounded-2xl border border-gray-200 p-5 hover:border-[#0077b6] hover:bg-[#fafcff] transition-colors"
                    >
                      <span className="shrink-0 w-11 h-11 rounded-xl bg-[#f0f5ff] flex items-center justify-center">
                        <Link2 className="w-5 h-5 text-[#0077b6]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">LinkedIn</span>
                        <span className="block font-semibold text-[#002244]">{t('about.contact.companyPage')}</span>
                      </span>
                    </a>
                  )}
                </div>
              ) : (
                /* Contact details abhi bhari nahi gayin. Nakli email
                   dikhane se behtar hai saaf kehna — warna client mail
                   kar ke jawab ka intezar karta rahega. */
                <div className="rounded-2xl border border-dashed border-[#b9d3ff] bg-[#fafcff] p-6 text-center">
                  <span className="inline-flex w-11 h-11 rounded-xl bg-[#f0f5ff] items-center justify-center mb-3">
                    <Mail className="w-5 h-5 text-[#0077b6]" />
                  </span>
                  <p className="font-bold text-[#002244]">{t('about.contact.soonTitle')}</p>
                  <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                    {t('about.contact.soonText')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
