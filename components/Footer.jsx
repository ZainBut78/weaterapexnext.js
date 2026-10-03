'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Cloud, Share2, AtSign, Globe } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');

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
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#0077b6] flex items-center justify-center text-white">
                  <Cloud className="w-5 h-5 fill-current" />
                </div>
                <span className="text-2xl font-extrabold tracking-tight text-[#002244]">
                  WeatherApex
                </span>
              </div>

              {/* Tagline / Description */}
              <p className="text-gray-600 text-sm max-w-sm leading-relaxed mb-6">
                Redefining meteorological intelligence for a world in constant motion. Precision data, simplified for everyone.
              </p>
            </div>

            {/* Social Circle Icons */}
            <div className="flex items-center gap-3">
              <button 
                type="button"
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-white hover:border-gray-400 transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button 
                type="button"
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-white hover:border-gray-400 transition-colors"
                aria-label="Email Contact"
              >
                <AtSign className="w-4 h-4" />
              </button>
              <button 
                type="button"
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-white hover:border-gray-400 transition-colors"
                aria-label="Website Link"
              >
                <Globe className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Links */}
          <div className="md:col-span-2">
            <h4 className="font-extrabold text-sm text-[#002244] mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link href="/" className="hover:text-[#0077b6] transition-colors">Local Forecasts</Link></li>
              <li><Link href="/climate-guides" className="hover:text-[#0077b6] transition-colors">Historical Data</Link></li>
              <li><Link href="/api-docs" className="hover:text-[#0077b6] transition-colors">API for Developers</Link></li>
              <li><Link href="/" className="hover:text-[#0077b6] transition-colors">Radar Visualization</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="md:col-span-2">
            <h4 className="font-extrabold text-sm text-[#002244] mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><Link href="/about" className="hover:text-[#0077b6] transition-colors">About Us</Link></li>
              <li><a href="#" className="hover:text-[#0077b6] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[#0077b6] transition-colors">Scientific Board</a></li>
              <li><a href="#" className="hover:text-[#0077b6] transition-colors">Press Room</a></li>
            </ul>
          </div>

          {/* Stay Informed Newsletter Column */}
          <div className="md:col-span-4">
            <h4 className="font-extrabold text-sm text-[#002244] mb-4">Stay Informed</h4>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Get localized severe weather alerts directly to your inbox.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full px-4 py-2 bg-white rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0077b6]"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-[#005a8d] hover:bg-[#004369] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        {/* Separator Line */}
        <hr className="border-gray-300/60 my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© 2024 WeatherApex. Precision data for the modern traveler.</p>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/privacy" className="hover:text-[#002244] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#002244] transition-colors">Terms of Service</Link>
            <a href="#" className="hover:text-[#002244] transition-colors">Cookie Settings</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;