// ─────────────────────────────────────────────────────────────
//  CITY WHITELIST — sirf yeh shehar /weather/<slug> par khulte hain
//
//  Kyun: pehle /weather/<kuch-bhi> backend ko call karta tha. Backend
//  anjaan (magar asli) jagah ka naam mile to naya City bana kar Open-Meteo
//  se 20 saal ka data mangwata hai (~261 weighted calls). Bots ulte-seedhe
//  URL try karein to quota barbaad + kachre pages. Ab list se bahar ka slug
//  backend call se PEHLE 404 hota hai (audit 2.1).
//
//  Source (read-only copy): backend
//  weather/management/commands/fetch_all_cities.py → CITIES (159 shehar
//  yahan + Singapore EXTRA mein = 160; Oct 2026: Key West, Anchorage,
//  Reykjavik, Nassau, San Juan jode — SEO plan ke blog posts).
//  Slug bilkul backend ke tareeqe se:
//    name.lower().replace(" ", "-").replace(",", "")
//  Backend list badle to yeh file bhi badlein.
//
//  EXTRA_CITIES: jo backend list mein nahi magar site par link hote hain.
//
//  lat / lon: backend CITIES list se (read-only copy). Singapore backend
//  list mein nahi — 1.3521, 103.8198 (Singapore ka aam markazi point).
//  tz: IANA timezone (daylight ke local waqt ke liye, content round B1) —
//  script se check: har tz Intl mein valid, aur UTC offset shehar ke
//  longitude ÷ 15 se 3.5 ghante ke andar (160/160 pass).
// ─────────────────────────────────────────────────────────────

const BACKEND_CITIES = [
  { slug: 'london', name: 'London', country: 'United Kingdom', region: 'europe', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { slug: 'manchester', name: 'Manchester', country: 'United Kingdom', region: 'europe', lat: 53.4808, lon: -2.2426, tz: 'Europe/London' },
  { slug: 'birmingham', name: 'Birmingham', country: 'United Kingdom', region: 'europe', lat: 52.4862, lon: -1.8904, tz: 'Europe/London' },
  { slug: 'edinburgh', name: 'Edinburgh', country: 'United Kingdom', region: 'europe', lat: 55.9533, lon: -3.1883, tz: 'Europe/London' },
  { slug: 'glasgow', name: 'Glasgow', country: 'United Kingdom', region: 'europe', lat: 55.8642, lon: -4.2518, tz: 'Europe/London' },
  { slug: 'paris', name: 'Paris', country: 'France', region: 'europe', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  { slug: 'lyon', name: 'Lyon', country: 'France', region: 'europe', lat: 45.764, lon: 4.8357, tz: 'Europe/Paris' },
  { slug: 'marseille', name: 'Marseille', country: 'France', region: 'europe', lat: 43.2965, lon: 5.3698, tz: 'Europe/Paris' },
  { slug: 'toulouse', name: 'Toulouse', country: 'France', region: 'europe', lat: 43.6047, lon: 1.4442, tz: 'Europe/Paris' },
  { slug: 'nice', name: 'Nice', country: 'France', region: 'europe', lat: 43.7102, lon: 7.262, tz: 'Europe/Paris' },
  { slug: 'berlin', name: 'Berlin', country: 'Germany', region: 'europe', lat: 52.52, lon: 13.405, tz: 'Europe/Berlin' },
  { slug: 'munich', name: 'Munich', country: 'Germany', region: 'europe', lat: 48.1351, lon: 11.582, tz: 'Europe/Berlin' },
  { slug: 'hamburg', name: 'Hamburg', country: 'Germany', region: 'europe', lat: 53.5511, lon: 9.9937, tz: 'Europe/Berlin' },
  { slug: 'frankfurt', name: 'Frankfurt', country: 'Germany', region: 'europe', lat: 50.1109, lon: 8.6821, tz: 'Europe/Berlin' },
  { slug: 'cologne', name: 'Cologne', country: 'Germany', region: 'europe', lat: 50.9375, lon: 6.9603, tz: 'Europe/Berlin' },
  { slug: 'madrid', name: 'Madrid', country: 'Spain', region: 'europe', lat: 40.4168, lon: -3.7038, tz: 'Europe/Madrid' },
  { slug: 'barcelona', name: 'Barcelona', country: 'Spain', region: 'europe', lat: 41.3874, lon: 2.1686, tz: 'Europe/Madrid' },
  { slug: 'valencia', name: 'Valencia', country: 'Spain', region: 'europe', lat: 39.4699, lon: -0.3763, tz: 'Europe/Madrid' },
  { slug: 'seville', name: 'Seville', country: 'Spain', region: 'europe', lat: 37.3891, lon: -5.9845, tz: 'Europe/Madrid' },
  { slug: 'bilbao', name: 'Bilbao', country: 'Spain', region: 'europe', lat: 43.263, lon: -2.935, tz: 'Europe/Madrid' },
  { slug: 'rome', name: 'Rome', country: 'Italy', region: 'europe', lat: 41.9028, lon: 12.4964, tz: 'Europe/Rome' },
  { slug: 'milan', name: 'Milan', country: 'Italy', region: 'europe', lat: 45.4642, lon: 9.19, tz: 'Europe/Rome' },
  { slug: 'naples', name: 'Naples', country: 'Italy', region: 'europe', lat: 40.8518, lon: 14.2681, tz: 'Europe/Rome' },
  { slug: 'turin', name: 'Turin', country: 'Italy', region: 'europe', lat: 45.0703, lon: 7.6869, tz: 'Europe/Rome' },
  { slug: 'florence', name: 'Florence', country: 'Italy', region: 'europe', lat: 43.7696, lon: 11.2558, tz: 'Europe/Rome' },
  { slug: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', region: 'europe', lat: 52.3676, lon: 4.9041, tz: 'Europe/Amsterdam' },
  { slug: 'rotterdam', name: 'Rotterdam', country: 'Netherlands', region: 'europe', lat: 51.9244, lon: 4.4777, tz: 'Europe/Amsterdam' },
  { slug: 'the-hague', name: 'The Hague', country: 'Netherlands', region: 'europe', lat: 52.0705, lon: 4.3007, tz: 'Europe/Amsterdam' },
  { slug: 'vienna', name: 'Vienna', country: 'Austria', region: 'europe', lat: 48.2082, lon: 16.3738, tz: 'Europe/Vienna' },
  { slug: 'salzburg', name: 'Salzburg', country: 'Austria', region: 'europe', lat: 47.8095, lon: 13.055, tz: 'Europe/Vienna' },
  { slug: 'brussels', name: 'Brussels', country: 'Belgium', region: 'europe', lat: 50.8503, lon: 4.3517, tz: 'Europe/Brussels' },
  { slug: 'antwerp', name: 'Antwerp', country: 'Belgium', region: 'europe', lat: 51.2194, lon: 4.4025, tz: 'Europe/Brussels' },
  { slug: 'dublin', name: 'Dublin', country: 'Ireland', region: 'europe', lat: 53.3498, lon: -6.2603, tz: 'Europe/Dublin' },
  { slug: 'cork', name: 'Cork', country: 'Ireland', region: 'europe', lat: 51.8985, lon: -8.4756, tz: 'Europe/Dublin' },
  { slug: 'lisbon', name: 'Lisbon', country: 'Portugal', region: 'europe', lat: 38.7223, lon: -9.1393, tz: 'Europe/Lisbon' },
  { slug: 'porto', name: 'Porto', country: 'Portugal', region: 'europe', lat: 41.1579, lon: -8.6291, tz: 'Europe/Lisbon' },
  { slug: 'stockholm', name: 'Stockholm', country: 'Sweden', region: 'europe', lat: 59.3293, lon: 18.0686, tz: 'Europe/Stockholm' },
  { slug: 'gothenburg', name: 'Gothenburg', country: 'Sweden', region: 'europe', lat: 57.7089, lon: 11.9746, tz: 'Europe/Stockholm' },
  { slug: 'oslo', name: 'Oslo', country: 'Norway', region: 'europe', lat: 59.9139, lon: 10.7522, tz: 'Europe/Oslo' },
  { slug: 'bergen', name: 'Bergen', country: 'Norway', region: 'europe', lat: 60.3913, lon: 5.3221, tz: 'Europe/Oslo' },
  { slug: 'trondheim', name: 'Trondheim', country: 'Norway', region: 'europe', lat: 63.4305, lon: 10.3951, tz: 'Europe/Oslo' },
  { slug: 'copenhagen', name: 'Copenhagen', country: 'Denmark', region: 'europe', lat: 55.6761, lon: 12.5683, tz: 'Europe/Copenhagen' },
  { slug: 'aarhus', name: 'Aarhus', country: 'Denmark', region: 'europe', lat: 56.1629, lon: 10.2039, tz: 'Europe/Copenhagen' },
  { slug: 'helsinki', name: 'Helsinki', country: 'Finland', region: 'europe', lat: 60.1699, lon: 24.9384, tz: 'Europe/Helsinki' },
  { slug: 'tampere', name: 'Tampere', country: 'Finland', region: 'europe', lat: 61.4978, lon: 23.761, tz: 'Europe/Helsinki' },
  { slug: 'warsaw', name: 'Warsaw', country: 'Poland', region: 'europe', lat: 52.2297, lon: 21.0122, tz: 'Europe/Warsaw' },
  { slug: 'krakow', name: 'Krakow', country: 'Poland', region: 'europe', lat: 50.0647, lon: 19.945, tz: 'Europe/Warsaw' },
  { slug: 'gdansk', name: 'Gdansk', country: 'Poland', region: 'europe', lat: 54.352, lon: 18.6466, tz: 'Europe/Warsaw' },
  { slug: 'prague', name: 'Prague', country: 'Czech Republic', region: 'europe', lat: 50.0755, lon: 14.4378, tz: 'Europe/Prague' },
  { slug: 'brno', name: 'Brno', country: 'Czech Republic', region: 'europe', lat: 49.1951, lon: 16.6068, tz: 'Europe/Prague' },
  { slug: 'budapest', name: 'Budapest', country: 'Hungary', region: 'europe', lat: 47.4979, lon: 19.0402, tz: 'Europe/Budapest' },
  { slug: 'athens', name: 'Athens', country: 'Greece', region: 'europe', lat: 37.9838, lon: 23.7275, tz: 'Europe/Athens' },
  { slug: 'thessaloniki', name: 'Thessaloniki', country: 'Greece', region: 'europe', lat: 40.6401, lon: 22.9444, tz: 'Europe/Athens' },
  { slug: 'istanbul', name: 'Istanbul', country: 'Turkey', region: 'other', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  { slug: 'ankara', name: 'Ankara', country: 'Turkey', region: 'other', lat: 39.9334, lon: 32.8597, tz: 'Europe/Istanbul' },
  { slug: 'antalya', name: 'Antalya', country: 'Turkey', region: 'other', lat: 36.8969, lon: 30.7133, tz: 'Europe/Istanbul' },
  { slug: 'zurich', name: 'Zurich', country: 'Switzerland', region: 'europe', lat: 47.3769, lon: 8.5417, tz: 'Europe/Zurich' },
  { slug: 'geneva', name: 'Geneva', country: 'Switzerland', region: 'europe', lat: 46.2044, lon: 6.1432, tz: 'Europe/Zurich' },
  { slug: 'moscow', name: 'Moscow', country: 'Russia', region: 'other', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  { slug: 'saint-petersburg', name: 'Saint Petersburg', country: 'Russia', region: 'other', lat: 59.9343, lon: 30.3351, tz: 'Europe/Moscow' },
  { slug: 'kazan', name: 'Kazan', country: 'Russia', region: 'other', lat: 55.8304, lon: 49.0661, tz: 'Europe/Moscow' },
  { slug: 'sochi', name: 'Sochi', country: 'Russia', region: 'other', lat: 43.6028, lon: 39.7342, tz: 'Europe/Moscow' },
  { slug: 'baku', name: 'Baku', country: 'Azerbaijan', region: 'other', lat: 40.4093, lon: 49.8671, tz: 'Asia/Baku' },
  { slug: 'new-york', name: 'New York', country: 'USA', region: 'usa', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
  { slug: 'los-angeles', name: 'Los Angeles', country: 'USA', region: 'usa', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
  { slug: 'chicago', name: 'Chicago', country: 'USA', region: 'usa', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
  { slug: 'houston', name: 'Houston', country: 'USA', region: 'usa', lat: 29.7604, lon: -95.3698, tz: 'America/Chicago' },
  { slug: 'phoenix', name: 'Phoenix', country: 'USA', region: 'usa', lat: 33.4484, lon: -112.074, tz: 'America/Phoenix' },
  { slug: 'philadelphia', name: 'Philadelphia', country: 'USA', region: 'usa', lat: 39.9526, lon: -75.1652, tz: 'America/New_York' },
  { slug: 'san-antonio', name: 'San Antonio', country: 'USA', region: 'usa', lat: 29.4241, lon: -98.4936, tz: 'America/Chicago' },
  { slug: 'san-diego', name: 'San Diego', country: 'USA', region: 'usa', lat: 32.7157, lon: -117.1611, tz: 'America/Los_Angeles' },
  { slug: 'dallas', name: 'Dallas', country: 'USA', region: 'usa', lat: 32.7767, lon: -96.797, tz: 'America/Chicago' },
  { slug: 'austin', name: 'Austin', country: 'USA', region: 'usa', lat: 30.2672, lon: -97.7431, tz: 'America/Chicago' },
  { slug: 'san-francisco', name: 'San Francisco', country: 'USA', region: 'usa', lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles' },
  { slug: 'seattle', name: 'Seattle', country: 'USA', region: 'usa', lat: 47.6062, lon: -122.3321, tz: 'America/Los_Angeles' },
  { slug: 'denver', name: 'Denver', country: 'USA', region: 'usa', lat: 39.7392, lon: -104.9903, tz: 'America/Denver' },
  { slug: 'washington-dc', name: 'Washington DC', country: 'USA', region: 'usa', lat: 38.9072, lon: -77.0369, tz: 'America/New_York' },
  { slug: 'boston', name: 'Boston', country: 'USA', region: 'usa', lat: 42.3601, lon: -71.0589, tz: 'America/New_York' },
  { slug: 'nashville', name: 'Nashville', country: 'USA', region: 'usa', lat: 36.1627, lon: -86.7816, tz: 'America/Chicago' },
  { slug: 'portland', name: 'Portland', country: 'USA', region: 'usa', lat: 45.5152, lon: -122.6784, tz: 'America/Los_Angeles' },
  { slug: 'las-vegas', name: 'Las Vegas', country: 'USA', region: 'usa', lat: 36.1699, lon: -115.1398, tz: 'America/Los_Angeles' },
  { slug: 'miami', name: 'Miami', country: 'USA', region: 'usa', lat: 25.7617, lon: -80.1918, tz: 'America/New_York' },
  { slug: 'atlanta', name: 'Atlanta', country: 'USA', region: 'usa', lat: 33.749, lon: -84.388, tz: 'America/New_York' },
  { slug: 'detroit', name: 'Detroit', country: 'USA', region: 'usa', lat: 42.3314, lon: -83.0458, tz: 'America/Detroit' },
  { slug: 'minneapolis', name: 'Minneapolis', country: 'USA', region: 'usa', lat: 44.9778, lon: -93.265, tz: 'America/Chicago' },
  { slug: 'salt-lake-city', name: 'Salt Lake City', country: 'USA', region: 'usa', lat: 40.7608, lon: -111.891, tz: 'America/Denver' },
  { slug: 'orlando', name: 'Orlando', country: 'USA', region: 'usa', lat: 28.5383, lon: -81.3792, tz: 'America/New_York' },
  { slug: 'new-orleans', name: 'New Orleans', country: 'USA', region: 'usa', lat: 29.9511, lon: -90.0715, tz: 'America/Chicago' },
  { slug: 'pittsburgh', name: 'Pittsburgh', country: 'USA', region: 'usa', lat: 40.4406, lon: -79.9959, tz: 'America/New_York' },
  { slug: 'honolulu', name: 'Honolulu', country: 'USA', region: 'usa', lat: 21.3069, lon: -157.8583, tz: 'Pacific/Honolulu' },
  { slug: 'toronto', name: 'Toronto', country: 'Canada', region: 'other', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  { slug: 'vancouver', name: 'Vancouver', country: 'Canada', region: 'other', lat: 49.2827, lon: -123.1207, tz: 'America/Vancouver' },
  { slug: 'montreal', name: 'Montreal', country: 'Canada', region: 'other', lat: 45.5017, lon: -73.5673, tz: 'America/Toronto' },
  { slug: 'calgary', name: 'Calgary', country: 'Canada', region: 'other', lat: 51.0447, lon: -114.0719, tz: 'America/Edmonton' },
  { slug: 'lahore', name: 'Lahore', country: 'Pakistan', region: 'other', lat: 31.5204, lon: 74.3587, tz: 'Asia/Karachi' },
  { slug: 'karachi', name: 'Karachi', country: 'Pakistan', region: 'other', lat: 24.8607, lon: 67.0011, tz: 'Asia/Karachi' },
  { slug: 'islamabad', name: 'Islamabad', country: 'Pakistan', region: 'other', lat: 33.6844, lon: 73.0479, tz: 'Asia/Karachi' },
  { slug: 'peshawar', name: 'Peshawar', country: 'Pakistan', region: 'other', lat: 34.0151, lon: 71.5249, tz: 'Asia/Karachi' },
  { slug: 'quetta', name: 'Quetta', country: 'Pakistan', region: 'other', lat: 30.1798, lon: 66.975, tz: 'Asia/Karachi' },
  { slug: 'mumbai', name: 'Mumbai', country: 'India', region: 'other', lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' },
  { slug: 'delhi', name: 'Delhi', country: 'India', region: 'other', lat: 28.7041, lon: 77.1025, tz: 'Asia/Kolkata' },
  { slug: 'bangalore', name: 'Bangalore', country: 'India', region: 'other', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
  { slug: 'chennai', name: 'Chennai', country: 'India', region: 'other', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
  { slug: 'kolkata', name: 'Kolkata', country: 'India', region: 'other', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
  { slug: 'dhaka', name: 'Dhaka', country: 'Bangladesh', region: 'other', lat: 23.8103, lon: 90.4125, tz: 'Asia/Dhaka' },
  { slug: 'chittagong', name: 'Chittagong', country: 'Bangladesh', region: 'other', lat: 22.3569, lon: 91.7832, tz: 'Asia/Dhaka' },
  { slug: 'kathmandu', name: 'Kathmandu', country: 'Nepal', region: 'other', lat: 27.7172, lon: 85.324, tz: 'Asia/Kathmandu' },
  { slug: 'pokhara', name: 'Pokhara', country: 'Nepal', region: 'other', lat: 28.2096, lon: 83.9856, tz: 'Asia/Kathmandu' },
  { slug: 'colombo', name: 'Colombo', country: 'Sri Lanka', region: 'other', lat: 6.9271, lon: 79.8612, tz: 'Asia/Colombo' },
  { slug: 'manila', name: 'Manila', country: 'Philippines', region: 'other', lat: 14.5995, lon: 120.9842, tz: 'Asia/Manila' },
  { slug: 'cebu', name: 'Cebu', country: 'Philippines', region: 'other', lat: 10.3157, lon: 123.8854, tz: 'Asia/Manila' },
  { slug: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', region: 'other', lat: 3.139, lon: 101.6869, tz: 'Asia/Kuala_Lumpur' },
  { slug: 'hanoi', name: 'Hanoi', country: 'Vietnam', region: 'other', lat: 21.0278, lon: 105.8342, tz: 'Asia/Ho_Chi_Minh' },
  { slug: 'ho-chi-minh-city', name: 'Ho Chi Minh City', country: 'Vietnam', region: 'other', lat: 10.8231, lon: 106.6297, tz: 'Asia/Ho_Chi_Minh' },
  { slug: 'yangon', name: 'Yangon', country: 'Myanmar', region: 'other', lat: 16.8661, lon: 96.1951, tz: 'Asia/Yangon' },
  { slug: 'tehran', name: 'Tehran', country: 'Iran', region: 'other', lat: 35.6892, lon: 51.389, tz: 'Asia/Tehran' },
  { slug: 'isfahan', name: 'Isfahan', country: 'Iran', region: 'other', lat: 32.6546, lon: 51.668, tz: 'Asia/Tehran' },
  { slug: 'shiraz', name: 'Shiraz', country: 'Iran', region: 'other', lat: 29.5918, lon: 52.5836, tz: 'Asia/Tehran' },
  { slug: 'beijing', name: 'Beijing', country: 'China', region: 'other', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
  { slug: 'shanghai', name: 'Shanghai', country: 'China', region: 'other', lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai' },
  { slug: 'guangzhou', name: 'Guangzhou', country: 'China', region: 'other', lat: 23.1291, lon: 113.2644, tz: 'Asia/Shanghai' },
  { slug: 'chengdu', name: 'Chengdu', country: 'China', region: 'other', lat: 30.5728, lon: 104.0668, tz: 'Asia/Shanghai' },
  { slug: 'shenzhen', name: 'Shenzhen', country: 'China', region: 'other', lat: 22.5431, lon: 114.0579, tz: 'Asia/Shanghai' },
  { slug: 'hong-kong', name: 'Hong Kong', country: 'China', region: 'other', lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong' },
  { slug: 'tokyo', name: 'Tokyo', country: 'Japan', region: 'other', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
  { slug: 'osaka', name: 'Osaka', country: 'Japan', region: 'other', lat: 34.6937, lon: 135.5023, tz: 'Asia/Tokyo' },
  { slug: 'kyoto', name: 'Kyoto', country: 'Japan', region: 'other', lat: 35.0116, lon: 135.7681, tz: 'Asia/Tokyo' },
  { slug: 'seoul', name: 'Seoul', country: 'South Korea', region: 'other', lat: 37.5665, lon: 126.978, tz: 'Asia/Seoul' },
  { slug: 'busan', name: 'Busan', country: 'South Korea', region: 'other', lat: 35.1796, lon: 129.0756, tz: 'Asia/Seoul' },
  { slug: 'bali', name: 'Bali', country: 'Indonesia', region: 'other', lat: -8.3405, lon: 115.092, tz: 'Asia/Makassar' },
  { slug: 'jakarta', name: 'Jakarta', country: 'Indonesia', region: 'other', lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta' },
  { slug: 'sydney', name: 'Sydney', country: 'Australia', region: 'other', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  { slug: 'melbourne', name: 'Melbourne', country: 'Australia', region: 'other', lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },
  { slug: 'brisbane', name: 'Brisbane', country: 'Australia', region: 'other', lat: -27.4698, lon: 153.0251, tz: 'Australia/Brisbane' },
  { slug: 'perth', name: 'Perth', country: 'Australia', region: 'other', lat: -31.9505, lon: 115.8605, tz: 'Australia/Perth' },
  { slug: 'dubai', name: 'Dubai', country: 'UAE', region: 'other', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { slug: 'abu-dhabi', name: 'Abu Dhabi', country: 'UAE', region: 'other', lat: 24.4539, lon: 54.3773, tz: 'Asia/Dubai' },
  { slug: 'sao-paulo', name: 'Sao Paulo', country: 'Brazil', region: 'other', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo' },
  { slug: 'rio-de-janeiro', name: 'Rio de Janeiro', country: 'Brazil', region: 'other', lat: -22.9068, lon: -43.1729, tz: 'America/Sao_Paulo' },
  { slug: 'mexico-city', name: 'Mexico City', country: 'Mexico', region: 'other', lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City' },
  { slug: 'cancun', name: 'Cancun', country: 'Mexico', region: 'other', lat: 21.1619, lon: -86.8515, tz: 'America/Cancun' },
  { slug: 'cape-town', name: 'Cape Town', country: 'South Africa', region: 'other', lat: -33.9249, lon: 18.4241, tz: 'Africa/Johannesburg' },
  { slug: 'johannesburg', name: 'Johannesburg', country: 'South Africa', region: 'other', lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg' },
  { slug: 'bangkok', name: 'Bangkok', country: 'Thailand', region: 'other', lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' },
  { slug: 'phuket', name: 'Phuket', country: 'Thailand', region: 'other', lat: 7.8804, lon: 98.3923, tz: 'Asia/Bangkok' },
  { slug: 'cairo', name: 'Cairo', country: 'Egypt', region: 'other', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  { slug: 'lagos', name: 'Lagos', country: 'Nigeria', region: 'other', lat: 6.5244, lon: 3.3792, tz: 'Africa/Lagos' },
  { slug: 'buenos-aires', name: 'Buenos Aires', country: 'Argentina', region: 'other', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' },
  { slug: 'auckland', name: 'Auckland', country: 'New Zealand', region: 'other', lat: -36.8485, lon: 174.7633, tz: 'Pacific/Auckland' },
  { slug: 'wellington', name: 'Wellington', country: 'New Zealand', region: 'other', lat: -41.2865, lon: 174.7762, tz: 'Pacific/Auckland' },
  { slug: 'bogota', name: 'Bogota', country: 'Colombia', region: 'other', lat: 4.711, lon: -74.0721, tz: 'America/Bogota' },
  { slug: 'medellin', name: 'Medellin', country: 'Colombia', region: 'other', lat: 6.2476, lon: -75.5658, tz: 'America/Bogota' },
  { slug: 'quito', name: 'Quito', country: 'Ecuador', region: 'other', lat: -0.1807, lon: -78.4678, tz: 'America/Guayaquil' },
  { slug: 'san-jose', name: 'San Jose', country: 'Costa Rica', region: 'other', lat: 9.9281, lon: -84.0907, tz: 'America/Costa_Rica' },
  // SEO plan (Oct 2026) — blog posts ke liye naye shehar (backend list mein bhi)
  { slug: 'key-west', name: 'Key West', country: 'USA', region: 'usa', lat: 24.5551, lon: -81.78, tz: 'America/New_York' },
  { slug: 'anchorage', name: 'Anchorage', country: 'USA', region: 'usa', lat: 61.2181, lon: -149.9003, tz: 'America/Anchorage' },
  { slug: 'reykjavik', name: 'Reykjavik', country: 'Iceland', region: 'europe', lat: 64.1466, lon: -21.9426, tz: 'Atlantic/Reykjavik' },
  { slug: 'nassau', name: 'Nassau', country: 'Bahamas', region: 'other', lat: 25.0443, lon: -77.3504, tz: 'America/Nassau' },
  { slug: 'san-juan', name: 'San Juan', country: 'Puerto Rico', region: 'other', lat: 18.4655, lon: -66.1057, tz: 'America/Puerto_Rico' },
];

// Singapore: Climate Guides + Popular Destinations par hai, backend ke DB
// mein maujood, magar fetch_all_cities.py ki list mein nahi. Owner ka
// faisla (round 2, 2.1-a option A): yahan extra + backend request.
const EXTRA_CITIES = [
  { slug: 'singapore', name: 'Singapore', country: 'Singapore', region: 'other', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
];

export const CITIES = [...BACKEND_CITIES, ...EXTRA_CITIES];

const BY_SLUG = new Map(CITIES.map((c) => [c.slug, c]));

export const getCity = (slug) => BY_SLUG.get(slug) || null;
export const isKnownCity = (slug) => BY_SLUG.has(slug);

// Usi mulk ke doosre shehar (city page ka "More cities in {country}").
export const citiesInCountry = (country, exceptSlug) =>
  CITIES.filter((c) => c.country === country && c.slug !== exceptSlug);
