// /embed/<country>/<city>/<month> — mahine ka widget (Nov 2026). Bloggers iframe mein lagate hain.
// noindex, sitemap mein nahi, framing ki ijazat (services/embedData.js). ?theme=light|dark
import { embedResponse } from '@/services/embedData';

export async function GET(request, { params }) {
  return embedResponse(request, await params);
}
