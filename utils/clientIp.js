// ─────────────────────────────────────────────────────────────
//  Asal client IP — SIRF server (route handlers). Security fix round 3, Oct 2026.
//
//  Masla (security report #9): /api/places/open per-IP hadd X-Forwarded-For
//  ki PEHLI value leti thi — yeh client khud likh sakta hai, har request mein
//  nayi jhooti IP = hadd khatam. Proxy asal IP list ke AAKHIR mein jodte hain.
//
//  CLIENT_IP_SOURCE (server env, Hostinger) — live par default sahi nikla
//  (Oct 2026), is liye set NAHI. Hosting badle to:
//    (khaali / "xff-right-public")  XFF mein daayen se pehli PUBLIC IP (Hostinger
//                                  ke andar ke private proxy hops chhor kar) — default
//    "xff-right:N"                 daayen se N-wi value (N proxies bharosemand)
//    "header:<naam>"               kisi header se seedha (jaise header:x-real-ip)
//  Kuch na mile → 'unknown' (sab ek hi bucket — hadd kabhi bypass nahi).
// ─────────────────────────────────────────────────────────────

const PRIVATE = [
  /^10\./, /^127\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,          // CGNAT 100.64/10
  /^::1$/, /^f[cd][0-9a-f]{2}:/i, /^fe80:/i, /^::ffff:(10|127|192\.168)\./i,
];

export const isPrivateIp = (ip) => PRIVATE.some((rx) => rx.test(ip));

// "1.2.3.4:5678" → "1.2.3.4" · "[2001:db8::1]:443" → "2001:db8::1"
function clean(v) {
  let s = (v || '').trim();
  if (s.startsWith('[')) return s.slice(1, s.indexOf(']'));
  if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(s)) s = s.split(':')[0];
  return s;
}

export function xffList(headers) {
  return (headers.get('x-forwarded-for') || '').split(',').map(clean).filter(Boolean);
}

/** Har tareeqe se kaunsi IP banti hai — debug route ke liye. */
export function ipCandidates(headers) {
  const xff = xffList(headers);
  const rightPublic = [...xff].reverse().find((ip) => !isPrivateIp(ip)) || null;
  return {
    'xff-right-public': rightPublic,
    'xff-right:1': xff[xff.length - 1] || null,
    'xff-right:2': xff[xff.length - 2] || null,
    'header:x-real-ip': clean(headers.get('x-real-ip')) || null,
    'xff-first (purana, ghalat)': xff[0] || null,
  };
}

export function clientIp(headers, source = process.env.CLIENT_IP_SOURCE || 'xff-right-public') {
  const xff = xffList(headers);
  if (source.startsWith('header:')) return clean(headers.get(source.slice(7))) || 'unknown';
  const m = /^xff-right:(\d+)$/.exec(source);
  if (m) return xff[xff.length - Number(m[1])] || 'unknown';
  return [...xff].reverse().find((ip) => !isPrivateIp(ip)) || xff[xff.length - 1] || 'unknown';
}

/** IP ka aadha hissa chhupa — logs / debug mein poori IP nahi */
export function maskIp(ip) {
  if (!ip) return null;
  if (ip.includes('.')) return ip.split('.').slice(0, 2).concat(['x', 'x']).join('.');
  return `${ip.split(':').slice(0, 2).join(':')}:…`;
}
