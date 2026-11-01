// Client components ko layout se kaunse messages namespaces milte hain
// (baqi — about/privacy/terms/meta waghera — sirf server par, payload mein nahi).
// Har page par lagne wale client components (Navbar, Footer, FreeLimitModal…).
// Page-khaas namespaces (weather/wx — home + trip planner, climate — climate
// pages, trip, events, auth…) wahi page <ClientMessages> se deta hai — har
// page ke HTML payload mein ~6 KB faltu JSON na jaye.
export const CLIENT_NAMESPACES = ['common', 'nav', 'footer', 'units', 'langSwitch', 'freeLimit', 'errors', 'search'];

// Home page ke client components (weather card, forecast, map, destinations)
export const HOME_NAMESPACES = ['weather', 'wx', 'wxNight', 'popular'];
