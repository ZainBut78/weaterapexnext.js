// ─────────────────────────────────────────────────────────────
//  Blog post ka HTML (backend se — nh3 allowlist se saaf aata hai) server
//  par tayyar karna (blog editor round 2):
//   • har <h2> ko id → Table of contents ke anchor links
//   • <table> ko scroll wrapper mein → mobile par horizontal scroll
//   • <img> lazy + async decode (width/height backend deta hai → CLS nahi)
//   • target="_blank" link par rel mein noopener zaroor
//  Sab regex se — backend ka HTML ek hi andaz ka hota hai (sanitizer), koi
//  browser DOM nahi chahiye, page server par hi banta hai.
// ─────────────────────────────────────────────────────────────

const decode = (s) =>
  s.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const textOf = (html) => decode(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';

/** HTML → { html, toc: [{ id, text }] } */
export function prepareBlogHtml(raw) {
  if (!raw) return { html: '', toc: [] };
  const used = new Set();
  const toc = [];

  let html = raw.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (m, attrs = '', inner) => {
    const text = textOf(inner);
    if (!text) return m;
    let id = slugify(text);
    for (let n = 2; used.has(id); n++) id = `${slugify(text)}-${n}`;
    used.add(id);
    toc.push({ id, text });
    const rest = (attrs || '').replace(/\sid="[^"]*"/i, '');
    return `<h2 id="${id}"${rest}>${inner}</h2>`;
  });

  // Table → scroll box (keyboard se bhi scroll: tabindex + label)
  html = html.replace(/<table\b[\s\S]*?<\/table>/gi,
    (t) => `<div class="table-scroll" role="region" aria-label="Data table" tabindex="0">${t}</div>`);

  html = html.replace(/<img\b([^>]*?)\s*\/?>/gi, (m, attrs) => {
    let a = attrs;
    if (!/\sloading=/i.test(a)) a += ' loading="lazy"';
    if (!/\sdecoding=/i.test(a)) a += ' decoding="async"';
    return `<img${a}>`;
  });

  html = html.replace(/<a\b([^>]*\starget="_blank"[^>]*)>/gi, (m, attrs) => {
    if (/\srel="/i.test(attrs)) {
      return `<a${attrs.replace(/\srel="([^"]*)"/i, (r, v) => (/\bnoopener\b/.test(v) ? r : ` rel="${`${v} noopener`.trim()}"`))}>`;
    }
    return `<a${attrs} rel="noopener">`;
  });

  return { html, toc };
}
