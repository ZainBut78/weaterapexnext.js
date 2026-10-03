// ─────────────────────────────────────────────────────────────
//  Home page ke loading SKELETONS (audit fix 1.2b — CLS)
//
//  Pehle loading ke waqt chhote dabbe ("Loading weather data...",
//  "Loading forecast...") dikhte the. Data aane par card 3-4 guna bara
//  ho jata aur poora page ~430px neeche khisak jata — Google isay CLS
//  (layout shift) ginta hai.
//
//  Ab loading ke waqt ASLI component ke bilkul wahi dabbe/padding/
//  breakpoints hain, sirf text ki jagah grey blocks — is liye data aane
//  par height nahi badalti. Loaded design ko haath nahi lagaya.
//  Agar asli component ki layout badlein to yahan bhi badlein.
// ─────────────────────────────────────────────────────────────

const bar = 'bg-gray-100 rounded-lg animate-pulse';

// WeatherCard.jsx ka loaded layout (same classes)
export function WeatherCardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div
        className="relative bg-white rounded-3xl shadow-xl p-5 sm:p-7 lg:p-10 max-w-[900px] mx-auto overflow-hidden"
        aria-busy="true"
      >
        <span className="sr-only">Loading weather data...</span>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 lg:gap-12 mb-6 lg:mb-10">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            {/* icon: w-16/20/24 */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 shrink-0 ${bar} rounded-full`} />
            <div className="min-w-0">
              {/* temperature line: °C/°F column = 2 × text-xl/2xl lines */}
              <div className={`h-14 sm:h-16 w-32 ${bar}`} />
              {/* "Cloudy • London, UK": text-sm + mt-1 */}
              <div className={`h-5 mt-1 w-44 ${bar}`} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:flex lg:gap-10 text-xs sm:text-sm font-semibold shrink-0">
            {[0, 1, 2].map((i) => (
              <div key={i} className="text-center flex flex-col items-center">
                {/* label (text-xs/sm) + value (text-xl/2xl, mt-1) */}
                <div className={`h-4 sm:h-5 w-16 ${bar}`} />
                <div className={`h-7 sm:h-8 mt-1 w-12 ${bar}`} />
              </div>
            ))}
          </div>
        </div>

        {/* tabs row: min-h-11 buttons + border-b */}
        <div className="border-b border-gray-100 flex gap-6 sm:gap-8 mb-6 sm:mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="min-h-11 py-3 shrink-0">
              <div className={`h-5 w-20 ${bar}`} />
            </div>
          ))}
        </div>

        {/* chart */}
        <div className={`relative h-32 sm:h-40 w-full mb-6 sm:mb-8 ${bar}`} />

        {/* hourly strip: time (24px) + gap + icon h-14 + gap + value (20px) */}
        <div className="overflow-hidden px-2">
          <div className="flex gap-5 w-max">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 w-20 shrink-0">
                <div className={`h-6 w-12 ${bar}`} />
                <div className={`w-14 h-14 ${bar} rounded-full`} />
                <div className={`h-5 w-8 ${bar}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// LiveSatelliteRadar.jsx ka loaded layout: heading block + 420px map
export function RadarSkeleton() {
  return (
    <div className="w-full bg-[#0f172a] py-10">
      <div className="max-w-[1000px] mx-auto px-4">
        {/* "Weather Map" (text-3xl) + subtitle (text-sm, mt-1), mb-6 */}
        <div className="mb-6">
          <div className="h-9 w-48 bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-5 mt-1 w-72 max-w-full bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <div className="h-[420px] bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    </div>
  );
}

// ForecastTable.jsx ka loaded layout. Heading + column header asli hain
// (static text); rows ki jagah skeleton. Rows ka dabba asli ki tarah
// max-h-[600px] — backend 15 din bhejta hai, is liye asli dabba bhi
// hamesha 600px par ruk jata hai.
export function ForecastSkeleton() {
  return (
    <div className="w-full bg-white py-8 border-t border-gray-100" aria-busy="true">
      <div className="max-w-[1000px] mx-auto px-4 font-sans">
        <h2 className="text-3xl font-extrabold text-[#002244] mb-6 tracking-tight">
          Long-range Forecast
        </h2>
        <span className="sr-only">Loading forecast...</span>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#f2f6fd] border-b border-gray-200 px-6 py-3 hidden md:grid grid-cols-12 text-[11px] font-bold text-gray-500 uppercase tracking-wider items-center">
            <div className="col-span-2">Day</div>
            <div className="col-span-1 text-center">Cond</div>
            <div className="col-span-2">Hi / Lo</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Night</div>
            <div className="col-span-1 text-right">Precip</div>
          </div>

          <div className="bg-white divide-y divide-gray-100 max-h-[600px] overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-6 py-3.5 grid grid-cols-12 items-center text-sm">
                <div className="col-span-2"><div className={`h-9 w-12 ${bar}`} /></div>
                <div className="col-span-1 flex justify-center"><div className={`w-14 h-14 ${bar} rounded-full`} /></div>
                <div className="col-span-2"><div className={`h-5 w-16 ${bar}`} /></div>
                <div className="col-span-4 pr-2"><div className={`h-9 w-full ${bar}`} /></div>
                <div className="col-span-2"><div className={`h-4 w-16 ${bar}`} /></div>
                <div className="col-span-1 flex justify-end"><div className={`h-4 w-8 ${bar}`} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
