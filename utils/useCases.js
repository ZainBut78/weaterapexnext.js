// Use-case pages ki list (Nov 2026): pages, sitemap aur links sab yahin se.
export const EVENT_USECASES = ['wedding', 'concert', 'marathon', 'festival', 'picnic-bbq'];
export const TRIP_USECASES = ['beach', 'city-break', 'hiking'];
export const USECASE_PATHS = [
  ...EVENT_USECASES.map((s) => `/events/${s}`),
  ...TRIP_USECASES.map((s) => `/trip-planner/${s}`),
];
// Use-case pages + hub ke naye sections kab live hue (asal content ki tareekh, deploy ki nahi)
export const TOOLS_CONTENT_DATE = '2026-11-12';
