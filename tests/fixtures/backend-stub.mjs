// Local only: Next aur local Django ke beech proxy, outage aur data badlao simulate karne ke liye.
// Sirf 127.0.0.1:8000 ko forward karta hai. Live site ya Open-Meteo se koi talluq nahi.
//   POST /__set {"mode":"ok|down|slow|500","delayMs":4000,"dropSummarySlugs":["baku"],"historyBump":{"slug":3}}
//   GET  /__stats  → kitni requests aayin
import http from 'node:http';

const state = { mode: 'ok', delayMs: 4000, dropSummarySlugs: [], historyBump: {} };
let hits = 0;

function forward(req, res, transform) {
  const up = http.request({ host: '127.0.0.1', port: 8000, path: req.url, method: req.method, headers: { ...req.headers, host: '127.0.0.1:8000', 'accept-encoding': 'identity' } }, (r) => {
    const chunks = [];
    r.on('data', (c) => chunks.push(c));
    r.on('end', () => {
      let body = Buffer.concat(chunks);
      if (transform && r.statusCode === 200) body = Buffer.from(JSON.stringify(transform(JSON.parse(body.toString()))));
      const headers = { ...r.headers, 'content-length': body.length };
      res.writeHead(r.statusCode, headers);
      res.end(body);
    });
  });
  up.on('error', () => { res.writeHead(502); res.end(); });
  req.pipe(up);
}

http.createServer((req, res) => {
  if (req.url === '/__stats') { res.end(JSON.stringify({ hits, ...state })); return; }
  if (req.url === '/__set') {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => { Object.assign(state, JSON.parse(b || '{}')); hits = 0; res.end(JSON.stringify(state)); });
    return;
  }
  hits += 1;
  if (state.failMatch && req.url.match(state.failMatch)) { res.writeHead(500); res.end('{}'); return; }
  if (state.mode === 'down') { req.socket.destroy(); return; }
  if (state.mode === '500') { res.writeHead(500, { 'content-type': 'application/json' }); res.end('{"error":"stub 500"}'); return; }
  const go = () => {
    const u = new URL(req.url, 'http://x');
    let transform = null;
    if (u.pathname.includes('/climate/summary/') && state.dropSummarySlugs.length) {
      transform = (d) => ({ ...d, cities: d.cities.filter((c) => !state.dropSummarySlugs.includes(c.slug)) });
    } else if (u.pathname.endsWith('/weather/history/') && state.historyBump[u.searchParams.get('city')]) {
      const add = state.historyBump[u.searchParams.get('city')];
      transform = (d) => ({ ...d, monthly_data: d.monthly_data.map((r) => ({ ...r, avg_high: r.avg_high + add })) });
    }
    forward(req, res, transform);
  };
  if (state.mode === 'slow') setTimeout(go, state.delayMs); else go();
}).listen(8100, '127.0.0.1', () => console.log('stub on 8100'));
