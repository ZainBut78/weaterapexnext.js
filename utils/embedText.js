// ─────────────────────────────────────────────────────────────
//  Embed widget ka text, 6 zabanein (Nov 2026). Chhote labels: widget 300px chauda bhi ho sakta hai.
//  Numbers utils/embedWidget.js mein format hote hain; yahan sirf jumle.
// ─────────────────────────────────────────────────────────────
import { codeText } from './embedCodeText/index.js';
import { fillTitle } from './embedConst.js';

const en = {
  period: (from, to) => `${from}–${to} averages`,
  high: 'Average high', low: 'Average low', rainyDays: 'Rainy days', rainfall: 'Rainfall',
  chance: (pct) => `Rain on ${pct}% of days`, sun: (h) => `${h} h of sun a day`,
  best: 'Best months', avoid: 'Least pleasant',
  recordsTitle: 'Records', oddsTitle: 'Odds',
  record: { warm: 'Warmest', cold: 'Coolest', wet: 'Wettest', dry: 'Driest' },
  years: (n) => `${n} years`,
  odds: {
    rainy: (c, n, t) => `${c} of ${n} years: ${t}+ rainy days`,
    anyrain: (c, n) => `${c} of ${n} years: at least 1 rainy day`,
    dry: (c, n, t) => `${c} of ${n} years: under ${t} mm of rain`,
    warm: (c, n, t) => `${c} of ${n} years: average high ${t} °C or more`,
    cool: (c, n, t) => `${c} of ${n} years: average high under ${t} °C`,
  },
  wearTitle: 'What to wear',
  band: { winter: 'Winter clothes', cold: 'Warm layers', mild: 'Light layers', warm: 'Light clothes', hot: 'Light, loose clothes' },
  pack: { layers: 'layers for cooler evenings', rain: 'umbrella', sun: 'sun protection', jacket: 'light jacket', warm: 'hat and gloves', shoes: 'waterproof shoes', shades: 'sunglasses' },
  legend: { rain: 'Rain (mm)', high: 'High', low: 'Low' },
  monthLink: (city, month) => `${city} weather in ${month} — WeatherApex`,
  yearLink: (city) => `${city} weather by month — WeatherApex`,
  trip: 'Plan your trip dates → Trip Planner',
  events: 'Planning an event? → Event weather',
  data: 'Weather data by Open-Meteo.com',
  unavailable: 'Weather data is temporarily unavailable. Please try again shortly.',
  notFound: 'This widget does not exist.',
};

const de = {
  period: (from, to) => `Durchschnitt ${from}–${to}`,
  high: 'Mittleres Maximum', low: 'Mittleres Minimum', rainyDays: 'Regentage', rainfall: 'Niederschlag',
  chance: (pct) => `Regen an ${pct} % der Tage`, sun: (h) => `${h} Std. Sonne pro Tag`,
  best: 'Beste Monate', avoid: 'Weniger angenehm',
  recordsTitle: 'Rekorde', oddsTitle: 'Chancen',
  record: { warm: 'Am wärmsten', cold: 'Am kühlsten', wet: 'Am nassesten', dry: 'Am trockensten' },
  years: (n) => `${n} Jahre`,
  odds: {
    rainy: (c, n, t) => `${c} von ${n} Jahren: ${t}+ Regentage`,
    anyrain: (c, n) => `${c} von ${n} Jahren: mindestens 1 Regentag`,
    dry: (c, n, t) => `${c} von ${n} Jahren: unter ${t} mm Regen`,
    warm: (c, n, t) => `${c} von ${n} Jahren: Maximum ${t} °C oder mehr`,
    cool: (c, n, t) => `${c} von ${n} Jahren: Maximum unter ${t} °C`,
  },
  wearTitle: 'Was anziehen',
  band: { winter: 'Winterkleidung', cold: 'Warme Schichten', mild: 'Leichte Schichten', warm: 'Leichte Kleidung', hot: 'Leichte, luftige Kleidung' },
  pack: { layers: 'Schichten für kühlere Abende', rain: 'Regenschirm', sun: 'Sonnenschutz', jacket: 'leichte Jacke', warm: 'Mütze und Handschuhe', shoes: 'wasserfeste Schuhe', shades: 'Sonnenbrille' },
  legend: { rain: 'Regen (mm)', high: 'Max.', low: 'Min.' },
  monthLink: (city, month) => `Wetter in ${city} im ${month} — WeatherApex`,
  yearLink: (city) => `Wetter in ${city} nach Monaten — WeatherApex`,
  trip: 'Reisedaten planen → Reiseplaner',
  events: 'Event geplant? → Event-Wetter',
  data: 'Wetterdaten von Open-Meteo.com',
  unavailable: 'Die Wetterdaten sind gerade nicht verfügbar. Bitte gleich noch einmal versuchen.',
  notFound: 'Dieses Widget gibt es nicht.',
};

const fr = {
  period: (from, to) => `Moyennes ${from}–${to}`,
  high: 'Max. moyen', low: 'Min. moyen', rainyDays: 'Jours de pluie', rainfall: 'Précipitations',
  chance: (pct) => `Pluie ${pct} % des jours`, sun: (h) => `${h} h de soleil par jour`,
  best: 'Meilleurs mois', avoid: 'Moins agréables',
  recordsTitle: 'Records', oddsTitle: 'Probabilités',
  record: { warm: 'Le plus chaud', cold: 'Le plus frais', wet: 'Le plus pluvieux', dry: 'Le plus sec' },
  years: (n) => `${n} années`,
  odds: {
    rainy: (c, n, t) => `${c} années sur ${n} : ${t} jours de pluie ou plus`,
    anyrain: (c, n) => `${c} années sur ${n} : au moins 1 jour de pluie`,
    dry: (c, n, t) => `${c} années sur ${n} : moins de ${t} mm de pluie`,
    warm: (c, n, t) => `${c} années sur ${n} : max. moyen de ${t} °C ou plus`,
    cool: (c, n, t) => `${c} années sur ${n} : max. moyen sous ${t} °C`,
  },
  wearTitle: 'Que porter',
  band: { winter: 'Vêtements d’hiver', cold: 'Couches chaudes', mild: 'Couches légères', warm: 'Vêtements légers', hot: 'Vêtements légers et amples' },
  pack: { layers: 'couches pour les soirées fraîches', rain: 'parapluie', sun: 'protection solaire', jacket: 'veste légère', warm: 'bonnet et gants', shoes: 'chaussures imperméables', shades: 'lunettes de soleil' },
  legend: { rain: 'Pluie (mm)', high: 'Max.', low: 'Min.' },
  monthLink: (city, month) => `Météo à ${city} en ${month} — WeatherApex`,
  yearLink: (city) => `Météo à ${city} mois par mois — WeatherApex`,
  trip: 'Planifiez vos dates → Planificateur de voyage',
  events: 'Un événement à prévoir ? → Météo des événements',
  data: 'Données météo : Open-Meteo.com',
  unavailable: 'Les données météo sont momentanément indisponibles. Réessayez dans un instant.',
  notFound: 'Ce widget n’existe pas.',
};

const it = {
  period: (from, to) => `Medie ${from}–${to}`,
  high: 'Massima media', low: 'Minima media', rainyDays: 'Giorni di pioggia', rainfall: 'Pioggia',
  chance: (pct) => `Pioggia nel ${pct}% dei giorni`, sun: (h) => `${h} h di sole al giorno`,
  best: 'Mesi migliori', avoid: 'Meno piacevoli',
  recordsTitle: 'Record', oddsTitle: 'Probabilità',
  record: { warm: 'Più caldo', cold: 'Più fresco', wet: 'Più piovoso', dry: 'Più secco' },
  years: (n) => `${n} anni`,
  odds: {
    rainy: (c, n, t) => `${c} anni su ${n}: ${t}+ giorni di pioggia`,
    anyrain: (c, n) => `${c} anni su ${n}: almeno 1 giorno di pioggia`,
    dry: (c, n, t) => `${c} anni su ${n}: meno di ${t} mm di pioggia`,
    warm: (c, n, t) => `${c} anni su ${n}: massima di ${t} °C o più`,
    cool: (c, n, t) => `${c} anni su ${n}: massima sotto i ${t} °C`,
  },
  wearTitle: 'Cosa indossare',
  band: { winter: 'Abiti invernali', cold: 'Strati caldi', mild: 'Strati leggeri', warm: 'Abiti leggeri', hot: 'Abiti leggeri e larghi' },
  pack: { layers: 'strati per le sere più fresche', rain: 'ombrello', sun: 'protezione solare', jacket: 'giacca leggera', warm: 'cappello e guanti', shoes: 'scarpe impermeabili', shades: 'occhiali da sole' },
  legend: { rain: 'Pioggia (mm)', high: 'Max', low: 'Min' },
  monthLink: (city, month) => `Meteo a ${city} a ${month} — WeatherApex`,
  yearLink: (city) => `Meteo a ${city} mese per mese — WeatherApex`,
  trip: 'Pianifica le date → Pianificatore di viaggio',
  events: 'Organizzi un evento? → Meteo per eventi',
  data: 'Dati meteo: Open-Meteo.com',
  unavailable: 'I dati meteo non sono disponibili al momento. Riprova tra poco.',
  notFound: 'Questo widget non esiste.',
};

const es = {
  period: (from, to) => `Medias ${from}–${to}`,
  high: 'Máxima media', low: 'Mínima media', rainyDays: 'Días de lluvia', rainfall: 'Lluvia',
  chance: (pct) => `Llueve el ${pct} % de los días`, sun: (h) => `${h} h de sol al día`,
  best: 'Mejores meses', avoid: 'Menos agradables',
  recordsTitle: 'Récords', oddsTitle: 'Probabilidades',
  record: { warm: 'Más cálido', cold: 'Más fresco', wet: 'Más lluvioso', dry: 'Más seco' },
  years: (n) => `${n} años`,
  odds: {
    rainy: (c, n, t) => `${c} de ${n} años: ${t} o más días de lluvia`,
    anyrain: (c, n) => `${c} de ${n} años: al menos 1 día de lluvia`,
    dry: (c, n, t) => `${c} de ${n} años: menos de ${t} mm de lluvia`,
    warm: (c, n, t) => `${c} de ${n} años: máxima de ${t} °C o más`,
    cool: (c, n, t) => `${c} de ${n} años: máxima por debajo de ${t} °C`,
  },
  wearTitle: 'Qué ponerse',
  band: { winter: 'Ropa de invierno', cold: 'Capas de abrigo', mild: 'Capas ligeras', warm: 'Ropa ligera', hot: 'Ropa ligera y holgada' },
  pack: { layers: 'capas para las noches frescas', rain: 'paraguas', sun: 'protección solar', jacket: 'chaqueta ligera', warm: 'gorro y guantes', shoes: 'calzado impermeable', shades: 'gafas de sol' },
  legend: { rain: 'Lluvia (mm)', high: 'Máx.', low: 'Mín.' },
  monthLink: (city, month) => `El tiempo en ${city} en ${month} — WeatherApex`,
  yearLink: (city) => `El tiempo en ${city} mes a mes — WeatherApex`,
  trip: 'Planifica tus fechas → Planificador de viajes',
  events: '¿Organizas un evento? → El tiempo para eventos',
  data: 'Datos meteorológicos: Open-Meteo.com',
  unavailable: 'Los datos del tiempo no están disponibles ahora. Inténtalo de nuevo en un momento.',
  notFound: 'Este widget no existe.',
};

const ja = {
  period: (from, to) => `${from}〜${to}年の平均`,
  high: '平均最高気温', low: '平均最低気温', rainyDays: '雨の日', rainfall: '降水量',
  chance: (pct) => `${pct}%の日に雨`, sun: (h) => `日照 1日${h}時間`,
  best: 'おすすめの月', avoid: '過ごしにくい月',
  recordsTitle: '記録', oddsTitle: '確率',
  record: { warm: '最も暖かい年', cold: '最も涼しい年', wet: '最も雨の多い年', dry: '最も雨の少ない年' },
  years: (n) => `${n}年`,
  odds: {
    rainy: (c, n, t) => `${n}年中${c}年：雨の日が${t}日以上`,
    anyrain: (c, n) => `${n}年中${c}年：雨の日が1日以上`,
    dry: (c, n, t) => `${n}年中${c}年：降水量${t}mm未満`,
    warm: (c, n, t) => `${n}年中${c}年：平均最高気温${t}℃以上`,
    cool: (c, n, t) => `${n}年中${c}年：平均最高気温${t}℃未満`,
  },
  wearTitle: '服装',
  band: { winter: '冬服', cold: '暖かい重ね着', mild: '薄手の重ね着', warm: '軽い服装', hot: '通気性のよい軽い服' },
  pack: { layers: '涼しい夜の羽織り', rain: '傘', sun: '日焼け対策', jacket: '薄手のジャケット', warm: '帽子と手袋', shoes: '防水の靴', shades: 'サングラス' },
  legend: { rain: '降水量（mm）', high: '最高', low: '最低' },
  monthLink: (city, month) => `${city}の${month}の天気 — WeatherApex`,
  yearLink: (city) => `${city}の月別の天気 — WeatherApex`,
  trip: '旅行の日程を計画 → 旅行プランナー',
  events: 'イベントの予定は？ → イベントの天気',
  data: '気象データ：Open-Meteo.com',
  unavailable: '現在、気象データを表示できません。しばらくしてから、もう一度お試しください。',
  notFound: 'このウィジェットはありません。',
};

const TEXT = { en, de, fr, it, es, ja };
// Titles copy code wale text se (utils/embedCodeText), taake widget aur copy code ka title ek hi rahe
for (const [lang, T] of Object.entries(TEXT)) {
  const C = codeText(lang);
  T.titleMonth = (city, month) => fillTitle(C.titleMonth, city, month);
  T.titleYear = (city) => fillTitle(C.titleYear, city);
}
export const embedText = (lang) => TEXT[lang] || en;
