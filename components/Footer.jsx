'use client';

import React, { useState } from 'react';
import Link from './LocaleLink';
import { Share2, AtSign, Globe } from 'lucide-react';
import BrandLogo from './BrandLogo';
import LanguageSwitcher from './LanguageSwitcher';
import { useT } from '@/i18n/client';

const Footer = () => {
  const [email, setEmail] = useState('');
  const t = useT();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter join
    console.log('Joined newsletter with:', email);
  };

  return (
    <footer className="w-full bg-[#edf4ff] text-[#002244] font-sans pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          
          {/* Brand Info Column */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div>
              {/* Logo */}
              <BrandLogo className="h-24 w-auto mb-4" />

              {/* Tagline / Description */}
              <p className="text-gray-600 text-sm max-w-sm leading-relaxed mb-6">
                {t('footer.tagline')}
              </p>
            </div>

            {/* Social Circle Icons */}
            <div className="flex items-center gap-3">
              <button 
                type="button"
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-white hover:border-gray-400 transition-colors"
                aria-label={t('footer.share')}
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button 
                type="button"
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-white hover:border-gray-400 transition-colors"
                aria-label={t('footer.emailContact')}
              >
                <AtSign className="w-4 h-4" />
              </button>
              <button 
                type="button"
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-white hover:border-gray-400 transition-colors"
                aria-label={t('footer.websiteLink')}
              >
                <Globe className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Links */}
          <div className="md:col-span-2">
            <h2 className="font-extrabold text-sm text-[#002244] mb-4">{t('footer.product')}</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link prefetch={false} href="/" className="hover:text-[#0077b6] transition-colors">{t('footer.localForecasts')}</Link></li>
              <li><Link prefetch={false} href="/climate-guides" className="hover:text-[#0077b6] transition-colors">{t('footer.historicalData')}</Link></li>
              <li><Link prefetch={false} noLocale href="/api-docs" className="hover:text-[#0077b6] transition-colors">{t('footer.apiForDevelopers')}</Link></li>
              <li><Link prefetch={false} href="/" className="hover:text-[#0077b6] transition-colors">{t('footer.radar')}</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="md:col-span-2">
            <h2 className="font-extrabold text-sm text-[#002244] mb-4">{t('footer.company')}</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link prefetch={false} href="/about" className="hover:text-[#0077b6] transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><a href="#" className="hover:text-[#0077b6] transition-colors">{t('footer.careers')}</a></li>
              <li><a href="#" className="hover:text-[#0077b6] transition-colors">{t('footer.scientificBoard')}</a></li>
              <li><a href="#" className="hover:text-[#0077b6] transition-colors">{t('footer.pressRoom')}</a></li>
            </ul>
          </div>

          {/* Stay Informed Newsletter Column */}
          <div className="md:col-span-4">
            <h2 className="font-extrabold text-sm text-[#002244] mb-4">{t('footer.stayInformed')}</h2>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {t('footer.newsletterText')}
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footer.emailPlaceholder')}
                required
                className="w-full px-4 py-2 bg-white rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0077b6]"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-[#005a8d] hover:bg-[#004369] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {t('footer.join')}
              </button>
            </form>
          </div>

        </div>

        {/* Zabanein — sirf jab ek se zyada on hon (warna kuch render nahi) */}
        <LanguageSwitcher variant="footer" />

        {/* Separator Line */}
        <hr className="border-gray-300/60 my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>{t('footer.copyright')}</p>
          <div className="flex items-center gap-6 font-medium">
            <Link prefetch={false} href="/privacy" className="hover:text-[#002244] transition-colors">{t('footer.privacy')}</Link>
            <Link prefetch={false} href="/terms" className="hover:text-[#002244] transition-colors">{t('footer.terms')}</Link>
            <a href="#" className="hover:text-[#002244] transition-colors">{t('footer.cookies')}</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;