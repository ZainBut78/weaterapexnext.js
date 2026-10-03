'use client';

import { useState, useEffect } from 'react';
import { Heart, User, Music, Circle, Building2, MapPin, Calendar, ArrowRight } from 'lucide-react';

const EVENT_TYPES = [
  { key: 'wedding', label: 'Wedding', icon: Heart },
  { key: 'marathon', label: 'Marathon', icon: User },
  { key: 'concert', label: 'Concert', icon: Music },
  { key: 'sports', label: 'Sports', icon: Circle },
  { key: 'festival', label: 'Festival', icon: Building2 },
];

const EventSearchForm = ({ onSubmit }) => {
  const [eventType, setEventType] = useState('wedding');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [specificTime, setSpecificTime] = useState(true);
  const [time, setTime] = useState('16:00');

  // toISOString() UTC deta hai. Pakistan (UTC+5) mein raat 12 se subah 5
  // baje ke darmiyan woh KAL ki date deta tha, is liye user aaj ka event
  // select hi nahi kar sakta tha (min = kal). Ab local date use hoti hai.
  const localISO = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Next.js: yeh component pehle SERVER par bhi banta hai, jahan ka
  // timezone user se alag ho sakta hai. Is liye "aaj" browser mein
  // useEffect ke andar nikalte hain (warna hydration mismatch).
  const [todayStr, setTodayStr] = useState('');
  const [maxDateStr, setMaxDateStr] = useState('');
  useEffect(() => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 10);
    setTodayStr(localISO(today));
    setMaxDateStr(localISO(maxDate));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({ eventType, city, date, time: specificTime ? time : null });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-5xl mx-auto">
      <form onSubmit={handleSubmit}>

        {/* Event Type Selector */}
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Event Type
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
          {EVENT_TYPES.map(({ key, label, icon: Icon }) => {
            const isActive = eventType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setEventType(key)}
                className={`flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border-2 transition-colors ${isActive
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
              >
                <Icon size={22} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
                <span className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Location + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Location
            </label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-3">
              <MapPin size={18} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City, Country"
                required
                className="w-full outline-none text-sm text-slate-800 placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Date
            </label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-3">
              <Calendar size={18} className="text-gray-400 flex-shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={todayStr}
                max={maxDateStr}
                required
                className="w-full outline-none text-sm text-slate-800 bg-transparent"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 mb-5" />

        {/* Specific Time Toggle + Submit */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Mobile pe yeh teen cheezein (toggle + label + time input) ek hi
              non-wrapping row mein thin: toggle squeeze ho jata tha aur
              "Specific time?" us ke neeche do lines mein toot kar overlap
              karta tha. Ab row wrap hoti hai, toggle shrink nahi hota, aur
              toggle+label ek hi 44px tap target hai. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={() => setSpecificTime(!specificTime)}
              aria-pressed={specificTime}
              className="flex shrink-0 items-center gap-3 min-h-11 text-left"
            >
              <span
                className={`block shrink-0 w-11 h-6 rounded-full relative transition-colors ${specificTime ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${specificTime ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                />
              </span>
              <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Specific time?</span>
            </button>
            {specificTime && (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="shrink-0 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none"
              />
            )}
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors w-full sm:w-auto justify-center"
          >
            Check Risk Score
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventSearchForm;