// Har ghalat URL (/koi-ghalat-page → andar /en/koi-ghalat-page) — app/[lang]
// root layout ke andar hamara apna 404 (app/[lang]/not-found.js), us zaban
// mein. Bina is ke Next ka saada default 404 aata (app/ root par layout nahi).
import { notFound } from 'next/navigation';

export default function CatchAll() {
  notFound();
}
