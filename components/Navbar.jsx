'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import NavLink from './NavLink';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useCity } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import CitySearchBox from './CitySearchBox';
import { isKnownCity } from '@/data/cities';
import { exactCity } from '@/utils/fuzzyCity';

const Navbar = () => {
  const { setCity } = useCity();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/trip-planner', label: 'Trip Planner' },
    { to: '/events', label: 'Events' },
    { to: '/climate-guides', label: 'Climate Guides' },
    { to: '/blog', label: 'Blog' },
    { to: '/api-docs', label: 'API Docs' },
  ];

  // Route badalne par mobile menu khud band ho jaye
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Menu khula ho to background scroll na ho
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Search (UX fixes, owner ka faisla):
  //  • Home par — pehle jaisa: city set, weather card wahi badal jata hai.
  //  • Kisi aur page par — shehar hamari 160 ki list mein ho to seedha
  //    us ka city page; warna city set kar ke home par (pehle yahan sirf
  //    city set hoti thi aur screen par kuch nahi hota tha).
  const handleSearch = (text, item) => {
    const name = item?.name || text;
    setMenuOpen(false);
    if (pathname === '/') {
      setCity(name.toLowerCase());
      return;
    }
    const known = item && isKnownCity(item.slug) ? item : exactCity(name);
    if (known) {
      router.push(`/weather/${known.slug}`);
    } else {
      setCity(name.toLowerCase());
      router.push('/');
    }
  };

  return (
    <header className="w-full font-sans border-b border-gray-200 bg-white">
      {/* Top Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between gap-2 lg:gap-4">

        {/* Logo Section */}
        <NavLink to="/" className="flex items-center gap-2 cursor-pointer select-none shrink-0">
          <div className="relative flex items-center justify-center">
            <svg
              className="w-8 h-8 lg:w-9 lg:h-9 text-[#0077b6]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.5 19.125A5.5 5.5 0 0 0 19 8.5a7 7 0 0 0-13.187 2.086A4.5 4.5 0 0 0 5.5 19.5h12" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>
          <span className="text-xl lg:text-2xl font-bold text-[#0077b6] tracking-tight">
            WeatherApex
          </span>
        </NavLink>

        {/* Center Search Bar — desktop. min-w-0 zaroori hai warna flex-1
            input ko apni min-content width se chhota nahi hone deta aur
            poora navbar viewport se bahar chala jata hai. */}
        <div className="hidden lg:block flex-1 min-w-0 max-w-xl mx-4">
          <CitySearchBox
            onSubmit={handleSearch}
            inputClassName="w-full pl-11 pr-4 py-3 bg-[#f0f5ff] text-gray-700 placeholder-gray-400 text-sm rounded-full border border-[#d6e4ff] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
          />
        </div>

        {/* Right Auth Buttons — desktop */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4" />
                <span>{user}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm font-semibold text-white bg-[#00a8e8] hover:bg-[#0092cd] px-6 py-2.5 rounded-full transition-colors shadow-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — sirf mobile/tablet */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="lg:hidden shrink-0 inline-flex items-center justify-center w-11 h-11 -mr-1 rounded-lg text-[#0077b6] hover:bg-[#f0f5ff] transition-colors"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile/tablet search — hamesha nazar aaye, menu kholne ki zaroorat
          nahi (UX fixes A). Server HTML mein hi hai → layout shift nahi.
          text-base (16px) — iOS chhote font par zoom kar deta hai. */}
      <div className="lg:hidden px-4 pb-3">
        <CitySearchBox
          onSubmit={handleSearch}
          inputClassName="w-full min-w-0 pl-11 pr-4 h-12 bg-[#f0f5ff] text-gray-700 placeholder-gray-400 text-base rounded-full border border-[#d6e4ff] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
        />
      </div>

      {/* Mobile menu — nav links + auth (search ab upar, hamesha khula) */}
      {menuOpen && (
        <div id="mobile-menu" className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-4">
            {/* Nav links */}
            <nav className="flex flex-col">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center min-h-12 px-2 rounded-lg text-base font-semibold transition-colors ${
                      isActive ? 'text-[#0077b6] bg-[#f0f5ff]' : 'text-[#4a607a] hover:bg-gray-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Auth */}
            <div className="pt-2 border-t border-gray-100">
              {user ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 min-w-0">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="truncate">{user}</span>
                  </div>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="flex items-center justify-center gap-1.5 min-h-11 px-4 text-sm font-semibold text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 inline-flex items-center justify-center min-h-12 rounded-full border border-[#d6e4ff] text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 inline-flex items-center justify-center min-h-12 rounded-full text-sm font-semibold text-white bg-[#00a8e8] hover:bg-[#0092cd] transition-colors shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub Navbar — desktop pe bilkul pehle jaisa; mobile pe links
          hamburger menu mein chale gaye hain, is liye yahan hide hai. */}
      <div className="hidden lg:block bg-[#f3f7ff] border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center items-center min-h-12 gap-x-8 gap-y-1 py-1 text-sm font-semibold text-gray-600">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `relative py-3 transition-colors hover:text-[#0077b6] ${
                  isActive ? 'text-[#0077b6]' : 'text-[#4a607a]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#0077b6] rounded-t-md" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
