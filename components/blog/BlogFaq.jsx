// ─────────────────────────────────────────────────────────────
//  Blog FAQ accordion (blog editor round 2). <details>/<summary>: sawal par
//  tap → jawab neeche khulta hai; jawab HTML mein hamesha maujood (SEO),
//  koi JS nahi. Jawab saada text — nayi line wahi rehti hai (pre-line).
//  FAQPage JSON-LD page.js mein (isi data se).
// ─────────────────────────────────────────────────────────────
import { ChevronDown } from 'lucide-react';

export default function BlogFaq({ faqs }) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <section aria-labelledby="blog-faq-heading" className="mt-10 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
      <h2 id="blog-faq-heading" className="text-lg font-extrabold text-[#002244] mb-2">
        Frequently asked questions
      </h2>
      <div className="divide-y divide-gray-100">
        {faqs.map((f, i) => (
          <details key={i} className="blog-details group">
            <summary className="flex items-center justify-between gap-4 min-h-12 py-3 cursor-pointer list-none font-bold text-[#002244] hover:text-[#0077b6] transition-colors">
              <span>{f.question}</span>
              <ChevronDown className="w-5 h-5 shrink-0 text-[#0077b6] transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="pb-4 text-gray-600 leading-relaxed whitespace-pre-line">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
