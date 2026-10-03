// Pexels URL ka size badalna — Pexels `w`/`h` query se khud resize karta
// hai. Pure function (server + browser dono jagah). Pexels ke ilawa URL
// waisa hi.
// ratio: height ÷ width (hero 16:9 = 0.5625; Climate Guides card 0.72)
export function pexelsSized(url, width, ratio = 0.5625) {
  try {
    const u = new URL(url);
    if (!/pexels\.com$/.test(u.hostname)) return url;
    u.searchParams.set('auto', 'compress');
    u.searchParams.set('cs', 'tinysrgb');
    u.searchParams.set('fit', 'crop');
    u.searchParams.set('w', String(width));
    u.searchParams.set('h', String(Math.round(width * ratio)));
    return u.toString();
  } catch {
    return url;
  }
}

export const pexelsSrcSet = (url, widths = [640, 960, 1280, 1920], ratio = 0.5625) =>
  widths.map((w) => `${pexelsSized(url, w, ratio)} ${w}w`).join(', ');
