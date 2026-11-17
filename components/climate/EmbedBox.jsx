'use client';

// ─────────────────────────────────────────────────────────────
//  "Use this data on your site" (Nov 2026): options, preview aur copy code. Code wahi pure
//  function banata hai jo server par bhi chalta hai (utils/embedCode.js), is liye pehla
//  render (server HTML) aur browser ek jaisa.
//  - Server HTML mein /embed/ ka koi href/src nahi: code sirf text (<pre><code>), preview
//    iframe "Show preview" dabane par hi banta hai.
//  - Bundle mein kisi zaban ka text nahi: page ki zaban ka text server prop mein deta hai,
//    doosri zaban chunne par woh zaban dynamic import (utils/embedCodeText/<lang>.js).
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { embedCode, embedPaths, monthName } from '@/utils/embedCode';
import { MONTH_HEIGHT, YEAR_HEIGHT } from '@/utils/embedConst';

const LANG_NAMES = { en: 'English', de: 'Deutsch', it: 'Italiano', ja: '日本語', fr: 'Français', es: 'Español' };
const LOADERS = {
  en: () => import('@/utils/embedCodeText/en'),
  de: () => import('@/utils/embedCodeText/de'),
  it: () => import('@/utils/embedCodeText/it'),
  ja: () => import('@/utils/embedCodeText/ja'),
  fr: () => import('@/utils/embedCodeText/fr'),
  es: () => import('@/utils/embedCodeText/es'),
};

/**
 * @param p.names     { en: 'Tokyo', ja: '東京', … } shehar ka naam har zaban mein
 * @param p.monthNum  is page ka mahina (month page) ya null (city page)
 * @param p.text      utils/embedBoxText.js (page ki zaban)
 * @param p.codeText  utils/embedCodeText/<lang>.js (page ki zaban)
 */
export default function EmbedBox({ lang, countrySlug, citySlug, names, monthNum = null, text, codeText }) {
  const [scope, setScope] = useState(monthNum ? String(monthNum) : 'year');
  const [codeLang, setCodeLang] = useState(lang);
  const [texts, setTexts] = useState({ [lang]: codeText });
  const [theme, setTheme] = useState('light');
  const [trip, setTrip] = useState(false);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const month = scope === 'year' ? null : Number(scope);
  const code = embedCode({ lang: codeLang, countrySlug, citySlug, cityName: names[codeLang] || names.en, monthNum: month, theme, trip, text: texts[codeLang] });
  // Preview apni hi site se (relative), code mein poora weatherapex.com URL
  const previewSrc = `${embedPaths({ lang: codeLang, countrySlug, citySlug, monthNum: month }).widget}${theme === 'dark' ? '?theme=dark' : ''}`;
  const codeId = `embed-code-${citySlug}`;

  const pickLang = async (next) => {
    if (!texts[next]) {
      try {
        const mod = await LOADERS[next]();
        setTexts((t) => ({ ...t, [next]: mod.default }));
      } catch {
        return; // chunk na mila (offline): pehli zaban hi rehti hai
      }
    }
    setCodeLang(next);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const box = document.getElementById(codeId);
      if (box) {
        const range = document.createRange();
        range.selectNodeContents(box);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand?.('copy');
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const select = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm';
  const button = 'inline-flex min-h-10 items-center rounded-full px-5 text-sm font-semibold';
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">{text.widget}
            <select className={select} value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="year">{text.year}</option>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{monthName(lang, i + 1)}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">{text.language}
            <select className={select} value={codeLang} onChange={(e) => pickLang(e.target.value)}>
              {Object.entries(LANG_NAMES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">{text.theme}
            <select className={select} value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">{text.light}</option>
              <option value="dark">{text.dark}</option>
            </select>
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={trip} onChange={(e) => setTrip(e.target.checked)} /> {text.trip}
        </label>
        <p className="mt-4 text-sm font-medium text-slate-700" id={`${codeId}-label`}>{text.code}</p>
        <pre aria-labelledby={`${codeId}-label`} className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-800"><code id={codeId}>{code}</code></pre>
        <button type="button" onClick={copy} className={`mt-2 ${button} bg-[#0077b6] text-white hover:bg-[#00629a]`}>
          {copied ? text.copied : text.copy}
        </button>
        <p className="mt-2 text-xs text-slate-500">{text.note}</p>
      </div>
      <div>
        <button type="button" aria-expanded={preview} onClick={() => setPreview((v) => !v)} className={`${button} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}>
          {preview ? text.hidePreview : text.showPreview}
        </button>
        {preview && (
          <iframe key={previewSrc} src={previewSrc} title={text.preview} width="100%" height={month ? MONTH_HEIGHT : YEAR_HEIGHT} loading="lazy" className="mt-2 w-full rounded-lg border border-slate-200" style={{ maxWidth: 520 }} />
        )}
      </div>
    </div>
  );
}
