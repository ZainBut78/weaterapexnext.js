// Use-case pages ka text, 6 zabanein (Nov 2026). Har file mein: common + har use case.
import en from './en';
import de from './de';
import fr from './fr';
import it from './it';
import es from './es';
import ja from './ja';

const TEXT = { en, de, fr, it, es, ja };

export const useCaseText = (lang) => TEXT[lang] || en;
