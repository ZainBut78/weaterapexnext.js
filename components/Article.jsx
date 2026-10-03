import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const Article = () => {
  const articles = [
    {
      category: 'CLIMATE TRENDS',
      title: 'The Shift in European Winter Patterns 2024',
      description:
        'Recent data suggests a fundamental shift in high-pressure systems across Central Europe, affecting ski seasons and...',
      image:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      author: {
        name: 'Dr. Sarah Jenkins',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      },
    },
    {
      category: 'TECHNOLOGY',
      title: 'How AI is Revolutionizing Local Forecasting',
      description:
        'Machine learning models are now outperforming traditional fluid dynamics simulations in predicting localized storm...',
      image:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      author: {
        name: 'Mark Thorne',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      },
    },
    {
      category: 'TRAVEL TIPS',
      title: 'Mastering the Monsoon Season in Bali',
      description:
        "Don't let the rain stop your travel. Learn how to time your excursions perfectly using micro-climate data for Indonesia...",
      image:
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
      author: {
        name: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
      },
    },
  ];

  return (
    <div className="w-full bg-[#f3f7ff] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#002244] tracking-tight mb-2">
              The Meteorological Digest
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Expert analysis on climate trends and travel tips.
            </p>
          </div>

          {/* View All Articles Link */}
          <Link
            href="/blog"
            className="text-sm font-bold text-[#0077b6] hover:text-[#005a8d] flex items-center gap-1.5 transition-colors group self-start sm:self-auto"
          >
            <span>View All Articles</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3 Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-100 group cursor-pointer"
            >
              {/* Image Banner */}
              <div className="h-56 w-full overflow-hidden relative bg-gray-100">
                <img
                  loading="lazy" decoding="async" src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8 flex flex-col flex-grow justify-between">
                <div>
                  {/* Category Tag */}
                  <span className="text-xs font-extrabold text-[#0077b6] tracking-wider uppercase block mb-3">
                    {article.category}
                  </span>

                  {/* Article Title */}
                  <h3 className="text-xl font-bold text-[#002244] leading-snug mb-3 group-hover:text-[#0077b6] transition-colors">
                    {article.title}
                  </h3>

                  {/* Article Description */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-3">
                    {article.description}
                  </p>
                </div>

                {/* Author Details */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                  <img
                    loading="lazy" decoding="async" src={article.author.avatar}
                    alt={article.author.name}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                  <span className="text-xs font-bold text-gray-700">
                    {article.author.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Article;