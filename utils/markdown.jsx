// ─────────────────────────────────────────────────────────────
//  Chhota Markdown → React (travel notes ke liye) — koi library NAHI
//  (owner ne library ke baghair kaha). Sirf yeh samajhta hai:
//    # / ## / ### heading, khaali line se paragraph, "- " / "* " list,
//    "1. " list, **bold**, *italic*, [text](https://… ya /path)
//  HTML (dangerouslySetInnerHTML) kabhi nahi — sab React elements, is
//  liye file mein likha koi <script> bhi sirf text ban kar dikhega.
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';

function inline(text, keyBase) {
  const out = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0; let m; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyBase}-${i++}`;
    if (m[1] != null) out.push(<strong key={k}>{m[1]}</strong>);
    else if (m[2] != null) out.push(<em key={k}>{m[2]}</em>);
    else {
      const href = m[4];
      if (href.startsWith('/')) out.push(<Link key={k} href={href} className="text-[#0077b6] font-semibold hover:underline">{m[3]}</Link>);
      else if (/^https?:\/\//.test(href)) out.push(<a key={k} href={href} rel="noopener noreferrer" target="_blank" className="text-[#0077b6] font-semibold hover:underline">{m[3]}</a>);
      else out.push(m[3]); // ajeeb link (javascript: wagera) → sirf text
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdown(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let para = []; let list = null;
  const flushPara = () => { if (para.length) { blocks.push({ t: 'p', text: para.join(' ') }); para = []; } };
  const flushList = () => { if (list) { blocks.push(list); list = null; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    if (line.startsWith('<!--')) continue; // comment lines
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { flushPara(); flushList(); blocks.push({ t: 'h', level: h[1].length, text: h[2] }); continue; }
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const kind = ul ? 'ul' : 'ol';
      if (!list || list.t !== kind) { flushList(); list = { t: kind, items: [] }; }
      list.items.push((ul || ol)[1]);
      continue;
    }
    flushList(); para.push(line);
  }
  flushPara(); flushList();

  // Page par H1/H2 pehle se hain — note ki headings H3/H4 ban jati hain
  return blocks.map((b, i) => {
    if (b.t === 'h') return b.level <= 2
      ? <h3 key={i} className="text-lg font-bold text-[#002244] mt-5 mb-2">{inline(b.text, i)}</h3>
      : <h4 key={i} className="font-bold text-[#002244] mt-4 mb-1.5">{inline(b.text, i)}</h4>;
    if (b.t === 'ul') return <ul key={i} className="list-disc pl-5 space-y-1 my-3">{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</ul>;
    if (b.t === 'ol') return <ol key={i} className="list-decimal pl-5 space-y-1 my-3">{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</ol>;
    return <p key={i} className="my-3">{inline(b.text, i)}</p>;
  });
}
