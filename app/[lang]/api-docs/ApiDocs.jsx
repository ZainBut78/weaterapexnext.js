'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, MapPin, Globe, Cloud, AlertTriangle, Copy, Check, KeyRound,
  LogIn, UserPlus, Loader2, Zap, ShieldCheck, Gauge, Terminal, CircleAlert,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { generateApiKey } from '@/services/authService';
import { API_BASE_URL } from '@/config/endpoints';

// CRITICAL FIX: yeh page 8 jagah dev machine ka hardcoded base URL
// (localhost, port 8000) dikhata tha — curl examples, "Base URL" box, sab.
// Production par har developer ko wahi URL dikhta, jo un ke computer par
// chalta hi nahi. Ab base wahi hai jo baqi app use karti hai
// (NEXT_PUBLIC_API_BASE_URL), aur relative value ho to browser ke apne origin se
// absolute bana lete hain.
const API_DOC_BASE = (() => {
  const raw = (API_BASE_URL || '/api').replace(/\/+$/, '');
  if (/^https?:\/\//i.test(raw)) return raw;
  // Next.js: yeh page server par bhi banta hai. window.location.origin
  // server par khaali hota aur browser mein bhara — docs ka text dono
  // jagah alag ho jata (hydration mismatch). Is liye site ka apna pata
  // (NEXT_PUBLIC_SITE_URL) — dono jagah ek jaisa.
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
  return `${origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
})();

// AHEM: API key wale PUBLIC endpoints /api/v1/ par hain, /api/ par nahi.
// Pehle yeh docs /api/trips/plan/ dikhati thin — woh website ke apne
// endpoints hain (anonymous daily limit wale), developer API nahi. Jo
// developer in docs ko follow karta, us ka integration versioned API par
// hota hi nahi — aur kal ko hum /api/ badal dete to us ka code toot jata.
const V1 = `${API_DOC_BASE}/v1`;

const sections = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'quickstart', label: 'Quickstart', icon: Zap },
  { id: 'authentication', label: 'Authentication', icon: ShieldCheck },
  { id: 'api-key', label: 'Get an API key', icon: KeyRound },
  { id: 'rate-limits', label: 'Rate limits & plans', icon: Gauge },
  { id: 'trip-planner', label: 'Trip Planner', icon: MapPin },
  { id: 'event-risk', label: 'Event Risk Score', icon: AlertTriangle },
  { id: 'errors', label: 'Errors', icon: CircleAlert },
  { id: 'best-practices', label: 'Best practices', icon: Lightbulb },
];

const KEY_FEATURES = [
  { value: 'trip_planner', label: 'Trip Planner', desc: 'Day-by-day trip scoring for a city', icon: MapPin },
  { value: 'events', label: 'Event Risk', desc: 'Weather risk scoring for outdoor events', icon: AlertTriangle },
];

const CODE = {
  curl: `curl "${V1}/trips/plan/?city=barcelona&start=2026-08-03&end=2026-08-06" \\
  -H "X-API-Key: wv_live_YOUR_KEY_HERE"`,

  js: `const res = await fetch(
  "${V1}/trips/plan/?city=barcelona&start=2026-08-03&end=2026-08-06",
  { headers: { "X-API-Key": process.env.WEATHERAPEX_KEY } }
);

if (!res.ok) {
  const { error, detail } = await res.json();
  throw new Error(\`\${res.status} \${error}: \${detail ?? ""}\`);
}

const { data } = await res.json();
console.log(data.overall_score, data.best_day);`,

  python: `import os, requests

res = requests.get(
    "${V1}/trips/plan/",
    params={"city": "barcelona", "start": "2026-08-03", "end": "2026-08-06"},
    headers={"X-API-Key": os.environ["WEATHERAPEX_KEY"]},
    timeout=30,
)
res.raise_for_status()

data = res.json()["data"]
print(data["overall_score"], data["best_day"])`,

  event: `curl "${V1}/events/risk/?city=london&date=2026-08-15&type=wedding&time=18" \\
  -H "X-API-Key: wv_live_YOUR_KEY_HERE"`,
};

const TRIP_PARAMS = [
  { name: 'city', type: 'string', required: true, desc: 'City name, e.g. "barcelona". Country and region names are rejected — see Errors.' },
  { name: 'start', type: 'string (YYYY-MM-DD)', required: true, desc: 'First day of the trip. Must not be in the past.' },
  { name: 'end', type: 'string (YYYY-MM-DD)', required: true, desc: 'Last day. Must be on or after start. Maximum 20 days total.' },
];

const EVENT_PARAMS = [
  { name: 'city', type: 'string', required: true, desc: 'City name, e.g. "london".' },
  { name: 'date', type: 'string (YYYY-MM-DD)', required: true, desc: 'Event date. Must be within the next 16 days.' },
  { name: 'type', type: 'string', required: false, desc: 'One of wedding, sports, concert, general. Each weights rain, wind, heat and humidity differently. Default: general.' },
  { name: 'time', type: 'integer (0-23)', required: false, desc: 'Hour of the event in local time. Omit it and the API returns the best time window of that day plus an hour-by-hour breakdown.' },
];

const TRIP_FIELDS = [
  ['city, country', 'string', 'Resolved city and its country.'],
  ['overall_score', 'number 0-10', 'Average day score across the trip. Higher is better.'],
  ['best_day, worst_day', 'string (date)', 'Highest and lowest scoring day.'],
  ['data_source', 'string', '"forecast" for dates within the forecast window, otherwise "historical" (a seasonal estimate from 20 years of records).'],
  ['days[]', 'array', 'One object per day — see below.'],
  ['days[].score', 'number 0-10', 'That day\'s score.'],
  ['days[].weather_code', 'integer', 'WMO weather code. 0 clear, 61 rain, 71 snow, 95 thunderstorm.'],
  ['days[].temp_max, temp_min', 'number (°C)', 'Daily high and low.'],
  ['days[].rain_probability', 'integer (%)', 'Maximum chance of rain that day.'],
  ['days[].wind_kmh', 'number', 'Maximum wind speed.'],
  ['days[].recommended_activity', 'string', 'e.g. beach_water, hiking_outdoor, indoor_museum.'],
  ['days[].day_parts', 'object', 'morning / afternoon / evening breakdown of temp, rain and wind.'],
  ['packing_suggestions[]', 'array', 'Items worth packing, with the reason they were suggested.'],
];

const EVENT_FIELDS = [
  ['risk_score', 'number 0-10', 'Weather risk. Lower is better.'],
  ['risk_level', 'string', 'low (0-3), moderate (3-6), high (6-10).'],
  ['weather_code', 'integer', 'WMO weather code for that hour.'],
  ['rain_probability', 'integer (%)', 'Chance of rain.'],
  ['wind_kmh, temperature_c, humidity_pct', 'number', 'Conditions at the requested hour.'],
  ['recommendation', 'string', 'Plain-language advice for the event.'],
  ['alternate_dates[]', 'array', 'Up to 5 nearby dates, sorted best first.'],
  ['best_window', 'object', 'Only when "time" is omitted — the calmest window of the day.'],
  ['hourly_breakdown[]', 'array', 'Only when "time" is omitted — 06:00 to 22:00, hour by hour.'],
];

const ERRORS = [
  ['400', 'Missing or invalid parameter', 'A required parameter is absent, the date format is wrong, or the range exceeds 20 days.'],
  ['400', 'Place is a country or region', 'You sent something like "pakistan". Weather differs between cities, so send a city. The response includes a suggestions array of cities we have.'],
  ['401', 'Missing or invalid API key', 'The X-API-Key header is absent, wrong, or the key was revoked.'],
  ['403', 'Feature not enabled / account inactive', 'Your key does not include this feature. Generate a new key with it enabled.'],
  ['404', 'City not found', 'We could not resolve that place name at all.'],
  ['429', 'Rate limit or quota exceeded', 'See Rate limits. The body carries a code field: rate_limited or free_limit_reached.'],
  ['503', 'Upstream data unavailable', 'The weather provider did not respond. Safe to retry with backoff.'],
];

const PLANS = [
  ['Free', '100 total (lifetime)', '10 / minute', 'Testing and small projects'],
  ['Starter', '5,000 / day', '30 / minute', 'Production side-projects'],
  ['Pro', '50,000 / day', '100 / minute', 'Commercial applications'],
  ['Business', '500,000 / day', '300 / minute', 'High-volume platforms'],
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    // Button dikhta 28x28 hai (design wahi rehta hai) magar after:-inset-2
    // se clickable area ~44x44 ho jata hai — mobile par tap miss nahi hota.
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors after:content-[''] after:absolute after:-inset-2"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function CodeBlock({ children }) {
  return (
    <div className="relative bg-gray-900 rounded-xl p-4 overflow-x-auto">
      <CopyButton text={children} />
      <pre className="text-sm text-gray-100 font-mono leading-relaxed whitespace-pre">{children}</pre>
    </div>
  );
}

/** Kai zabanon ke code samples ek hi block mein. */
function CodeTabs({ samples }) {
  const names = Object.keys(samples);
  const [active, setActive] = useState(names[0]);
  return (
    <div>
      <div className="flex gap-1 mb-2 overflow-x-auto">
        {names.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setActive(n)}
            className={`min-h-11 px-4 rounded-lg text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
              active === n ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <CodeBlock>{samples[active]}</CodeBlock>
    </div>
  );
}

function ParamTable({ params }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Parameter</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Required</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
              <td className="px-4 py-3 align-top"><code className="text-[#0077b6] bg-blue-50 px-1.5 py-0.5 rounded text-xs font-mono">{p.name}</code></td>
              <td className="px-4 py-3 text-gray-600 align-top whitespace-nowrap">{p.type}</td>
              <td className="px-4 py-3 align-top">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${p.required ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                  {p.required ? 'Required' : 'Optional'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 align-top">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FieldTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Field</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([f, t, d]) => (
            <tr key={f} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
              <td className="px-4 py-3 align-top"><code className="text-[#0077b6] bg-blue-50 px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap">{f}</code></td>
              <td className="px-4 py-3 text-gray-500 align-top whitespace-nowrap text-xs">{t}</td>
              <td className="px-4 py-3 text-gray-600 align-top">{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Endpoint({ method = 'GET', path }) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-900 rounded-xl px-4 py-3 mb-5">
      <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">{method}</span>
      <code className="text-sm font-mono text-blue-200 break-all">{path}</code>
    </div>
  );
}

function Card({ id, badge, title, children }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {badge && (
            <span className="px-3 py-1 bg-blue-50 text-[#0077b6] text-xs font-bold rounded-full uppercase tracking-wide">
              {badge}
            </span>
          )}
          <h2 className="text-xl sm:text-2xl font-bold text-[#002244]">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function ApiDocs() {
  const [activeSection, setActiveSection] = useState('overview');
  const { user } = useAuth();
  const router = useRouter();

  const [selectedFeatures, setSelectedFeatures] = useState(['trip_planner', 'events']);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [keyError, setKeyError] = useState('');

  const toggleFeature = (value) => {
    setSelectedFeatures((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]
    );
  };

  const handleGenerate = async () => {
    setKeyError('');
    setGeneratedKey(null);
    if (selectedFeatures.length === 0) {
      setKeyError('Select at least one feature for your API key.');
      return;
    }
    setGenerating(true);
    try {
      const res = await generateApiKey({ name: 'API Docs Key', features: selectedFeatures });
      setGeneratedKey(res);
    } catch (err) {
      setKeyError(err.response?.data?.error || err.message || 'Could not generate key');
    } finally {
      setGenerating(false);
    }
  };

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <div className="bg-[#002244] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-6 h-6 text-blue-300" />
            <h1 className="text-2xl sm:text-3xl font-bold">API Reference</h1>
            <span className="px-2 py-0.5 rounded bg-white/10 text-blue-200 text-xs font-bold ring-1 ring-white/20">v1</span>
          </div>
          <p className="text-blue-200/90 max-w-2xl leading-relaxed">
            Turn a forecast into a decision. Score every day of a trip, or find the
            safest hour for an outdoor event — over plain HTTP, JSON in and JSON out.
          </p>
          <div className="mt-6 inline-flex flex-wrap items-center gap-2 bg-white/5 ring-1 ring-white/15 rounded-xl px-4 py-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Base URL</span>
            <code className="text-sm font-mono text-white break-all">{V1}</code>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <nav className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-8 space-y-1">
            {sections.map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollTo(sec.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                    activeSection === sec.id
                      ? 'bg-[#0077b6] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0 space-y-8 pb-16">

          {/* ── OVERVIEW ─────────────────────────────────────────── */}
          <Card id="overview" title="Overview">
            <p className="text-gray-600 leading-relaxed mb-5">
              The WeatherApex API answers a question raw forecast data cannot:
              <em> is this a good day for what I am planning?</em> We take hourly and
              daily forecasts from national weather models, weight them against the
              activity you care about, and return a score you can act on.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {[
                { icon: MapPin, t: 'Trip Planner', d: 'Score each day of a date range for one city, with per-day activity suggestions.' },
                { icon: AlertTriangle, t: 'Event Risk', d: 'Risk score for an outdoor event, the calmest window of the day, and better nearby dates.' },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="border border-gray-200 rounded-xl p-4">
                  <p className="flex items-center gap-2 font-bold text-[#002244] mb-1">
                    <Icon className="w-4 h-4 text-[#0077b6]" /> {t}
                  </p>
                  <p className="text-sm text-gray-600">{d}</p>
                </div>
              ))}
            </div>

            <h4 className="font-bold text-[#002244] mb-2">Conventions</h4>
            <ul className="text-sm text-gray-600 space-y-2 mb-5">
              <li>• All requests are <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">GET</code>; parameters go in the query string.</li>
              <li>• Responses are JSON, UTF-8. Successful calls return <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{'{ "success": true, "data": { ... } }'}</code>.</li>
              <li>• Errors return a non-2xx status and <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{'{ "error": "...", "detail": "..." }'}</code>.</li>
              <li>• Dates are <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">YYYY-MM-DD</code>. Times are local to the city, in 24-hour form.</li>
              <li>• Temperatures are Celsius, wind is km/h, rainfall is millimetres.</li>
            </ul>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-900">
                <strong>Version your calls.</strong> Always use the <code className="bg-white px-1.5 py-0.5 rounded text-xs">/v1</code> path
                shown above. Endpoints without it power this website, may change without notice,
                and are not covered by these docs.
              </p>
            </div>
          </Card>

          {/* ── QUICKSTART ───────────────────────────────────────── */}
          <Card id="quickstart" badge="Start here" title="Quickstart">
            <ol className="space-y-3 mb-6">
              {[
                'Create a free account and generate an API key below.',
                'Send the key in the X-API-Key header on every request.',
                'Call an endpoint and read response.data.',
              ].map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-gray-700">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#0077b6] text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <CodeTabs samples={{ curl: CODE.curl, javascript: CODE.js, python: CODE.python }} />
            <p className="text-xs text-gray-500 mt-3">
              Keep the key on your server. Anyone who can read your front-end bundle can read a key you put in it.
            </p>
          </Card>

          {/* ── AUTHENTICATION ───────────────────────────────────── */}
          <Card id="authentication" title="Authentication">
            <p className="text-gray-600 leading-relaxed mb-5">
              Every v1 request needs an API key in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">X-API-Key</code> header.
              Keys look like <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">wv_live_…</code> and are shown once,
              at creation — we store only a hash, so we cannot recover a lost key. Generate a new one instead.
            </p>
            <CodeBlock>{`X-API-Key: wv_live_YOUR_KEY_HERE`}</CodeBlock>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="font-bold text-[#002244] text-sm mb-1">Scoped to features</p>
                <p className="text-sm text-gray-600">
                  A key only reaches the features you selected. Calling an endpoint outside
                  its scope returns <code className="bg-gray-100 px-1 rounded text-xs">403</code>.
                </p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="font-bold text-[#002244] text-sm mb-1">Up to 5 active keys</p>
                <p className="text-sm text-gray-600">
                  Use separate keys per environment so you can revoke one without touching the rest.
                </p>
              </div>
            </div>
          </Card>

          {/* ── API KEY GENERATION (live) ────────────────────────── */}
          <Card id="api-key" badge="Get access" title="Get an API key">
            <p className="text-gray-600 leading-relaxed mb-6">
              Generate a key right here. Choose only the features you need — you can
              create another key later for anything else.
            </p>

            {!user ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                <KeyRound className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Sign in to generate an API key</h3>
                <p className="text-sm text-slate-500 mb-5">
                  You need a free WeatherApex account to manage API keys.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0077b6] hover:bg-[#005a8d] text-white text-sm font-bold px-6 min-h-11 rounded-lg transition-colors"
                  >
                    <LogIn size={16} /> Sign In
                  </button>
                  <button
                    onClick={() => router.push('/signup')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-100 text-slate-700 text-sm font-bold px-6 min-h-11 rounded-lg transition-colors"
                  >
                    <UserPlus size={16} /> Create Account
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Signed in as <span className="font-semibold text-slate-900">{user}</span> — select the features this key can access:
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {KEY_FEATURES.map((f) => {
                    const Icon = f.icon;
                    const checked = selectedFeatures.includes(f.value);
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => toggleFeature(f.value)}
                        aria-pressed={checked}
                        className={`flex items-start gap-3 border-2 rounded-xl p-4 text-left transition-all ${
                          checked ? 'border-[#0077b6] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            checked ? 'bg-[#0077b6] border-[#0077b6]' : 'border-gray-300'
                          }`}
                        >
                          {checked && <Check className="w-3.5 h-3.5 text-white" />}
                        </span>
                        <span>
                          <span className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                            <Icon className="w-4 h-4 text-[#0077b6]" /> {f.label}
                          </span>
                          <span className="text-xs text-gray-500 mt-1 block">{f.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {keyError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl mb-4">
                    {keyError}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-2 bg-[#0077b6] hover:bg-[#005a8d] disabled:bg-[#0077b6]/60 text-white text-sm font-bold px-6 min-h-12 rounded-lg transition-colors"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound size={16} />}
                  {generating ? 'Generating...' : 'Generate API Key'}
                </button>

                {generatedKey && (
                  <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-amber-700 mb-2">Your API key</p>
                    <div className="relative bg-slate-900 rounded-lg p-3 pr-12">
                      <code className="text-sm text-green-300 font-mono break-all">{generatedKey.api_key}</code>
                      <CopyButton text={generatedKey.api_key} />
                    </div>
                    <p className="text-xs text-amber-600 mt-2 flex items-start gap-1.5">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      <span>
                        {generatedKey.warning}
                        {generatedKey.features?.length ? ` Features: ${generatedKey.features.join(', ')}.` : ''}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* ── RATE LIMITS ──────────────────────────────────────── */}
          <Card id="rate-limits" title="Rate limits & plans">
            <p className="text-gray-600 leading-relaxed mb-5">
              Two limits apply to every key: a request rate, and a call quota.
              The free plan's quota is a <strong>lifetime</strong> total, not a daily
              one — 100 calls to build and test an integration.
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200 mb-6">
              <table className="w-full text-sm min-w-[540px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Quota</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Rate</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Suited to</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANS.map(([plan, quota, rate, who]) => (
                    <tr key={plan} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 font-bold text-[#002244]">{plan}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{quota}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{rate}</td>
                      <td className="px-4 py-3 text-gray-500">{who}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="font-bold text-[#002244] mb-2">Response headers</h4>
            <p className="text-sm text-gray-600 mb-3">Every authenticated response tells you where you stand:</p>
            <CodeBlock>{`X-RateLimit-Limit:      5000      # your plan's quota
X-RateLimit-Remaining:  4873      # calls left
X-RateLimit-Plan:       starter   # plan on this key`}</CodeBlock>
            <p className="text-sm text-gray-600 mt-3">
              Exceeding either limit returns <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">429</code>.
              Back off and retry rather than looping — repeated 429s do not reset the window.
            </p>
          </Card>

          {/* ── TRIP PLANNER ─────────────────────────────────────── */}
          <Card id="trip-planner" badge="Endpoint" title="Trip Planner">
            <Endpoint path={`${V1}/trips/plan/`} />
            <p className="text-gray-600 leading-relaxed mb-5">
              Scores every day between two dates for one city, so you can tell a traveller
              which days are worth going out and what to do on each. Beyond the forecast
              window the API falls back to a seasonal estimate built from 20 years of
              records — <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">data_source</code> tells
              you which you received.
            </p>

            <h4 className="font-bold text-[#002244] mb-3">Query parameters</h4>
            <ParamTable params={TRIP_PARAMS} />

            <h4 className="font-bold text-[#002244] mt-6 mb-3">Example request</h4>
            <CodeTabs samples={{ curl: CODE.curl, javascript: CODE.js, python: CODE.python }} />

            <h4 className="font-bold text-[#002244] mt-6 mb-3">Example response</h4>
            <CodeBlock>{`{
  "success": true,
  "data": {
    "city": "Barcelona",
    "country": "Spain",
    "start_date": "2026-08-03",
    "end_date": "2026-08-06",
    "data_source": "forecast",
    "overall_score": 7.8,
    "best_day": "2026-08-05",
    "worst_day": "2026-08-06",
    "days": [
      {
        "date": "2026-08-03",
        "score": 8.5,
        "weather_code": 0,
        "temp_max": 28.4,
        "temp_min": 19.1,
        "rain_probability": 5,
        "wind_kmh": 12.0,
        "recommended_activity": "beach_water",
        "day_parts": {
          "morning":   { "temp": 21.3, "rain_probability": 2,  "wind_kmh": 8.1 },
          "afternoon": { "temp": 28.4, "rain_probability": 5,  "wind_kmh": 12.0 },
          "evening":   { "temp": 24.0, "rain_probability": 3,  "wind_kmh": 9.4 }
        }
      }
    ],
    "packing_suggestions": [
      { "item": "SPF 50 Sunscreen", "reason": "Strong sun on 3 of 4 days" }
    ]
  }
}`}</CodeBlock>

            <h4 className="font-bold text-[#002244] mt-6 mb-3">Response fields</h4>
            <FieldTable rows={TRIP_FIELDS} />
          </Card>

          {/* ── EVENT RISK ───────────────────────────────────────── */}
          <Card id="event-risk" badge="Endpoint" title="Event Risk Score">
            <Endpoint path={`${V1}/events/risk/`} />
            <p className="text-gray-600 leading-relaxed mb-5">
              Rates how risky the weather is for an outdoor event. A wedding and a
              marathon are not troubled by the same conditions, so
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs mx-1">type</code>
              changes how rain, wind, heat and humidity are weighted.
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {[['low', '0–3', 'bg-emerald-50 text-emerald-700'],
                ['moderate', '3–6', 'bg-amber-50 text-amber-700'],
                ['high', '6–10', 'bg-rose-50 text-rose-700']].map(([lvl, range, cls]) => (
                <span key={lvl} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${cls}`}>
                  {lvl} · {range}
                </span>
              ))}
            </div>

            <h4 className="font-bold text-[#002244] mb-3">Query parameters</h4>
            <ParamTable params={EVENT_PARAMS} />

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 my-6">
              <p className="text-sm text-blue-900">
                <strong>Omit <code className="bg-white px-1 rounded">time</code> for planning.</strong> Without
                it you also get <code className="bg-white px-1 rounded">best_window</code> (the calmest stretch
                of that day) and <code className="bg-white px-1 rounded">hourly_breakdown</code> from 06:00 to 22:00 —
                enough to render a timeline and let the user pick an hour.
              </p>
            </div>

            <h4 className="font-bold text-[#002244] mb-3">Example request</h4>
            <CodeBlock>{CODE.event}</CodeBlock>

            <h4 className="font-bold text-[#002244] mt-6 mb-3">Example response</h4>
            <CodeBlock>{`{
  "success": true,
  "data": {
    "city": "London",
    "country": "United Kingdom",
    "event_type": "wedding",
    "event_date": "2026-08-15",
    "event_time": "18:00",
    "risk_score": 3.2,
    "risk_level": "low",
    "weather_code": 2,
    "rain_probability": 15,
    "wind_kmh": 12.0,
    "temperature_c": 21.5,
    "humidity_pct": 62,
    "recommendation": "Conditions look good — an outdoor ceremony should be fine.",
    "alternate_dates": [
      {
        "date": "2026-08-16",
        "risk_score": 2.1,
        "rain_probability": 8,
        "wind_kmh": 9.0,
        "temperature_c": 22.8,
        "weather_code": 0
      }
    ]
  }
}`}</CodeBlock>

            <h4 className="font-bold text-[#002244] mt-6 mb-3">Response fields</h4>
            <FieldTable rows={EVENT_FIELDS} />
          </Card>

          {/* ── ERRORS ───────────────────────────────────────────── */}
          <Card id="errors" title="Errors">
            <p className="text-gray-600 leading-relaxed mb-5">
              Errors carry a human-readable <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">error</code> and,
              where it helps, a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">detail</code> you
              can show a user. Branch on the status code and on
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs mx-1">code</code> where present — never on message text, which may be reworded.
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200 mb-6">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Meaning</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">What to do</th>
                  </tr>
                </thead>
                <tbody>
                  {ERRORS.map(([code, meaning, what], i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 align-top">
                        <code className={`px-2 py-0.5 rounded text-xs font-bold ${
                          code.startsWith('4') ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>{code}</code>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#002244] align-top">{meaning}</td>
                      <td className="px-4 py-3 text-gray-600 align-top">{what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="font-bold text-[#002244] mb-3">Country sent instead of a city</h4>
            <p className="text-sm text-gray-600 mb-3">
              Weather is not uniform across a country, so a single score for one would be
              misleading. We refuse it and hand you cities to offer the user instead:
            </p>
            <CodeBlock>{`{
  "error": "Please enter a city, not a country",
  "detail": "Pakistan is a country, not a city — and weather is different in
             every city within it, so a single score would be misleading.",
  "kind": "country",
  "place": "Pakistan",
  "suggestions": [
    { "name": "Karachi",   "slug": "karachi",   "country": "Pakistan" },
    { "name": "Lahore",    "slug": "lahore",    "country": "Pakistan" },
    { "name": "Islamabad", "slug": "islamabad", "country": "Pakistan" }
  ]
}`}</CodeBlock>
          </Card>

          {/* ── BEST PRACTICES ───────────────────────────────────── */}
          <Card id="best-practices" title="Best practices">
            <div className="space-y-5">
              {[
                {
                  icon: Gauge,
                  t: 'Cache on your side, and match the model clock',
                  d: 'Forecasts are regenerated when a weather model finishes a run — roughly hourly for the USA, Canada, the UK and France, every 3 hours across the rest of Europe and Japan, and every 6 hours elsewhere. Calling more often than that returns the same numbers and spends your quota for nothing.',
                },
                {
                  icon: ShieldCheck,
                  t: 'Keep keys server-side',
                  d: 'Call the API from your backend and pass the result to your front end. A key shipped in browser JavaScript is a key anyone can copy. Use a separate key per environment so revoking one is cheap.',
                },
                {
                  icon: Terminal,
                  t: 'Handle 503 with backoff, not a retry loop',
                  d: 'A 503 means the upstream weather service did not answer. Retry once after a few seconds, then give up and show the user the last value you had. Tight retry loops turn a brief outage into a quota problem.',
                },
                {
                  icon: Cloud,
                  t: 'Read weather_code, not just the numbers',
                  d: 'Temperature alone does not tell a user what the day looks like. weather_code is the WMO code for the actual condition — map it to your own icons so rain shows rain and snow shows snow.',
                },
                {
                  icon: Globe,
                  t: 'Send city names, resolve ambiguity yourself',
                  d: 'We resolve names to real populated places and reject countries and regions. When you get a suggestions array, show it — it turns a dead end into one tap for your user.',
                },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex gap-4">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#0077b6]" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#002244] mb-1">{t}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Also available: an OpenAPI schema at{' '}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs break-all">{API_DOC_BASE}/schema/</code>{' '}
                and interactive docs at{' '}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs break-all">{API_DOC_BASE}/docs/</code>.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ApiDocs;
