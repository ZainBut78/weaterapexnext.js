// Widget ki iframe heights aur HTML escape (Nov 2026). Chhoti file: client copy box bhi yahi
// import karta hai, poora widget builder (utils/embedWidget.js) browser bundle mein nahi jata.
export const MONTH_HEIGHT = 420;
// Naapi hui unchai (300px aur 1000px par 14 shehar × 6 zabanein) + thora margin. Copy code yahi deta hai.
export const YEAR_HEIGHT = 360;
export const MONTH_SLUGS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// "{city} weather in {month}" → "Tokyo weather in December" (utils/embedCodeText)
export const fillTitle = (tpl, city, month = '') => tpl.replace('{city}', () => city).replace('{month}', () => month);
// Bloggers ki landing page (Step 3): path aur us ke content ki asal tareekh (sitemap lastmod)
export const WIDGET_PAGE = '/weather-widget';
export const WIDGET_PAGE_DATE = '2026-11-17';
