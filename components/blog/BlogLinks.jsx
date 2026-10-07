// ─────────────────────────────────────────────────────────────
//  "Further reading" (apni site ke links) + "Sources" (bahar ke links)
//  — blog editor round 2. Khaali ho to kuch nahi.
//  Sources: naya tab + admin mein chuna hua rel ("nofollow noopener" ya
//  trusted ke liye sirf "noopener").
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import { ArrowRight, BookOpen, ExternalLink } from 'lucide-react';

export function FurtherReading({ links }) {
  if (!links || links.length === 0) return null;
  return (
    <aside aria-labelledby="further-reading-heading" className="mt-10 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
      <h2 id="further-reading-heading" className="flex items-center gap-2 text-lg font-extrabold text-[#002244] mb-4">
        <BookOpen className="w-5 h-5 text-[#0077b6]" aria-hidden="true" />
        Further reading
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((l, i) => (
          <li key={`${l.url}-${i}`}>
            <Link
              href={l.url}
              className="flex items-center justify-between gap-2 min-h-12 rounded-2xl bg-[#f3f7ff] px-4 py-3 text-sm font-semibold text-[#0077b6] hover:underline"
            >
              {l.text}
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function Sources({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <section aria-labelledby="sources-heading" className="mt-6 px-1">
      <h2 id="sources-heading" className="text-sm font-extrabold text-[#002244] uppercase tracking-wider mb-2">
        Sources
      </h2>
      <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
        {sources.map((s, i) => (
          <li key={`${s.url}-${i}`}>
            <a
              href={s.url}
              target="_blank"
              rel={s.rel || 'nofollow noopener'}
              className="inline-flex items-center gap-1 font-semibold text-[#0077b6] hover:underline"
            >
              {s.name}
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
