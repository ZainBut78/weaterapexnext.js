// ─────────────────────────────────────────────────────────────
//  Blog post ka "On this page" (blog editor round 2) — content ke H2 se.
//  Mobile: <details> (band, tap se khule). Desktop: hamesha khula.
//  Server component — links HTML mein hi (JS ki zaroorat nahi).
// ─────────────────────────────────────────────────────────────
import { ChevronDown } from 'lucide-react';

export default function BlogToc({ items }) {
  if (!items || items.length < 2) return null;   // 1 heading ka TOC bekaar

  const list = (
    <ol className="space-y-2 text-sm list-decimal pl-5 marker:text-[#0077b6] marker:font-bold">
      {items.map((it) => (
        <li key={it.id}>
          <a href={`#${it.id}`} className="font-semibold text-[#0077b6] hover:underline">
            {it.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <nav aria-label="Table of contents" className="mb-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
      <details className="blog-details group lg:hidden">
        <summary className="flex items-center justify-between gap-3 min-h-12 px-5 cursor-pointer list-none font-extrabold text-[#002244]">
          On this page
          <ChevronDown className="w-5 h-5 text-[#0077b6] transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="px-5 pb-5">{list}</div>
      </details>
      <div className="hidden lg:block p-6">
        <p className="font-extrabold text-[#002244] mb-3">On this page</p>
        {list}
      </div>
    </nav>
  );
}
