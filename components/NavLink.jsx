'use client';

// ─────────────────────────────────────────────────────────────
//  NavLink — react-router ke <NavLink> jaisa, Next.js ke liye.
//
//  Next.js ka apna <Link> hai, magar us mein "active" wala feature
//  nahi (jo menu item khula ho us ko neela karna). Is liye yeh chhota
//  sa wrapper: usePathname() se maujooda URL parhta hai aur batata hai
//  ke yeh link active hai ya nahi.
//
//  Faida: Navbar ka code bilkul purane jaisa rehta hai — sirf
//  `to=` aur import badla. Design par koi asar nahi.
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ to, end = false, className, children, ...rest }) {
  const pathname = usePathname() || '/';

  // `end` = sirf exact match (Home "/" har page par active na ho jaye).
  // Warna "/blog" link "/blog/koi-post" par bhi active rahe.
  const isActive = end
    ? pathname === to
    : pathname === to || pathname.startsWith(`${to}/`);

  const resolvedClass = typeof className === 'function' ? className({ isActive }) : className;
  const resolvedChildren = typeof children === 'function' ? children({ isActive }) : children;

  return (
    <Link href={to} className={resolvedClass} aria-current={isActive ? 'page' : undefined} {...rest}>
      {resolvedChildren}
    </Link>
  );
}
