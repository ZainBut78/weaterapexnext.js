// ─────────────────────────────────────────────────────────────
//  GET /api/places/ip-debug — Hostinger asal client IP kahan deta hai? (security fix round 3)
//
//  Sirf `Authorization: Bearer <REVALIDATE_SECRET>` ke saath — warna 404 (route
//  ka hona bhi na bataye). Jawab mein headers ke SIRF NAAM aur IPs AADHI chhupi
//  (pehle 2 hisse) — values / secrets kabhi nahi. Owner deploy ke baad ek curl
//  chalaye; jis tareeqe ki IP us ki apni IP se mile, wahi CLIENT_IP_SOURCE.
//  Pakka hone ke baad yeh route hata sakte hain.
// ─────────────────────────────────────────────────────────────
import { timingSafeEqual } from 'node:crypto';
import { clientIp, ipCandidates, maskIp, xffList } from '@/utils/clientIp';

export const dynamic = 'force-dynamic';

function authorized(request) {
  const secret = process.env.REVALIDATE_SECRET || '';
  const header = request.headers.get('authorization') || '';
  if (!secret || !header.startsWith('Bearer ')) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function GET(request) {
  if (!authorized(request)) return new Response('Not found', { status: 404 });
  const h = request.headers;
  const candidates = Object.fromEntries(Object.entries(ipCandidates(h)).map(([k, v]) => [k, maskIp(v)]));
  return Response.json({
    header_names: [...h.keys()].sort(),
    xff_hops: xffList(h).length,
    xff_masked: xffList(h).map(maskIp),
    candidates,
    current_source: process.env.CLIENT_IP_SOURCE || 'xff-right-public (default)',
    current_pick: maskIp(clientIp(h)),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
