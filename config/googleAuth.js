// Google Sign-In ka Client ID.
//
// Alag file mein kyun: React ka fast-refresh tab hi kaam karta hai jab ek
// file sirf components export kare. Component ke sath constant export
// karne se dev server ka hot-reload tootta hai.
//
// Yeh value SECRET NAHI hai — har `NEXT_PUBLIC_*` value build ke waqt browser ke
// bundle mein chali jati hai. Google ka client SECRET yahan kabhi nahi
// aana chahiye (is flow mein uski zaroorat bhi nahi).
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
