// WeatherApex ka asal logo (owner, Nov 2026) — har jagah yahi.
//   full: nishan + naam (footer, login / signup waghera)
//   mark: sirf nishan (header mein neeche ka naam itna chhota ho kar parha nahi jata,
//         is liye Navbar nishan ke saath naam text mein likhta hai)
// Files: public/brand/. Logo badalna ho to wahi naam, wahi jagah.
const LOGOS = {
  full: { src: '/brand/logo-full.png', width: 240, height: 228 },
  mark: { src: '/brand/logo-mark.png', width: 112, height: 100 },
};

export default function BrandLogo({ variant = 'full', alt = 'WeatherApex', className = '' }) {
  const logo = LOGOS[variant];
  return <img src={logo.src} width={logo.width} height={logo.height} alt={alt} className={className} />;
}
