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
    'rain-most': `Regen an den meisten Tagen (etwa ${n})`, 'rain-frequent': `häufig Regen (etwa ${n} Regentage)`,
    'rain-some': `einige Regentage (etwa ${n})`, dry: `überwiegend trocken (etwa ${n} Regentage)`,
    heavy: `viel Niederschlag (${n} mm)`, dull: `wenig Sonne (${n} Std. am Tag)`, sunny: `viel Sonne (${n} Std. am Tag)`,
  }[r.key || r.t] || '';
};
const SUIT = { sightseeing: 'Besichtigungen', parks: 'Parks & draußen', beach: 'Strand', hiking: 'Wandern', indoor: 'Museen & drinnen' };
const PACK = { layers: 'Zwiebellook', rain: 'Regenschutz', sun: 'Sonnenschutz', jacket: 'Leichte Jacke', warm: 'Warme Kleidung', shades: 'Sonnenbrille', light: 'Leichte Kleidung' };

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
  rainyDays: (n) => `${h.n1(n)} Regentage`,
  sunHours: (n) => `${h.n1(n)} Sonnenstunden`,
  mm: (n) => `${h.n0(n)} mm`,
  perDay: (v) => `etwa ${h.n1(v)} mm`,
  often: (o) => ({ most: 'an den meisten Tagen', everyOther: 'etwa jeden zweiten Tag', never: 'so gut wie nie', oneIn: `etwa an jedem ${o.k}. Tag` }[o.key]),

  hero: ({ monthN, place, y }) => [
    `So ist der ${monthN} in ${place} normalerweise – nach den Mittelwerten ${y}.`,
    `Typisches Wetter im ${monthN} in ${place}, auf Basis der Klimadaten ${y}.`,
    `${place} im ${monthN}: wie der Monat meist ausfällt – Mittelwerte ${y}.`,
  ],
  quick: ({ monthN, inCity, cityN, hi, lo, days, mm, sun }) => [
    <>Im {monthN} erreicht {cityN} im Schnitt {hi} am Tag und {lo} in der Nacht, bei etwa {days} ({mm} Niederschlag) und {sun} pro Tag.</>,
    <>Ein typischer {monthN}tag {inCity} kommt auf {hi} und kühlt nachts auf {lo} ab; dazu etwa {days} ({mm} insgesamt) und {sun} täglich.</>,
    <>{cityN} im {monthN}: Höchstwerte um {hi}, Tiefstwerte um {lo}, rund {days} mit zusammen {mm} und {sun} an einem durchschnittlichen Tag.</>,
  ],
  tableExtreme: ({ monthN, inCity, warmest, rainTxt }) => [
    <>Der {monthN} ist <strong>der {warmest ? 'wärmste' : 'kühlste'} Monat</strong> {inCity}{rainTxt && <>; beim Niederschlag ist er {rainTxt}</>}.</>,
    <>Kein Monat {inCity} ist {warmest ? 'wärmer' : 'kühler'} als der {monthN}{rainTxt && <>; beim Regen ist er {rainTxt}</>}.</>,
  ],
  tableNormal: ({ monthN, inCity, warmer, k, rainTxt }) => [
    <>Der {monthN} ist wärmer als <strong>{warmer} der übrigen 11 Monate</strong>{rainTxt && <>; beim Niederschlag ist er {rainTxt} {inCity}</>}.</>,
    <>{k <= 3 ? `Nur ${k} ${k === 1 ? 'Monat ist' : 'Monate sind'}` : `${k} der übrigen 11 Monate sind`} {inCity} wärmer als der {monthN}{rainTxt && <>; beim Regen ist er {rainTxt}</>}.</>,
    <>So schneidet jeder Monat {inCity} im Vergleich zum {monthN} ab{rainTxt && <> – beim Regen ist der {monthN} {rainTxt}</>}.</>,
  ],
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
  feel: {
    freezing: ['Die Tageswerte kommen kaum über den Gefrierpunkt – draußen fühlt es sich selbst mittags richtig winterlich an.', 'Auch die wärmste Stunde des Tages bleibt nahe am Gefrierpunkt.'],
    cold: ['Tagsüber bleibt es kalt, ein warmer Mantel ist auch mittags nötig.', 'Mittags wird es kaum wärmer – von morgens bis abends ist Mantel-und-Schal-Wetter.'],
    chilly: ['Die Tage sind eher frisch als eisig; mit einer ordentlichen Jacke lässt es sich gut spazieren.', 'Die Luft hat tagsüber etwas Kühles, wird aber selten bitterkalt.'],
    cool: ['Die Nachmittage sind kühl und mit einer Jacke angenehm für Spaziergänge.', 'Tagsüber fühlt es sich eher kühl und frisch als kalt an.', 'Die Tage sind auf der kühlen Seite – genau richtig für flotte Besichtigungen.'],
    mild: ['Die Nachmittage sind mild und mit leichter Kleidung für die meisten angenehm.', 'Tagsüber ist es mild – weder kalt noch heiß zum Herumlaufen.', 'Milde Nachmittage laden dazu ein, viele Stunden draußen zu verbringen.'],
    warm: ['Die Tage sind warm genug für kurze Ärmel, und man ist gern draußen.', 'Die Nachmittage sind warm und angenehm – gut für lange Tage unterwegs.'],
    hot: ['Die Nachmittage sind heiß, Besichtigungen klappen am besten morgens oder abends.', 'Mittags ist es heiß; auf langen Wegen zählen Schatten und Wasser.'],
    'very-hot': ['Die Mittagshitze ist intensiv – die meisten bleiben nachmittags im Schatten oder in klimatisierten Räumen.', 'Die Nachmittage sind sehr heiß; Pläne im Freien gelingen am besten früh am Tag oder nach Sonnenuntergang.'],
  },
  nightTxt: {
    'hard-frost': 'die Nächte fallen deutlich unter den Gefrierpunkt', frosty: 'die Nächte liegen um den Gefrierpunkt, Frost ist häufig',
    cold: 'die Nächte sind kalt', cool: 'die Nächte sind kühl', mild: 'die Nächte bleiben mild', warm: 'die Nächte bleiben warm', sultry: 'die Nächte sind schwül',
  },
  night: {
    sultry: () => ['Die Nächte bringen kaum Abkühlung: Selbst die kühlste Stunde bleibt sehr warm.', 'Auch nach Einbruch der Dunkelheit bleibt es heiß und schwül.'],
    small: ({ nightTxt }) => [`Zwischen Tag und Nacht gibt es kaum Unterschied: ${cap(nightTxt)}, und die Abende fühlen sich fast wie der Nachmittag an.`, `Nach Sonnenuntergang ändert sich wenig – ${nightTxt}, nur etwas unter dem Tagesniveau.`],
    moderate: ({ nightTxt }) => [`Nach Sonnenuntergang kühlt es spürbar ab – ${nightTxt}.`, `Am Abend sinkt die Temperatur deutlich, und ${nightTxt}.`, `Sobald die Sonne weg ist, ändert sich die Luft: ${cap(nightTxt)}.`],
    big: ({ nightTxt, delta }) => [
      <>Der Unterschied zwischen Tag und Nacht ist groß (etwa {delta}): {cap(nightTxt)}, Morgen und Abend fühlen sich also ganz anders an als der Mittag.</>,
      <>Nach Einbruch der Dunkelheit fällt die Temperatur stark – um rund {delta} –, und {nightTxt}.</>,
    ],
  },
  humidity: {
    veryHumidHot: ['Die Luft ist schwül, deshalb fühlt es sich heißer an, als das Thermometer zeigt.', 'Die hohe Luftfeuchtigkeit macht die Hitze drückend und klebrig, besonders an windstillen Nachmittagen.'],
    dampCold: ['Die feuchte Luft lässt die Kälte rauer wirken, als die Zahlen vermuten lassen.', 'Durch die Feuchtigkeit fühlt sich die Kälte klamm an, vor allem bei Wind.'],
    humidHot: ['Etwas Feuchtigkeit liegt in der Luft – spürbar, wenn die Sonne kräftig scheint.', 'Die Luft ist leicht feucht, warme Phasen fühlen sich etwas klebrig an.'],
    humidMild: ['Die Luft ist recht feucht, bei diesen Temperaturen aber selten drückend.', 'Die Luftfeuchtigkeit ist eher hoch, die milden Temperaturen halten es aber angenehm.'],
    dryHot: ['Die trockene Luft lässt Schweiß schnell verdunsten – es fühlt sich weniger klebrig an, man verliert aber schnell Wasser.', 'Die Hitze ist trocken statt schwül, also mehr trinken, als man denkt.'],
    dry: ['Die Luft ist trocken – Haut und Lippen spüren das oft mehr als die Temperatur.'],
    comfortable: ['Die Luftfeuchtigkeit ist moderat, die Luft fühlt sich weder klebrig noch trocken an.', 'Die Luft ist angenehm – weder schwül noch trocken.'],
  },
  rainFreq: {
    dry: ({ monthN, inCity, often, never }) => [`Regen ist im ${monthN} selten – die meisten Wochen vergehen ohne nassen Tag.`, never ? `Der ${monthN} ist ${inCity} ein trockener Monat; Regen fällt so gut wie nie.` : `Der ${monthN} ist ${inCity} ein trockener Monat; Regen fällt ${often}.`, 'Trockenes Wetter überwiegt, der Regenschirm kann meist im Koffer bleiben.'],
    occasional: ({ often }) => [`Ab und zu regnet es – ${often}.`, `Nasse Tage kommen gelegentlich vor, ${often}.`, `Die meisten Tage bleiben trocken; Regen fällt ${often}.`],
    showery: ({ often }) => [`Schauer gehören dazu und kommen ${often}.`, `Es ist ein wechselhafter Monat: Regen fällt ${often}, dazwischen gibt es trockene Phasen.`],
    wet: ({ monthN, often }) => [`Regen gehört in diesem Monat zum Alltag und fällt ${often}.`, `Der ${monthN} ist hier beständig nass: Etwas Regen fällt ${often}.`, `Trockene Tage sind die Ausnahme, Regen gibt es ${often}.`],
  },
  rainSize: {
    light: ({ per }) => [`An den meisten nassen Tagen fällt nur leichter Regen – ${per} an einem typischen Regentag –, eher Niesel oder kurze Schauer, die Pläne selten lange stoppen.`, `Wenn es regnet, dann meist leicht: ${per} pro Regentag, eher Niesel als Wolkenbruch.`],
    moderate: ({ per }) => [`Ein Regentag bringt im Schnitt ${per} – eher anhaltender Regen als ein kurzer Schauer.`, `Nasse Tage bringen im Schnitt ${per}, genug, um ohne Schirm nass zu werden.`],
    heavy: ({ per }) => [`Regen kommt oft in kräftigen Güssen: ${per} an einem durchschnittlichen Regentag.`, `Regentage sind intensiv, mit im Schnitt ${per} – eher Platzregen als Niesel.`],
  },
  rainVs: {
    heavier: ({ cityN, year }) => `Das ist mehr als die übliche Menge von ${cityN} mit ${year} mm pro Regentag übers Jahr.`,
    lighter: ({ year }) => `Das ist weniger als der Jahresschnitt der Stadt von etwa ${year} mm pro Regentag.`,
    typical: ({ cityN, monthN, year }) => [`Das entspricht etwa dem Jahresschnitt von ${cityN} (rund ${year} mm pro Regentag).`, `Übers Jahr fallen in ${cityN} etwa ${year} mm pro Regentag – der ${monthN} ist also typisch.`],
  },
  rainRank1: ({ monthN, inCity, kind }) => `Der ${monthN} ist ${inCity} der ${KIND[kind]} Monat des Jahres.`,
  rainRankTop3: ({ kind }) => `Er gehört zu den drei ${kind === 'wettest' ? 'nassesten' : 'trockensten'} Monaten des Jahres.`,
  polar: {
    day: ({ monthN, inCity }) => `Mitte ${monthN} geht die Sonne ${inCity} nicht unter.`,
    night: ({ monthN, inCity }) => `Mitte ${monthN} steigt die Sonne ${inCity} nicht über den Horizont.`,
  },
  dayMain: ({ monthN, inCity, cityN, rise, set, len }) => [
    `Am 15. ${monthN} geht die Sonne gegen ${rise} Uhr auf und gegen ${set} Uhr unter (Ortszeit) – ${len} Tageslicht.`,
    `Mitte ${monthN} ist Sonnenaufgang gegen ${rise} Uhr und Sonnenuntergang gegen ${set} Uhr (Ortszeit) – ${len} Tageslicht.`,
    `Zur Monatsmitte hat ${cityN} ${len} Tageslicht, von Sonnenaufgang gegen ${rise} Uhr bis Sonnenuntergang gegen ${set} Uhr.`,
  ],
  dayChange: {
    same: ({ pm }) => `Die Tageslänge ist praktisch dieselbe wie Mitte ${pm}.`,
    barely: ({ pm, amt, longer }) => `Die Tageslänge ändert sich gegenüber Mitte ${pm} kaum (${amt} ${longer ? 'länger' : 'kürzer'}).`,
    shorter: ({ pm, amt }) => [`Die Tage werden kürzer: ${amt} weniger Tageslicht als Mitte ${pm}.`, `Die Abende werden früher dunkel – ${amt} weniger Tageslicht als Mitte ${pm}.`],
    longer: ({ pm, amt }) => [`Die Tage werden länger: ${amt} mehr Tageslicht als Mitte ${pm}.`, `Seit Mitte ${pm} hat der Tag ${amt} gewonnen.`],
  },
  sky: { cloudy: 'der Himmel ist oft bewölkt', mixed: 'Sonne und Wolken wechseln sich ab', bright: 'es gibt viele sonnige Abschnitte', clear: 'der Himmel ist meist klar' },
  sunShare: ({ share, sky }) => [`Die Sonne scheint etwa ${share} % dieser hellen Stunden – ${sky}.`, `Rund ${share} % der Tageslichtstunden sind sonnig; kurz gesagt: ${cap(sky)}.`],
  equatorDay: 'So nah am Äquator verschieben sich Sonnenauf- und -untergang übers Jahr nur wenig.',
  cmpFirst: ({ monthN, inCity, rankTxt }) => [`Der ${monthN} ist ${inCity} ${rankTxt} des Jahres.`, `Nach mittlerer Höchsttemperatur ist der ${monthN} ${inCity} ${rankTxt}.`],
  cmpRain: (rain) => (rain === 0 ? ', bei etwa gleich viel Regen' : `, mit ${h.n0(Math.abs(rain))} mm ${rain > 0 ? 'mehr' : 'weniger'} Regen`),
  cmpSame: ({ prevN, rainTxt }) => <>Er ist etwa so warm wie der {prevN}{rainTxt}.</>,
  cmpPrev: ({ prevN, delta, warmer, rainTxt }) => [
    <>Im Vergleich zum {prevN} sind die Nachmittage {delta} {warmer ? 'wärmer' : 'kühler'}{rainTxt}.</>,
    <>Gegenüber dem {prevN} liegt die mittlere Höchsttemperatur {delta} {warmer ? 'höher' : 'niedriger'}{rainTxt}.</>,
  ],
  trend: {
    peak: ({ nextN }) => [`Danach kippt das Jahr: Der ${nextN} ist schon kühler.`, `Ab jetzt lassen die Temperaturen nach, beginnend im ${nextN}.`],
    trough: ({ nextN }) => [`Das ist der Tiefpunkt, ab dem ${nextN} wird es wärmer.`, `Von hier an geht es nur noch aufwärts, angefangen mit dem ${nextN}.`],
    warming: ({ nextN }) => [`Die Erwärmung setzt sich im ${nextN} fort.`, `Die Temperaturen steigen bis in den ${nextN} weiter.`],
    cooling: ({ nextN }) => [`Die Temperaturen sinken im ${nextN} weiter.`, `Der Abkühlungstrend hält bis in den ${nextN} an.`],
    flat: () => 'Die Temperaturen ändern sich hier von Monat zu Monat kaum.',
  },
  nextHi: ({ nextN, temp }) => [<> Im {nextN} liegt die mittlere Höchsttemperatur bei {temp}.</>, <> Der {nextN} kommt im Schnitt auf Höchstwerte um {temp}.</>],
  suitWhy: {
    sightseeing: { ok: ['die Tagestemperaturen passen gut zum Herumlaufen', 'angenehm genug, um den ganzen Tag zu Fuß unterwegs zu sein'], rain: ['an mehr als der Hälfte der Tage regnet es'], hot: ['die Mittagshitze macht lange Wege anstrengend'], cold: ['für lange Spaziergänge ist es kalt'] },
    parks: { ok: ['angenehm für lange Spaziergänge und Picknicks', 'gute Bedingungen, um draußen zu sitzen'], hot: ['nachmittags ist es zu warm, um lange draußen zu bleiben'], cold: ['zu kühl, um lange draußen zu sitzen'], rain: ['Regen durchkreuzt Pläne im Freien'] },
    beach: { ok: ['warm und an der Küste meist trocken'], hot: ['heißes Küstenwetter'], cold: ['die Seeluft ist zu kühl'], rain: ['zu viele Regentage'] },
    hiking: { ok: ['milde Temperaturen für Wanderwege'], cold: ['auf den Wegen ist es kühl'], hot: ['zu heiß für lange Wanderungen'], rain: ['nasse Wege'] },
    indoor: { rain: ['bei Regen an den meisten Tagen sind Galerien und Museen eine einfache Wahl'], hot: ['eine kühle Pause in den heißesten Stunden'], cold: ['warme Orte für den kältesten Teil des Tages'] },
  },
  tips: {
    layers: ['Die Tage sind deutlich wärmer als die Nächte – Kleidung zum An- und Ausziehen.', 'Morgens und abends ist es kühler als mittags, also im Zwiebellook kleiden.'],
    rain: ['Ein kompakter Schirm und eine leichte Regenjacke.', 'Einen kleinen Schirm in die Tasche und Schuhe, die Pfützen aushalten.'],
    sun: ['Sonnencreme, Hut und Sonnenbrille; leichte, atmungsaktive Kleidung.', 'Vor starker Sonne schützen: Hut, Sonnencreme und viel Wasser.'],
    jacket: ['Kühle Tage – eine leichte Jacke oder ein Pullover für unterwegs.', 'Eine leichte Jacke oder Strickjacke reicht für den Großteil des Tages.'],
    warm: ['Eine warme Jacke, Mütze und Handschuhe für kalte Morgen und Abende.', 'Ein richtiger Wintermantel, dazu Handschuhe und Mütze für frühe Starts.'],
    shades: ['Viel Sonne – Sonnenbrille und ein leichter Hut.', 'Helle Tage: Eine Sonnenbrille gehört ins Gepäck.'],
    light: ['Bequeme Kleidung und eine leichte Schicht für den Abend.', 'Alltagskleidung plus eine leichte Schicht für später am Tag.'],
  },
  packPhrase: { layers: 'Kleidung im Zwiebellook', rain: 'Regenschutz', sun: 'Sonnenschutz', jacket: 'eine leichte Jacke', warm: 'warme Kleidung', shades: 'eine Sonnenbrille', light: 'leichte Kleidung' },
  eveCool: ['Für die kühleren Abende etwas Wärmeres einpacken.', 'Für nach Sonnenuntergang eine zusätzliche Schicht mitnehmen.'],
  eveSame: ['Die Abende fühlen sich ähnlich an wie der Tag – dieselbe Kleidung passt von morgens bis abends.', 'Für den Abend muss man sich kaum umziehen.'],
  q1: ({ monthN, cityN }) => `Wie warm ist es in ${cityN} im ${monthN}?`,
  a1: ({ hi, lo, feel, warmRank }) => [
    <>Nachmittags im Schnitt {hi}, nachts etwa {lo} – für die meisten {feel}.{warmRank && <> Es ist {warmRank} des Jahres.</>}</>,
    <>Rechnen Sie mit etwa {hi} am Nachmittag und {lo} in der Nacht – die meisten würden es {feel} nennen.</>,
  ],
  q2: ({ monthN, cityN }) => `Regnet es im ${monthN} viel in ${cityN}?`,
  a2: {
    never: ({ monthN, none }) => <>So gut wie nie – der {monthN} ist praktisch regenlos, mit {none ? 'keinem Regentag' : 'etwa einem Regentag'} in einem typischen Jahr.</>,
    dry: ({ monthN, days, mm }) => [<>Nein – der {monthN} gehört zu den trockeneren Zeiten, mit etwa {h.n1(days)} Regentagen und insgesamt {h.n0(mm)} mm.</>, <>Kaum – nur etwa {h.n1(days)} Regentage und {h.n0(mm)} mm im ganzen Monat.</>],
    yes: ({ days, mm, often }) => [<>Ja, recht viel – Regen fällt {often} und summiert sich auf etwa {h.n0(mm)} mm, ein Schirm lohnt sich.</>, <>Ja: Etwa {h.n1(days)} Regentage bringen rund {h.n0(mm)} mm, planen Sie ein paar Indoor-Optionen ein.</>],
    some: ({ days, mm, light }) => [<>Nicht besonders. Es gibt etwa {h.n1(days)} Regentage ({h.n0(mm)} mm), meist {light ? 'leichten' : 'mäßigen'} Regen.</>, <>Nur mäßig: rund {h.n1(days)} nasse Tage und {h.n0(mm)} mm, meist {light ? 'leichte Schauer' : 'mäßiger Regen'}.</>],
  },
  q3: ({ monthN, cityN }) => `Was sollte man im ${monthN} in ${cityN} anziehen?`,
  a3: ({ list, eve }) => [<>Nach den Mittelwerten: {list}. {eve}</>, <>Einpacken: {list}. {eve}</>],
  q4: ({ monthN, nextN, cityN }) => `Ist der ${monthN} oder der ${nextN} besser für ${cityN}?`,
  nextWhy: ({ nextN, why }) => {
    const parts = why.map((w) => ({ warmer: 'wärmer', cooler: 'kühler', fewerRain: 'hat weniger Regentage', moreRain: 'hat mehr Regentage' }[w]));
    const first = parts[0] === 'wärmer' || parts[0] === 'kühler' ? `ist ${parts[0]}` : parts[0];
    return `Der ${nextN} ${[first, ...parts.slice(1)].join(' und ')}.`;
  },
  a4: ({ win, ranks, labels, whyTxt, cityN, narrow }) => [
    <>Der {win} schneidet in unserem Klima-Ranking besser ab (Platz {ranks.a} von 12 gegenüber Platz {ranks.b}){labels ? `, bewertet mit „${labels[0]}“ gegenüber „${labels[1]}“` : ''}.{whyTxt}</>,
    <>Der {win}, und zwar {narrow ? 'knapp' : 'deutlich'}: Er belegt Platz {ranks.a} von 12 unter den Monaten von {cityN}, der andere Platz {ranks.b}.{whyTxt}</>,
  ],
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
  statDays: (n) => `${h.n1(n)} Tage`,
  statSun: (v) => `${h.n1(v)} Std. / Tag`,
  Latest: ({ monthN, latest, row, years }) => (
    <>
      <span className="font-semibold text-gray-700">Zuletzt gemessen – {monthN} {latest.year}:</span>{' '}
      max. <UnitTemp c={latest.avg_high} />, min. <UnitTemp c={latest.avg_low} />
      {latest.avg_rainfall != null && <>, {h.n0(latest.avg_rainfall)} mm Regen</>}
      {latest.rainy_days != null && <> an {h.n1(latest.rainy_days)} Tagen</>}
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
