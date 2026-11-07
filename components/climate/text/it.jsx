// ─────────────────────────────────────────────────────────────
//  Climate pages — ITALIANO (i18n Phase 3). Stessa API di ./en.jsx.
//  Keyword (Semrush): «Meteo {città} {mese}», «Quando andare a/in …»,
//  «Periodo migliore per andare in/a {luogo}».
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';
import { UnitTemp } from '../UnitText';
import UnitTempShort from '../UnitTempShort';
import { inCity, inCountry } from '@/i18n/places';
import { intlHelpers, cap } from './common';
import { makeStory } from './story';

const h = intlHelpers('it');
const fit = (max, ...opts) => opts.find((o) => o.length <= max) || opts[opts.length - 1];
const S = ({ children }) => <strong className="text-gray-900">{children}</strong>;

const VERDICT = { Great: 'Ottimo', Good: 'Buono', Fair: 'Discreto', Poor: 'Scarso' };
const ORD = ['', '', 'secondo ', 'terzo ', 'quarto ', 'quinto ', 'sesto '];
const KIND = { warmest: 'più caldo', coolest: 'più fresco', wettest: 'più piovoso', driest: 'più secco' };
const SEASON = {
  winter: { early: 'inizio inverno', mid: 'pieno inverno', late: 'fine inverno' },
  spring: { early: 'inizio primavera', mid: 'piena primavera', late: 'tarda primavera' },
  summer: { early: 'inizio estate', mid: 'piena estate', late: 'fine estate' },
  autumn: { early: 'inizio autunno', mid: 'pieno autunno', late: 'tardo autunno' },
};
// "a maggio" — "ad" solo davanti ad "a" (ad aprile, ad agosto; a ottobre)
const aM = (m) => (/^a/i.test(m) ? `ad ${m}` : `a ${m}`);
// "il 75%" ma "l'82%", "l'11%" (articolo davanti a numeri che iniziano per vocale)
const pct = (n) => (/^(8|11(\D|$))/.test(String(n)) ? `l'${n}%` : `il ${n}%`);
const hm = (mins) => {
  const m = Math.round(Math.abs(mins));
  const H = Math.floor(m / 60);
  const r = m % 60;
  return H ? (r ? `${H} h ${r} min` : `${H} h`) : `${r} min`;
};
const reasonText = (r) => {
  const n = h.n1(r.n);
  return {
    cold: 'giornate fredde', chilly: 'giornate fresche', 'mild-cool': 'giornate miti ma fresche', comfortable: 'temperature piacevoli',
    warm: 'giornate da calde a molto calde', hot: 'giornate molto calde', 'very-hot': 'giornate torride', frost: 'notti sotto lo zero',
    'snow-most': `neve o pioggia quasi tutti i giorni (circa ${n})`, 'snow-frequent': `neve o pioggia frequenti (circa ${n} giorni bagnati)`, 'snow-some': `alcuni giorni di neve o pioggia (circa ${n})`,
    'rain-most': `pioggia quasi tutti i giorni (circa ${n})`, 'rain-frequent': `pioggia frequente (circa ${n} giorni di pioggia)`,
    'rain-some': `alcuni giorni di pioggia (circa ${n})`, dry: r.n < 0.5 ? 'quasi senza pioggia' : `per lo più asciutto (circa ${n} ${r.n === 1 ? 'giorno' : 'giorni'} di pioggia)`,
    heavy: `piogge abbondanti (${n} mm)`, dull: `poco sole (${n} h al giorno)`, sunny: `tanto sole (${n} h al giorno)`,
  }[r.key || r.t] || '';
};
const SUIT = { sightseeing: 'Visite in città', parks: 'Parchi e aria aperta', beach: 'Spiaggia', hiking: 'Escursioni', indoor: 'Musei e al chiuso' };
const PACK = { shoes: 'Scarpe impermeabili', layers: 'Vestirsi a strati', rain: 'Protezione dalla pioggia', sun: 'Protezione dal sole', jacket: 'Giacca leggera', warm: 'Abiti caldi', shades: 'Occhiali da sole', light: 'Abiti leggeri' };

const P = {
  month: h.month,
  list: h.list,
  n1: h.n1,
  hm,
  verdict: (l) => VERDICT[l] || l,
  packTitle: (p) => PACK[p.key] || p.title,
  inCity: (city) => inCity('it', city),
  rank: (kind, r) => `il ${ORD[r] || ''}mese ${KIND[kind]}`,
  rainyDays: (n) => `${h.n1(n)} ${Number(n) === 1 ? 'giorno' : 'giorni'} di pioggia`,
  sunHours: (n) => `${h.n1(n)} ore di sole`,
  mm: (n) => `${h.n0(n)} mm`,
  perDay: (v) => `circa ${h.n1(v)} mm`,
  often: (o) => ({ most: 'quasi tutti i giorni', everyOther: 'circa un giorno sì e uno no', never: 'quasi mai', oneIn: `circa un giorno ogni ${o.k}` }[o.key]),

  hero: ({ monthN, place, y, feelK, rainK }) => {
    const feel = { freezing: 'gelidi', cold: 'freddi', chilly: 'freddini', cool: 'freschi', mild: 'miti', warm: 'caldi', hot: 'molto caldi', 'very-hot': 'torridi' }[feelK] || 'tipici';
    const rain = { dry: 'poca pioggia', occasional: 'pioggia occasionale', showery: 'rovesci regolari', wet: 'pioggia quasi tutti i giorni', wintry: 'pioggia o neve in molti giorni' }[rainK];
    return `${place} ${aM(monthN)}: pomeriggi ${feel} e ${rain}, secondo le medie ${y}.`;
  },
  quick: ({ monthN, cityN, hi, lo, days, mm, sun, feelK, rainK, sunK }) => {
    const lead = { freezing: 'Un mese gelido', cold: 'Un mese freddo', chilly: 'Un mese freddino', cool: 'Un mese fresco', mild: 'Un mese mite', warm: 'Un mese caldo', hot: 'Un mese molto caldo', 'very-hot': 'Un mese torrido' }[feelK] || 'Un mese tipico';
    const rain = { dry: <>pochissima pioggia ({mm})</>, some: <>circa {days} ({mm})</>, wet: <>circa {days} ({mm} in totale)</> }[rainK];
    const shine = { low: <>solo {sun} al giorno</>, mid: <>{sun} al giorno</>, high: <>ben {sun} al giorno</> }[sunK];
    return <>{lead} per {cityN}: {aM(monthN)} le massime sono in media {hi} e le minime {lo}, con {rain} e {shine}.</>;
  },
  tableExtreme: ({ monthN, inCity, warmest, rainTxt }) => <>{cap(monthN)} è <strong>il mese più {warmest ? 'caldo' : 'fresco'}</strong> {inCity}{rainTxt && <>; per la pioggia è {rainTxt}</>}.</>,
  tableNormal: ({ monthN, inCity, warmer, k, rainTxt, band }) => ({
    high: <>Solo {k} {k === 1 ? 'mese è più caldo' : 'mesi sono più caldi'} di {monthN} {inCity}{rainTxt && <>; per la pioggia è {rainTxt}</>}.</>,
    mid: <>{cap(monthN)} è più caldo di <strong>{warmer} degli altri 11 mesi</strong>{rainTxt && <>, ed è {rainTxt} {inCity}</>}.</>,
    low: <>Per temperatura, {monthN} supera solo <strong>{warmer} degli altri 11</strong> mesi{rainTxt && <>, ed è {rainTxt} dell&apos;anno</>}.</>,
  }[band]),
  feelLine: ({ feelK, hi, pos, peakN, delta, wet }) => {
    const open = feelK === 'freezing' ? <>Di pomeriggio si superano a fatica {hi}</> : ['hot', 'very-hot'].includes(feelK) ? <>Di pomeriggio si toccano {hi}</> : <>Di pomeriggio si arriva a circa {hi}</>;
    const where = {
      peak: ', il valore più alto dell\'anno',
      trough: ', il valore più basso dell\'anno',
      nearPeak: <>, vicino al massimo di {peakN}</>,
      nearTrough: ', vicino al valore più basso dell\'anno',
      flat: ', quasi come in ogni altro mese qui',
      middle: <>, circa {delta} sotto il massimo di {peakN}</>,
    }[pos] || '';
    const advice = {
      freezing: 'anche a mezzogiorno sembra pieno inverno',
      cold: 'cappotto e sciarpa dalla mattina alla sera',
      chilly: 'si cammina bene con una vera giacca',
      cool: 'piacevole per camminare con uno strato in più',
      mild: 'comodo con abiti leggeri',
      warm: 'abbastanza caldo per le maniche corte',
      hot: 'le visite riescono meglio la mattina o la sera',
      'very-hot': 'stare a lungo fuori stanca, quindi conviene organizzarsi intorno al pomeriggio',
    }[feelK];
    return <>{open}{where}: {advice}{wet ? ', tra un rovescio e l\'altro' : ''}.</>;
  },
  nightLine: ({ night, swing, lo, delta }) => {
    const gap = {
      tiny: 'appena meno che nel pomeriggio',
      small: <>circa {delta} in meno rispetto al pomeriggio</>,
      moderate: <>{delta} in meno rispetto al pomeriggio</>,
      clear: <>ben {delta} in meno rispetto al pomeriggio</>,
      big: <>un forte calo di {delta} rispetto al pomeriggio</>,
    }[swing];
    const tail = {
      'hard-frost': ', ben sotto lo zero',
      frosty: ', quindi il gelo è frequente',
      cold: ', quindi le mattine iniziano fredde',
      cool: ', quindi la sera serve uno strato in più',
      mild: ', ancora piacevole all\'aperto',
      warm: ', ancora abbastanza caldo per le maniche corte',
      sultry: ', quindi il caldo concede poca tregua',
    }[night];
    return <>Di notte si scende a circa {lo}, {gap}{tail}.</>;
  },
  humLine: ({ caseK, h: hum, rel }) => {
    const r = { above: ', più umido del solito qui', below: ', più secco del solito qui' }[rel] || '';
    const t = {
      veryHumidHot: 'l\'aria è afosa e sembra più caldo di quanto dica il termometro',
      dampCold: 'l\'aria umida rende il freddo più pungente',
      dampCool: 'l\'aria umida fa sembrare più freddo un giorno fresco, soprattutto con il vento',
      humidHot: 'i momenti di caldo risultano un po\' appiccicosi',
      humidMild: 'l\'aria è umida, ma a queste temperature raramente pesa',
      dryHot: 'il caldo è secco, quindi conviene bere più di quanto sembri',
      dry: 'pelle e labbra possono risentire dell\'aria secca',
      comfortCold: 'l\'aria non è né umida né secca, quindi il freddo resta asciutto',
      comfortMild: 'l\'aria non è né appiccicosa né secca',
      comfortHot: 'il caldo raramente risulta appiccicoso',
    }[caseK];
    return `L'umidità media è ${pct(h.n0(hum))}${r}: ${t}.`;
  },
  rainLine: ({ freq, never, days, n, inCity, top }) => {
    const base = never ? 'Non piove quasi mai' : {
      dry: `La pioggia è rara, circa ${days} giorni bagnati su ${n}`,
      occasional: `Piove circa ${days} giorni su ${n}`,
      showery: `Aspettati pioggia circa ${days} giorni su ${n}, con pause asciutte nel mezzo`,
      wet: `La pioggia cade circa ${days} giorni su ${n}`,
    }[freq];
    const t = !top ? '' : top.first ? `, il che lo rende il mese ${KIND[top.kind]} ${inCity}` : `, tra i tre mesi ${top.kind === 'wettest' ? 'più piovosi' : 'più secchi'} dell'anno`;
    return `${base}${t}`;
  },
  rainJoin: '; ',
  stop: '.',
  rainSizeLine: ({ per, sizeK, vs, year }) => {
    const kind = {
      lightCool: 'soprattutto pioviggine fredda',
      lightWarm: 'di solito un breve rovescio',
      moderateCool: 'pioggia continua più che un rovescio passeggero',
      moderateWarm: 'abbastanza da bagnarsi senza ombrello',
      heavyCool: 'una bella inzuppata',
      heavyWarm: 'spesso sotto forma di forti acquazzoni',
    }[sizeK];
    const cmp = { heavier: `, più dei ${year} mm abituali della città`, lighter: `, meno dei ${year} mm abituali della città`, typical: `, vicino ai ${year} mm abituali della città` }[vs] || '';
    return `i giorni bagnati portano ${per}: ${kind}${cmp}.`;
  },
  snowNote: { snow: 'Con queste temperature, buona parte cade probabilmente come neve.', mixed: 'Una parte può cadere come nevischio o neve.' },
  dayLine: ({ monthN, cityN, rise, set, len, band, dir, amt, pm }) => {
    const lead = { long: 'Giornate lunghe: a metà', short: 'Giornate corte: a metà', normal: 'A metà' }[band] || 'A metà';
    const chg = { barely: `, più o meno come a metà ${pm}`, shorter: `, ${amt} in meno rispetto a metà ${pm}`, longer: `, ${amt} in più rispetto a metà ${pm}` }[dir];
    return `${lead} ${monthN}, ${cityN} ha ${len} di luce, dall'alba verso le ${rise} al tramonto verso le ${set}${chg}.`;
  },
  sunLine: ({ share, skyK, rel }) => {
    const r = { above: ', sul lato più soleggiato dell\'anno qui', below: ', sul lato più grigio dell\'anno qui' }[rel] || '';
    const sky = { cloudy: 'il cielo è spesso nuvoloso', mixed: 'sole e nuvole si dividono la giornata', bright: 'ci sono molte schiarite', clear: 'il cielo è per lo più sereno', showery: 'aspettati schiarite tra un rovescio e l\'altro', clearDry: 'il cielo è per lo più sereno e la pioggia è rara', clearSome: 'il cielo è per lo più sereno tra i giorni di pioggia', brightSome: 'aspettati schiarite tra i giorni di pioggia' }[skyK];
    return `Secondo le stime del modello il sole copre circa ${pct(share)} delle ore di luce${r}, quindi ${sky}.`;
  },
  cmpRain: (rain) => (rain === 0 ? ', con circa la stessa pioggia' : `, con ${h.n0(Math.abs(rain))} mm di pioggia in ${rain > 0 ? 'più' : 'meno'}`),
  cmpLine: ({ monthN, rankTxt, prevN, delta, warmer, mag, same, rainTxt }) => {
    const first = rankTxt ? `${cap(monthN)} è ${rankTxt} dell'anno` : cap(monthN);
    if (same) return <>{first}, e fa caldo più o meno come {aM(prevN)}{rainTxt}.</>;
    const size = { slight: 'solo ', big: 'ben ', plain: '' }[mag];
    return <>{first}; i pomeriggi sono {size}{delta} più {warmer ? 'caldi' : 'freschi'} rispetto a {prevN}{rainTxt}.</>;
  },
  nextLine: ({ trendK, nextN, temp, rainDir }) => {
    const base = {
      peak: <>Poi l&apos;anno gira: {nextN} è già più fresco, con massime vicine a {temp}</>,
      trough: <>Questo è il punto più basso: {nextN} risale a circa {temp}</>,
      warming: <>Le temperature continuano a salire verso {nextN}, fino a circa {temp}</>,
      cooling: <>Le temperature continuano a scendere verso {nextN}, fino a circa {temp}</>,
      flat: <>Le temperature cambiano appena verso {nextN}, intorno a {temp}</>,
    }[trendK];
    const r = { wetter: ', e piove di più', drier: ', e piove di meno' }[rainDir] || '';
    return <>{base}{r}.</>;
  },
  suitWhy: {
    sightseeing: {
      ok: 'le temperature diurne sono adatte per camminare', okCool: 'comodo a piedi con una giacca', okWarm: 'caldo ma gestibile per una passeggiata in città',
      rainSnow: 'piove o nevica in più della metà dei giorni', rainMostSnow: 'piove o nevica nella maggior parte dei giorni', rain: 'piove in più della metà dei giorni', rainMost: 'piove nella maggior parte dei giorni', hot: 'il caldo di mezzogiorno rende difficili le lunghe camminate', cold: 'fa freddo per le lunghe passeggiate', coldHard: 'troppo freddo per le lunghe passeggiate',
    },
    parks: {
      ok: 'piacevole per lunghe passeggiate e picnic', okCool: 'piacevole con uno strato leggero',
      hot: 'i pomeriggi sono troppo caldi per trattenersi fuori', hotHard: 'i pomeriggi sono davvero troppo caldi per sedersi fuori',
      cold: 'troppo freddo per stare seduti fuori a lungo', coldHard: 'davvero troppo freddo per sedersi fuori', coldMild: 'un po\' troppo fresco per stare seduti fuori a lungo',
      rain: 'la pioggia interrompe i piani all\'aperto', rainMost: 'la pioggia interrompe la maggior parte dei piani all\'aperto',
    },
    beach: { ok: 'caldo e per lo più asciutto sulla costa', hot: 'caldo sulla costa', cold: 'l\'aria di mare è troppo fresca', coldHard: 'davvero troppo freddo per la spiaggia', rain: 'troppi giorni di pioggia', rainMost: 'pioggia quasi tutti i giorni' },
    hiking: { ok: 'temperature miti per i sentieri', cold: 'i sentieri sono freschi', coldHard: 'i sentieri sono freddi, quindi meglio coprirsi', hot: 'troppo caldo per lunghe escursioni', rain: 'sentieri bagnati', rainMost: 'i sentieri restano bagnati' },
    indoor: { rainSnow: 'con pioggia o neve quasi tutti i giorni, gallerie e musei sono una scelta facile', rain: 'con pioggia quasi tutti i giorni, gallerie e musei sono una scelta facile', hot: 'una pausa fresca nelle ore più calde', cold: 'posti caldi per le ore più fredde' },
  },
  tips: {
    layers: {
      big: 'Pomeriggio e notte sono molto lontani come temperatura: porta capi da togliere a mezzogiorno e rimettere al tramonto.',
      cold: 'Mattina e sera fa freddo rispetto a mezzogiorno, quindi vestiti a strati.',
      mild: 'Le giornate sono nettamente più calde delle notti: porta strati da aggiungere o togliere.',
    },
    rain: {
      showeryLight: 'I rovesci sono di solito leggeri, basta un ombrello compatto.',
      showeryModerate: 'Tieni un piccolo ombrello in borsa per i giorni di pioggia.',
      showeryHeavy: 'Quando piove può farlo con forza: porta una giacca impermeabile leggera.',
      wetLight: 'La pioviggine è frequente, una giacca antipioggia ripiegabile torna utile.',
      wetModerate: 'Piove spesso: giacca impermeabile e scarpe che reggono le pozzanghere.',
      wetHeavy: 'Piove spesso e forte: un buon impermeabile e scarpe ad asciugatura rapida.',
      wintry: 'Pioggia o neve sono frequenti: giacca impermeabile e stivali con buona presa.',
    },
    sun: {
      extreme: 'Caldo estremo: cappello, crema solare, abiti larghi e molta acqua.',
      humid: 'Abiti larghi e traspiranti, più crema solare e cappello a tesa larga.',
      dry: 'Proteggiti dal sole forte e dall\'aria secca: cappello, crema solare e molta acqua.',
      clear: 'Crema solare, cappello e occhiali da sole; abiti leggeri e traspiranti.',
    },
    jacket: {
      cold: 'Una giacca per il freddo del mattino, facile da portare dopo.',
      cool: 'Una giacca leggera o un capo in maglia bastano per gran parte della giornata.',
      mild: 'Porta un maglione o un cappotto leggero per i pomeriggi freschi.',
    },
    warm: {
      freezing: 'Un vero cappotto invernale, guanti e cappello, più scarpe calde per i marciapiedi ghiacciati.',
      cold: 'Un vero cappotto invernale, con guanti e cappello per le uscite mattutine.',
      frost: 'Una giacca calda, cappello e guanti per le mattine di gelo.',
      chilly: 'Una giacca calda e un cappello per mattine e sere fredde.',
    },
    shades: {
      clear: 'Il cielo sereno è comune, occhiali da sole e cappello leggero valgono il posto in valigia.',
      bright: 'Le schiarite sono comuni, quindi porta occhiali da sole e un berretto.',
      mixed: 'Il sole va e viene, ma gli occhiali da sole meritano comunque un posto in borsa.',
    },
    light: { any: 'Abiti comodi e uno strato leggero per la sera.' },
    shoes: { any: 'Con tanti giorni bagnati servono scarpe che reggano le pozzanghere e si asciughino in fretta.', heavy: 'Molta pioggia forte: scarpe impermeabili e un paio di calze di ricambio.', snow: 'Stivali impermeabili con buona presa per marciapiedi bagnati o ghiacciati.' },
  },
  a1: ({ hi, lo, feel, warmRank }) => <>I pomeriggi sono in media {hi} e le notti circa {lo}: un clima {feel} per la maggior parte delle persone{warmRank && <>; è {warmRank} dell&apos;anno</>}.</>,
  a2: {
    never: ({ monthN, none }) => <>Quasi mai: {monthN} è praticamente senza pioggia, {none ? 'senza giorni di pioggia' : 'con circa un giorno di pioggia'} in un anno tipico.</>,
    dry: ({ daysTxt, mm }) => <>No: solo circa {daysTxt} e {h.n0(mm)} mm in tutto il mese.</>,
    yes: ({ mm, often, sizeK }) => <>Sì: piove {often} per un totale di circa {h.n0(mm)} mm{{ light: ', per lo più leggera', moderate: ', quindi l\'ombrello è utile', heavy: ', spesso con forza, quindi conviene prevedere qualche piano al chiuso' }[sizeK]}.</>,
    some: ({ daysTxt, mm, light }) => <>Non particolarmente: circa {daysTxt} ({h.n0(mm)} mm), per lo più pioggia {light ? 'leggera' : 'moderata'}.</>,
  },
  a3: ({ list, eve, cold }) => ({
    cool: <>Porta {list}, più uno strato per le mattine e le sere {cold ? 'fredde' : 'fresche'}.</>,
    same: <>Porta {list}; le sere sono simili al giorno, quindi vanno bene gli stessi abiti.</>,
    warm: <>Porta {list}; anche dopo il tramonto resta caldo, quindi non serve uno strato in più.</>,
  }[eve]),
  a4: ({ win, ranks, labels, whyTxt, narrow }) => <>{cap(win)} ottiene un punteggio {narrow ? 'di poco' : 'nettamente'} migliore nella nostra classifica climatica (n. {ranks.a} su 12 contro n. {ranks.b}){labels ? `, con «${labels[0]}» contro «${labels[1]}»` : ''}.{whyTxt}</>,
  season: {
    equator: ({ cityN, monthN }) => [
      `${cityN} si trova vicino all'equatore, quindi non ha un vero inverno né una vera estate: fa caldo tutto l'anno, e ${monthN} non fa eccezione.`,
      `Così vicino all'equatore non esistono quattro stagioni: ${cityN} è calda tutto l'anno, anche ${aM(monthN)}.`,
    ],
    tropical: ({ cityN, monthN }) => [
      `${cityN} si trova ai tropici e resta calda tutto l'anno, senza una netta divisione tra le stagioni.`,
      `Come città tropicale, ${cityN} è calda tutto l'anno; ${monthN} non rientra chiaramente né nella stagione secca né in quella delle piogge.`,
    ],
    wet: ({ cityN, monthN }) => `${cap(monthN)} cade nella stagione delle piogge di ${cityN}: le precipitazioni salgono nettamente sopra quelle dei mesi secchi.`,
    dry: ({ cityN, monthN }) => `${cap(monthN)} fa parte della stagione secca di ${cityN}, quando le piogge scendono molto al di sotto dei mesi umidi.`,
    between: ({ cityN, monthN }) => `${cap(monthN)} si colloca a ${cityN} tra la stagione secca e quella delle piogge.`,
    south: ({ cityN }) => ` (${cityN} si trova nell'emisfero australe, quindi le stagioni sono invertite rispetto all'Europa)`,
    peakSummer: ({ monthN, inCity, south }) => [`${cap(aM(monthN))} ${inCity} è piena estate: il mese più caldo dell'anno${south}.`, `L'estate tocca il culmine ${aM(monthN)}: nessun mese ${inCity} è più caldo${south}.`],
    troughWinter: ({ monthN, inCity, south }) => [`${cap(monthN)} è il periodo più freddo dell'inverno ${inCity}${south}.`, `L'inverno tocca il fondo ${aM(monthN)}, il mese più fresco dell'anno ${inCity}${south}.`],
    warmWinter: ({ monthN, inCity, season, stage, south, feel }) => `${cap(aM(monthN))} ${inCity} è ${SEASON[season][stage]}${south}, anche se qui l'inverno significa giornate ${feel} e non fredde.`,
    normal: ({ monthN, inCity, season, stage, south }) => [
      `${cap(aM(monthN))} ${inCity} è ${SEASON[season][stage]}${south}.`,
      `${cap(inCity)}, ${monthN} porta ${SEASON[season][stage]}${south}.`,
      `Per il calendario, ${monthN} ${inCity} significa ${SEASON[season][stage]}${south}.`,
    ],
  },
  feelWord: { freezing: 'gelido', cold: 'freddo', chilly: 'freddino', cool: 'fresco', mild: 'mite', warm: 'caldo', hot: 'molto caldo', 'very-hot': 'torrido' },
  polar: {
    day: ({ monthN, inCity }) => `A metà ${monthN} ${inCity} il sole non tramonta.`,
    night: ({ monthN, inCity }) => `A metà ${monthN} ${inCity} il sole non sorge sopra l'orizzonte.`,
  },
  equatorDay: "Vicino all'equatore, gli orari di alba e tramonto cambiano molto poco durante l'anno.",
  packPhrase: { shoes: 'scarpe impermeabili', layers: 'abiti a strati', rain: 'protezione dalla pioggia', sun: 'protezione dal sole', jacket: 'una giacca leggera', warm: 'abiti caldi', shades: 'occhiali da sole', light: 'abiti leggeri' },
  wear: {
    title: ({ monthN, inCity }) => `Cosa indossare ${inCity} ${/^[aeiou]/i.test(monthN) ? 'ad' : 'a'} ${monthN}`,
    basis: 'Sono stime basate su medie mensili, quindi ogni temperatura è indicativa.',
    h3: { time: 'In base al momento della giornata', pack: 'Valigia per 7 giorni', year: { normal: 'Anno freddo o caldo', winter: 'Anno freddo o mite', cooler: 'Anno più fresco o più caldo', hot: 'Anno fresco o molto caldo' } },
    at: { morning: (t) => <>Mattina, circa {t}:</>, afternoon: (t) => <>Pomeriggio, circa {t}:</>, evening: (t) => <>Sera, circa {t}:</> },
    morning: { winter: 'un vero cappotto invernale, guanti e un berretto.', cold: 'una giacca calda e un berretto, con uno strato sotto.', mild: 'una giacca leggera o un maglione.', warm: 'abiti leggeri con uno strato sottile per iniziare.', hot: 'abiti leggeri e ampi fin dal mattino.' },
    afternoon: { winter: 'il cappotto resta addosso, anche a mezzogiorno.', cold: 'tieni la giacca per camminare; lo strato in più si può togliere.', mild: 'basta una maglia leggera, con la giacca a portata di mano.', warm: 'bastano abiti leggeri e traspiranti.', warmSun: 'abiti leggeri, un cappello e crema solare.', hot: 'un cappello, crema solare e abiti ampi, con molta acqua.' },
    evening: { ice: 'di nuovo vicino allo zero: tieni tutti gli strati e attenzione ai marciapiedi ghiacciati.', winter: 'tieni tutti gli strati.', cold: 'rimetti lo strato.', mild: 'rimetti la giacca.', warm: 'rimetti lo strato sottile.', warmNight: 'gli stessi abiti leggeri; non serve uno strato in più.', same: 'vanno bene gli stessi abiti, la temperatura cambia appena.' },
    year: {
      normal: ({ monthN, coldY, warmY, cold, warm }) => <>In un anno freddo come il {coldY}, le massime di {monthN} hanno avuto una media di soli {cold}, quindi conviene uno strato caldo in più. In un anno caldo come il {warmY} hanno raggiunto {warm}, e basta uno strato più leggero.</>,
      winter: ({ monthN, coldY, warmY, cold, warm }) => <>In un anno freddo come il {coldY}, le massime di {monthN} hanno avuto una media di soli {cold}, quindi conviene uno strato caldo in più. Anche in un anno mite come il {warmY} hanno raggiunto solo {warm}, quindi il cappotto invernale serve comunque.</>,
      cooler: ({ monthN, coldY, warmY, cold, warm }) => <>In un anno più fresco come il {coldY}, le massime di {monthN} hanno avuto una media di {cold}, quindi conviene uno strato leggero in più. In un anno più caldo come il {warmY} hanno raggiunto {warm}, quindi meglio restare leggeri.</>,
      hot: ({ monthN, coldY, warmY, cold, warm, y1, y2 }) => <>Anche il {monthN} più fresco del periodo {y1}–{y2}, nel {coldY}, ha avuto una media di {cold}, e il più caldo, nel {warmY}, ha raggiunto {warm}. In ogni caso, non serve niente di più caldo.</>,
    },
    wet: {
      none: 'Nessun giorno bagnato in una settimana tipica: l\'attrezzatura da pioggia può restare a casa.',
      some: ({ n, wintry, size, per }) => {
        const tail = !per ? '' : wintry ? <>, tra pioggia e neve, con {per} al giorno</> : size === 'light' ? <>, soprattutto pioggia leggera, con {per} al giorno</> : size === 'heavy' ? <>, spesso forte, con {per} al giorno</> : <>, con {per} al giorno</>;
        return <>Prevedi circa {n} {n === 1 ? 'giorno bagnato' : 'giorni bagnati'} a settimana{tail}.</>;
      },
    },
    items: { coat: 'Un cappotto invernale', coatWet: 'Un cappotto invernale con uno strato esterno impermeabile', midThermal: '2 strati intermedi caldi e uno strato termico', glovesHat: 'Guanti e un berretto', jacketHat: 'Una giacca calda e un berretto', mid2: '2 strati intermedi caldi', lightJacket: 'Una giacca leggera o un maglione', lightLayers: '2 o 3 strati leggeri', lightClothes: 'Abiti leggeri e traspiranti', thinLayer: 'Uno strato sottile per mattina e sera', looseClothes: 'Abiti ampi e traspiranti', rainJacket: 'Una giacca antipioggia compatta', sunKit: 'Un cappello, crema solare e occhiali da sole', shades: 'Occhiali da sole e un cappello leggero', bottle: "Una borraccia d'acqua", boots: 'Stivali caldi con buona aderenza', wpShoes: 'Scarpe impermeabili che si asciugano in fretta', lightShoes: 'Scarpe leggere e traspiranti', walkShoes: 'Scarpe comode da passeggio' },
    trip: { lead: 'Viaggi in date precise?', link: 'Controlla le tue date esatte nel pianificatore di viaggio.' },
  },
  hist: {
    title: ({ monthN, inCity, n }) => `${cap(monthN)} ${inCity}: cosa mostrano ${n} anni`,
    basis: ({ y1, y2 }) => `In base alle medie mensili ${y1}–${y2}, non ai record giornalieri.`,
    h3: { range: 'Intervallo abituale', records: 'Record', odds: 'Frequenza negli anni' },
    to: 'a',
    range: ({ monthN, temps, rainLo, rainHi, wintry }) => <>Nella maggior parte degli anni, {monthN} ha in media {temps} nel pomeriggio, con {rainLo}–{rainHi} mm di {wintry ? 'pioggia o neve' : 'pioggia'}.</>,
    chance: ({ monthN, often, wintry, never }) => (never ? `In un ${monthN} medio non piove quasi mai.` : `In un ${monthN} medio ${wintry ? 'piove o nevica' : 'piove'} ${often}.`),
    caption: ({ monthN, y1, y2 }) => `Record di ${monthN}, ${y1}–${y2} (medie mensili)`,
    th: { record: 'Record', year: 'Anno', high: 'Max media', rain: 'Pioggia', days: 'Giorni di pioggia' },
    record: {
      warm: ({ monthN }) => `${cap(monthN)} più caldo`, cold: ({ monthN }) => `${cap(monthN)} più freddo`, cool: ({ monthN }) => `${cap(monthN)} più fresco`,
      wet: ({ monthN }) => `${cap(monthN)} più piovoso`, dry: ({ monthN }) => `${cap(monthN)} più secco`,
    },
    ties: ({ count, n }) => `${count} anni su ${n}`,
    odds: {
      rainy: ({ monthN, count, n, t, wintry }) => `In ${count} anni su ${n}, ${monthN} ha avuto ${t} o più giorni ${wintry ? 'bagnati' : 'di pioggia'}.`,
      anyrain: ({ monthN, count, n, wintry }) => `In ${count} anni su ${n}, ${monthN} ha avuto almeno un giorno ${wintry ? 'bagnato' : 'di pioggia'}.`,
      dry: ({ count, n, t, wintry }) => `In ${count} anni su ${n}, sono caduti meno di ${t} mm di ${wintry ? 'pioggia o neve' : 'pioggia'}.`,
      warm: ({ count, n, temp }) => <>In {count} anni su {n}, la massima media ha raggiunto {temp} o più.</>,
      cool: ({ count, n, temp }) => <>In {count} anni su {n}, è rimasta sotto {temp}.</>,
    },
    latest: ({ monthN, year, dir, rank, total, y1, high, mm, days, wintry }) => <>Tra i {total} anni dal {y1}, {monthN} {year} è al {rank}° posto tra i più {dir === 'warm' ? 'caldi' : 'freddi'} ({high}{mm ? `, ${mm}` : ''}{days != null ? `, ${days} ${days === 1 ? 'giorno' : 'giorni'} ${wintry ? (days === 1 ? 'bagnato' : 'bagnati') : 'di pioggia'}` : ''}).</>,
    broke: {
      warm: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} è stato più caldo di ogni {monthN} del periodo {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} ha eguagliato il {monthN} più caldo del periodo {y1}–{y2} ({value}).</> },
      cold: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} è stato più freddo di ogni {monthN} del periodo {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} ha eguagliato il {monthN} più freddo del periodo {y1}–{y2} ({value}).</> },
      wet: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} è stato più piovoso di ogni {monthN} del periodo {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} ha eguagliato il {monthN} più piovoso del periodo {y1}–{y2} ({value}).</> },
      dry: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} è stato più secco di ogni {monthN} del periodo {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} ha eguagliato il {monthN} più secco del periodo {y1}–{y2} ({value}).</> },
    },
  },
  q1: ({ monthN, inCity }) => `Quanto fa caldo ${aM(monthN)} ${inCity}?`,
  q2: ({ monthN, inCity }) => `Piove molto ${inCity} ${aM(monthN)}?`,
  q3: ({ monthN, inCity }) => `Cosa mettere in valigia per ${inCity.replace(/^(a|ad|al|all'|in) /, '')} ${aM(monthN)}?`,
  q4: ({ monthN, nextN, cityN }) => `Meglio ${monthN} o ${nextN} per visitare ${cityN}?`,
  nextWhy: ({ nextN, why }) => {
    const parts = why.map((w) => ({ warmer: 'è più caldo', cooler: 'è più fresco', fewerRain: 'ha meno giorni di pioggia', moreRain: 'ha più giorni di pioggia' }[w]));
    return `${cap(nextN)} ${parts.join(' e ')}.`;
  },
};

const it = {
  lang: 'it',
  story: makeStory(P),
  locale: h.loc,
  place: (cityN, countryN) => (cityN === countryN ? cityN : `${cityN}, ${countryN}`),
  list: h.list,
  month: h.month,
  monthShort: h.monthShort,
  verdict: P.verdict,
  reasons: (v) => v.reasons.map(reasonText).filter(Boolean).join(', '),
  suitLabel: (s) => SUIT[s.key] || s.label,
  suitStatus: (s) => (s.key === 'indoor' ? 'una buona scelta' : s.ok ? 'adatto' : 'meno indicato'),
  packTitle: P.packTitle,

  cityMeta: ({ cityN, city, x, best }) => {
    const inC = inCity('it', city);
    return {
      title: fit(60, `Meteo ${cityN} mese per mese: clima e quando andare`, `Meteo ${cityN}: clima e quando andare`, `Meteo ${cityN} mese per mese`),
      imageTitle: `Meteo ${cityN} mese per mese`,
      description: fit(160,
        `Meteo ${inC} mese per mese: il più caldo è ${h.month(x.warmest?.month.num)}, il più piovoso ${h.month(x.wettest?.month.num)}. Periodo migliore: ${h.list(best)}. Medie di 20 anni.`,
        `Meteo ${inC} mese per mese: periodo migliore per andare ${h.list(best)}. Medie di 20 anni.`,
        `Meteo ${cityN} mese per mese e periodo migliore per andarci.`),
    };
  },
  cityDataset: ({ cityN, place, years }) => ({
    name: `Meteo ${cityN} mese per mese: medie climatiche ${years.start}–${years.end}`,
    description: `Medie climatiche mensili per ${place}: temperatura massima e minima media, precipitazioni totali, giorni di pioggia, ore di sole giornaliere e umidità per ogni mese, calcolate sul periodo ${years.start}–${years.end} da dati meteo storici.`,
  }),
  variables: ['Temperatura massima media', 'Temperatura minima media', 'Precipitazioni totali', 'Giorni di pioggia', 'Ore di sole', 'Umidità relativa'],
  skylineAlt: (place) => `Skyline di ${place}`,
  cityH1: (cityN) => `Meteo ${cityN} mese per mese`,
  citySub: (place, years) => <>Dodici mesi di meteo a {place}: medie {years.start}–{years.end}.</>,
  CityIntro: ({ x, inCity: inC }) => (
    <>
      {x.warmest && <>{cap(inC)} il mese più caldo è <S>{h.month(x.warmest.month.num)}</S> (massima media <UnitTemp c={x.warmest.row.avg_high} />)</>}
      {x.coolest && <> e il più fresco è <S>{h.month(x.coolest.month.num)}</S> (<UnitTemp c={x.coolest.row.avg_high} />)</>}.
      {x.wettest && <> La pioggia è più abbondante {aM(h.month(x.wettest.month.num)).split(' ')[0]} <S>{h.month(x.wettest.month.num)}</S> (circa {h.n0(x.wettest.row.avg_rainfall)} mm)</>}
      {x.driest && <>, mentre <S>{h.month(x.driest.month.num)}</S> è il mese più secco (circa {h.n0(x.driest.row.avg_rainfall)} mm)</>}.
      {x.sunniest && <> <S>{cap(h.month(x.sunniest.month.num))}</S> è il più soleggiato, con circa {h.n1(x.sunniest.row.sunshine_hours)} ore di sole al giorno.</>}
    </>
  ),
  bestTitle: (cityN) => `Quando andare a ${cityN}: i mesi migliori`,
  bestNote: () => "Classifica all'interno dell'anno della città in base a temperature piacevoli, giorni di pioggia e sole: medie storiche, non una previsione.",
  monthByMonth: (cityN) => `${cityN} mese per mese`,
  high: 'Max',
  low: 'Min',
  srRainfall: 'Precipitazioni',
  srRainy: 'Giorni di pioggia',
  srSun: 'Sole',
  rainMmIn: (mm) => `${h.n0(mm)} mm`,
  rainyDaysN: (n) => `${h.n1(n)} giorni di pioggia`,
  sunPerDay: (v) => `${h.n1(v)} h di sole / giorno`,
  guideTitle: (cityN) => `Clima e meteo a ${cityN}`,
  guideSub: (years) => <>Temperature, precipitazioni e sole durante l'anno: medie {years.start}–{years.end}.</>,
  tiles: { hottest: 'Max media del mese più caldo', coolest: 'Max media del mese più fresco', wettest: 'Media del mese più piovoso', driest: 'Media del mese più secco' },
  tempByMonth: 'Temperature mese per mese',
  rainByMonth: 'Precipitazioni mese per mese',
  sunHours: 'Ore di sole',
  chartTemp: (cityN) => `${cityN}: temperatura massima e minima media mese per mese`,
  chartRain: (cityN) => `${cityN}: precipitazioni medie mese per mese`,
  chartSun: (cityN) => `${cityN}: ore di sole giornaliere medie mese per mese`,
  monthlyAverages: 'Medie mensili',
  whatToPack: 'Cosa mettere in valigia',
  packIntro: (cityN) => <>Consigli per la valigia in base al clima di {cityN}.</>,
  cityPacking: {
    layers: { title: 'Vestirsi a strati', text: 'Strati leggeri adatti sia ai pomeriggi miti sia alle serate più fresche.' },
    rain: { title: 'Protezione dalla pioggia', text: 'Un ombrello compatto e una giacca antipioggia leggera per i mesi più piovosi.' },
    sun: { title: 'Protezione dal sole', text: 'Crema solare, cappello a tesa larga e occhiali da sole per le giornate calde e soleggiate.' },
    warm: { title: 'Abiti caldi', text: 'Una giacca calda o un pile per le mattine e le sere fresche.' },
  },
  moreCities: (countryN, country) => `Altre città ${inCountry('it', country).replace(/^in /, 'in ')} mese per mese`,
  weatherByMonth: 'Meteo mese per mese',
  ctaCityTitle: (cityN) => `Stai organizzando un viaggio a ${cityN}?`,
  ctaCityText: 'Ricevi un piano meteo giorno per giorno per le date esatte del tuo viaggio.',
  ctaCityButton: 'Usa il pianificatore di viaggio',
  cityDataNote: (years) => <>Basato su {years.end - years.start + 1} anni di dati meteo storici ({years.start}–{years.end}) di Open-Meteo. Medie mensili, non una previsione.</>,

  monthMeta: ({ cityN, countryN, monthN, row, verdict, city }) => {
    const t = (c) => (c == null ? '—' : `${h.n1(Math.round(c * 10) / 10)} °C`);
    const inC = inCity('it', city);
    const base = `Meteo ${inC} ${aM(monthN)}: massime di ${t(row?.avg_high)}, minime di ${t(row?.avg_low)}, ${h.n1(row?.rainy_days)} giorni di pioggia e ${h.n1(row?.sunshine_hours)} ore di sole al giorno.`;
    return {
      title: fit(60, `Meteo ${cityN} ${monthN}: temperature, pioggia e consigli`, `Meteo ${cityN} ${monthN}: temperature e pioggia`, `Meteo ${cityN} ${monthN}`),
      imageTitle: `Meteo ${cityN} ${aM(monthN)}`,
      kicker: countryN,
      description: fit(160, `${base} Giudizio: ${verdict ? VERDICT[verdict.label] : '—'}.`, base, `Meteo ${cityN} ${aM(monthN)}: temperature, giorni di pioggia e ore di sole.`),
    };
  },
  monthDataset: ({ cityN, place, monthN, years }) => ({
    name: `Meteo ${cityN} ${aM(monthN)}: medie climatiche ${years.start}–${years.end}`,
    description: `Medie climatiche mensili per ${place} ${aM(monthN)}: temperatura massima e minima media, precipitazioni totali, giorni di pioggia, ore di sole giornaliere e umidità, calcolate sul periodo ${years.start}–${years.end} da dati meteo storici.`,
  }),
  monthH1: (cityN, monthN) => `Meteo ${cityN} ${aM(monthN)}`,
  stat: { avgHigh: 'Max media', avgLow: 'Min media', rainfall: 'Precipitazioni', rainyDays: 'Giorni di pioggia', sunshine: 'Sole', humidity: 'Umidità' },
  statDays: (n) => `${h.n1(n)} ${n === 1 ? 'giorno' : 'giorni'}`,
  statSun: (v) => `${h.n1(v)} h / giorno`,
  Latest: ({ monthN, latest, row, years }) => (
    <>
      <span className="font-semibold text-gray-700">Dato reale più recente – {monthN} {latest.year}:</span>{' '}
      massima <UnitTemp c={latest.avg_high} />, minima <UnitTemp c={latest.avg_low} />
      {latest.avg_rainfall != null && <>, {h.n0(latest.avg_rainfall)} mm di pioggia</>}
      {latest.rainy_days != null && <> in {h.n1(latest.rainy_days)} {latest.rainy_days === 1 ? 'giorno' : 'giorni'}</>}
      {' '}(la media {years.start}–{years.end} qui sopra è {latest.avg_high != null && row?.avg_high != null
        ? (latest.avg_high > row.avg_high + 0.4 ? 'più fresca' : latest.avg_high < row.avg_high - 0.4 ? 'più calda' : 'più o meno uguale')
        : 'per confronto'}).
    </>
  ),
  vsYearTitle: (monthN) => `${cap(monthN)} rispetto al resto dell'anno`,
  tableFallback: (monthN, cityN) => <>{cap(monthN)} a confronto con tutti gli altri mesi a {cityN}.</>,
  th: { month: 'Mese', avgHigh: 'Max media', vs: (monthN) => `vs ${monthN}`, rain: 'Pioggia', rainyDays: 'Giorni di pioggia' },
  rainMm: (mm) => `${h.n0(mm)} mm`,
  chipsLabel: (cityN) => `Meteo ${cityN} mese per mese`,
  chipAria: (cityN, mN) => `Meteo ${cityN} ${aM(mN)}`,
  feelTitle: (monthN, cityN) => `Com'è ${monthN} a ${cityN}`,
  rainTitle: (cityN, monthN) => `Pioggia a ${cityN} ${aM(monthN)}`,
  daylightTitle: (monthN) => `Luce e sole ${aM(monthN)}`,
  compareTitle: (monthN) => `${cap(monthN)} a confronto con il resto dell'anno`,
  suitsTitle: (monthN) => `Per chi è adatto ${monthN}`,
  tipsTitle: (cityN, monthN) => `Consigli per visitare ${cityN} ${aM(monthN)}`,
  questionsTitle: 'Domande veloci',
  verdictTitle: (monthN, cityN) => `${cap(monthN)} è un buon periodo per andare a ${cityN}?`,
  VerdictText: ({ verdict, relRank, cityN, monthN, reasons }) => (
    <>
      <strong>{VERDICT[verdict.label]}</strong> – {reasons}.
      {relRank && (
        <> Nell'anno di {cityN}, {monthN} è <strong>{relRank}° su 12</strong>
          {relRank <= 3 ? <>: uno dei 3 mesi migliori per andarci.</> : relRank >= 10 ? <>: uno dei mesi meno piacevoli.</> : '.'}</>
      )}
    </>
  ),
  notesTitle: (cityN, monthN) => `Note di viaggio: ${cityN} ${aM(monthN)}`,
  othersTitle: (monthN, countryN, country) => `${cap(monthN)} in altre città ${inCountry('it', country).replace(/^in /, 'in ')}`,
  OtherHigh: ({ row }) => <>Max <UnitTempShort c={row.avg_high} /> · {h.n0(row.avg_rainfall ?? 0)} mm</>,
  otherGuide: (monthN) => `Guida a ${monthN}`,
  elsewhereTitle: (kind, monthN) => `Mete ${kind === 'both' ? 'più calde o più asciutte' : kind === 'warmer' ? 'più calde' : 'più asciutte'} ${aM(monthN)}`,
  ElsewhereHigh: ({ row }) => <>Max <UnitTempShort c={row.avg_high} /></>,
  elsewhereRainy: (n) => `${n == null ? '—' : h.n1(n)} giorni di pioggia`,
  warmer: 'Più caldo',
  drier: 'Più asciutto',
  ctaMonthTitle: (cityN) => `Organizza un viaggio a ${cityN}`,
  ctaMonthText: 'Ricevi un punteggio meteo giorno per giorno per le date esatte del tuo viaggio.',
  ctaMonthButton: 'Apri il pianificatore di viaggio',
  MonthDataNote: ({ years, cityHref, cityN }) => (
    <>
      Medie mensili su {years.end - years.start + 1} anni di dati Open-Meteo ({years.start}–{years.end}), non una previsione: tutti i 12 mesi in{' '}
      <Link href={cityHref} className="text-[#0077b6] font-semibold hover:underline">Meteo {cityN} mese per mese</Link>.
    </>
  ),

  countryMeta: ({ countryN, country, n }) => {
    const inK = inCountry('it', country);
    return {
      absoluteTitle: fit(60, `Quando andare ${inK}: meteo e clima mese per mese`, `Periodo migliore per andare ${inK}`, `Quando andare ${inK}`),
      description: fit(160,
        `Quando andare ${inK}? Clima mese per mese in ${n} città: temperature, pioggia e periodo migliore per andarci, da 20 anni di dati meteo.`,
        `Periodo migliore per andare ${inK}: clima mese per mese in ${n} città.`),
      kicker: 'Meteo per mese e città',
    };
  },
  countryH1: (countryN, country) => <>Quando andare {inCountry('it', country)}: meteo per città e mese</>,
  countrySub: (n, countryN, country) => <>Medie mese per mese per {n} {n === 1 ? 'città' : 'città'} {inCountry('it', country)}, da 20 anni di dati meteo storici.</>,
  climateAcross: (countryN, country) => `Il clima ${inCountry('it', country)}`,
  CountryIntro: ({ single, warmest, coolest, wettest, loaded }) => (
    <>
      {single && (
        <><strong className="text-gray-800">{single.name}</strong> ha una massima diurna media di <UnitTemp c={single.v} /> nel corso dell'anno</>
      )}
      {warmest && (
        <>Tra le città qui sotto, <strong className="text-gray-800">{warmest.name}</strong> è la più calda, con una massima diurna media di <UnitTemp c={warmest.v} /> nell'anno</>
      )}
      {coolest && (
        <>, mentre <strong className="text-gray-800">{coolest.name}</strong> è la più fresca con <UnitTemp c={coolest.v} /></>
      )}
      .{wettest && <> {loaded.length > 1 ? 'In queste città' : `A ${loaded[0].name}`} il mese più piovoso è di solito <strong className="text-gray-800">{wettest.name}</strong> (in media circa {h.n0(wettest.v)} mm).</>}
    </>
  ),
  preparing: 'Stiamo preparando i dati climatici di queste città.',
  citiesByMonth: (countryN, country) => `Città ${inCountry('it', country).replace(/^in /, 'in ')} mese per mese`,
  avgHighByMonth: 'Temperatura massima media mese per mese',
  tapValue: 'Tocca un valore per aprire la guida mensile della città.',
  cityTh: 'Città',
  cellAria: (cityN, mN) => `${cityN} ${aM(mN)}`,
  bestMonthsTitle: (countryN, country) => `Periodo migliore per andare ${inCountry('it', country)}`,
  BestMonthsText: ({ across, best, worst }) => (
    <>
      In base a temperature piacevoli, giorni di pioggia e sole {across ? `a ${across}` : 'in queste città'}, i mesi più piacevoli sono di solito{' '}
      <strong className="text-gray-800">{best}</strong>
      {worst && <>; il meno piacevole è di solito <strong className="text-gray-800">{worst}</strong></>}.
      Sono medie storiche, non una previsione.
    </>
  ),
};

export default it;
