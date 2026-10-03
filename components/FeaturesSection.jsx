import React from 'react';
import Link from 'next/link';
import { Route, CalendarDays, History } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Route,
      iconBg: 'bg-[#00a8e8]',
      iconColor: 'text-white',
      title: 'Trip Weather Planner',
      description: 'Simulate weather conditions across your entire route to ensure safety and comfort during long-haul travel.',
      linkText: 'Learn more',
    },
    {
      icon: CalendarDays,
      iconBg: 'bg-[#00c853]', // Bright green background
      iconColor: 'text-white',
      title: 'Event Risk Score',
      description: 'Planning a wedding or outdoor marathon? Our proprietary algorithm calculates meteorological risk up to 6 months in advance.',
      linkText: 'Try it out',
    },
    {
      icon: History,
      iconBg: 'bg-[#2979ff]', // Different shade of blue for contrast
      iconColor: 'text-white',
      title: 'Historical Data Analysis',
      description: 'Access decades of climate patterns for specific locations to make data-backed decisions for infrastructure and agriculture.',
      linkText: 'View Archive',
    },
  ];

  return (
    <div className="w-full bg-[#d9e6ff] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans text-center">
        
        {/* Section Heading — home page ka AKELA <h1> (SEO). Pehle
            "Engineered for Accuracy" tha; owner ne keywords wala text
            chuna (audit 1.3, option 1). Styling wahi. */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#002244] tracking-tight mb-4">
          Weather Forecasts, Trip Planning &amp; Climate Guides
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
          More than just a forecast. Our suite of professional tools provides actionable insights for complex logistics and travel planning.
        </p>

        {/* 3 Features Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const FeatureIcon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg flex flex-col text-left transition-all hover:shadow-2xl hover:-translate-y-1"
              >
                {/* Icon Container */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.iconBg}`}>
                  <FeatureIcon className={`w-6 h-6 ${feature.iconColor}`} strokeWidth={2.5} />
                </div>
                
                {/* Feature Title */}
                <h3 className="text-xl font-extrabold text-[#002244] mb-3">
                  {feature.title}
                </h3>
                
                {/* Feature Description */}
                <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-grow">
                  {feature.description}
                </p>
                
                {/* Call to Action Link */}
                <Link
                  href={idx === 0 ? '/trip-planner' : idx === 1 ? '/events' : '/blog'}
                  className="text-sm font-semibold text-[#0077b6] hover:text-[#005f91] flex items-center gap-1.5 transition-colors group"
                >
                  {feature.linkText}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;