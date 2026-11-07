// ─────────────────────────────────────────────────────────────
//  Climate pages — DEUTSCH (i18n Phase 3). API wie ./en.jsx.
//  Keywords (Semrush): „Wetter {Stadt} {Monat}“, „Beste Reisezeit {Land}“.
//  Zahlen kommen unverändert aus den Daten; nur die Schreibweise ist
//  deutsch (21,7 °C, Komma). Kein Fakt außerhalb der Daten.
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';
import { UnitTemp } from '../UnitText';
import UnitTempShort from '../UnitTempShort';
import { inCity, inCountry } from '@/i18n/places';
import { intlHelpers, cap } from './common';
import { makeStory } from './story';

const h = intlHelpers('de');
const fit = (max, ...opts) => opts.find((o) => o.length <= max) || opts[opts.length - 1];
const S = ({ children }) => <strong className="text-gray-900">{children}</strong>;

const VERDICT = { Great: 'Sehr gut', Good: 'Gut', Fair: 'Mittel', Poor: 'Schlecht' };
const ORD = ['', '', 'zweit', 'dritt', 'viert', 'fünft', 'sechst'];
const KIND = { warmest: 'wärmste', coolest: 'kühlste', wettest: 'nasseste', driest: 'trockenste' };
const SEASON = {
  winter: { early: 'Frühwinter', mid: 'Hochwinter', late: 'Spätwinter' },
  spring: { early: 'Vorfrühling', mid: 'Frühling', late: 'Spätfrühling' },
  summer: { early: 'Frühsommer', mid: 'Hochsommer', late: 'Spätsommer' },
  autumn: { early: 'Frühherbst', mid: 'Herbst', late: 'Spätherbst' },
};
const hm = (mins) => {
  const m = Math.round(Math.abs(mins));
  const H = Math.floor(m / 60);
  const r = m % 60;
  return H ? (r ? `${H} Std. ${r} Min.` : `${H} Std.`) : `${r} Min.`;
};
const reasonText = (r) => {
  const n = h.n1(r.n);
  return {
    cold: 'kalte Tage', chilly: 'kühle Tage', 'mild-cool': 'milde, aber frische Tage', comfortable: 'angenehme Temperaturen',
    warm: 'warme bis heiße Tage', hot: 'heiße Tage', 'very-hot': 'sehr heiße Tage', frost: 'Nächte mit Frost',
    'snow-most': `Schnee oder Regen an den meisten Tagen (etwa ${n})`, 'snow-frequent': `häufig Schnee oder Regen (etwa ${n} nasse Tage)`, 'snow-some': `einige Tage mit Schnee oder Regen (etwa ${n})`,
    'rain-most': `Regen an den meisten Tagen (etwa ${n})`, 'rain-frequent': `häufig Regen (etwa ${n} Regentage)`,
    'rain-some': `einige Regentage (etwa ${n})`, dry: r.n < 0.5 ? 'kaum Regen' : `überwiegend trocken (etwa ${n} ${r.n === 1 ? 'Regentag' : 'Regentage'})`,
    heavy: `viel Niederschlag (${n} mm)`, dull: `wenig Sonne (${n} Std. am Tag)`, sunny: `viel Sonne (${n} Std. am Tag)`,
  }[r.key || r.t] || '';
};
const SUIT = { sightseeing: 'Besichtigungen', parks: 'Parks & draußen', beach: 'Strand', hiking: 'Wandern', indoor: 'Museen & drinnen' };
const PACK = { shoes: 'Wasserfeste Schuhe', layers: 'Zwiebellook', rain: 'Regenschutz', sun: 'Sonnenschutz', jacket: 'Leichte Jacke', warm: 'Warme Kleidung', shades: 'Sonnenbrille', light: 'Leichte Kleidung' };

// ── Story-Phrasen (Engine: ./story.jsx) ─────────────────────
const P = {
  month: h.month,
  list: h.list,
  n1: h.n1,
  hm,
  verdict: (l) => VERDICT[l] || l,
  packTitle: (p) => PACK[p.key] || p.title,
  inCity: (city) => inCity('de', city),
  rank: (kind, r) => `der ${ORD[r] || ''}${KIND[kind]} Monat`,
  rainyDays: (n) => `${h.n1(n)} ${Number(n) === 1 ? 'Regentag' : 'Regentage'}`,
  sunHours: (n) => `${h.n1(n)} Sonnenstunden`,
  mm: (n) => `${h.n0(n)} mm`,
  perDay: (v) => `etwa ${h.n1(v)} mm`,
  often: (o) => ({ most: 'an den meisten Tagen', everyOther: 'etwa jeden zweiten Tag', never: 'so gut wie nie', oneIn: `etwa an jedem ${o.k}. Tag` }[o.key]),

  hero: ({ monthN, place, y, feelK, rainK }) => {
    const feel = { freezing: 'frostige', cold: 'kalte', chilly: 'frische', cool: 'kühle', mild: 'milde', warm: 'warme', hot: 'heiße', 'very-hot': 'sehr heiße' }[feelK] || 'typische';
    const rain = { dry: 'wenig Regen', occasional: 'gelegentlicher Regen', showery: 'regelmäßige Schauer', wet: 'Regen an den meisten Tagen', wintry: 'Regen oder Schnee an vielen Tagen' }[rainK];
    return `${place} im ${monthN}: ${feel} Nachmittage und ${rain}, nach den Mittelwerten ${y}.`;
  },
  quick: ({ monthN, cityN, hi, lo, days, mm, sun, feelK, rainK, sunK }) => {
    const lead = { freezing: 'Ein frostiger', cold: 'Ein kalter', chilly: 'Ein frischer', cool: 'Ein kühler', mild: 'Ein milder', warm: 'Ein warmer', hot: 'Ein heißer', 'very-hot': 'Ein sehr heißer' }[feelK] || 'Ein typischer';
    const rain = { dry: <>sehr wenig Regen ({mm})</>, some: <>etwa {days} ({mm})</>, wet: <>rund {days} ({mm} insgesamt)</> }[rainK];
    const shine = { low: <>nur {sun} pro Tag</>, mid: <>{sun} pro Tag</>, high: <>reichlich {sun} pro Tag</> }[sunK];
    return <>{lead} Monat in {cityN}, im {monthN} mit Höchstwerten um {hi} und Tiefstwerten um {lo}, dazu {rain} und {shine}.</>;
  },
  tableExtreme: ({ monthN, inCity, warmest, rainTxt }) => <>Der {monthN} ist <strong>der {warmest ? 'wärmste' : 'kühlste'} Monat</strong> {inCity}{rainTxt && <>; beim Niederschlag ist er {rainTxt}</>}.</>,
  tableNormal: ({ monthN, inCity, warmer, k, rainTxt, band }) => ({
    high: <>Nur {k} {k === 1 ? 'Monat ist' : 'Monate sind'} {inCity} wärmer als der {monthN}{rainTxt && <>; beim Regen ist er {rainTxt}</>}.</>,
    mid: <>Der {monthN} ist wärmer als <strong>{warmer} der übrigen 11 Monate</strong>{rainTxt && <>; beim Niederschlag ist er {rainTxt} {inCity}</>}.</>,
    low: <>Bei der Temperatur liegt der {monthN} nur vor <strong>{warmer} von 11</strong> anderen Monaten{rainTxt && <>, und beim Regen ist er {rainTxt} des Jahres</>}.</>,
  }[band]),
  feelLine: ({ feelK, hi, pos, peakN, delta, wet }) => {
    const open = feelK === 'freezing' ? <>Nachmittags kommt es kaum über {hi}</> : ['hot', 'very-hot'].includes(feelK) ? <>Nachmittags werden {hi} erreicht</> : <>Nachmittags sind es etwa {hi}</>;
    const where = {
      peak: ', der höchste Wert des Jahres',
      trough: ', der niedrigste Wert des Jahres',
      nearPeak: <>, nah am Höchstwert im {peakN}</>,
      nearTrough: ', nah am niedrigsten Wert des Jahres',
      flat: ', fast wie in jedem anderen Monat hier',
      middle: <>, etwa {delta} unter dem Höchstwert im {peakN}</>,
    }[pos] || '';
    const advice = {
      freezing: 'Selbst mittags fühlt es sich richtig winterlich an',
      cold: 'Von morgens bis abends ist Mantel-und-Schal-Wetter',
      chilly: 'Mit einer ordentlichen Jacke lässt es sich gut spazieren',
      cool: 'Mit einer zusätzlichen Schicht angenehm für Spaziergänge',
      mild: 'Mit leichter Kleidung angenehm',
      warm: 'Warm genug für kurze Ärmel',
      hot: 'Besichtigungen klappen am besten morgens oder abends',
      'very-hot': 'Lange Zeit draußen ist anstrengend, also den Tag um den Nachmittag herum planen',
    }[feelK];
    return <>{open}{where}. {advice}{wet ? ', zwischen den Schauern' : ''}.</>;
  },
  nightLine: ({ night, swing, lo, delta }) => {
    const gap = {
      tiny: 'kaum kühler als am Nachmittag',
      small: <>etwa {delta} unter dem Nachmittag</>,
      moderate: <>{delta} unter dem Nachmittag</>,
      clear: <>deutliche {delta} unter dem Nachmittag</>,
      big: <>ein großer Abfall um {delta} gegenüber dem Nachmittag</>,
    }[swing];
    const tail = {
      'hard-frost': ', deutlich unter dem Gefrierpunkt',
      frosty: ', Frost ist also häufig',
      cold: ', die Morgen beginnen also kalt',
      cool: ', abends braucht man also eine weitere Schicht',
      mild: ', draußen aber weiter angenehm',
      warm: ', noch warm genug für kurze Ärmel',
      sultry: ', die Hitze lässt also kaum nach',
    }[night];
    return <>Nachts sinkt es auf etwa {lo}, {gap}{tail}.</>;
  },
  humLine: ({ caseK, h: hum, rel }) => {
    const r = { above: ', feuchter als sonst hier', below: ', trockener als sonst hier' }[rel] || '';
    const t = {
      veryHumidHot: 'Die Luft ist schwül und fühlt sich heißer an, als das Thermometer zeigt',
      dampCold: 'Die feuchte Luft lässt die Kälte rauer wirken',
      dampCool: 'Die feuchte Luft lässt einen kühlen Tag noch kühler wirken, vor allem bei Wind',
      humidHot: 'Warme Phasen fühlen sich etwas klebrig an',
      humidMild: 'Die Luft ist feucht, bei diesen Temperaturen aber selten drückend',
      dryHot: 'Die Hitze ist trocken, also mehr trinken, als man denkt',
      dry: 'Haut und Lippen spüren die trockene Luft oft zuerst',
      comfortCold: 'Die Luft ist weder feucht noch trocken, die Kälte bleibt also klar',
      comfortMild: 'Die Luft fühlt sich weder klebrig noch trocken an',
      comfortHot: 'Die Hitze fühlt sich selten klebrig an',
    }[caseK];
    return `Die Luftfeuchtigkeit liegt im Schnitt bei ${h.n0(hum)} %${r}. ${t}.`;
  },
  rainLine: ({ freq, never, days, n, inCity, top }) => {
    const base = never ? 'Regen fällt so gut wie nie' : {
      dry: `Regen ist selten, etwa ${days} von ${n} Tagen sind nass`,
      occasional: `Regen fällt an etwa ${days} von ${n} Tagen`,
      showery: `An etwa ${days} von ${n} Tagen regnet es, dazwischen gibt es trockene Phasen`,
      wet: `Es regnet an etwa ${days} von ${n} Tagen`,
    }[freq];
    const t = !top ? '' : top.first ? `, damit ist es ${inCity} der ${KIND[top.kind]} Monat` : `, damit gehört er zu den drei ${top.kind === 'wettest' ? 'nassesten' : 'trockensten'} Monaten des Jahres`;
    return `${base}${t}`;
  },
  rainJoin: '; ',
  stop: '.',
  rainSizeLine: ({ per, sizeK, vs, year }) => {
    const kind = {
      lightCool: 'meist kalter Niesel',
      lightWarm: 'meist ein kurzer Schauer',
      moderateCool: 'eher anhaltender Regen als ein kurzer Schauer',
      moderateWarm: 'genug, um ohne Schirm nass zu werden',
      heavyCool: 'ein richtiger Dauerguss',
      heavyWarm: 'oft als kräftige Güsse',
    }[sizeK];
    const cmp = { heavier: `, mehr als die üblichen ${year} mm der Stadt`, lighter: `, weniger als die üblichen ${year} mm der Stadt`, typical: `, nah an den üblichen ${year} mm der Stadt` }[vs] || '';
    return `nasse Tage bringen ${per}, ${kind}${cmp}.`;
  },
  snowNote: { snow: 'Bei diesen Temperaturen fällt vieles davon wohl als Schnee.', mixed: 'Ein Teil davon kann als Schneeregen oder Schnee fallen.' },
  dayLine: ({ monthN, cityN, rise, set, len, band, dir, amt, pm }) => {
    const lead = { long: 'Lange Tage: Mitte', short: 'Kurze Tage: Mitte', normal: 'Mitte' }[band] || 'Mitte';
    const chg = { barely: `, etwa so viel wie Mitte ${pm}`, shorter: `, ${amt} weniger als Mitte ${pm}`, longer: `, ${amt} mehr als Mitte ${pm}` }[dir];
    return `${lead} ${monthN} hat ${cityN} ${len} Tageslicht, von Sonnenaufgang gegen ${rise} Uhr bis Sonnenuntergang gegen ${set} Uhr${chg}.`;
  },
  sunLine: ({ share, skyK, rel }) => {
    const r = { above: ', eher die sonnige Seite des Jahres hier', below: ', eher die trübe Seite des Jahres hier' }[rel] || '';
    const sky = { cloudy: 'der Himmel ist oft bewölkt', mixed: 'Sonne und Wolken wechseln sich ab', bright: 'es gibt viele sonnige Abschnitte', clear: 'der Himmel ist meist klar', showery: 'zwischen den Schauern gibt es helle Abschnitte', clearDry: 'der Himmel ist meist klar und Regen selten', clearSome: 'zwischen den nassen Tagen ist der Himmel meist klar', brightSome: 'zwischen den nassen Tagen gibt es helle Abschnitte' }[skyK];
    return `Modellschätzungen zufolge scheint die Sonne etwa ${share} % des Tageslichts${r}, also: ${sky}.`;
  },
  cmpRain: (rain) => (rain === 0 ? ', bei etwa gleich viel Regen' : `, mit ${h.n0(Math.abs(rain))} mm ${rain > 0 ? 'mehr' : 'weniger'} Regen`),
  cmpLine: ({ monthN, inCity, rankTxt, prevN, delta, warmer, mag, same, rainTxt }) => {
    const first = rankTxt ? `Der ${monthN} ist ${inCity} ${rankTxt} des Jahres` : `Der ${monthN}`;
    if (same) return <>{first} und etwa so warm wie der {prevN}{rainTxt}.</>;
    const size = { slight: 'nur ', big: 'ganze ', plain: '' }[mag];
    return <>{first}; die Nachmittage sind {size}{delta} {warmer ? 'wärmer' : 'kühler'} als im {prevN}{rainTxt}.</>;
  },
  nextLine: ({ trendK, nextN, temp, rainDir }) => {
    const base = {
      peak: <>Danach kippt das Jahr: Der {nextN} ist schon kühler, mit Höchstwerten um {temp}</>,
      trough: <>Das ist der Tiefpunkt: Der {nextN} erwärmt sich auf etwa {temp}</>,
      warming: <>Die Temperaturen steigen bis in den {nextN} weiter, auf etwa {temp}</>,
      cooling: <>Die Temperaturen sinken bis in den {nextN} weiter, auf etwa {temp}</>,
      flat: <>Bis in den {nextN} ändert sich kaum etwas, es bleibt bei etwa {temp}</>,
    }[trendK];
    const r = { wetter: ', und es wird nasser', drier: ', und es wird trockener' }[rainDir] || '';
    return <>{base}{r}.</>;
  },
  suitWhy: {
    sightseeing: {
      ok: 'die Tagestemperaturen passen gut zum Herumlaufen', okCool: 'mit Jacke angenehm zu Fuß', okWarm: 'warm, aber für einen Stadtbummel machbar',
      rainSnow: 'an mehr als der Hälfte der Tage fällt Regen oder Schnee', rainMostSnow: 'an den meisten Tagen fällt Regen oder Schnee', rain: 'an mehr als der Hälfte der Tage regnet es', rainMost: 'an den meisten Tagen regnet es', hot: 'die Mittagshitze macht lange Wege anstrengend', cold: 'für lange Spaziergänge ist es kalt', coldHard: 'zu kalt für lange Spaziergänge',
    },
    parks: {
      ok: 'angenehm für lange Spaziergänge und Picknicks', okCool: 'mit einer leichten Schicht angenehm',
      hot: 'nachmittags ist es zu warm, um lange draußen zu bleiben', hotHard: 'nachmittags viel zu heiß, um draußen zu sitzen',
      cold: 'zu kalt, um lange draußen zu sitzen', coldHard: 'viel zu kalt, um draußen zu sitzen', coldMild: 'etwas zu kühl, um lange draußen zu sitzen',
      rain: 'Regen durchkreuzt Pläne im Freien', rainMost: 'Regen durchkreuzt die meisten Pläne im Freien',
    },
    beach: { ok: 'warm und an der Küste meist trocken', hot: 'heißes Küstenwetter', cold: 'die Seeluft ist zu kühl', coldHard: 'viel zu kalt für den Strand', rain: 'zu viele Regentage', rainMost: 'Regen an den meisten Tagen' },
    hiking: { ok: 'milde Temperaturen für Wanderwege', cold: 'auf den Wegen ist es kühl', coldHard: 'auf den Wegen ist es kalt, also warm anziehen', hot: 'zu heiß für lange Wanderungen', rain: 'nasse Wege', rainMost: 'die Wege bleiben nass' },
    indoor: { rainSnow: 'bei Regen oder Schnee an den meisten Tagen sind Galerien und Museen eine einfache Wahl', rain: 'bei Regen an den meisten Tagen sind Galerien und Museen eine einfache Wahl', hot: 'eine kühle Pause in den heißesten Stunden', cold: 'warme Orte für den kältesten Teil des Tages' },
  },
  tips: {
    layers: {
      big: 'Nachmittag und Nacht liegen weit auseinander, also Kleidung zum An- und Ausziehen mitnehmen.',
      cold: 'Morgens und abends ist es im Vergleich zum Mittag kalt, also im Zwiebellook kleiden.',
      mild: 'Die Tage sind deutlich wärmer als die Nächte: Kleidung zum An- und Ausziehen.',
    },
    rain: {
      showeryLight: 'Schauer sind meist leicht, ein kompakter Schirm reicht.',
      showeryModerate: 'Für die nassen Tage einen kleinen Schirm in die Tasche.',
      showeryHeavy: 'Wenn es regnet, dann oft kräftig: eine leichte Regenjacke mitnehmen.',
      wetLight: 'Niesel ist häufig, eine verstaubare Regenjacke lohnt sich.',
      wetModerate: 'Regen ist häufig: eine Regenjacke und Schuhe, die Pfützen aushalten.',
      wetHeavy: 'Regen ist häufig und kräftig: gute Regenkleidung und schnell trocknende Schuhe.',
      wintry: 'Regen oder Schnee sind häufig: eine wasserfeste Jacke und Stiefel mit gutem Profil.',
    },
    sun: {
      extreme: 'Extreme Hitze: Hut, Sonnencreme, weite Kleidung und viel Wasser.',
      humid: 'Weite, atmungsaktive Kleidung, dazu Sonnencreme und ein breitkrempiger Hut.',
      dry: 'Vor starker Sonne und trockener Luft schützen: Hut, Sonnencreme und viel Wasser.',
      clear: 'Sonnencreme, Hut und Sonnenbrille; leichte, atmungsaktive Kleidung.',
    },
    jacket: {
      cold: 'Eine Jacke für den kalten Morgen, später leicht zu tragen.',
      cool: 'Eine leichte Jacke oder Strickjacke reicht für den Großteil des Tages.',
      mild: 'Einen Pullover oder leichten Mantel für kühle Nachmittage einpacken.',
    },
    warm: {
      freezing: 'Ein richtiger Wintermantel, Handschuhe und Mütze, dazu warme Schuhe für glatte Wege.',
      cold: 'Ein richtiger Wintermantel, dazu Handschuhe und Mütze für frühe Starts.',
      frost: 'Eine warme Jacke, Mütze und Handschuhe für frostige Morgen.',
      chilly: 'Eine warme Jacke und eine Mütze für kalte Morgen und Abende.',
    },
    shades: {
      clear: 'Klarer Himmel ist häufig, Sonnenbrille und leichter Hut lohnen sich.',
      bright: 'Sonnige Abschnitte sind häufig, also Sonnenbrille und Kappe einpacken.',
      mixed: 'Die Sonne kommt und geht, eine Sonnenbrille gehört trotzdem in die Tasche.',
    },
    light: { any: 'Bequeme Kleidung und eine leichte Schicht für den Abend.' },
    shoes: { any: 'Bei vielen nassen Tagen helfen Schuhe, die Pfützen aushalten und schnell trocknen.', heavy: 'Viel starker Regen: wasserfeste Schuhe und ein Paar Ersatzsocken.', snow: 'Wasserfeste Stiefel mit gutem Profil für nasse oder glatte Wege.' },
  },
  a1: ({ hi, lo, feel, warmRank }) => <>Nachmittags im Schnitt {hi}, nachts etwa {lo}, für die meisten {feel}{warmRank && <>; es ist {warmRank} des Jahres</>}.</>,
  a2: {
    never: ({ monthN, none }) => <>So gut wie nie: Der {monthN} ist praktisch regenlos, mit {none ? 'keinem Regentag' : 'etwa einem Regentag'} in einem typischen Jahr.</>,
    dry: ({ daysTxt, mm }) => <>Nein: nur etwa {daysTxt} und {h.n0(mm)} mm im ganzen Monat.</>,
    yes: ({ mm, often, sizeK }) => <>Ja: Regen fällt {often} und summiert sich auf etwa {h.n0(mm)} mm{{ light: ', meist leicht', moderate: ', ein Schirm lohnt sich also', heavy: ', oft kräftig, also ein paar Indoor-Optionen einplanen' }[sizeK]}.</>,
    some: ({ daysTxt, mm, light }) => <>Nicht besonders: etwa {daysTxt} ({h.n0(mm)} mm), meist {light ? 'leichter' : 'mäßiger'} Regen.</>,
  },
  a3: ({ list, eve, cold }) => ({
    cool: <>Einpacken: {list}, dazu eine weitere Schicht für {cold ? 'kalte' : 'kühle'} Morgen und Abende.</>,
    same: <>Einpacken: {list}. Die Abende fühlen sich ähnlich an, dieselbe Kleidung passt also.</>,
    warm: <>Einpacken: {list}. Auch nach Einbruch der Dunkelheit bleibt es warm, eine weitere Schicht braucht man nicht.</>,
  }[eve]),
  a4: ({ win, ranks, labels, whyTxt, narrow }) => <>Der {win} schneidet in unserem Klima-Ranking {narrow ? 'knapp' : 'deutlich'} besser ab (Platz {ranks.a} von 12 gegenüber Platz {ranks.b}){labels ? `, bewertet mit „${labels[0]}“ gegenüber „${labels[1]}“` : ''}.{whyTxt}</>,
  season: {
    equator: ({ cityN, monthN }) => [
      `${cityN} liegt nahe am Äquator und kennt keinen echten Winter oder Sommer – es ist das ganze Jahr warm, und der ${monthN} macht da keine Ausnahme.`,
      `So nah am Äquator gibt es keine vier Jahreszeiten: ${cityN} ist ganzjährig warm, auch im ${monthN}.`,
    ],
    tropical: ({ cityN, monthN }) => [
      `${cityN} liegt in den Tropen und bleibt das ganze Jahr über warm, ohne klare Trennung der Jahreszeiten.`,
      `Als tropische Stadt ist ${cityN} ganzjährig warm; der ${monthN} gehört weder klar zur Trocken- noch zur Regenzeit.`,
    ],
    wet: ({ cityN, monthN }) => `Der ${monthN} fällt in die Regenzeit von ${cityN} – die Niederschlagswerte liegen deutlich über denen der trockenen Monate.`,
    dry: ({ cityN, monthN }) => `Der ${monthN} gehört zur Trockenzeit von ${cityN}; die Regenmengen liegen weit unter denen der nassen Monate.`,
    between: ({ cityN, monthN }) => `Der ${monthN} liegt in ${cityN} zwischen Trocken- und Regenzeit.`,
    south: ({ cityN }) => ` (${cityN} liegt auf der Südhalbkugel, die Jahreszeiten sind also umgekehrt wie in Europa)`,
    peakSummer: ({ monthN, inCity, south }) => [`Im ${monthN} ist ${inCity} Hochsommer – der wärmste Monat des Jahres${south}.`, `Der Sommer erreicht im ${monthN} seinen Höhepunkt: Kein Monat ${inCity} ist wärmer${south}.`],
    troughWinter: ({ monthN, inCity, cityN, south }) => [`Der ${monthN} ist der kälteste Abschnitt des Winters ${inCity}${south}.`, `Im ${monthN} erreicht der Winter in ${cityN} seinen Tiefpunkt – der kühlste Monat des Jahres${south}.`],
    warmWinter: ({ monthN, inCity, season, stage, south, feel }) => `Im ${monthN} ist ${inCity} ${SEASON[season][stage]}${south}, wobei Winter hier ${feel}e Tage bedeutet und keine kalten.`,
    normal: ({ monthN, inCity, season, stage, south }) => [
      `Im ${monthN} ist ${inCity} ${SEASON[season][stage]}${south}.`,
      `${cap(inCity)} bringt der ${monthN} den ${SEASON[season][stage]}${south}.`,
      `Für ${inCity.replace(/^(in|auf) /, '')} bedeutet der ${monthN} ${SEASON[season][stage]}${south}.`,
    ],
  },
  feelWord: { freezing: 'frostig', cold: 'kalt', chilly: 'frisch', cool: 'kühl', mild: 'mild', warm: 'warm', hot: 'heiß', 'very-hot': 'sehr heiß' },
  polar: {
    day: ({ monthN, inCity }) => `Mitte ${monthN} geht die Sonne ${inCity} nicht unter.`,
    night: ({ monthN, inCity }) => `Mitte ${monthN} steigt die Sonne ${inCity} nicht über den Horizont.`,
  },
  equatorDay: 'So nah am Äquator verschieben sich Sonnenauf- und -untergang übers Jahr nur wenig.',
  packPhrase: { shoes: 'wasserfeste Schuhe', layers: 'Kleidung im Zwiebellook', rain: 'Regenschutz', sun: 'Sonnenschutz', jacket: 'eine leichte Jacke', warm: 'warme Kleidung', shades: 'eine Sonnenbrille', light: 'leichte Kleidung' },
  wear: {
    title: ({ monthN, cityN }) => `Was man im ${monthN} in ${cityN} anziehen sollte`,
    basis: 'Das sind Schätzungen aus Monatsmittelwerten, jede Temperatur ist also als „etwa“ zu verstehen.',
    h3: { time: 'Nach Tageszeit', pack: 'Packliste für 7 Tage', year: { normal: 'Kaltes oder warmes Jahr', winter: 'Kaltes oder mildes Jahr', cooler: 'Kühleres oder heißeres Jahr', hot: 'Kühles oder heißes Jahr' } },
    at: { morning: (t) => <>Morgens, etwa {t}:</>, afternoon: (t) => <>Nachmittags, etwa {t}:</>, evening: (t) => <>Abends, etwa {t}:</> },
    morning: { winter: 'ein richtiger Wintermantel, Handschuhe und eine Mütze.', cold: 'eine warme Jacke und eine Mütze, darunter eine weitere Schicht.', mild: 'eine leichte Jacke oder ein Pullover.', warm: 'leichte Kleidung und anfangs eine dünne Schicht.', hot: 'leichte, weite Kleidung vom Morgen an.' },
    afternoon: { winter: 'der Mantel bleibt an, auch mittags.', cold: 'die Jacke bleibt zum Gehen an, die zusätzliche Schicht kann weg.', mild: 'ein leichtes Oberteil genügt, die Jacke griffbereit.', warm: 'leichte, luftige Kleidung genügt.', warmSun: 'leichte Kleidung, ein Hut und Sonnencreme.', hot: 'ein Hut, Sonnencreme und weite Kleidung, dazu viel Wasser.' },
    evening: { ice: 'wieder nahe am Gefrierpunkt, also alle Schichten anlassen und auf glatte Gehwege achten.', winter: 'alle Schichten anlassen.', cold: 'die Schicht wieder anziehen.', mild: 'die Jacke wieder anziehen.', warm: 'die dünne Schicht wieder anziehen.', warmNight: 'dieselbe leichte Kleidung, eine weitere Schicht ist nicht nötig.', same: 'dieselbe Kleidung passt, die Temperatur ändert sich kaum.' },
    year: {
      normal: ({ monthN, coldY, warmY, cold, warm }) => <>In einem kalten Jahr wie {coldY} lagen die Höchstwerte im {monthN} im Schnitt nur bei {cold}, eine zusätzliche warme Schicht lohnt sich also. In einem warmen Jahr wie {warmY} erreichten sie {warm}, dann reicht eine leichtere Schicht.</>,
      winter: ({ monthN, coldY, warmY, cold, warm }) => <>In einem kalten Jahr wie {coldY} lagen die Höchstwerte im {monthN} im Schnitt nur bei {cold}, eine zusätzliche warme Schicht lohnt sich also. Selbst in einem milden Jahr wie {warmY} erreichten sie nur {warm}, der Wintermantel kommt also trotzdem mit.</>,
      cooler: ({ monthN, coldY, warmY, cold, warm }) => <>In einem kühleren Jahr wie {coldY} lagen die Höchstwerte im {monthN} im Schnitt bei {cold}, eine leichte zusätzliche Schicht lohnt sich also. In einem heißeren Jahr wie {warmY} erreichten sie {warm}, dann bleibt die Kleidung leicht.</>,
      hot: ({ monthN, coldY, warmY, cold, warm, y1, y2 }) => <>Selbst der kühlste {monthN} von {y1}–{y2}, im Jahr {coldY}, lag im Schnitt bei {cold}, der heißeste, im Jahr {warmY}, bei {warm}. So oder so braucht man nichts Wärmeres.</>,
    },
    wet: {
      none: 'In einer typischen Woche ist kein nasser Tag zu erwarten, die Regenkleidung kann also zu Hause bleiben.',
      some: ({ n, wintry, size, per }) => {
        const tail = !per ? '' : wintry ? <>, als Regen oder Schnee, mit jeweils {per}</> : size === 'light' ? <>, meist leichter Regen mit {per} pro Tag</> : size === 'heavy' ? <>, oft kräftig, mit jeweils {per}</> : <>, mit jeweils {per}</>;
        return <>Rechnen Sie mit etwa {n} {n === 1 ? 'nassen Tag' : 'nassen Tagen'} pro Woche{tail}.</>;
      },
    },
    items: { coat: 'Ein Wintermantel', coatWet: 'Ein Wintermantel mit wasserdichter Außenschicht', midThermal: '2 warme Zwischenschichten und eine Thermo-Unterschicht', glovesHat: 'Handschuhe und eine Mütze', jacketHat: 'Eine warme Jacke und eine Mütze', mid2: '2 warme Zwischenschichten', lightJacket: 'Eine leichte Jacke oder ein Pullover', lightLayers: '2 oder 3 leichte Schichten', lightClothes: 'Leichte, luftige Kleidung', thinLayer: 'Eine dünne Schicht für Morgen und Abend', looseClothes: 'Weite, luftige Kleidung', rainJacket: 'Eine kleine Regenjacke', sunKit: 'Ein Hut, Sonnencreme und eine Sonnenbrille', shades: 'Eine Sonnenbrille und ein leichter Hut', bottle: 'Eine Wasserflasche', boots: 'Warme Stiefel mit gutem Profil', wpShoes: 'Wasserfeste, schnell trocknende Schuhe', lightShoes: 'Leichte, luftige Schuhe', walkShoes: 'Bequeme Laufschuhe' },
    trip: { lead: 'Reisen Sie zu bestimmten Terminen?', link: 'Prüfen Sie Ihre genauen Daten im Reiseplaner.' },
  },
  hist: {
    title: ({ monthN, cityN, n }) => `${monthN} in ${cityN}: Was ${n} Jahre zeigen`,
    basis: ({ y1, y2 }) => `Auf Basis von Monatsmittelwerten ${y1}–${y2}, keine Tagesrekorde.`,
    h3: { range: 'Üblicher Bereich', records: 'Rekorde', odds: 'Häufigkeit über die Jahre' },
    to: 'bis',
    range: ({ monthN, temps, rainLo, rainHi, wintry }) => <>In den meisten Jahren liegt der {monthN} nachmittags im Schnitt bei {temps}, mit {rainLo}–{rainHi} mm {wintry ? 'Regen oder Schnee' : 'Regen'}.</>,
    chance: ({ monthN, often, wintry, never }) => (never ? `In einem durchschnittlichen ${monthN} regnet es so gut wie nie.` : `${wintry ? 'Regen oder Schnee fällt' : 'Regen fällt'} in einem durchschnittlichen ${monthN} ${often}.`),
    caption: ({ monthN, y1, y2 }) => `Rekorde im ${monthN}, ${y1}–${y2} (Monatsmittelwerte)`,
    th: { record: 'Rekord', year: 'Jahr', high: 'Mittl. Höchstwert', rain: 'Regen', days: 'Regentage' },
    record: {
      warm: ({ monthN }) => `Wärmster ${monthN}`, cold: ({ monthN }) => `Kältester ${monthN}`, cool: ({ monthN }) => `Kühlster ${monthN}`,
      wet: ({ monthN }) => `Nassester ${monthN}`, dry: ({ monthN }) => `Trockenster ${monthN}`,
    },
    ties: ({ count, n }) => `${count} von ${n} Jahren`,
    odds: {
      rainy: ({ monthN, count, n, t, wintry }) => `In ${count} von ${n} Jahren hatte der ${monthN} ${t} oder mehr ${wintry ? 'nasse Tage' : 'Regentage'}.`,
      anyrain: ({ monthN, count, n, wintry }) => `In ${count} von ${n} Jahren hatte der ${monthN} mindestens einen ${wintry ? 'nassen Tag' : 'Regentag'}.`,
      dry: ({ count, n, t, wintry }) => `In ${count} von ${n} Jahren fielen unter ${t} mm ${wintry ? 'Regen oder Schnee' : 'Regen'}.`,
      warm: ({ count, n, temp }) => <>In {count} von {n} Jahren erreichte der mittlere Höchstwert {temp} oder mehr.</>,
      cool: ({ count, n, temp }) => <>In {count} von {n} Jahren blieb er unter {temp}.</>,
    },
    latest: ({ monthN, year, dir, rank, total, y1, high, mm, days, wintry }) => <>Unter den {total} Jahren seit {y1} lag der {monthN} {year} auf Platz {rank} der {dir === 'warm' ? 'wärmsten' : 'kältesten'} ({high}{mm ? `, ${mm}` : ''}{days != null ? `, ${days} ${wintry ? (days === 1 ? 'nasser Tag' : 'nasse Tage') : (days === 1 ? 'Regentag' : 'Regentage')}` : ''}).</>,
    broke: {
      warm: { beat: ({ monthN, year, y1, y2, value }) => <>Der {monthN} {year} war wärmer als jeder {monthN} von {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>Der {monthN} {year} erreichte den Wert des wärmsten {monthN} von {y1}–{y2} ({value}).</> },
      cold: { beat: ({ monthN, year, y1, y2, value }) => <>Der {monthN} {year} war kälter als jeder {monthN} von {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>Der {monthN} {year} erreichte den Wert des kältesten {monthN} von {y1}–{y2} ({value}).</> },
      wet: { beat: ({ monthN, year, y1, y2, value }) => <>Der {monthN} {year} war nasser als jeder {monthN} von {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>Der {monthN} {year} erreichte den Wert des nassesten {monthN} von {y1}–{y2} ({value}).</> },
      dry: { beat: ({ monthN, year, y1, y2, value }) => <>Der {monthN} {year} war trockener als jeder {monthN} von {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>Der {monthN} {year} erreichte den Wert des trockensten {monthN} von {y1}–{y2} ({value}).</> },
    },
  },
  q1: ({ monthN, cityN }) => `Wie warm ist es in ${cityN} im ${monthN}?`,
  q2: ({ monthN, cityN }) => `Regnet es im ${monthN} viel in ${cityN}?`,
  q3: ({ monthN, cityN }) => `Was sollte man im ${monthN} in ${cityN} anziehen?`,
  q4: ({ monthN, nextN, cityN }) => `Ist der ${monthN} oder der ${nextN} besser für ${cityN}?`,
  nextWhy: ({ nextN, why }) => {
    const parts = why.map((w) => ({ warmer: 'wärmer', cooler: 'kühler', fewerRain: 'hat weniger Regentage', moreRain: 'hat mehr Regentage' }[w]));
    const first = parts[0] === 'wärmer' || parts[0] === 'kühler' ? `ist ${parts[0]}` : parts[0];
    return `Der ${nextN} ${[first, ...parts.slice(1)].join(' und ')}.`;
  },
};

const de = {
  lang: 'de',
  story: makeStory(P),
  locale: h.loc,
  place: (cityN, countryN) => (cityN === countryN ? cityN : `${cityN}, ${countryN}`),
  list: h.list,
  month: h.month,
  monthShort: h.monthShort,
  verdict: P.verdict,
  reasons: (v) => v.reasons.map(reasonText).filter(Boolean).join(', '),
  suitLabel: (s) => SUIT[s.key] || s.label,
  suitStatus: (s) => (s.key === 'indoor' ? 'eine gute Wahl' : s.ok ? 'passt gut' : 'weniger ideal'),
  packTitle: P.packTitle,

  // ── Stadtseite ─────────────────────────────────────────────
  cityMeta: ({ cityN, countryN, x, best }) => ({
    title: fit(60, `Wetter ${cityN}: Klima & beste Reisezeit nach Monaten`, `Wetter ${cityN}: Klima & beste Reisezeit`, `Wetter ${cityN} nach Monaten`),
    imageTitle: `Wetter ${cityN} nach Monaten`,
    description: fit(160,
      `Wetter in ${cityN === countryN ? cityN : `${cityN} (${countryN})`} Monat für Monat: am wärmsten im ${h.month(x.warmest?.month.num)}, am nassesten im ${h.month(x.wettest?.month.num)}. Beste Reisezeit: ${h.list(best)}. 20-Jahres-Mittel.`,
      `Wetter in ${cityN} Monat für Monat: am wärmsten im ${h.month(x.warmest?.month.num)}. Beste Reisezeit: ${h.list(best)}. Mittelwerte aus 20 Jahren.`,
      `Wetter in ${cityN} nach Monaten – beste Reisezeit: ${h.list(best)}.`),
  }),
  cityDataset: ({ cityN, place, years }) => ({
    name: `Wetter ${cityN} nach Monaten: Klimamittel ${years.start}–${years.end}`,
    description: `Monatliche Klimamittel für ${place}: durchschnittliche Höchst- und Tiefsttemperatur, Niederschlagsmenge, Regentage, tägliche Sonnenstunden und Luftfeuchtigkeit für jeden Monat, gemittelt über ${years.start}–${years.end} aus historischen Wetterdaten.`,
  }),
  variables: ['Durchschnittliche Höchsttemperatur', 'Durchschnittliche Tiefsttemperatur', 'Niederschlagsmenge', 'Regentage', 'Sonnenstunden', 'Relative Luftfeuchtigkeit'],
  skylineAlt: (place) => `Skyline von ${place}`,
  cityH1: (cityN) => `Wetter ${cityN} nach Monaten`,
  citySub: (place, years) => <>Zwölf Monate Wetter in {place} – Mittelwerte {years.start}–{years.end}.</>,
  CityIntro: ({ x, inCity: inC }) => (
    <>
      {x.warmest && <>Der wärmste Monat {inC} ist der <S>{h.month(x.warmest.month.num)}</S> (mittleres Maximum <UnitTemp c={x.warmest.row.avg_high} />)</>}
      {x.coolest && <>, der kühlste der <S>{h.month(x.coolest.month.num)}</S> (<UnitTemp c={x.coolest.row.avg_high} />)</>}.
      {x.wettest && <> Am meisten Regen fällt im <S>{h.month(x.wettest.month.num)}</S> (etwa {h.n0(x.wettest.row.avg_rainfall)} mm)</>}
      {x.driest && <>, am trockensten ist der <S>{h.month(x.driest.month.num)}</S> (etwa {h.n0(x.driest.row.avg_rainfall)} mm)</>}.
      {x.sunniest && <> Am sonnigsten ist der <S>{h.month(x.sunniest.month.num)}</S> mit rund {h.n1(x.sunniest.row.sunshine_hours)} Sonnenstunden pro Tag.</>}
    </>
  ),
  bestTitle: (cityN) => `Beste Reisezeit für ${cityN}`,
  bestNote: () => 'Gereiht innerhalb des Jahres der Stadt nach angenehmen Temperaturen, Regentagen und Sonnenschein – historische Mittelwerte, keine Vorhersage.',
  monthByMonth: (cityN) => `${cityN} Monat für Monat`,
  high: 'Max.',
  low: 'Min.',
  srRainfall: 'Niederschlag',
  srRainy: 'Regentage',
  srSun: 'Sonnenschein',
  rainMmIn: (mm) => `${h.n0(mm)} mm`,
  rainyDaysN: (n) => `${h.n1(n)} Regentage`,
  sunPerDay: (v) => `${h.n1(v)} Std. Sonne / Tag`,
  guideTitle: (cityN) => `Klima & Wetter in ${cityN}`,
  guideSub: (years) => <>Temperatur, Niederschlag und Sonnenschein im Jahresverlauf – Mittelwerte {years.start}–{years.end}.</>,
  tiles: { hottest: 'Ø Max. im wärmsten Monat', coolest: 'Ø Max. im kühlsten Monat', wettest: 'Ø im nassesten Monat', driest: 'Ø im trockensten Monat' },
  tempByMonth: 'Temperatur nach Monaten',
  rainByMonth: 'Niederschlag nach Monaten',
  sunHours: 'Sonnenstunden',
  chartTemp: (cityN) => `${cityN}: durchschnittliche Höchst- und Tiefsttemperatur nach Monaten`,
  chartRain: (cityN) => `${cityN}: durchschnittlicher Niederschlag nach Monaten`,
  chartSun: (cityN) => `${cityN}: durchschnittliche tägliche Sonnenstunden nach Monaten`,
  monthlyAverages: 'Monatsmittel',
  whatToPack: 'Was einpacken?',
  packIntro: (cityN) => <>Packtipps für das Klima in {cityN}.</>,
  cityPacking: {
    layers: { title: 'Zwiebellook', text: 'Leichte Schichten für milde Nachmittage und kühlere Abende.' },
    rain: { title: 'Regenschutz', text: 'Ein kompakter Schirm und eine leichte Regenjacke für die nassesten Monate.' },
    sun: { title: 'Sonnenschutz', text: 'Sonnencreme, ein breitkrempiger Hut und eine Sonnenbrille für heiße, sonnige Tage.' },
    warm: { title: 'Warme Kleidung', text: 'Eine warme Jacke oder ein Fleece für frische Morgen und Abende.' },
  },
  moreCities: (countryN, country) => `Weitere Städte ${inCountry('de', country)} nach Monaten`,
  weatherByMonth: 'Wetter nach Monaten',
  ctaCityTitle: (cityN) => `Sie planen eine Reise nach ${cityN}?`,
  ctaCityText: 'Holen Sie sich einen Wetterplan Tag für Tag für Ihre genauen Reisedaten.',
  ctaCityButton: 'Zum Reiseplaner',
  cityDataNote: (years) => <>Basierend auf {years.end - years.start + 1} Jahren historischer Wetterdaten ({years.start}–{years.end}) von Open-Meteo. Monatsmittel, keine Vorhersage.</>,

  // ── Monatsseite ────────────────────────────────────────────
  monthMeta: ({ cityN, countryN, monthN, row, verdict }) => {
    const t = (c) => (c == null ? '—' : `${h.n1(Math.round(c * 10) / 10)} °C`);
    const base = `Wetter in ${cityN} im ${monthN}: tagsüber ${t(row?.avg_high)}, nachts ${t(row?.avg_low)}, ${h.n1(row?.rainy_days)} Regentage und ${h.n1(row?.sunshine_hours)} Std. Sonne am Tag.`;
    return {
      title: fit(60, `Wetter ${cityN} ${monthN}: Temperatur, Regen & Tipps`, `Wetter ${cityN} ${monthN}: Temperatur & Regen`, `Wetter ${cityN} im ${monthN}`),
      imageTitle: `Wetter ${cityN} im ${monthN}`,
      kicker: countryN,
      description: fit(160, `${base} Reisezeit: ${verdict ? VERDICT[verdict.label] : '–'}.`, base, `Wetter in ${cityN} im ${monthN}: Temperaturen, Regentage und Sonnenschein.`),
    };
  },
  monthDataset: ({ cityN, place, monthN, years }) => ({
    name: `Wetter ${cityN} im ${monthN}: Klimamittel ${years.start}–${years.end}`,
    description: `Monatliche Klimamittel für ${place} im ${monthN}: durchschnittliche Höchst- und Tiefsttemperatur, Niederschlagsmenge, Regentage, tägliche Sonnenstunden und Luftfeuchtigkeit, gemittelt über ${years.start}–${years.end} aus historischen Wetterdaten.`,
  }),
  monthH1: (cityN, monthN) => `Wetter ${cityN} im ${monthN}`,
  stat: { avgHigh: 'Ø Max.', avgLow: 'Ø Min.', rainfall: 'Niederschlag', rainyDays: 'Regentage', sunshine: 'Sonnenschein', humidity: 'Luftfeuchte' },
  statDays: (n) => `${h.n1(n)} ${n === 1 ? 'Tag' : 'Tage'}`,
  statSun: (v) => `${h.n1(v)} Std. / Tag`,
  Latest: ({ monthN, latest, row, years }) => (
    <>
      <span className="font-semibold text-gray-700">Zuletzt gemessen – {monthN} {latest.year}:</span>{' '}
      max. <UnitTemp c={latest.avg_high} />, min. <UnitTemp c={latest.avg_low} />
      {latest.avg_rainfall != null && <>, {h.n0(latest.avg_rainfall)} mm Regen</>}
      {latest.rainy_days != null && <> an {h.n1(latest.rainy_days)} {latest.rainy_days === 1 ? 'Tag' : 'Tagen'}</>}
      {' '}(das Mittel {years.start}–{years.end} oben ist {latest.avg_high != null && row?.avg_high != null
        ? (latest.avg_high > row.avg_high + 0.4 ? 'kühler' : latest.avg_high < row.avg_high - 0.4 ? 'wärmer' : 'etwa gleich')
        : 'zum Vergleich'}).
    </>
  ),
  vsYearTitle: (monthN) => `Der ${monthN} im Vergleich zum restlichen Jahr`,
  tableFallback: (monthN, cityN) => <>Der {monthN} im Vergleich mit allen anderen Monaten in {cityN}.</>,
  th: { month: 'Monat', avgHigh: 'Ø Max.', vs: (monthN) => `ggü. ${monthN}`, rain: 'Regen', rainyDays: 'Regentage' },
  rainMm: (mm) => `${h.n0(mm)} mm`,
  chipsLabel: (cityN) => `Wetter ${cityN} nach Monaten`,
  chipAria: (cityN, mN) => `Wetter ${cityN} im ${mN}`,
  feelTitle: (monthN, cityN) => `So fühlt sich der ${monthN} in ${cityN} an`,
  rainTitle: (cityN, monthN) => `Regen in ${cityN} im ${monthN}`,
  daylightTitle: (monthN) => `Tageslicht und Sonne im ${monthN}`,
  compareTitle: (monthN) => `Der ${monthN} im Jahresvergleich`,
  suitsTitle: (monthN) => `Für wen eignet sich der ${monthN}?`,
  tipsTitle: (cityN, monthN) => `Tipps für ${cityN} im ${monthN}`,
  questionsTitle: 'Kurze Fragen',
  verdictTitle: (monthN, cityN) => `Ist der ${monthN} eine gute Reisezeit für ${cityN}?`,
  VerdictText: ({ verdict, relRank, cityN, monthN, reasons }) => (
    <>
      <strong>{VERDICT[verdict.label]}</strong> – {reasons}.
      {relRank && (
        <> Innerhalb des Jahres von {cityN} belegt der {monthN} <strong>Platz {relRank} von 12</strong>
          {relRank <= 3 ? <> – einer der 3 besten Monate für eine Reise.</> : relRank >= 10 ? <> – einer der ungemütlichsten Monate.</> : '.'}</>
      )}
    </>
  ),
  notesTitle: (cityN, monthN) => `Reisenotizen: ${cityN} im ${monthN}`,
  othersTitle: (monthN, countryN, country) => `Der ${monthN} in anderen Städten ${inCountry('de', country)}`,
  OtherHigh: ({ row }) => <>Max. <UnitTempShort c={row.avg_high} /> · {h.n0(row.avg_rainfall ?? 0)} mm</>,
  otherGuide: (monthN) => `Guide für den ${monthN}`,
  elsewhereTitle: (kind, monthN) => `${kind === 'both' ? 'Wärmer oder trockener' : kind === 'warmer' ? 'Wärmer' : 'Trockener'}: Reiseziele im ${monthN}`,
  ElsewhereHigh: ({ row }) => <>Max. <UnitTempShort c={row.avg_high} /></>,
  elsewhereRainy: (n) => `${n == null ? '—' : h.n1(n)} Regentage`,
  warmer: 'Wärmer',
  drier: 'Trockener',
  ctaMonthTitle: (cityN) => `Reise nach ${cityN} planen`,
  ctaMonthText: 'Holen Sie sich eine Wetterbewertung Tag für Tag für Ihre genauen Reisedaten.',
  ctaMonthButton: 'Reiseplaner öffnen',
  MonthDataNote: ({ years, cityHref, cityN }) => (
    <>
      Monatsmittel aus {years.end - years.start + 1} Jahren Open-Meteo-Daten ({years.start}–{years.end}), keine Vorhersage – alle 12 Monate unter{' '}
      <Link href={cityHref} className="text-[#0077b6] font-semibold hover:underline">Wetter {cityN} nach Monaten</Link>.
    </>
  ),

  // ── Länderseite ────────────────────────────────────────────
  countryMeta: ({ countryN, country, n }) => ({
    absoluteTitle: fit(60, `Beste Reisezeit ${countryN}: Wetter & Klima nach Monaten`, `Beste Reisezeit ${countryN}: Klima nach Monaten`, `Beste Reisezeit ${countryN}`),
    description: fit(160,
      `Beste Reisezeit ${countryN}: Klima ${inCountry('de', country)} für ${n} Städte Monat für Monat – Temperaturen, Regen und die schönsten Monate aus 20 Jahren Wetterdaten.`,
      `Beste Reisezeit ${countryN}: Wetter in ${n} Städten Monat für Monat – Temperaturen, Regen und die schönsten Reisemonate.`),
    kicker: 'Wetter nach Monaten & Städten',
  }),
  countryH1: (countryN) => <>Beste Reisezeit {countryN}: Wetter nach Städten &amp; Monaten</>,
  countrySub: (n, countryN, country) => <>Monatsmittel für {n} {n === 1 ? 'Stadt' : 'Städte'} {inCountry('de', country)}, aus 20 Jahren historischer Wetterdaten.</>,
  climateAcross: (countryN, country) => `Das Klima ${inCountry('de', country)}`,
  CountryIntro: ({ single, warmest, coolest, wettest, loaded }) => (
    <>
      {single && (
        <><strong className="text-gray-800">{single.name}</strong> hat übers Jahr eine mittlere Tageshöchsttemperatur von <UnitTemp c={single.v} /></>
      )}
      {warmest && (
        <>Von den Städten unten ist <strong className="text-gray-800">{warmest.name}</strong> die wärmste, mit einer mittleren Tageshöchsttemperatur von <UnitTemp c={warmest.v} /> übers Jahr</>
      )}
      {coolest && (
        <>, <strong className="text-gray-800">{coolest.name}</strong> ist mit <UnitTemp c={coolest.v} /> die kühlste</>
      )}
      .{wettest && <> {loaded.length > 1 ? 'In diesen Städten' : `In ${loaded[0].name}`} ist der <strong className="text-gray-800">{wettest.name}</strong> meist der nasseste Monat (im Schnitt etwa {h.n0(wettest.v)} mm).</>}
    </>
  ),
  preparing: 'Die Klimadaten für diese Städte werden gerade vorbereitet.',
  citiesByMonth: (countryN, country) => `Städte ${inCountry('de', country)} nach Monaten`,
  avgHighByMonth: 'Mittlere Höchsttemperatur nach Monaten',
  tapValue: 'Tippen Sie auf einen Wert, um den Monats-Guide der Stadt zu öffnen.',
  cityTh: 'Stadt',
  cellAria: (cityN, mN) => `${cityN} im ${mN}`,
  bestMonthsTitle: (countryN) => `Beste Reisezeit ${countryN}`,
  BestMonthsText: ({ across, best, worst }) => (
    <>
      Nach angenehmen Temperaturen, Regentagen und Sonnenschein {across ? `in ${across}` : 'in diesen Städten'} sind die schönsten Monate meist{' '}
      <strong className="text-gray-800">{best}</strong>
      {worst && <>; am ungemütlichsten ist meist der <strong className="text-gray-800">{worst}</strong></>}.
      Das sind historische Mittelwerte, keine Vorhersage.
    </>
  ),
};

export default de;
