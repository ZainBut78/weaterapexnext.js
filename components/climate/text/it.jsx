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
    'rain-most': `pioggia quasi tutti i giorni (circa ${n})`, 'rain-frequent': `pioggia frequente (circa ${n} giorni di pioggia)`,
    'rain-some': `alcuni giorni di pioggia (circa ${n})`, dry: `per lo più asciutto (circa ${n} giorni di pioggia)`,
    heavy: `piogge abbondanti (${n} mm)`, dull: `poco sole (${n} h al giorno)`, sunny: `tanto sole (${n} h al giorno)`,
  }[r.key || r.t] || '';
};
const SUIT = { sightseeing: 'Visite in città', parks: 'Parchi e aria aperta', beach: 'Spiaggia', hiking: 'Escursioni', indoor: 'Musei e al chiuso' };
const PACK = { layers: 'Vestirsi a strati', rain: 'Protezione dalla pioggia', sun: 'Protezione dal sole', jacket: 'Giacca leggera', warm: 'Abiti caldi', shades: 'Occhiali da sole', light: 'Abiti leggeri' };

const P = {
  month: h.month,
  list: h.list,
  n1: h.n1,
  hm,
  verdict: (l) => VERDICT[l] || l,
  packTitle: (p) => PACK[p.key] || p.title,
  inCity: (city) => inCity('it', city),
  rank: (kind, r) => `il ${ORD[r] || ''}mese ${KIND[kind]}`,
  rainyDays: (n) => `${h.n1(n)} giorni di pioggia`,
  sunHours: (n) => `${h.n1(n)} ore di sole`,
  mm: (n) => `${h.n0(n)} mm`,
  perDay: (v) => `circa ${h.n1(v)} mm`,
  often: (o) => ({ most: 'quasi tutti i giorni', everyOther: 'circa un giorno sì e uno no', never: 'quasi mai', oneIn: `circa un giorno ogni ${o.k}` }[o.key]),

  hero: ({ monthN, place, y }) => [
    `Com'è di solito ${monthN} a ${place}: medie ${y}.`,
    `Il meteo tipico di ${monthN} a ${place}, in base alle medie climatiche ${y}.`,
    `${place} ${aM(monthN)}: come va di solito il mese, secondo le medie ${y}.`,
  ],
  quick: ({ monthN, inCity, cityN, hi, lo, days, mm, sun }) => [
    <>{cap(aM(monthN))} {inCity} si registrano in media massime di {hi} e minime di {lo}, con circa {days} ({mm} di pioggia) e {sun} al giorno.</>,
    <>Una tipica giornata di {monthN} {inCity} arriva a {hi} e scende a {lo} di notte; ci sono circa {days} ({mm} in totale) e {sun} al giorno.</>,
    <>{cityN} {aM(monthN)}: massime intorno a {hi}, minime intorno a {lo}, circa {days} per un totale di {mm} e {sun} in una giornata media.</>,
  ],
  tableExtreme: ({ monthN, inCity, warmest, rainTxt }) => [
    <>{cap(monthN)} è <strong>il mese {warmest ? 'più caldo' : 'più fresco'}</strong> {inCity}{rainTxt && <>; per la pioggia è {rainTxt}</>}.</>,
    <>Nessun mese {inCity} è più {warmest ? 'caldo' : 'fresco'} di {monthN}{rainTxt && <>; per la pioggia è {rainTxt}</>}.</>,
  ],
  tableNormal: ({ monthN, inCity, warmer, k, rainTxt }) => [
    <>{cap(monthN)} è più caldo di <strong>{warmer} degli altri 11 mesi</strong>{rainTxt && <>, e per la pioggia è {rainTxt} {inCity}</>}.</>,
    <>{k <= 3 ? `Solo ${k} ${k === 1 ? 'mese è' : 'mesi sono'}` : `${k} degli altri 11 mesi sono`} più caldi di {monthN} {inCity}{rainTxt && <>; per la pioggia è {rainTxt}</>}.</>,
    <>Ecco come si colloca ogni mese {inCity} rispetto a {monthN}{rainTxt && <>: per la pioggia {monthN} è {rainTxt}</>}.</>,
  ],
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
  feel: {
    freezing: ['Di giorno le temperature superano a malapena lo zero: fuori sembra pieno inverno anche a mezzogiorno.', "Anche l'ora più calda della giornata resta vicina allo zero."],
    cold: ['Le temperature diurne restano fredde e serve un cappotto pesante anche a metà giornata.', 'A mezzogiorno fa poco più caldo: dalla mattina alla sera è tempo da cappotto e sciarpa.'],
    chilly: ['Le giornate sono fresche più che gelide, e con una buona giacca si cammina bene.', "L'aria diurna è frizzante, ma raramente pungente."],
    cool: ['I pomeriggi sono freschi e piacevoli per camminare, tenendo addosso uno strato in più.', 'Di giorno la sensazione è di aria fresca più che fredda.', 'Giornate sul fresco, ideali per visite a passo svelto.'],
    mild: ['I pomeriggi sono miti e piacevoli per quasi tutti con abiti leggeri.', 'Le temperature diurne sono miti: né freddo né caldo per girare a piedi.', "I pomeriggi miti invitano a passare molte ore all'aperto."],
    warm: ['Le giornate sono abbastanza calde per le maniche corte e stare fuori è facile.', 'I pomeriggi sono caldi e piacevoli, perfetti per lunghe giornate in giro.'],
    hot: ['I pomeriggi sono molto caldi: le visite funzionano meglio al mattino o alla sera.', "Le ore centrali sono molto calde; nelle lunghe camminate contano ombra e acqua."],
    'very-hot': ["Il caldo di mezzogiorno è intenso e quasi tutti nel pomeriggio cercano l'ombra o l'aria condizionata.", 'I pomeriggi sono torridi: i programmi all\'aperto riescono meglio presto o dopo il tramonto.'],
  },
  nightTxt: {
    'hard-frost': 'le notti scendono ben sotto lo zero', frosty: 'le notti si aggirano intorno allo zero e le gelate sono frequenti',
    cold: 'le notti sono fredde', cool: 'le notti sono fresche', mild: 'le notti restano miti', warm: 'le notti restano calde', sultry: 'le notti sono afose',
  },
  night: {
    sultry: () => ["Le notti danno poco sollievo: anche l'ora più fresca resta molto calda.", 'Anche dopo il tramonto il clima resta caldo e afoso.'],
    small: ({ nightTxt }) => [`Tra giorno e notte c'è poca differenza: ${nightTxt} e le serate sembrano quasi il pomeriggio.`, `Dopo il tramonto cambia poco: ${nightTxt}, appena sotto i valori diurni.`],
    moderate: ({ nightTxt }) => [`Dopo il tramonto la temperatura cala in modo netto: ${nightTxt}.`, `Le serate portano un calo evidente, e ${nightTxt}.`],
    big: ({ nightTxt, delta }) => [
      <>L'escursione tra giorno e notte è ampia (circa {delta}): {nightTxt}, quindi mattina e sera sono molto diverse dal mezzogiorno.</>,
      <>Dopo il tramonto la temperatura scende parecchio, di circa {delta}, e {nightTxt}.</>,
    ],
  },
  humidity: {
    veryHumidHot: ["L'aria è afosa, quindi la sensazione è più calda di quanto indichi il termometro.", "L'umidità elevata rende il caldo pesante e appiccicoso, soprattutto nei pomeriggi senza vento."],
    dampCold: ["L'aria umida rende il freddo più pungente di quanto dicano i numeri.", "L'umidità dà al freddo una nota pungente, specialmente con il vento."],
    humidHot: ["Nell'aria c'è un po' di umidità, percepibile quando il sole picchia.", "L'aria è un po' umida, e nei momenti di caldo si sente."],
    humidMild: ["L'aria è piuttosto umida, ma a queste temperature raramente risulta opprimente.", "L'umidità è elevata, ma le temperature miti la rendono sopportabile."],
    dryHot: ["L'aria secca fa evaporare in fretta il sudore: si suda meno ma ci si disidrata in fretta.", 'Il caldo è secco più che afoso: bevi più di quanto pensi.'],
    dry: ["L'aria è secca, e pelle e labbra spesso lo sentono più della temperatura."],
    comfortable: ["L'umidità è moderata: l'aria non è né appiccicosa né secca.", "L'aria è piacevole, né afosa né secca."],
  },
  rainFreq: {
    dry: ({ monthN, inCity, often, never }) => [`${cap(aM(monthN))} la pioggia è rara: la maggior parte delle settimane passa senza giorni bagnati.`, never ? `${cap(monthN)} è un mese secco ${inCity}; non piove quasi mai.` : `${cap(monthN)} è un mese secco ${inCity}; piove ${often}.`, "Prevale il tempo asciutto e l'ombrello può restare in valigia."],
    occasional: ({ often }) => [`La pioggia arriva ogni tanto, ${often}.`, `I giorni di pioggia sono occasionali più che regolari: ${often}.`, `Quasi tutti i giorni restano asciutti; piove ${often}.`],
    showery: ({ often }) => [`I rovesci sono frequenti e arrivano ${often}.`, `È un mese variabile: piove ${often}, con pause asciutte nel mezzo.`],
    wet: ({ monthN, often }) => [`In questo mese la pioggia fa parte della normalità e cade ${often}.`, `${cap(monthN)} qui è costantemente piovoso: piove ${often}.`, `I giorni asciutti sono l'eccezione: piove ${often}.`],
  },
  rainSize: {
    light: ({ per }) => [`Nella maggior parte dei giorni piovosi cade solo una pioggia leggera, ${per} in un giorno di pioggia tipico: pioviggine o brevi rovesci che raramente fermano i programmi.`, `Quando piove, di solito è poco: ${per} per giorno di pioggia, più pioviggine che acquazzone.`],
    moderate: ({ per }) => [`Un giorno di pioggia porta in media ${per}: pioggia continua più che un rovescio passeggero.`, `I giorni piovosi portano in media ${per}, abbastanza da bagnarsi senza ombrello.`],
    heavy: ({ per }) => [`La pioggia arriva spesso in scrosci intensi: ${per} in un giorno di pioggia medio.`, `I giorni di pioggia sono intensi, con una media di ${per}: acquazzoni più che pioviggine.`],
  },
  rainVs: {
    heavier: ({ cityN, year }) => `È più della media annua di ${cityN}, circa ${year} mm per giorno di pioggia.`,
    lighter: ({ year }) => `È meno della media annua della città, circa ${year} mm per giorno di pioggia.`,
    typical: ({ cityN, monthN, year }) => [`È in linea con la media annua di ${cityN} (circa ${year} mm per giorno di pioggia).`, `Nell'arco dell'anno ${cityN} registra circa ${year} mm per giorno di pioggia, quindi ${monthN} è nella norma.`],
  },
  rainRank1: ({ monthN, inCity, kind }) => `${cap(monthN)} è il mese ${KIND[kind]} dell'anno ${inCity}.`,
  rainRankTop3: ({ kind }) => `È tra i tre mesi ${kind === 'wettest' ? 'più piovosi' : 'più secchi'} dell'anno.`,
  polar: {
    day: ({ monthN, inCity }) => `A metà ${monthN} ${inCity} il sole non tramonta.`,
    night: ({ monthN, inCity }) => `A metà ${monthN} ${inCity} il sole non sorge sopra l'orizzonte.`,
  },
  dayMain: ({ monthN, cityN, rise, set, len }) => [
    `Il 15 ${monthN} il sole sorge verso le ${rise} e tramonta verso le ${set} (ora locale): ${len} di luce.`,
    `A metà ${monthN} l'alba è verso le ${rise} e il tramonto verso le ${set} (ora locale): ${len} di luce.`,
    `A metà mese ${cityN} ha ${len} di luce, dall'alba verso le ${rise} al tramonto verso le ${set}.`,
  ],
  dayChange: {
    same: ({ pm }) => `La durata del giorno è praticamente la stessa di metà ${pm}.`,
    barely: ({ pm, amt, longer }) => `La durata del giorno cambia poco rispetto a metà ${pm} (${amt} in ${longer ? 'più' : 'meno'}).`,
    shorter: ({ pm, amt }) => [`Le giornate si accorciano: ${amt} di luce in meno rispetto a metà ${pm}.`, `Rispetto a metà ${pm}, il giorno ha perso ${amt}.`],
    longer: ({ pm, amt }) => [`Le giornate si allungano: ${amt} di luce in più rispetto a metà ${pm}.`, `Da metà ${pm} il giorno ha guadagnato ${amt}.`],
  },
  sky: { cloudy: 'il cielo è spesso nuvoloso', mixed: 'sole e nuvole si alternano', bright: 'ci sono molte schiarite', clear: 'il cielo è per lo più sereno' },
  sunShare: ({ share, sky }) => [`Il sole splende per circa ${pct(share)} di queste ore di luce: ${sky}.`, `Circa ${pct(share)} delle ore di luce è soleggiato; in breve, ${sky}.`],
  equatorDay: "Vicino all'equatore, gli orari di alba e tramonto cambiano molto poco durante l'anno.",
  cmpFirst: ({ monthN, inCity, rankTxt }) => [`${cap(monthN)} è ${rankTxt} dell'anno ${inCity}.`, `In base alla temperatura massima media, ${monthN} risulta ${rankTxt} ${inCity}.`],
  cmpRain: (rain) => (rain === 0 ? ', con circa la stessa pioggia' : `, con ${h.n0(Math.abs(rain))} mm di pioggia in ${rain > 0 ? 'più' : 'meno'}`),
  cmpSame: ({ prevN, rainTxt }) => <>Fa caldo più o meno come {aM(prevN)}{rainTxt}.</>,
  cmpPrev: ({ prevN, delta, warmer, rainTxt }) => [
    <>Rispetto a {prevN}, i pomeriggi sono {delta} più {warmer ? 'caldi' : 'freschi'}{rainTxt}.</>,
    <>Rispetto a {prevN} la massima media è {delta} più {warmer ? 'alta' : 'bassa'}{rainTxt}.</>,
  ],
  trend: {
    peak: ({ nextN }) => [`Da qui l'anno cambia direzione: ${nextN} è già più fresco.`, `Da questo momento le temperature iniziano a calare, a partire da ${nextN}.`],
    trough: ({ nextN }) => [`È il punto più basso, e ${aM(nextN)} si comincia a scaldare.`, `Da qui in poi fa solo più caldo, a cominciare da ${nextN}.`],
    warming: ({ nextN }) => [`Il riscaldamento prosegue ${aM(nextN)}.`, `Le temperature continuano a salire fino a ${nextN}.`],
    cooling: ({ nextN }) => [`Le temperature continuano a scendere ${aM(nextN)}.`, `Il raffreddamento prosegue fino a ${nextN}.`],
    flat: () => 'Qui le temperature cambiano pochissimo da un mese all\'altro.',
  },
  nextHi: ({ nextN, temp }) => [<> {cap(aM(nextN))} la massima media è di {temp}.</>, <> {cap(nextN)} registra in media massime di {temp}.</>],
  suitWhy: {
    sightseeing: { ok: ['le temperature diurne vanno bene per girare a piedi', 'abbastanza piacevole per esplorare a piedi tutto il giorno'], rain: ['piove in più della metà dei giorni'], hot: ['il caldo di mezzogiorno rende faticose le lunghe camminate'], cold: ['fa freddo per lunghe passeggiate'] },
    parks: { ok: ['piacevole per lunghe passeggiate e picnic', "buone condizioni per stare seduti all'aperto"], hot: ['nel pomeriggio fa troppo caldo per restare fuori a lungo'], cold: ['troppo fresco per stare seduti fuori a lungo'], rain: ["la pioggia interrompe i programmi all'aperto"] },
    beach: { ok: ['caldo e per lo più asciutto sulla costa'], hot: ['clima costiero molto caldo'], cold: ["l'aria di mare è troppo fresca"], rain: ['troppi giorni di pioggia'] },
    hiking: { ok: ['temperature miti per i sentieri'], cold: ['sui sentieri fa fresco'], hot: ['troppo caldo per lunghe escursioni'], rain: ['sentieri bagnati'] },
    indoor: { rain: ['con la pioggia quasi ogni giorno, gallerie e musei sono una scelta facile'], hot: ['una pausa al fresco nelle ore più calde'], cold: ['luoghi caldi per la parte più fredda della giornata'] },
  },
  tips: {
    layers: ['Le giornate sono molto più calde delle notti: strati da mettere e togliere.', 'Mattina e sera fa più fresco che a mezzogiorno, quindi vestiti a strati.'],
    rain: ['Un ombrello compatto e una giacca impermeabile leggera.', "Tieni un piccolo ombrello in borsa e scarpe che reggano le pozzanghere."],
    sun: ['Crema solare, cappello e occhiali da sole; abiti leggeri e traspiranti.', 'Proteggiti dal sole forte: cappello, protezione solare e tanta acqua.'],
    jacket: ['Giornate fresche: una giacca leggera o un maglione per girare.', 'Una giacca leggera o un cardigan bastano per gran parte della giornata.'],
    warm: ['Una giacca pesante, cappello e guanti per le mattine e le sere fredde.', 'Un vero cappotto invernale, con guanti e cappello per le uscite presto.'],
    shades: ['Sole frequente: occhiali da sole e un cappello leggero.', 'Giornate luminose: gli occhiali da sole meritano un posto in valigia.'],
    light: ['Abiti comodi e uno strato leggero per la sera.', 'Abiti di tutti i giorni più uno strato leggero per la sera.'],
  },
  packPhrase: { layers: 'abiti a strati', rain: 'protezione dalla pioggia', sun: 'protezione dal sole', jacket: 'una giacca leggera', warm: 'abiti caldi', shades: 'occhiali da sole', light: 'abiti leggeri' },
  eveCool: ['Porta qualcosa in più per le serate più fresche.', 'Aggiungi uno strato per dopo il tramonto.'],
  eveSame: ['Le serate sono simili al giorno, quindi gli stessi abiti vanno bene dalla mattina alla sera.', 'Per la sera non serve cambiarsi.'],
  q1: ({ monthN, inCity }) => `Quanto fa caldo ${aM(monthN)} ${inCity}?`,
  a1: ({ hi, lo, feel, warmRank }) => [
    <>Nel pomeriggio la media è di {hi} e di notte di circa {lo}: un clima {feel} per la maggior parte delle persone.{warmRank && <> È {warmRank} dell'anno.</>}</>,
    <>Aspettati circa {hi} nel pomeriggio e {lo} di notte, un clima che quasi tutti definirebbero {feel}.</>,
  ],
  q2: ({ monthN, inCity }) => `Piove molto ${inCity} ${aM(monthN)}?`,
  a2: {
    never: ({ monthN, none }) => <>Quasi mai: {monthN} è praticamente senza pioggia, con {none ? 'nessun giorno di pioggia' : 'circa un giorno di pioggia'} in un anno tipico.</>,
    dry: ({ monthN, days, mm }) => [<>No: {monthN} è uno dei periodi più asciutti, con circa {h.n1(days)} giorni di pioggia e {h.n0(mm)} mm in totale.</>, <>Poco: solo circa {h.n1(days)} giorni di pioggia e {h.n0(mm)} mm in tutto il mese.</>],
    yes: ({ days, mm, often }) => [<>Sì, abbastanza: piove {often} e si arriva a circa {h.n0(mm)} mm, quindi l'ombrello conviene.</>, <>Sì: circa {h.n1(days)} giorni di pioggia portano circa {h.n0(mm)} mm, meglio prevedere qualche alternativa al chiuso.</>],
    some: ({ days, mm, light }) => [<>Non particolarmente. Ci sono circa {h.n1(days)} giorni di pioggia ({h.n0(mm)} mm), per lo più pioggia {light ? 'leggera' : 'moderata'}.</>, <>Solo in modo moderato: circa {h.n1(days)} giorni bagnati e {h.n0(mm)} mm, di solito {light ? 'brevi rovesci' : 'pioggia moderata'}.</>],
  },
  q3: ({ monthN, inCity }) => `Cosa mettere in valigia per ${inCity.replace(/^(a|ad|al|all'|in) /, '')} ${aM(monthN)}?`,
  a3: ({ list, eve }) => [<>In base alle medie: {list}. {eve}</>, <>Metti in valigia {list}. {eve}</>],
  q4: ({ monthN, nextN, cityN }) => `Meglio ${monthN} o ${nextN} per visitare ${cityN}?`,
  nextWhy: ({ nextN, why }) => {
    const parts = why.map((w) => ({ warmer: 'è più caldo', cooler: 'è più fresco', fewerRain: 'ha meno giorni di pioggia', moreRain: 'ha più giorni di pioggia' }[w]));
    return `${cap(nextN)} ${parts.join(' e ')}.`;
  },
  a4: ({ win, ranks, labels, whyTxt, cityN, narrow }) => [
    <>{cap(win)} ottiene un punteggio migliore nella nostra classifica climatica ({ranks.a}° su 12 contro {ranks.b}°){labels ? `, con giudizio «${labels[0]}» contro «${labels[1]}»` : ''}.{whyTxt}</>,
    <>{cap(win)}, {narrow ? 'di poco' : 'nettamente'}: è {ranks.a}° su 12 tra i mesi di {cityN}, contro il {ranks.b}° dell'altro.{whyTxt}</>,
  ],
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
  statDays: (n) => `${h.n1(n)} giorni`,
  statSun: (v) => `${h.n1(v)} h / giorno`,
  Latest: ({ monthN, latest, row, years }) => (
    <>
      <span className="font-semibold text-gray-700">Dato reale più recente – {monthN} {latest.year}:</span>{' '}
      massima <UnitTemp c={latest.avg_high} />, minima <UnitTemp c={latest.avg_low} />
      {latest.avg_rainfall != null && <>, {h.n0(latest.avg_rainfall)} mm di pioggia</>}
      {latest.rainy_days != null && <> in {h.n1(latest.rainy_days)} giorni</>}
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
