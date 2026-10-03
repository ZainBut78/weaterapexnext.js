'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// BUG JO YEH THEEK KARTA HAI:
// `localStorage.setItem('username', undefined)` khaali nahi chhorta —
// woh LITERAL string "undefined" save kar deta hai. Phir page refresh par
// `if (token && username)` sach nikalta tha (kyunki "undefined" ek
// non-empty string hai) aur navbar mein saaf saaf "undefined" likha aata
// tha. Agar backend kabhi `username` na bheje (purana version, ya koi
// naya login raasta), to poora navbar isi tarah kharab ho jata hai.
//
// Is liye naam har dafa — likhte waqt AUR parhte waqt — guzarta hai:
const cleanName = (value) => {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s || s === 'undefined' || s === 'null') return '';
  return s;
};

// Token mojood hai magar naam ka pata nahi — session torna ghalat hoga
// (banda asal mein logged in hai), aur "undefined" dikhana bhi ghalat.
const FALLBACK_NAME = 'Account';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const name = cleanName(localStorage.getItem('username'));
    if (name) {
      setUser(name);
      return;
    }
    // Purani kharab value (jaise "undefined") saaf karo, session rakho.
    localStorage.removeItem('username');
    setUser(FALLBACK_NAME);
  }, []);

  const login = (username, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);

    const name = cleanName(username);
    if (name) {
      localStorage.setItem('username', name);
    } else {
      localStorage.removeItem('username');
    }
    setUser(name || FALLBACK_NAME);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
