// Tailwind CSS ko Next.js se jorne wali file.
// Vite mein yeh kaam `@tailwindcss/vite` plugin karta tha;
// Next.js mein yeh PostCSS plugin karta hai. Is ko chhedne ki zaroorat nahi.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
