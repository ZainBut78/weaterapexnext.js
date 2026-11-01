// ─────────────────────────────────────────────────────────────
//  Climate pages — ESPAÑOL (i18n Phase 3). Misma API que ./en.jsx.
//  Palabras clave (Semrush): «Mejor época para viajar a {lugar}»,
//  «Clima en {ciudad} en {mes}», «Tiempo en {ciudad} en {mes}».
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';
import { UnitTemp } from '../UnitText';
import UnitTempShort from '../UnitTempShort';
import { inCity, inCountry, toCountry } from '@/i18n/places';
import { intlHelpers, cap } from './common';
import { makeStory } from './story';

const h = intlHelpers('es');
const fit = (max, ...opts) => opts.find((o) => o.length <= max) || opts[opts.length - 1];
const S = ({ children }) => <strong className="text-gray-900">{children}</strong>;

const VERDICT = { Great: 'Excelente', Good: 'Bueno', Fair: 'Regular', Poor: 'Malo' };
const ORD = ['', '', 'segundo ', 'tercer ', 'cuarto ', 'quinto ', 'sexto '];
const KIND = { warmest: 'cálido', coolest: 'fresco', wettest: 'lluvioso', driest: 'seco' };
const SEASON = {
  winter: { early: 'el comienzo del invierno', mid: 'pleno invierno', late: 'el final del invierno' },
  spring: { early: 'el comienzo de la primavera', mid: 'plena primavera', late: 'el final de la primavera' },
  summer: { early: 'el comienzo del verano', mid: 'pleno verano', late: 'el final del verano' },
  autumn: { early: 'el comienzo del otoño', mid: 'pleno otoño', late: 'el final del otoño' },
};
const enM = (m) => `en ${m}`;
// "de Japón" / "del Reino Unido"
const deK = (country) => inCountry('es', country).replace(/^en el /, 'del ').replace(/^en /, 'de ');
const hm = (mins) => {
  const m = Math.round(Math.abs(mins));
  const H = Math.floor(m / 60);
  const r = m % 60;
  return H ? (r ? `${H} h ${r} min` : `${H} h`) : `${r} min`;
};
const reasonText = (r) => {
  const n = h.n1(r.n);
  return {
    cold: 'días fríos', chilly: 'días frescos', 'mild-cool': 'días templados pero frescos', comfortable: 'temperaturas agradables',
    warm: 'días de cálidos a calurosos', hot: 'días calurosos', 'very-hot': 'días de calor extremo', frost: 'noches bajo cero',
    'rain-most': `lluvia casi todos los días (unos ${n})`, 'rain-frequent': `lluvia frecuente (unos ${n} días de lluvia)`,
    'rain-some': `algunos días de lluvia (unos ${n})`, dry: `mayormente seco (unos ${n} días de lluvia)`,
    heavy: `lluvias intensas (${n} mm)`, dull: `poco sol (${n} h al día)`, sunny: `mucho sol (${n} h al día)`,
  }[r.key || r.t] || '';
};
const SUIT = { sightseeing: 'Turismo urbano', parks: 'Parques y aire libre', beach: 'Playa', hiking: 'Senderismo', indoor: 'Museos y planes bajo techo' };
const PACK = { layers: 'Ropa por capas', rain: 'Protección para la lluvia', sun: 'Protección solar', jacket: 'Chaqueta ligera', warm: 'Ropa de abrigo', shades: 'Gafas de sol', light: 'Ropa ligera' };

const P = {
  month: h.month,
  list: h.list,
  n1: h.n1,
  hm,
  verdict: (l) => VERDICT[l] || l,
  packTitle: (p) => PACK[p.key] || p.title,
  inCity: (city) => inCity('es', city),
  rank: (kind, r) => `el ${ORD[r] || ''}mes más ${KIND[kind]}`,
  rainyDays: (n) => `${h.n1(n)} días de lluvia`,
  sunHours: (n) => `${h.n1(n)} horas de sol`,
  mm: (n) => `${h.n0(n)} mm`,
  perDay: (v) => `unos ${h.n1(v)} mm`,
  often: (o) => ({ most: 'casi todos los días', everyOther: 'aproximadamente un día sí y otro no', never: 'casi nunca', oneIn: `aproximadamente un día de cada ${o.k}` }[o.key]),

  hero: ({ monthN, place, y }) => [
    `Cómo suele ser ${monthN} en ${place}: promedios ${y}.`,
    `El tiempo típico de ${monthN} en ${place}, según los promedios climáticos ${y}.`,
    `${place} ${enM(monthN)}: cómo se presenta normalmente el mes, según los promedios ${y}.`,
  ],
  quick: ({ monthN, inCity, cityN, hi, lo, days, mm, sun }) => [
    <>{cap(enM(monthN))}, {inCity} se registran de media máximas de {hi} y mínimas de {lo}, con unos {days} ({mm} de lluvia) y {sun} al día.</>,
    <>Un día típico de {monthN} {inCity} llega a {hi} y baja a {lo} por la noche; hay unos {days} ({mm} en total) y {sun} al día.</>,
    <>{cityN} {enM(monthN)}: máximas en torno a {hi}, mínimas en torno a {lo}, unos {days} que suman {mm} y {sun} en un día medio.</>,
  ],
  tableExtreme: ({ monthN, inCity, warmest, rainTxt }) => [
    <>{cap(monthN)} es <strong>el mes más {warmest ? 'cálido' : 'fresco'}</strong> {inCity}{rainTxt && <>; en cuanto a lluvia, es {rainTxt}</>}.</>,
    <>Ningún mes es más {warmest ? 'cálido' : 'fresco'} que {monthN} {inCity}{rainTxt && <>; en cuanto a lluvia, es {rainTxt}</>}.</>,
  ],
  tableNormal: ({ monthN, inCity, warmer, k, rainTxt }) => [
    <>{cap(monthN)} es más cálido que <strong>{warmer} de los otros 11 meses</strong>{rainTxt && <>, y en cuanto a lluvia es {rainTxt} {inCity}</>}.</>,
    <>{k <= 3 ? `Solo ${k} ${k === 1 ? 'mes es' : 'meses son'}` : `${k} de los otros 11 meses son`} más cálidos que {monthN} {inCity}{rainTxt && <>; en cuanto a lluvia, es {rainTxt}</>}.</>,
    <>Así se compara cada mes {inCity} con {monthN}{rainTxt && <>: en cuanto a lluvia, {monthN} es {rainTxt}</>}.</>,
  ],
  season: {
    equator: ({ cityN, monthN }) => [
      `${cityN} está cerca del ecuador, así que no tiene un invierno ni un verano de verdad: hace calor todo el año, y ${monthN} no es una excepción.`,
      `Tan cerca del ecuador no hay cuatro estaciones: ${cityN} es cálida todo el año, también ${enM(monthN)}.`,
    ],
    tropical: ({ cityN, monthN }) => [
      `${cityN} está en los trópicos y se mantiene cálida todo el año, sin una división clara entre estaciones.`,
      `Como ciudad tropical, ${cityN} es cálida todo el año; ${monthN} no pertenece claramente ni a la estación seca ni a la de lluvias.`,
    ],
    wet: ({ cityN, monthN }) => `${cap(monthN)} cae en la estación de lluvias de ${cityN}: las precipitaciones superan claramente a las de los meses secos.`,
    dry: ({ cityN, monthN }) => `${cap(monthN)} forma parte de la estación seca de ${cityN}, cuando llueve mucho menos que en los meses húmedos.`,
    between: ({ cityN, monthN }) => `${cap(monthN)} se sitúa en ${cityN} entre la estación seca y la de lluvias.`,
    south: ({ cityN }) => ` (${cityN} está en el hemisferio sur, así que las estaciones van al revés que en Europa)`,
    peakSummer: ({ monthN, inCity, south }) => [`${cap(enM(monthN))}, ${inCity} es pleno verano: el mes más cálido del año${south}.`, `El verano alcanza su punto máximo ${enM(monthN)}: ningún mes es más cálido ${inCity}${south}.`],
    troughWinter: ({ monthN, inCity, south }) => [`${cap(monthN)} es el momento más frío del invierno ${inCity}${south}.`, `El invierno toca fondo ${enM(monthN)}, el mes más fresco del año ${inCity}${south}.`],
    warmWinter: ({ monthN, inCity, season, stage, south, feel }) => `${cap(enM(monthN))}, ${inCity} es ${SEASON[season][stage]}${south}, aunque aquí el invierno significa días ${feel} y no fríos.`,
    normal: ({ monthN, inCity, season, stage, south }) => [
      `${cap(enM(monthN))}, ${inCity} es ${SEASON[season][stage]}${south}.`,
      `${cap(inCity)}, ${monthN} trae ${SEASON[season][stage]}${south}.`,
      `Según el calendario, ${monthN} ${inCity} significa ${SEASON[season][stage]}${south}.`,
    ],
  },
  feelWord: { freezing: 'gélidos', cold: 'fríos', chilly: 'frescos', cool: 'frescos', mild: 'templados', warm: 'cálidos', hot: 'calurosos', 'very-hot': 'muy calurosos' },
  feel: {
    freezing: ['De día las temperaturas apenas superan los cero grados: incluso a mediodía parece pleno invierno.', 'Incluso la hora más cálida del día se queda cerca de cero.'],
    cold: ['Las temperaturas diurnas siguen siendo frías y hace falta un abrigo grueso incluso a mediodía.', 'A mediodía apenas sube la temperatura: abrigo y bufanda de la mañana a la noche.'],
    chilly: ['Los días son frescos más que gélidos, y con una buena chaqueta se pasea sin problema.', 'El aire es fresco durante el día, pero rara vez cortante.'],
    cool: ['Las tardes son frescas y agradables para caminar con una capa extra.', 'De día la sensación es de aire fresco más que frío.', 'Días frescos, ideales para hacer turismo a buen paso.'],
    mild: ['Las tardes son templadas y agradables para casi todo el mundo con ropa ligera.', 'Las temperaturas diurnas son templadas: ni frío ni calor para pasear.', 'Las tardes templadas invitan a pasar muchas horas al aire libre.'],
    warm: ['Los días son lo bastante cálidos para ir de manga corta y estar fuera resulta fácil.', 'Las tardes son cálidas y agradables, perfectas para largas jornadas de turismo.'],
    hot: ['Las tardes son calurosas: el turismo funciona mejor por la mañana o al atardecer.', 'Las horas centrales son calurosas; en los paseos largos importan la sombra y el agua.'],
    'very-hot': ['El calor del mediodía es intenso y la mayoría busca sombra o aire acondicionado por la tarde.', 'Las tardes son de calor extremo: los planes al aire libre salen mejor temprano o tras la puesta de sol.'],
  },
  nightTxt: {
    'hard-frost': 'las noches bajan muy por debajo de cero', frosty: 'las noches rondan los cero grados y las heladas son frecuentes',
    cold: 'las noches son frías', cool: 'las noches son frescas', mild: 'las noches son templadas', warm: 'las noches siguen siendo cálidas', sultry: 'las noches son bochornosas',
  },
  night: {
    sultry: () => ['Las noches dan poco respiro: incluso la hora más fresca sigue siendo calurosa.', 'Incluso después de la puesta de sol hace calor y bochorno.'],
    small: ({ nightTxt }) => [`Hay poca diferencia entre el día y la noche: ${nightTxt} y las noches se parecen casi a la tarde.`, `Tras la puesta de sol cambia poco: ${nightTxt}, apenas por debajo de los valores diurnos.`],
    moderate: ({ nightTxt }) => [`Después de la puesta de sol la temperatura baja de forma notable: ${nightTxt}.`, `Al anochecer se nota un descenso claro, y ${nightTxt}.`],
    big: ({ nightTxt, delta }) => [
      <>La diferencia entre el día y la noche es grande (unos {delta}): {nightTxt}, así que la mañana y la noche se sienten muy distintas del mediodía.</>,
      <>Tras la puesta de sol la temperatura baja bastante, unos {delta}, y {nightTxt}.</>,
    ],
  },
  humidity: {
    veryHumidHot: ['El aire es bochornoso, así que la sensación es más calurosa de lo que marca el termómetro.', 'La alta humedad hace que el calor se sienta pesado y pegajoso, sobre todo en las tardes sin viento.'],
    dampCold: ['El aire húmedo hace que el frío cale más de lo que indican las cifras.', 'La humedad le da al frío un punto penetrante, sobre todo con viento.'],
    humidHot: ['El aire tiene algo de humedad, que se nota cuando aprieta el sol.', 'El aire es algo húmedo, y en los momentos de calor se nota.'],
    humidMild: ['El aire es bastante húmedo, pero con estas temperaturas rara vez resulta agobiante.', 'La humedad es alta, pero las temperaturas templadas la hacen llevadera.'],
    dryHot: ['El aire seco evapora el sudor enseguida: se suda menos, pero uno se deshidrata rápido.', 'El calor es seco más que bochornoso: bebe más de lo que crees.'],
    dry: ['El aire es seco, y la piel y los labios suelen notarlo más que la temperatura.'],
    comfortable: ['La humedad es moderada: el aire no resulta ni pegajoso ni seco.', 'El aire es agradable, ni bochornoso ni seco.'],
  },
  rainFreq: {
    dry: ({ monthN, inCity, often, never }) => [`${cap(enM(monthN))} la lluvia es rara: la mayoría de las semanas pasan sin días de lluvia.`, never ? `${cap(monthN)} es un mes seco ${inCity}; casi nunca llueve.` : `${cap(monthN)} es un mes seco ${inCity}; llueve ${often}.`, 'Predomina el tiempo seco y el paraguas puede quedarse en la maleta.'],
    occasional: ({ often }) => [`La lluvia llega de vez en cuando, ${often}.`, `Los días de lluvia son ocasionales más que habituales: ${often}.`, `La mayoría de los días son secos; llueve ${often}.`],
    showery: ({ often }) => [`Los chubascos son frecuentes y llegan ${often}.`, `Es un mes variable: llueve ${often}, con pausas secas entre medias.`],
    wet: ({ monthN, often }) => [`Este mes la lluvia forma parte de la rutina y cae ${often}.`, `Aquí ${monthN} es lluvioso de forma constante: llueve ${often}.`, `Los días secos son la excepción: llueve ${often}.`],
  },
  rainSize: {
    light: ({ per }) => [`La mayoría de los días de lluvia solo traen lluvia ligera, ${per} en un día de lluvia típico: llovizna o chubascos breves que rara vez estropean los planes.`, `Cuando llueve, suele ser poco: ${per} por día de lluvia, más llovizna que aguacero.`],
    moderate: ({ per }) => [`Un día de lluvia deja de media ${per}: lluvia continua más que un chubasco pasajero.`, `Los días lluviosos dejan de media ${per}, suficiente para mojarse sin paraguas.`],
    heavy: ({ per }) => [`La lluvia suele caer en aguaceros intensos: ${per} en un día de lluvia medio.`, `Los días de lluvia son intensos, con una media de ${per}: aguaceros más que llovizna.`],
  },
  rainVs: {
    heavier: ({ cityN, year }) => `Es más que la media anual de ${cityN}, unos ${year} mm por día de lluvia.`,
    lighter: ({ year }) => `Es menos que la media anual de la ciudad, unos ${year} mm por día de lluvia.`,
    typical: ({ cityN, monthN, year }) => [`Está en línea con la media anual de ${cityN} (unos ${year} mm por día de lluvia).`, `A lo largo del año, ${cityN} recibe unos ${year} mm por día de lluvia, así que ${monthN} es normal.`],
  },
  rainRank1: ({ monthN, inCity, kind }) => `${cap(monthN)} es el mes más ${KIND[kind]} del año ${inCity}.`,
  rainRankTop3: ({ kind }) => `Está entre los tres meses más ${kind === 'wettest' ? 'lluviosos' : 'secos'} del año.`,
  polar: {
    day: ({ monthN, inCity }) => `A mediados de ${monthN}, ${inCity} el sol no se pone.`,
    night: ({ monthN, inCity }) => `A mediados de ${monthN}, ${inCity} el sol no sale sobre el horizonte.`,
  },
  dayMain: ({ monthN, cityN, rise, set, len }) => [
    `El 15 de ${monthN} el sol sale hacia las ${rise} y se pone hacia las ${set} (hora local): ${len} de luz.`,
    `A mediados de ${monthN} amanece hacia las ${rise} y anochece hacia las ${set} (hora local): ${len} de luz.`,
    `A mitad de mes, ${cityN} tiene ${len} de luz, desde el amanecer hacia las ${rise} hasta el atardecer hacia las ${set}.`,
  ],
  dayChange: {
    same: ({ pm }) => `La duración del día es prácticamente la misma que a mediados de ${pm}.`,
    barely: ({ pm, amt, longer }) => `La duración del día apenas cambia respecto a mediados de ${pm} (${amt} ${longer ? 'más' : 'menos'}).`,
    shorter: ({ pm, amt }) => [`Los días se acortan: ${amt} menos de luz que a mediados de ${pm}.`, `Respecto a mediados de ${pm}, el día ha perdido ${amt}.`],
    longer: ({ pm, amt }) => [`Los días se alargan: ${amt} más de luz que a mediados de ${pm}.`, `Desde mediados de ${pm}, el día ha ganado ${amt}.`],
  },
  sky: { cloudy: 'el cielo suele estar nublado', mixed: 'se alternan sol y nubes', bright: 'hay muchos claros', clear: 'el cielo está mayormente despejado' },
  sunShare: ({ share, sky }) => [`El sol brilla durante aproximadamente el ${share} % de esas horas de luz: ${sky}.`, `Aproximadamente el ${share} % de las horas de luz es soleado; en resumen, ${sky}.`],
  equatorDay: 'Cerca del ecuador, las horas de amanecer y atardecer cambian muy poco a lo largo del año.',
  cmpFirst: ({ monthN, inCity, rankTxt }) => [`${cap(monthN)} es ${rankTxt} del año ${inCity}.`, `Según la temperatura máxima media, ${monthN} es ${rankTxt} ${inCity}.`],
  cmpRain: (rain) => (rain === 0 ? ', con aproximadamente la misma lluvia' : `, con ${h.n0(Math.abs(rain))} mm ${rain > 0 ? 'más' : 'menos'} de lluvia`),
  cmpSame: ({ prevN, rainTxt }) => <>Hace más o menos el mismo calor que {enM(prevN)}{rainTxt}.</>,
  cmpPrev: ({ prevN, delta, warmer, rainTxt }) => [
    <>En comparación con {prevN}, las tardes son {delta} más {warmer ? 'cálidas' : 'frescas'}{rainTxt}.</>,
    <>Respecto a {prevN}, la máxima media es {delta} más {warmer ? 'alta' : 'baja'}{rainTxt}.</>,
  ],
  trend: {
    peak: ({ nextN }) => [`A partir de aquí el año cambia de rumbo: ${nextN} ya es más fresco.`, `Desde este momento las temperaturas empiezan a bajar, empezando por ${nextN}.`],
    trough: ({ nextN }) => [`Es el punto más bajo, y ${enM(nextN)} empieza a subir la temperatura.`, `De aquí en adelante solo hace más calor, empezando por ${nextN}.`],
    warming: ({ nextN }) => [`El calentamiento continúa ${enM(nextN)}.`, `Las temperaturas siguen subiendo hasta ${nextN}.`],
    cooling: ({ nextN }) => [`Las temperaturas siguen bajando ${enM(nextN)}.`, `El enfriamiento continúa hasta ${nextN}.`],
    flat: () => 'Aquí las temperaturas cambian muy poco de un mes a otro.',
  },
  nextHi: ({ nextN, temp }) => [<> {cap(enM(nextN))} la máxima media es de {temp}.</>, <> {cap(nextN)} registra de media máximas de {temp}.</>],
  suitWhy: {
    sightseeing: { ok: ['las temperaturas diurnas son buenas para caminar', 'lo bastante agradable para explorar a pie todo el día'], rain: ['llueve más de la mitad de los días'], hot: ['el calor del mediodía hace pesados los paseos largos'], cold: ['hace frío para paseos largos'] },
    parks: { ok: ['agradable para paseos largos y pícnics', 'buenas condiciones para sentarse al aire libre'], hot: ['por la tarde hace demasiado calor para estar mucho tiempo fuera'], cold: ['demasiado fresco para estar sentado fuera mucho tiempo'], rain: ['la lluvia interrumpe los planes al aire libre'] },
    beach: { ok: ['cálido y mayormente seco en la costa'], hot: ['clima costero muy caluroso'], cold: ['el aire del mar es demasiado fresco'], rain: ['demasiados días de lluvia'] },
    hiking: { ok: ['temperaturas templadas para los senderos'], cold: ['en los senderos hace fresco'], hot: ['demasiado calor para rutas largas'], rain: ['senderos mojados'] },
    indoor: { rain: ['con lluvia casi a diario, galerías y museos son una opción fácil'], hot: ['un respiro fresco en las horas de más calor'], cold: ['lugares cálidos para la parte más fría del día'] },
  },
  tips: {
    layers: ['Los días son mucho más cálidos que las noches: lleva capas fáciles de poner y quitar.', 'Las mañanas y las noches son más frescas que el mediodía, así que vístete por capas.'],
    rain: ['Un paraguas compacto y una chaqueta impermeable ligera.', 'Lleva un paraguas pequeño en el bolso y calzado que aguante los charcos.'],
    sun: ['Protector solar, sombrero y gafas de sol; ropa ligera y transpirable.', 'Protégete del sol fuerte: sombrero, protector solar y mucha agua.'],
    jacket: ['Días frescos: una chaqueta ligera o un jersey para hacer turismo.', 'Una chaqueta ligera o una rebeca bastan para casi todo el día.'],
    warm: ['Una chaqueta de abrigo, gorro y guantes para las mañanas y noches frías.', 'Un abrigo de invierno de verdad, con guantes y gorro para salir temprano.'],
    shades: ['Sol frecuente: gafas de sol y un sombrero ligero.', 'Días luminosos: las gafas de sol merecen un sitio en la maleta.'],
    light: ['Ropa cómoda y una capa ligera para la noche.', 'Ropa de diario y una capa ligera para la noche.'],
  },
  packPhrase: { layers: 'ropa por capas', rain: 'protección para la lluvia', sun: 'protección solar', jacket: 'una chaqueta ligera', warm: 'ropa de abrigo', shades: 'gafas de sol', light: 'ropa ligera' },
  eveCool: ['Lleva algo más para las noches más frescas.', 'Añade una capa para después de la puesta de sol.'],
  eveSame: ['Las noches se parecen al día, así que la misma ropa sirve de la mañana a la noche.', 'No hace falta cambiarse para la noche.'],
  q1: ({ monthN, inCity }) => `¿Qué temperatura hace ${inCity} ${enM(monthN)}?`,
  a1: ({ hi, lo, feel, warmRank }) => [
    <>Por la tarde la media es de {hi} y por la noche de unos {lo}: días {feel} para la mayoría de la gente.{warmRank && <> Es {warmRank} del año.</>}</>,
    <>Cuenta con unos {hi} por la tarde y {lo} por la noche: días que casi todo el mundo llamaría {feel}.</>,
  ],
  q2: ({ monthN, inCity }) => `¿Llueve mucho ${inCity} ${enM(monthN)}?`,
  a2: {
    never: ({ monthN, none }) => <>Casi nunca: {monthN} es prácticamente seco, con {none ? 'ningún día de lluvia' : 'alrededor de un día de lluvia'} en un año típico.</>,
    dry: ({ monthN, days, mm }) => [<>No: {monthN} es una de las épocas más secas, con unos {h.n1(days)} días de lluvia y {h.n0(mm)} mm en total.</>, <>Poco: solo unos {h.n1(days)} días de lluvia y {h.n0(mm)} mm en todo el mes.</>],
    yes: ({ days, mm, often }) => [<>Sí, bastante: llueve {often} y se acumulan unos {h.n0(mm)} mm, así que conviene llevar paraguas.</>, <>Sí: unos {h.n1(days)} días de lluvia dejan unos {h.n0(mm)} mm, mejor tener algún plan bajo techo.</>],
    some: ({ days, mm, light }) => [<>No especialmente. Hay unos {h.n1(days)} días de lluvia ({h.n0(mm)} mm), sobre todo lluvia {light ? 'ligera' : 'moderada'}.</>, <>Solo de forma moderada: unos {h.n1(days)} días húmedos y {h.n0(mm)} mm, normalmente {light ? 'chubascos breves' : 'lluvia moderada'}.</>],
  },
  q3: ({ monthN, cityN }) => `¿Qué llevar en la maleta para ${cityN} ${enM(monthN)}?`,
  a3: ({ list, eve }) => [<>Según los promedios: {list}. {eve}</>, <>Lleva {list}. {eve}</>],
  q4: ({ monthN, nextN, cityN }) => `¿Es mejor visitar ${cityN} ${enM(monthN)} o ${enM(nextN)}?`,
  nextWhy: ({ nextN, why }) => {
    const parts = why.map((w) => ({ warmer: 'es más cálido', cooler: 'es más fresco', fewerRain: 'tiene menos días de lluvia', moreRain: 'tiene más días de lluvia' }[w]));
    return `${cap(nextN)} ${parts.join(' y ')}.`;
  },
  a4: ({ win, ranks, labels, whyTxt, cityN, narrow }) => [
    <>{cap(win)} puntúa mejor en nuestra clasificación climática ({ranks.a}.º de 12 frente a {ranks.b}.º){labels ? `, con valoración «${labels[0]}» frente a «${labels[1]}»` : ''}.{whyTxt}</>,
    <>{cap(win)}, {narrow ? 'por poco' : 'claramente'}: es el {ranks.a}.º de 12 entre los meses de {cityN}, frente al {ranks.b}.º del otro.{whyTxt}</>,
  ],
};

const es = {
  lang: 'es',
  story: makeStory(P),
  locale: h.loc,
  place: (cityN, countryN) => (cityN === countryN ? cityN : `${cityN}, ${countryN}`),
  list: h.list,
  month: h.month,
  monthShort: h.monthShort,
  verdict: P.verdict,
  reasons: (v) => v.reasons.map(reasonText).filter(Boolean).join(', '),
  suitLabel: (s) => SUIT[s.key] || s.label,
  suitStatus: (s) => (s.key === 'indoor' ? 'una buena opción' : s.ok ? 'adecuado' : 'menos adecuado'),
  packTitle: P.packTitle,

  cityMeta: ({ cityN, city, x, best }) => {
    const inC = inCity('es', city);
    return {
      title: fit(60, `Clima ${inC} por meses: tiempo y mejor época para viajar`, `Clima ${inC} por meses y mejor época`, `Clima ${inC} por meses`),
      imageTitle: `Clima ${inC} por meses`,
      description: fit(160,
        `Clima ${inC} mes a mes: el más cálido es ${h.month(x.warmest?.month.num)}, el más lluvioso ${h.month(x.wettest?.month.num)}. Mejor época: ${h.list(best)}. Promedios de 20 años.`,
        `Clima ${inC} mes a mes. Mejor época para viajar: ${h.list(best)}. Promedios de 20 años.`,
        `Clima ${inC} mes a mes y mejor época para viajar.`),
    };
  },
  cityDataset: ({ cityN, place, years }) => ({
    name: `Clima en ${cityN} por meses: promedios climáticos ${years.start}–${years.end}`,
    description: `Promedios climáticos mensuales de ${place}: temperatura máxima y mínima media, precipitación total, días de lluvia, horas de sol diarias y humedad de cada mes, calculados para ${years.start}–${years.end} a partir de datos meteorológicos históricos.`,
  }),
  variables: ['Temperatura máxima media', 'Temperatura mínima media', 'Precipitación total', 'Días de lluvia', 'Horas de sol', 'Humedad relativa'],
  skylineAlt: (place) => `Vista urbana de ${place}`,
  cityH1: (cityN) => `Clima en ${cityN} por meses`,
  citySub: (place, years) => <>Doce meses de tiempo en {place}: promedios {years.start}–{years.end}.</>,
  CityIntro: ({ x, inCity: inC }) => (
    <>
      {x.warmest && <>{cap(inC)}, el mes más cálido es <S>{h.month(x.warmest.month.num)}</S> (máxima media de <UnitTemp c={x.warmest.row.avg_high} />)</>}
      {x.coolest && <> y el más fresco es <S>{h.month(x.coolest.month.num)}</S> (<UnitTemp c={x.coolest.row.avg_high} />)</>}.
      {x.wettest && <> La lluvia es más abundante en <S>{h.month(x.wettest.month.num)}</S> (unos {h.n0(x.wettest.row.avg_rainfall)} mm)</>}
      {x.driest && <>, mientras que <S>{h.month(x.driest.month.num)}</S> es el mes más seco (unos {h.n0(x.driest.row.avg_rainfall)} mm)</>}.
      {x.sunniest && <> <S>{cap(h.month(x.sunniest.month.num))}</S> es el más soleado, con unas {h.n1(x.sunniest.row.sunshine_hours)} horas de sol al día.</>}
    </>
  ),
  bestTitle: (cityN) => `Mejor época para viajar a ${cityN}`,
  bestNote: () => 'Clasificación dentro del año de la ciudad según temperaturas agradables, días de lluvia y sol: promedios históricos, no un pronóstico.',
  monthByMonth: (cityN) => `${cityN} mes a mes`,
  high: 'Máx.',
  low: 'Mín.',
  srRainfall: 'Precipitación',
  srRainy: 'Días de lluvia',
  srSun: 'Sol',
  rainMmIn: (mm) => `${h.n0(mm)} mm`,
  rainyDaysN: (n) => `${h.n1(n)} días de lluvia`,
  sunPerDay: (v) => `${h.n1(v)} h de sol / día`,
  guideTitle: (cityN) => `Clima y tiempo en ${cityN}`,
  guideSub: (years) => <>Temperaturas, precipitaciones y sol a lo largo del año: promedios {years.start}–{years.end}.</>,
  tiles: { hottest: 'Máx. media del mes más cálido', coolest: 'Máx. media del mes más fresco', wettest: 'Media del mes más lluvioso', driest: 'Media del mes más seco' },
  tempByMonth: 'Temperaturas por meses',
  rainByMonth: 'Precipitaciones por meses',
  sunHours: 'Horas de sol',
  chartTemp: (cityN) => `${cityN}: temperatura máxima y mínima media por meses`,
  chartRain: (cityN) => `${cityN}: precipitación media por meses`,
  chartSun: (cityN) => `${cityN}: horas de sol diarias medias por meses`,
  monthlyAverages: 'Promedios mensuales',
  whatToPack: 'Qué llevar en la maleta',
  packIntro: (cityN) => <>Consejos de equipaje según el clima de {cityN}.</>,
  cityPacking: {
    layers: { title: 'Ropa por capas', text: 'Capas ligeras que sirvan tanto para las tardes templadas como para las noches más frescas.' },
    rain: { title: 'Protección para la lluvia', text: 'Un paraguas compacto y una chaqueta impermeable ligera para los meses más lluviosos.' },
    sun: { title: 'Protección solar', text: 'Protector solar, sombrero de ala ancha y gafas de sol para los días cálidos y soleados.' },
    warm: { title: 'Ropa de abrigo', text: 'Una chaqueta de abrigo o un forro polar para las mañanas y noches frescas.' },
  },
  moreCities: (countryN, country) => `Más ciudades ${deK(country)} mes a mes`,
  weatherByMonth: 'Tiempo mes a mes',
  ctaCityTitle: (cityN) => `¿Planeas un viaje a ${cityN}?`,
  ctaCityText: 'Obtén un plan del tiempo día a día para las fechas exactas de tu viaje.',
  ctaCityButton: 'Usar el planificador de viajes',
  cityDataNote: (years) => <>Basado en {years.end - years.start + 1} años de datos meteorológicos históricos ({years.start}–{years.end}) de Open-Meteo. Promedios mensuales, no un pronóstico.</>,

  monthMeta: ({ cityN, countryN, monthN, row, verdict, city }) => {
    const t = (c) => (c == null ? '—' : `${h.n1(Math.round(c * 10) / 10)} °C`);
    const inC = inCity('es', city);
    const base = `Tiempo ${inC} ${enM(monthN)}: máximas de ${t(row?.avg_high)}, mínimas de ${t(row?.avg_low)}, ${h.n1(row?.rainy_days)} días de lluvia y ${h.n1(row?.sunshine_hours)} h de sol al día.`;
    return {
      title: fit(60, `Clima ${inC} ${enM(monthN)}: temperatura, lluvia y consejos`, `Clima ${inC} ${enM(monthN)}: temperatura y lluvia`, `Clima ${inC} ${enM(monthN)}`),
      imageTitle: `Clima ${inC} ${enM(monthN)}`,
      kicker: countryN,
      description: fit(160, `${base} Valoración: ${verdict ? VERDICT[verdict.label] : '—'}.`, base, `Tiempo ${inC} ${enM(monthN)}: temperaturas, días de lluvia y horas de sol.`),
    };
  },
  monthDataset: ({ cityN, place, monthN, years }) => ({
    name: `Clima en ${cityN} ${enM(monthN)}: promedios climáticos ${years.start}–${years.end}`,
    description: `Promedios climáticos mensuales de ${place} ${enM(monthN)}: temperatura máxima y mínima media, precipitación total, días de lluvia, horas de sol diarias y humedad, calculados para ${years.start}–${years.end} a partir de datos meteorológicos históricos.`,
  }),
  monthH1: (cityN, monthN) => `Clima en ${cityN} ${enM(monthN)}`,
  stat: { avgHigh: 'Máx. media', avgLow: 'Mín. media', rainfall: 'Precipitación', rainyDays: 'Días de lluvia', sunshine: 'Sol', humidity: 'Humedad' },
  statDays: (n) => `${h.n1(n)} días`,
  statSun: (v) => `${h.n1(v)} h / día`,
  Latest: ({ monthN, latest, row, years }) => (
    <>
      <span className="font-semibold text-gray-700">Último dato real – {monthN} de {latest.year}:</span>{' '}
      máxima <UnitTemp c={latest.avg_high} />, mínima <UnitTemp c={latest.avg_low} />
      {latest.avg_rainfall != null && <>, {h.n0(latest.avg_rainfall)} mm de lluvia</>}
      {latest.rainy_days != null && <> en {h.n1(latest.rainy_days)} días</>}
      {' '}(el promedio {years.start}–{years.end} de arriba es {latest.avg_high != null && row?.avg_high != null
        ? (latest.avg_high > row.avg_high + 0.4 ? 'más fresco' : latest.avg_high < row.avg_high - 0.4 ? 'más cálido' : 'más o menos igual')
        : 'de referencia'}).
    </>
  ),
  vsYearTitle: (monthN) => `${cap(monthN)} frente al resto del año`,
  tableFallback: (monthN, cityN) => <>{cap(monthN)} comparado con todos los demás meses en {cityN}.</>,
  th: { month: 'Mes', avgHigh: 'Máx. media', vs: (monthN) => `vs ${monthN}`, rain: 'Lluvia', rainyDays: 'Días de lluvia' },
  rainMm: (mm) => `${h.n0(mm)} mm`,
  chipsLabel: (cityN) => `Clima en ${cityN} mes a mes`,
  chipAria: (cityN, mN) => `Clima en ${cityN} ${enM(mN)}`,
  feelTitle: (monthN, cityN) => `Cómo es ${monthN} en ${cityN}`,
  rainTitle: (cityN, monthN) => `Lluvia en ${cityN} ${enM(monthN)}`,
  daylightTitle: (monthN) => `Horas de luz y sol ${enM(monthN)}`,
  compareTitle: (monthN) => `${cap(monthN)} comparado con el resto del año`,
  suitsTitle: (monthN) => `Para quién es ideal ${monthN}`,
  tipsTitle: (cityN, monthN) => `Consejos para visitar ${cityN} ${enM(monthN)}`,
  questionsTitle: 'Preguntas rápidas',
  verdictTitle: (monthN, cityN) => `¿Es ${monthN} buena época para viajar a ${cityN}?`,
  VerdictText: ({ verdict, relRank, cityN, monthN, reasons }) => (
    <>
      <strong>{VERDICT[verdict.label]}</strong> – {reasons}.
      {relRank && (
        <> Dentro del año de {cityN}, {monthN} ocupa el <strong>puesto {relRank} de 12</strong>
          {relRank <= 3 ? <>: uno de los 3 mejores meses para ir.</> : relRank >= 10 ? <>: uno de los meses menos agradables.</> : '.'}</>
      )}
    </>
  ),
  notesTitle: (cityN, monthN) => `Notas de viaje: ${cityN} ${enM(monthN)}`,
  othersTitle: (monthN, countryN, country) => `${cap(monthN)} en otras ciudades ${deK(country)}`,
  OtherHigh: ({ row }) => <>Máx. <UnitTempShort c={row.avg_high} /> · {h.n0(row.avg_rainfall ?? 0)} mm</>,
  otherGuide: (monthN) => `Guía de ${monthN}`,
  elsewhereTitle: (kind, monthN) => `Destinos ${kind === 'both' ? 'más cálidos o más secos' : kind === 'warmer' ? 'más cálidos' : 'más secos'} ${enM(monthN)}`,
  ElsewhereHigh: ({ row }) => <>Máx. <UnitTempShort c={row.avg_high} /></>,
  elsewhereRainy: (n) => `${n == null ? '—' : h.n1(n)} días de lluvia`,
  warmer: 'Más cálido',
  drier: 'Más seco',
  ctaMonthTitle: (cityN) => `Planifica un viaje a ${cityN}`,
  ctaMonthText: 'Obtén una puntuación del tiempo día a día para las fechas exactas de tu viaje.',
  ctaMonthButton: 'Abrir el planificador de viajes',
  MonthDataNote: ({ years, cityHref, cityN }) => (
    <>
      Promedios mensuales de {years.end - years.start + 1} años de datos de Open-Meteo ({years.start}–{years.end}), no un pronóstico: los 12 meses en{' '}
      <Link href={cityHref} className="text-[#0077b6] font-semibold hover:underline">Clima en {cityN} por meses</Link>.
    </>
  ),

  countryMeta: ({ countryN, country, n }) => {
    const toK = toCountry('es', country);
    return {
      absoluteTitle: fit(60, `Mejor época para viajar ${toK}: clima por meses`, `Mejor época para viajar ${toK}`, `Cuándo viajar ${toK}`),
      description: fit(160,
        `¿Cuál es la mejor época para viajar ${toK}? Clima mes a mes en ${n} ciudades: temperaturas, lluvia y sol, según 20 años de datos meteorológicos.`,
        `Mejor época para viajar ${toK}: clima mes a mes en ${n} ciudades.`),
      kicker: 'Tiempo por meses y ciudades',
    };
  },
  countryH1: (countryN, country) => <>Mejor época para viajar {toCountry('es', country)}: tiempo por ciudad y mes</>,
  countrySub: (n, countryN, country) => <>Promedios mes a mes de {n} {n === 1 ? 'ciudad' : 'ciudades'} {deK(country)}, según 20 años de datos meteorológicos históricos.</>,
  climateAcross: (countryN, country) => `El clima ${inCountry('es', country)}`,
  CountryIntro: ({ single, warmest, coolest, wettest, loaded }) => (
    <>
      {single && (
        <><strong className="text-gray-800">{single.name}</strong> tiene una máxima diurna media de <UnitTemp c={single.v} /> a lo largo del año</>
      )}
      {warmest && (
        <>De las ciudades de abajo, <strong className="text-gray-800">{warmest.name}</strong> es la más cálida, con una máxima diurna media de <UnitTemp c={warmest.v} /> en el año</>
      )}
      {coolest && (
        <>, mientras que <strong className="text-gray-800">{coolest.name}</strong> es la más fresca con <UnitTemp c={coolest.v} /></>
      )}
      .{wettest && <> {loaded.length > 1 ? 'En estas ciudades' : `En ${loaded[0].name}`}, el mes más lluvioso suele ser <strong className="text-gray-800">{wettest.name}</strong> (unos {h.n0(wettest.v)} mm de media).</>}
    </>
  ),
  preparing: 'Estamos preparando los datos climáticos de estas ciudades.',
  citiesByMonth: (countryN, country) => `Ciudades ${deK(country)} mes a mes`,
  avgHighByMonth: 'Temperatura máxima media por meses',
  tapValue: 'Toca un valor para abrir la guía mensual de la ciudad.',
  cityTh: 'Ciudad',
  cellAria: (cityN, mN) => `${cityN} ${enM(mN)}`,
  bestMonthsTitle: (countryN, country) => `Mejor época para viajar ${toCountry('es', country)}`,
  BestMonthsText: ({ across, best, worst }) => (
    <>
      Según temperaturas agradables, días de lluvia y sol {across ? `en ${across}` : 'en estas ciudades'}, los meses más agradables suelen ser{' '}
      <strong className="text-gray-800">{best}</strong>
      {worst && <>; el menos agradable suele ser <strong className="text-gray-800">{worst}</strong></>}.
      Son promedios históricos, no un pronóstico.
    </>
  ),
};

export default es;
