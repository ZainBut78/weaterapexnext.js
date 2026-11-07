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
    'snow-most': `nieve o lluvia casi todos los días (unos ${n})`, 'snow-frequent': `nieve o lluvia frecuentes (unos ${n} días húmedos)`, 'snow-some': `algunos días de nieve o lluvia (unos ${n})`,
    'rain-most': `lluvia casi todos los días (unos ${n})`, 'rain-frequent': `lluvia frecuente (unos ${n} días de lluvia)`,
    'rain-some': `algunos días de lluvia (unos ${n})`, dry: r.n < 0.5 ? 'casi sin lluvia' : `mayormente seco (unos ${n} ${r.n === 1 ? 'día' : 'días'} de lluvia)`,
    heavy: `lluvias intensas (${n} mm)`, dull: `poco sol (${n} h al día)`, sunny: `mucho sol (${n} h al día)`,
  }[r.key || r.t] || '';
};
const SUIT = { sightseeing: 'Turismo urbano', parks: 'Parques y aire libre', beach: 'Playa', hiking: 'Senderismo', indoor: 'Museos y planes bajo techo' };
const PACK = { shoes: 'Calzado impermeable', layers: 'Ropa por capas', rain: 'Protección para la lluvia', sun: 'Protección solar', jacket: 'Chaqueta ligera', warm: 'Ropa de abrigo', shades: 'Gafas de sol', light: 'Ropa ligera' };

const P = {
  month: h.month,
  list: h.list,
  n1: h.n1,
  hm,
  verdict: (l) => VERDICT[l] || l,
  packTitle: (p) => PACK[p.key] || p.title,
  inCity: (city) => inCity('es', city),
  rank: (kind, r) => `el ${ORD[r] || ''}mes más ${KIND[kind]}`,
  rainyDays: (n) => `${h.n1(n)} ${Number(n) === 1 ? 'día' : 'días'} de lluvia`,
  sunHours: (n) => `${h.n1(n)} horas de sol`,
  mm: (n) => `${h.n0(n)} mm`,
  perDay: (v) => `unos ${h.n1(v)} mm`,
  often: (o) => ({ most: 'casi todos los días', everyOther: 'aproximadamente un día sí y otro no', never: 'casi nunca', oneIn: `aproximadamente un día de cada ${o.k}` }[o.key]),

  hero: ({ monthN, place, y, feelK, rainK }) => {
    const feel = { freezing: 'gélidas', cold: 'frías', chilly: 'frescas', cool: 'fresquitas', mild: 'templadas', warm: 'cálidas', hot: 'calurosas', 'very-hot': 'muy calurosas' }[feelK] || 'típicas';
    const rain = { dry: 'poca lluvia', occasional: 'lluvia ocasional', showery: 'chubascos regulares', wet: 'lluvia casi todos los días', wintry: 'lluvia o nieve muchos días' }[rainK];
    return `${place} ${enM(monthN)}: tardes ${feel} y ${rain}, según las medias de ${y}.`;
  },
  quick: ({ monthN, cityN, hi, lo, days, mm, sun, feelK, rainK, sunK }) => {
    const lead = { freezing: 'Un mes gélido', cold: 'Un mes frío', chilly: 'Un mes fresco', cool: 'Un mes fresquito', mild: 'Un mes templado', warm: 'Un mes cálido', hot: 'Un mes caluroso', 'very-hot': 'Un mes muy caluroso' }[feelK] || 'Un mes típico';
    const rain = { dry: <>muy poca lluvia ({mm})</>, some: <>unos {days} ({mm})</>, wet: <>unos {days} ({mm} en total)</> }[rainK];
    const shine = { low: <>solo {sun} al día</>, mid: <>{sun} al día</>, high: <>unas generosas {sun} al día</> }[sunK];
    return <>{lead} en {cityN}: {enM(monthN)}, las máximas rondan {hi} y las mínimas {lo}, con {rain} y {shine}.</>;
  },
  tableExtreme: ({ monthN, inCity, warmest, rainTxt }) => <>{cap(monthN)} es <strong>el mes más {warmest ? 'cálido' : 'fresco'}</strong> {inCity}{rainTxt && <>; en lluvia es {rainTxt}</>}.</>,
  tableNormal: ({ monthN, inCity, warmer, k, rainTxt, band }) => ({
    high: <>Solo {k} {k === 1 ? 'mes es más cálido' : 'meses son más cálidos'} que {monthN} {inCity}{rainTxt && <>; en lluvia es {rainTxt}</>}.</>,
    mid: <>{cap(monthN)} es más cálido que <strong>{warmer} de los otros 11 meses</strong>{rainTxt && <>, y es {rainTxt} {inCity}</>}.</>,
    low: <>En temperatura, {monthN} solo supera a <strong>{warmer} de los otros 11</strong> meses{rainTxt && <>, y es {rainTxt} del año</>}.</>,
  }[band]),
  feelLine: ({ feelK, hi, pos, peakN, delta, wet }) => {
    const open = feelK === 'freezing' ? <>Por la tarde apenas se superan {hi}</> : ['hot', 'very-hot'].includes(feelK) ? <>Por la tarde se alcanzan {hi}</> : <>Por la tarde se llega a unos {hi}</>;
    const where = {
      peak: ', el valor más alto del año',
      trough: ', el valor más bajo del año',
      nearPeak: <>, cerca del máximo de {peakN}</>,
      nearTrough: ', cerca del valor más bajo del año',
      flat: ', casi igual que cualquier otro mes aquí',
      middle: <>, unos {delta} por debajo del máximo de {peakN}</>,
    }[pos] || '';
    const advice = {
      freezing: 'incluso a mediodía se siente pleno invierno',
      cold: 'hace falta abrigo y bufanda de la mañana a la noche',
      chilly: 'se camina bien con una buena chaqueta',
      cool: 'agradable para pasear con una capa encima',
      mild: 'cómodo con ropa ligera',
      warm: 'suficiente para ir de manga corta',
      hot: 'las visitas funcionan mejor por la mañana o al anochecer',
      'very-hot': 'pasar mucho tiempo fuera agota, así que conviene planificar en torno a la tarde',
    }[feelK];
    return <>{open}{where}: {advice}{wet ? ', entre chubasco y chubasco' : ''}.</>;
  },
  nightLine: ({ night, swing, lo, delta }) => {
    const gap = {
      tiny: 'apenas menos que por la tarde',
      small: <>unos {delta} menos que por la tarde</>,
      moderate: <>{delta} menos que por la tarde</>,
      clear: <>unos claros {delta} menos que por la tarde</>,
      big: <>una gran caída de {delta} respecto a la tarde</>,
    }[swing];
    const tail = {
      'hard-frost': ', muy por debajo de cero',
      frosty: ', así que las heladas son frecuentes',
      cold: ', así que las mañanas empiezan frías',
      cool: ', así que por la noche conviene una capa más',
      mild: ', todavía agradable al aire libre',
      warm: ', todavía suficiente para ir de manga corta',
      sultry: ', así que el calor apenas da tregua',
    }[night];
    return <>Por la noche baja a unos {lo}, {gap}{tail}.</>;
  },
  humLine: ({ caseK, h: hum, rel }) => {
    const r = { above: ', más húmedo de lo habitual aquí', below: ', más seco de lo habitual aquí' }[rel] || '';
    const t = {
      veryHumidHot: 'el aire es bochornoso y se siente más calor del que marca el termómetro',
      dampCold: 'el aire húmedo hace que el frío se note más',
      dampCool: 'el aire húmedo hace que un día fresco parezca más frío, sobre todo con viento',
      humidHot: 'los ratos de calor resultan algo pegajosos',
      humidMild: 'el aire es húmedo, aunque a estas temperaturas rara vez agobia',
      dryHot: 'el calor es seco, así que conviene beber más de lo que parece',
      dry: 'la piel y los labios pueden notar el aire seco',
      comfortCold: 'el aire no es ni húmedo ni seco, así que el frío se nota limpio',
      comfortMild: 'el aire no resulta ni pegajoso ni seco',
      comfortHot: 'el calor rara vez resulta pegajoso',
    }[caseK];
    return `La humedad media es del ${h.n0(hum)} %${r}: ${t}.`;
  },
  rainLine: ({ freq, never, days, n, inCity, top }) => {
    const base = never ? 'Casi nunca llueve' : {
      dry: `La lluvia es rara, unos ${days} días húmedos de ${n}`,
      occasional: `Llueve unos ${days} días de ${n}`,
      showery: `Cabe esperar lluvia unos ${days} días de ${n}, con ratos secos entre medias`,
      wet: `La lluvia cae unos ${days} días de ${n}`,
    }[freq];
    const t = !top ? '' : top.first ? `, lo que lo convierte en el mes más ${KIND[top.kind]} ${inCity}` : `, entre los tres meses más ${top.kind === 'wettest' ? 'lluviosos' : 'secos'} del año`;
    return `${base}${t}`;
  },
  rainJoin: '; ',
  stop: '.',
  rainSizeLine: ({ per, sizeK, vs, year }) => {
    const kind = {
      lightCool: 'sobre todo llovizna fría',
      lightWarm: 'normalmente un chubasco breve',
      moderateCool: 'lluvia constante más que un chubasco pasajero',
      moderateWarm: 'suficiente para mojarse sin paraguas',
      heavyCool: 'un buen remojón',
      heavyWarm: 'a menudo en forma de aguaceros fuertes',
    }[sizeK];
    const cmp = { heavier: `, más que los ${year} mm habituales de la ciudad`, lighter: `, menos que los ${year} mm habituales de la ciudad`, typical: `, cerca de los ${year} mm habituales de la ciudad` }[vs] || '';
    return `los días húmedos dejan ${per}: ${kind}${cmp}.`;
  },
  snowNote: { snow: 'Con estas temperaturas, buena parte probablemente cae en forma de nieve.', mixed: 'Una parte puede caer como aguanieve o nieve.' },
  dayLine: ({ monthN, cityN, rise, set, len, band, dir, amt, pm }) => {
    const lead = { long: 'Días largos: a mediados de', short: 'Días cortos: a mediados de', normal: 'A mediados de' }[band] || 'A mediados de';
    const chg = { barely: `, casi lo mismo que a mediados de ${pm}`, shorter: `, ${amt} menos que a mediados de ${pm}`, longer: `, ${amt} más que a mediados de ${pm}` }[dir];
    return `${lead} ${monthN}, ${cityN} tiene ${len} de luz, del amanecer hacia las ${rise} al atardecer hacia las ${set}${chg}.`;
  },
  sunLine: ({ share, skyK, rel }) => {
    const r = { above: ', en la parte más soleada del año aquí', below: ', en la parte menos soleada del año aquí' }[rel] || '';
    const sky = { cloudy: 'el cielo suele estar nublado', mixed: 'sol y nubes se reparten el día', bright: 'hay muchos ratos de sol', clear: 'el cielo suele estar despejado', showery: 'cabe esperar ratos de sol entre los chubascos', clearDry: 'el cielo suele estar despejado y la lluvia es rara', clearSome: 'el cielo suele estar despejado entre los días de lluvia', brightSome: 'cabe esperar ratos de sol entre los días de lluvia' }[skyK];
    return `Las estimaciones del modelo sitúan el sol en torno al ${share} % de las horas de luz${r}, así que ${sky}.`;
  },
  cmpRain: (rain) => (rain === 0 ? ', con casi la misma lluvia' : `, con ${h.n0(Math.abs(rain))} mm ${rain > 0 ? 'más' : 'menos'} de lluvia`),
  cmpLine: ({ monthN, rankTxt, prevN, delta, warmer, mag, same, rainTxt }) => {
    const first = rankTxt ? `${cap(monthN)} es ${rankTxt} del año` : cap(monthN);
    if (same) return <>{first} y hace casi tanto calor como en {prevN}{rainTxt}.</>;
    const size = { slight: 'solo ', big: 'nada menos que ', plain: '' }[mag];
    return <>{first}; las tardes son {size}{delta} {warmer ? 'más cálidas' : 'más frescas'} que en {prevN}{rainTxt}.</>;
  },
  nextLine: ({ trendK, nextN, temp, rainDir }) => {
    const base = {
      peak: <>Después el año cambia: {nextN} ya es más fresco, con máximas cerca de {temp}</>,
      trough: <>Este es el punto más bajo: {nextN} sube hasta unos {temp}</>,
      warming: <>Las temperaturas siguen subiendo hacia {nextN}, hasta unos {temp}</>,
      cooling: <>Las temperaturas siguen bajando hacia {nextN}, hasta unos {temp}</>,
      flat: <>Las temperaturas apenas cambian hacia {nextN}, en torno a {temp}</>,
    }[trendK];
    const r = { wetter: ', y llueve más', drier: ', y llueve menos' }[rainDir] || '';
    return <>{base}{r}.</>;
  },
  suitWhy: {
    sightseeing: {
      ok: 'las temperaturas diurnas son buenas para caminar', okCool: 'cómodo a pie con una chaqueta', okWarm: 'calor llevadero para pasear por la ciudad',
      rainSnow: 'llueve o nieva más de la mitad de los días', rainMostSnow: 'llueve o nieva la mayoría de los días', rain: 'llueve más de la mitad de los días', rainMost: 'llueve la mayoría de los días', hot: 'el calor del mediodía dificulta las caminatas largas', cold: 'hace frío para pasear mucho rato', coldHard: 'demasiado frío para pasear mucho rato',
    },
    parks: {
      ok: 'agradable para largos paseos y pícnics', okCool: 'agradable con una capa ligera',
      hot: 'las tardes son demasiado cálidas para quedarse fuera', hotHard: 'las tardes son demasiado calurosas para sentarse fuera',
      cold: 'demasiado frío para sentarse fuera mucho rato', coldHard: 'mucho frío para sentarse fuera', coldMild: 'algo fresco para sentarse fuera mucho rato',
      rain: 'la lluvia interrumpe los planes al aire libre', rainMost: 'la lluvia interrumpe la mayoría de los planes al aire libre',
    },
    beach: { ok: 'cálido y mayormente seco en la costa', hot: 'calor costero', cold: 'el aire del mar es demasiado fresco', coldHard: 'demasiado frío para la playa', rain: 'demasiados días de lluvia', rainMost: 'lluvia casi todos los días' },
    hiking: { ok: 'temperaturas suaves para los senderos', cold: 'los senderos están frescos', coldHard: 'los senderos están fríos, así que hay que abrigarse', hot: 'demasiado calor para rutas largas', rain: 'senderos mojados', rainMost: 'los senderos siguen mojados' },
    indoor: { rainSnow: 'con lluvia o nieve casi todos los días, galerías y museos son un plan fácil', rain: 'con lluvia casi todos los días, galerías y museos son un plan fácil', hot: 'un respiro fresco en las horas de más calor', cold: 'lugares cálidos para las horas más frías' },
  },
  tips: {
    layers: {
      big: 'La tarde y la noche están muy lejos en temperatura, así que lleva prendas para quitar a mediodía y volver a poner al anochecer.',
      cold: 'Por la mañana y por la noche hace frío comparado con el mediodía, así que vístete por capas.',
      mild: 'Los días son claramente más cálidos que las noches: lleva capas que puedas añadir o quitar.',
    },
    rain: {
      showeryLight: 'Los chubascos suelen ser ligeros, así que basta con un paraguas compacto.',
      showeryModerate: 'Lleva un paraguas pequeño en el bolso para los días de lluvia.',
      showeryHeavy: 'Cuando llueve puede hacerlo con fuerza: lleva una chaqueta impermeable ligera.',
      wetLight: 'La llovizna es frecuente, así que compensa llevar un impermeable plegable.',
      wetModerate: 'Llueve a menudo: lleva impermeable y calzado que aguante los charcos.',
      wetHeavy: 'Llueve a menudo y con fuerza: un buen impermeable y calzado de secado rápido.',
      wintry: 'La lluvia o la nieve son frecuentes: lleva una chaqueta impermeable y botas con buen agarre.',
    },
    sun: {
      extreme: 'Calor extremo: sombrero, crema solar, ropa holgada y mucha agua.',
      humid: 'Ropa holgada y transpirable, además de crema solar y un sombrero de ala ancha.',
      dry: 'Protégete del sol fuerte y del aire seco: sombrero, crema solar y mucha agua.',
      clear: 'Crema solar, sombrero y gafas de sol; ropa ligera y transpirable.',
    },
    jacket: {
      cold: 'Una chaqueta para el frío de primera hora, fácil de llevar después.',
      cool: 'Una chaqueta ligera o una prenda de punto basta para casi todo el día.',
      mild: 'Lleva un jersey o un abrigo ligero para las tardes frescas.',
    },
    warm: {
      freezing: 'Un buen abrigo de invierno, guantes y gorro, y calzado abrigado para las aceras heladas.',
      cold: 'Un buen abrigo de invierno, con guantes y gorro para salir temprano.',
      frost: 'Una chaqueta de abrigo, gorro y guantes para las mañanas con helada.',
      chilly: 'Una chaqueta de abrigo y un gorro para las mañanas y noches frías.',
    },
    shades: {
      clear: 'El cielo despejado es habitual, así que merece la pena llevar gafas de sol y un sombrero ligero.',
      bright: 'Los ratos de sol son habituales, así que lleva gafas de sol y una gorra.',
      mixed: 'El sol va y viene, pero las gafas de sol siguen mereciendo un sitio en el bolso.',
    },
    light: { any: 'Ropa cómoda y una capa ligera para la noche.' },
    shoes: { any: 'Con tantos días húmedos, conviene llevar calzado que aguante los charcos y seque rápido.', heavy: 'Mucha lluvia fuerte: calzado impermeable y un par de calcetines de repuesto.', snow: 'Botas impermeables con buen agarre para aceras mojadas o heladas.' },
  },
  a1: ({ hi, lo, feel, warmRank }) => <>Las tardes rondan {hi} y las noches unos {lo}: días {feel} para la mayoría{warmRank && <>; es {warmRank} del año</>}.</>,
  a2: {
    never: ({ monthN, none }) => <>Casi nunca: {monthN} apenas tiene lluvia, {none ? 'sin ningún día de lluvia' : 'con un día de lluvia aproximadamente'} en un año típico.</>,
    dry: ({ daysTxt, mm }) => <>No: solo unos {daysTxt} y {h.n0(mm)} mm en todo el mes.</>,
    yes: ({ mm, often, sizeK }) => <>Sí: llueve {often} y se acumulan unos {h.n0(mm)} mm{{ light: ', sobre todo lluvia ligera', moderate: ', así que compensa llevar paraguas', heavy: ', a menudo con fuerza, así que conviene prever planes bajo techo' }[sizeK]}.</>,
    some: ({ daysTxt, mm, light }) => <>No especialmente: unos {daysTxt} ({h.n0(mm)} mm), sobre todo lluvia {light ? 'ligera' : 'moderada'}.</>,
  },
  a3: ({ list, eve, cold }) => ({
    cool: <>Lleva {list}, además de una capa para las mañanas y noches {cold ? 'frías' : 'frescas'}.</>,
    same: <>Lleva {list}; las noches se parecen al día, así que sirve la misma ropa.</>,
    warm: <>Lleva {list}; sigue haciendo calor al anochecer, así que no hace falta una capa extra.</>,
  }[eve]),
  a4: ({ win, ranks, labels, whyTxt, narrow }) => <>{cap(win)} puntúa {narrow ? 'algo' : 'claramente'} mejor en nuestro ranking climático (n.º {ranks.a} de 12 frente al n.º {ranks.b}){labels ? `, con «${labels[0]}» frente a «${labels[1]}»` : ''}.{whyTxt}</>,
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
  polar: {
    day: ({ monthN, inCity }) => `A mediados de ${monthN}, ${inCity} el sol no se pone.`,
    night: ({ monthN, inCity }) => `A mediados de ${monthN}, ${inCity} el sol no sale sobre el horizonte.`,
  },
  equatorDay: 'Cerca del ecuador, las horas de amanecer y atardecer cambian muy poco a lo largo del año.',
  packPhrase: { shoes: 'calzado impermeable', layers: 'ropa por capas', rain: 'protección para la lluvia', sun: 'protección solar', jacket: 'una chaqueta ligera', warm: 'ropa de abrigo', shades: 'gafas de sol', light: 'ropa ligera' },
  wear: {
    title: ({ monthN, cityN }) => `Qué ropa llevar a ${cityN} en ${monthN}`,
    basis: 'Son estimaciones a partir de medias mensuales, así que cada temperatura es aproximada.',
    h3: { time: 'Según el momento del día', pack: 'Equipaje para 7 días', year: { normal: 'Año frío o cálido', winter: 'Año frío o suave', cooler: 'Año más fresco o más caluroso', hot: 'Año fresco o muy caluroso' } },
    at: { morning: (t) => <>Mañana, unos {t}:</>, afternoon: (t) => <>Tarde, unos {t}:</>, evening: (t) => <>Noche, unos {t}:</> },
    morning: { winter: 'un buen abrigo de invierno, guantes y gorro.', cold: 'una chaqueta de abrigo y un gorro, con una capa debajo.', mild: 'una chaqueta ligera o un jersey.', warm: 'ropa ligera con una capa fina para empezar.', hot: 'ropa ligera y holgada desde el principio del día.' },
    afternoon: { winter: 'el abrigo sigue puesto, incluso a mediodía.', cold: 'deja la chaqueta para caminar; puedes quitarte la capa extra.', mild: 'basta una prenda ligera, con la chaqueta a mano.', warm: 'basta ropa ligera y transpirable.', warmSun: 'ropa ligera, un sombrero y protector solar.', hot: 'un sombrero, protector solar y ropa holgada, con mucha agua.' },
    evening: { ice: 'de nuevo cerca de cero: mantén todas las capas y cuidado con las aceras heladas.', winter: 'mantén todas las capas.', cold: 'vuelve a ponerte la capa.', mild: 'vuelve a ponerte la chaqueta.', warm: 'vuelve a ponerte la capa fina.', warmNight: 'la misma ropa ligera; no hace falta otra capa.', same: 'sirve la misma ropa, porque la temperatura apenas cambia.' },
    year: {
      normal: ({ monthN, coldY, warmY, cold, warm }) => <>En un año frío como {coldY}, las máximas de {monthN} promediaron solo {cold}, así que conviene llevar una capa de abrigo más. En un año cálido como {warmY} llegaron a {warm}, y basta una capa más ligera.</>,
      winter: ({ monthN, coldY, warmY, cold, warm }) => <>En un año frío como {coldY}, las máximas de {monthN} promediaron solo {cold}, así que conviene llevar una capa de abrigo más. Incluso en un año suave como {warmY} llegaron solo a {warm}, así que el abrigo de invierno sigue haciendo falta.</>,
      cooler: ({ monthN, coldY, warmY, cold, warm }) => <>En un año más fresco como {coldY}, las máximas de {monthN} promediaron {cold}, así que conviene una capa ligera más. En un año más caluroso como {warmY} llegaron a {warm}, así que mejor ropa ligera.</>,
      hot: ({ monthN, coldY, warmY, cold, warm, y1, y2 }) => <>Incluso el {monthN} más fresco de {y1}–{y2}, en {coldY}, promedió {cold}, y el más caluroso, en {warmY}, llegó a {warm}. En cualquier caso, no hace falta nada más abrigado.</>,
    },
    wet: {
      none: 'En una semana típica no se esperan días húmedos, así que puedes dejar la ropa de lluvia en casa.',
      some: ({ n, wintry, size, per }) => {
        const each = n === 1 ? 'ese día' : 'cada uno';
        const tail = !per ? '' : wintry ? <>, entre lluvia y nieve, con {per} {each}</> : size === 'light' ? <>, sobre todo lluvia ligera de {per} al día</> : size === 'heavy' ? <>, a menudo fuerte, con {per} {each}</> : <>, con {per} {each}</>;
        return <>Cuenta con unos {n} {n === 1 ? 'día húmedo' : 'días húmedos'} por semana{tail}.</>;
      },
    },
    items: { coat: 'Un abrigo de invierno', coatWet: 'Un abrigo de invierno con una capa exterior impermeable', midThermal: '2 capas intermedias de abrigo y una capa térmica', glovesHat: 'Guantes y gorro', jacketHat: 'Una chaqueta de abrigo y un gorro', mid2: '2 capas intermedias de abrigo', lightJacket: 'Una chaqueta ligera o un jersey', lightLayers: '2 o 3 capas ligeras', lightClothes: 'Ropa ligera y transpirable', thinLayer: 'Una capa fina para la mañana y la noche', looseClothes: 'Ropa holgada y transpirable', rainJacket: 'Una chaqueta de lluvia compacta', sunKit: 'Un sombrero, protector solar y gafas de sol', shades: 'Gafas de sol y un sombrero ligero', bottle: 'Una botella de agua', boots: 'Botas de abrigo con buen agarre', wpShoes: 'Zapatos impermeables que se sequen rápido', lightShoes: 'Zapatos ligeros y transpirables', walkShoes: 'Zapatos cómodos para caminar' },
    trip: { lead: '¿Viajas en fechas concretas?', link: 'Comprueba tus fechas exactas en el planificador de viajes.' },
  },
  hist: {
    title: ({ monthN, cityN, n }) => `${cap(monthN)} en ${cityN}: lo que muestran ${n} años`,
    basis: ({ y1, y2 }) => `Basado en medias mensuales de ${y1}–${y2}, no en récords diarios.`,
    h3: { range: 'Rango habitual', records: 'Récords', odds: 'Frecuencia a lo largo de los años' },
    to: 'a',
    range: ({ monthN, temps, rainLo, rainHi, wintry }) => <>La mayoría de los años, {monthN} promedia {temps} por la tarde, con {rainLo}–{rainHi} mm de {wintry ? 'lluvia o nieve' : 'lluvia'}.</>,
    chance: ({ monthN, often, wintry, never }) => (never ? `Casi nunca llueve en un ${monthN} típico.` : `En un ${monthN} típico, ${wintry ? 'llueve o nieva' : 'llueve'} ${often}.`),
    caption: ({ monthN, y1, y2 }) => `Récords de ${monthN}, ${y1}–${y2} (medias mensuales)`,
    th: { record: 'Récord', year: 'Año', high: 'Máx. media', rain: 'Lluvia', days: 'Días de lluvia' },
    record: {
      warm: ({ monthN }) => `${cap(monthN)} más cálido`, cold: ({ monthN }) => `${cap(monthN)} más frío`, cool: ({ monthN }) => `${cap(monthN)} más fresco`,
      wet: ({ monthN }) => `${cap(monthN)} más lluvioso`, dry: ({ monthN }) => `${cap(monthN)} más seco`,
    },
    ties: ({ count, n }) => `${count} de ${n} años`,
    odds: {
      rainy: ({ monthN, count, n, t, wintry }) => `En ${count} de ${n} años, ${monthN} tuvo ${t} o más días ${wintry ? 'húmedos' : 'de lluvia'}.`,
      anyrain: ({ monthN, count, n, wintry }) => `En ${count} de ${n} años, ${monthN} tuvo al menos un día ${wintry ? 'húmedo' : 'de lluvia'}.`,
      dry: ({ count, n, t, wintry }) => `En ${count} de ${n} años, cayeron menos de ${t} mm de ${wintry ? 'lluvia o nieve' : 'lluvia'}.`,
      warm: ({ count, n, temp }) => <>En {count} de {n} años, la máxima media llegó a {temp} o más.</>,
      cool: ({ count, n, temp }) => <>En {count} de {n} años, se quedó por debajo de {temp}.</>,
    },
    latest: ({ monthN, year, dir, rank, total, y1, high, mm, days, wintry }) => <>Entre los {total} años desde {y1}, {monthN} de {year} ocupó el puesto {rank} entre los más {dir === 'warm' ? 'cálidos' : 'fríos'} ({high}{mm ? `, ${mm}` : ''}{days != null ? `, ${days} ${days === 1 ? 'día' : 'días'} ${wintry ? (days === 1 ? 'húmedo' : 'húmedos') : 'de lluvia'}` : ''}).</>,
    broke: {
      warm: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} de {year} fue más cálido que cualquier {monthN} de {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} de {year} igualó al {monthN} más cálido de {y1}–{y2} ({value}).</> },
      cold: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} de {year} fue más frío que cualquier {monthN} de {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} de {year} igualó al {monthN} más frío de {y1}–{y2} ({value}).</> },
      wet: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} de {year} fue más lluvioso que cualquier {monthN} de {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} de {year} igualó al {monthN} más lluvioso de {y1}–{y2} ({value}).</> },
      dry: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} de {year} fue más seco que cualquier {monthN} de {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} de {year} igualó al {monthN} más seco de {y1}–{y2} ({value}).</> },
    },
  },
  q1: ({ monthN, inCity }) => `¿Qué temperatura hace ${inCity} ${enM(monthN)}?`,
  q2: ({ monthN, inCity }) => `¿Llueve mucho ${inCity} ${enM(monthN)}?`,
  q3: ({ monthN, cityN }) => `¿Qué llevar en la maleta para ${cityN} ${enM(monthN)}?`,
  q4: ({ monthN, nextN, cityN }) => `¿Es mejor visitar ${cityN} ${enM(monthN)} o ${enM(nextN)}?`,
  nextWhy: ({ nextN, why }) => {
    const parts = why.map((w) => ({ warmer: 'es más cálido', cooler: 'es más fresco', fewerRain: 'tiene menos días de lluvia', moreRain: 'tiene más días de lluvia' }[w]));
    return `${cap(nextN)} ${parts.join(' y ')}.`;
  },
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
  statDays: (n) => `${h.n1(n)} ${n === 1 ? 'día' : 'días'}`,
  statSun: (v) => `${h.n1(v)} h / día`,
  Latest: ({ monthN, latest, row, years }) => (
    <>
      <span className="font-semibold text-gray-700">Último dato real – {monthN} de {latest.year}:</span>{' '}
      máxima <UnitTemp c={latest.avg_high} />, mínima <UnitTemp c={latest.avg_low} />
      {latest.avg_rainfall != null && <>, {h.n0(latest.avg_rainfall)} mm de lluvia</>}
      {latest.rainy_days != null && <> en {h.n1(latest.rainy_days)} {latest.rainy_days === 1 ? 'día' : 'días'}</>}
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
