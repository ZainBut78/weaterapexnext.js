'use client';

// next/link jaisa — magar andar ke link (/blog, /weather/...) khud maujooda
// zaban ka prefix le lete hain (/de/blog). English par href bilkul wahi.
// Bahar ke links (https://…, mailto:, #) waise hi.
import Link from 'next/link';
import { forwardRef } from 'react';
import { useLocalePath } from '@/i18n/client';

// noLocale: jo page sirf English mein hai (/api-docs) — har zaban se bina prefix
const LocaleLink = forwardRef(function LocaleLink({ href, noLocale = false, ...rest }, ref) {
  const lp = useLocalePath();
  return <Link ref={ref} href={typeof href === 'string' && !noLocale ? lp(href) : href} {...rest} />;
});

export default LocaleLink;
