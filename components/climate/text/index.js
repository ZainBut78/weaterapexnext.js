// Climate pages ka text — har zaban ki apni file (wahi API, apni grammar).
// Server components (CityByMonth / MonthGuide / CountryClimate + metadata).
import en from './en';
import de from './de';
import it from './it';
import ja from './ja';
import fr from './fr';
import es from './es';

const TEXTS = { en, de, it, ja, fr, es };

export function climateText(lang) {
  return TEXTS[lang] || en;
}
