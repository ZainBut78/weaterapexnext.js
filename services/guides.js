// ─────────────────────────────────────────────────────────────
//  Haath se likhe "Travel notes" (Phase C2 §2.2.8)
//  content/guides/<city-slug>/<month>.md ho to month page par dikhta hai;
//  na ho to kuch nahi. Server par fs se parha jata hai (browser ko sirf
//  bana hua HTML). Naya note: file banayein, build/revalidate par aa jata hai.
//  "## Sources to check" (owner ke verify karne ke links) file mein rehta
//  hai magar page par NAHI dikhta — wahan se aakhir tak kaat diya jata hai.
//  Drafts (content/guides-drafts/) kabhi nahi parhe jate.
// ─────────────────────────────────────────────────────────────
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SAFE = /^[a-z0-9-]+$/;

export async function getTravelNote(citySlug, monthSlug) {
  if (!SAFE.test(citySlug) || !SAFE.test(monthSlug)) return null; // path traversal nahi
  try {
    const md = await readFile(join(process.cwd(), 'content', 'guides', citySlug, `${monthSlug}.md`), 'utf8');
    return md.replace(/^##\s+Sources to check[\s\S]*$/m, '').trim() || null;
  } catch {
    return null;
  }
}
