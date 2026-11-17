// Saari 6 zabanein ek saath: SIRF server aur tests ke liye (widget, pehla render). Browser copy box
// yeh file import nahi karta; woh zaroorat par ./<lang>.js dynamic import karta hai (EmbedBox.jsx).
import en from './en.js';
import de from './de.js';
import fr from './fr.js';
import it from './it.js';
import es from './es.js';
import ja from './ja.js';

export const CODE_TEXT = { en, de, fr, it, es, ja };
export const codeText = (lang) => CODE_TEXT[lang] || en;
