// ─────────────────────────────────────────────────────────────
//  Climate pages — FRANÇAIS (i18n Phase 3). Même API que ./en.jsx.
//  Mots-clés (Semrush) : « Météo {ville} {mois} », « Quand partir à/en/au {lieu} ».
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';
import { UnitTemp } from '../UnitText';
import UnitTempShort from '../UnitTempShort';
import { inCity, inCountry } from '@/i18n/places';
import { intlHelpers, cap } from './common';
import { makeStory } from './story';

const h = intlHelpers('fr');
const fit = (max, ...opts) => opts.find((o) => o.length <= max) || opts[opts.length - 1];
const S = ({ children }) => <strong className="text-gray-900">{children}</strong>;

const VERDICT = { Great: 'Excellent', Good: 'Bon', Fair: 'Moyen', Poor: 'Médiocre' };
const ORD = ['', '', 'deuxième ', 'troisième ', 'quatrième ', 'cinquième ', 'sixième '];
const KIND = { warmest: 'chaud', coolest: 'frais', wettest: 'pluvieux', driest: 'sec' };
const SEASON = {
  winter: { early: 'le début de l\'hiver', mid: 'le cœur de l\'hiver', late: 'la fin de l\'hiver' },
  spring: { early: 'le début du printemps', mid: 'le plein printemps', late: 'la fin du printemps' },
  summer: { early: 'le début de l\'été', mid: 'le plein été', late: 'la fin de l\'été' },
  autumn: { early: 'le début de l\'automne', mid: 'le cœur de l\'automne', late: 'la fin de l\'automne' },
};
const VOWEL = /^[aeiouyàâäéèêëîïôöùûüœæh]/i;
// "de mai" / "d'avril", "de Paris" / "d'Athènes" / "du Caire"
const de = (w) => (/^Le /.test(w) ? `du ${w.slice(3)}` : /^Les /.test(w) ? `des ${w.slice(4)}` : VOWEL.test(w) ? `d'${w}` : `de ${w}`);
const enM = (m) => `en ${m}`;
const que = (w) => (VOWEL.test(w) ? `qu'${w}` : `que ${w}`);
// "à Paris" / "au Caire" / "aux …"
const aC = (n) => (n.startsWith('Le ') ? `au ${n.slice(3)}` : n.startsWith('Les ') ? `aux ${n.slice(4)}` : `à ${n}`);
const hm = (mins) => {
  const m = Math.round(Math.abs(mins));
  const H = Math.floor(m / 60);
  const r = m % 60;
  return H ? (r ? `${H} h ${String(r).padStart(2, '0')}` : `${H} h`) : `${r} min`;
};
const reasonText = (r) => {
  const n = h.n1(r.n);
  return {
    cold: 'journées froides', chilly: 'journées fraîches', 'mild-cool': 'journées douces mais fraîches', comfortable: 'températures agréables',
    warm: 'journées chaudes à très chaudes', hot: 'journées très chaudes', 'very-hot': 'journées caniculaires', frost: 'nuits sous zéro',
    'snow-most': `neige ou pluie presque tous les jours (environ ${n})`, 'snow-frequent': `neige ou pluie fréquentes (environ ${n} jours humides)`, 'snow-some': `quelques jours de neige ou de pluie (environ ${n})`,
    'rain-most': `pluie presque tous les jours (environ ${n})`, 'rain-frequent': `pluie fréquente (environ ${n} jours de pluie)`,
    'rain-some': `quelques jours de pluie (environ ${n})`, dry: r.n < 0.5 ? 'presque pas de pluie' : `plutôt sec (environ ${n} ${r.n < 2 ? 'jour' : 'jours'} de pluie)`,
    heavy: `fortes pluies (${n} mm)`, dull: `peu de soleil (${n} h par jour)`, sunny: `beaucoup de soleil (${n} h par jour)`,
  }[r.key || r.t] || '';
};
const SUIT = { sightseeing: 'Visites en ville', parks: 'Parcs et plein air', beach: 'Plage', hiking: 'Randonnée', indoor: 'Musées et activités en intérieur' };
const PACK = { shoes: 'Chaussures imperméables', layers: 'Superposer les couches', rain: 'Protection contre la pluie', sun: 'Protection solaire', jacket: 'Veste légère', warm: 'Vêtements chauds', shades: 'Lunettes de soleil', light: 'Vêtements légers' };

const P = {
  month: h.month,
  list: h.list,
  n1: h.n1,
  hm,
  verdict: (l) => VERDICT[l] || l,
  packTitle: (p) => PACK[p.key] || p.title,
  inCity: (city) => inCity('fr', city),
  rank: (kind, r) => `le ${ORD[r] || ''}mois le plus ${KIND[kind]}`,
  rainyDays: (n) => `${h.n1(n)} ${n < 2 ? 'jour' : 'jours'} de pluie`,
  sunHours: (n) => `${h.n1(n)} heures de soleil`,
  mm: (n) => `${h.n0(n)} mm`,
  perDay: (v) => `environ ${h.n1(v)} mm`,
  often: (o) => ({ most: 'presque tous les jours', everyOther: 'environ un jour sur deux', never: 'presque jamais', oneIn: `environ un jour sur ${o.k}` }[o.key]),

  hero: ({ monthN, place, y, feelK, rainK }) => {
    const feel = { freezing: 'glaciales', cold: 'froides', chilly: 'fraîches', cool: 'assez fraîches', mild: 'douces', warm: 'chaudes', hot: 'très chaudes', 'very-hot': 'caniculaires' }[feelK] || 'typiques';
    const rain = { dry: 'peu de pluie', occasional: 'de la pluie par moments', showery: 'des averses régulières', wet: 'de la pluie presque tous les jours', wintry: 'de la pluie ou de la neige bien des jours' }[rainK];
    return `${place} ${enM(monthN)} : des après-midi ${feel} et ${rain}, d'après les moyennes ${y}.`;
  },
  quick: ({ monthN, cityN, hi, lo, days, mm, sun, feelK, rainK, sunK }) => {
    const lead = { freezing: 'Un mois glacial', cold: 'Un mois froid', chilly: 'Un mois frais', cool: 'Un mois assez frais', mild: 'Un mois doux', warm: 'Un mois chaud', hot: 'Un mois très chaud', 'very-hot': 'Un mois caniculaire' }[feelK] || 'Un mois typique';
    const rain = { dry: <>très peu de pluie ({mm})</>, some: <>environ {days} ({mm})</>, wet: <>environ {days} ({mm} au total)</> }[rainK];
    const shine = { low: <>seulement {sun} par jour</>, mid: <>{sun} par jour</>, high: <>pas moins de {sun} par jour</> }[sunK];
    return <>{lead} {aC(cityN)} : {enM(monthN)}, les maximales tournent autour de {hi} et les minimales de {lo}, avec {rain} et {shine}.</>;
  },
  tableExtreme: ({ monthN, inCity, warmest, rainTxt }) => <>{cap(monthN)} est <strong>le mois le plus {warmest ? 'chaud' : 'frais'}</strong> {inCity}{rainTxt && <> ; côté pluie, c&apos;est {rainTxt}</>}.</>,
  tableNormal: ({ monthN, inCity, warmer, k, rainTxt, band }) => ({
    high: <>Seuls {k} {k === 1 ? 'mois est plus chaud' : 'mois sont plus chauds'} {que(monthN)} {inCity}{rainTxt && <> ; côté pluie, c&apos;est {rainTxt}</>}.</>,
    mid: <>{cap(monthN)} est plus chaud que <strong>{warmer} des 11 autres mois</strong>{rainTxt && <>, et c&apos;est {rainTxt} {inCity}</>}.</>,
    low: <>Côté température, {monthN} ne dépasse que <strong>{warmer} des 11</strong> autres mois{rainTxt && <>, et c&apos;est {rainTxt} de l&apos;année</>}.</>,
  }[band]),
  feelLine: ({ feelK, hi, pos, peakN, delta, wet }) => {
    const open = feelK === 'freezing' ? <>L&apos;après-midi, on dépasse à peine {hi}</> : ['hot', 'very-hot'].includes(feelK) ? <>L&apos;après-midi, on atteint {hi}</> : <>L&apos;après-midi, on arrive à environ {hi}</>;
    const where = {
      peak: ', la valeur la plus haute de l\'année',
      trough: ', la valeur la plus basse de l\'année',
      nearPeak: <>, près du maximum {de(peakN || '')}</>,
      nearTrough: ', près de la valeur la plus basse de l\'année',
      flat: ', presque comme tous les autres mois ici',
      middle: <>, environ {delta} sous le maximum {de(peakN || '')}</>,
    }[pos] || '';
    const advice = {
      freezing: 'même à midi, on se sent en plein hiver',
      cold: 'manteau et écharpe du matin au soir',
      chilly: 'on marche bien avec une vraie veste',
      cool: 'agréable pour marcher avec une couche en plus',
      mild: 'confortable en tenue légère',
      warm: 'assez chaud pour les manches courtes',
      hot: 'les visites se font mieux le matin ou le soir',
      'very-hot': 'rester longtemps dehors épuise, mieux vaut s\'organiser autour de l\'après-midi',
    }[feelK];
    return <>{open}{where} : {advice}{wet ? ', entre deux averses' : ''}.</>;
  },
  nightLine: ({ night, swing, lo, delta }) => {
    const gap = {
      tiny: 'à peine moins que l\'après-midi',
      small: <>environ {delta} de moins que l&apos;après-midi</>,
      moderate: <>{delta} de moins que l&apos;après-midi</>,
      clear: <>bien {delta} de moins que l&apos;après-midi</>,
      big: <>une forte baisse de {delta} par rapport à l&apos;après-midi</>,
    }[swing];
    const tail = {
      'hard-frost': ', bien en dessous de zéro',
      frosty: ', le gel est donc fréquent',
      cold: ', les matinées commencent donc dans le froid',
      cool: ', le soir appelle donc une couche en plus',
      mild: ', toujours agréable dehors',
      warm: ', toujours assez chaud pour les manches courtes',
      sultry: ', la chaleur laisse donc peu de répit',
    }[night];
    return <>La nuit, on descend à environ {lo}, {gap}{tail}.</>;
  },
  humLine: ({ caseK, h: hum, rel }) => {
    const r = { above: ', plus humide que d\'habitude ici', below: ', plus sec que d\'habitude ici' }[rel] || '';
    const t = {
      veryHumidHot: 'l\'air est lourd et la chaleur semble plus forte que ce qu\'indique le thermomètre',
      dampCold: 'l\'air humide rend le froid plus mordant',
      dampCool: 'l\'air humide rend une journée fraîche encore plus fraîche, surtout avec du vent',
      humidHot: 'les moments de chaleur sont un peu collants',
      humidMild: 'l\'air est humide, mais rarement pesant à ces températures',
      dryHot: 'la chaleur est sèche, buvez donc plus que vous ne le pensez',
      dry: 'la peau et les lèvres peuvent ressentir l\'air sec',
      comfortCold: 'l\'air n\'est ni humide ni sec, le froid reste donc franc',
      comfortMild: 'l\'air n\'est ni collant ni sec',
      comfortHot: 'la chaleur est rarement collante',
    }[caseK];
    return `L'humidité moyenne est de ${h.n0(hum)} %${r} : ${t}.`;
  },
  rainLine: ({ freq, never, days, n, inCity, top }) => {
    const base = never ? 'Il ne pleut presque jamais' : {
      dry: `La pluie est rare, environ ${days} jours humides sur ${n}`,
      occasional: `Il pleut environ ${days} jours sur ${n}`,
      showery: `Il faut s'attendre à de la pluie environ ${days} jours sur ${n}, avec des périodes sèches entre-temps`,
      wet: `La pluie tombe environ ${days} jours sur ${n}`,
    }[freq];
    const t = !top ? '' : top.first ? `, ce qui en fait le mois le plus ${KIND[top.kind]} ${inCity}` : `, parmi les trois mois les plus ${top.kind === 'wettest' ? 'pluvieux' : 'secs'} de l'année`;
    return `${base}${t}`;
  },
  rainJoin: ' ; ',
  stop: '.',
  rainSizeLine: ({ per, sizeK, vs, year }) => {
    const kind = {
      lightCool: 'surtout une bruine froide',
      lightWarm: 'en général une averse brève',
      moderateCool: 'une pluie continue plutôt qu\'une averse passagère',
      moderateWarm: 'assez pour être mouillé sans parapluie',
      heavyCool: 'de quoi être bien trempé',
      heavyWarm: 'souvent sous forme de fortes averses',
    }[sizeK];
    const cmp = { heavier: `, plus que les ${year} mm habituels de la ville`, lighter: `, moins que les ${year} mm habituels de la ville`, typical: `, proche des ${year} mm habituels de la ville` }[vs] || '';
    return `les jours humides apportent ${per} : ${kind}${cmp}.`;
  },
  snowNote: { snow: 'À ces températures, une bonne partie tombe sans doute sous forme de neige.', mixed: 'Une partie peut tomber sous forme de neige fondue ou de neige.' },
  dayLine: ({ monthN, cityN, rise, set, len, band, dir, amt, pm }) => {
    const lead = { long: 'Longues journées : à la mi-', short: 'Journées courtes : à la mi-', normal: 'À la mi-' }[band] || 'À la mi-';
    const chg = { barely: `, à peu près autant qu'à la mi-${pm}`, shorter: `, ${amt} de moins qu'à la mi-${pm}`, longer: `, ${amt} de plus qu'à la mi-${pm}` }[dir];
    return `${lead}${monthN}, ${cityN} a ${len} de jour, du lever du soleil vers ${rise} au coucher vers ${set}${chg}.`;
  },
  sunLine: ({ share, skyK, rel }) => {
    const r = { above: ', plutôt le côté ensoleillé de l\'année ici', below: ', plutôt le côté terne de l\'année ici' }[rel] || '';
    const sky = { cloudy: 'le ciel est souvent couvert', mixed: 'soleil et nuages se partagent la journée', bright: 'les éclaircies sont nombreuses', clear: 'le ciel est le plus souvent dégagé', showery: 'attendez-vous à des éclaircies entre les averses', clearDry: 'le ciel est le plus souvent dégagé et la pluie rare', clearSome: 'le ciel est le plus souvent dégagé entre les jours de pluie', brightSome: 'attendez-vous à des éclaircies entre les jours de pluie' }[skyK];
    return `Selon les estimations du modèle, le soleil brille environ ${share} % des heures de jour${r} : ${sky}.`;
  },
  cmpRain: (rain) => (rain === 0 ? ', avec à peu près autant de pluie' : `, avec ${h.n0(Math.abs(rain))} mm de pluie en ${rain > 0 ? 'plus' : 'moins'}`),
  cmpLine: ({ monthN, rankTxt, prevN, delta, warmer, mag, same, rainTxt }) => {
    const first = rankTxt ? `${cap(monthN)} est ${rankTxt} de l'année` : cap(monthN);
    if (same) return <>{first}, et il fait à peu près aussi chaud {enM(prevN)}{rainTxt}.</>;
    const size = { slight: 'seulement ', big: 'pas moins de ', plain: '' }[mag];
    return <>{first} ; les après-midi sont {size}{delta} plus {warmer ? 'chauds' : 'frais'} {enM(prevN).replace(/^en /, 'qu\'en ')}{rainTxt}.</>;
  },
  nextLine: ({ trendK, nextN, temp, rainDir }) => {
    const base = {
      peak: <>Ensuite, l&apos;année bascule : {nextN} est déjà plus frais, avec des maximales proches de {temp}</>,
      trough: <>C&apos;est le point bas : {nextN} remonte à environ {temp}</>,
      warming: <>Les températures continuent de monter {enM(nextN)}, jusqu&apos;à environ {temp}</>,
      cooling: <>Les températures continuent de baisser {enM(nextN)}, jusqu&apos;à environ {temp}</>,
      flat: <>Les températures bougent à peine {enM(nextN)}, autour de {temp}</>,
    }[trendK];
    const r = { wetter: ', et il pleut davantage', drier: ', et il pleut moins' }[rainDir] || '';
    return <>{base}{r}.</>;
  },
  suitWhy: {
    sightseeing: {
      ok: 'les températures de la journée conviennent à la marche', okCool: 'confortable à pied avec une veste', okWarm: 'chaud mais supportable pour une balade en ville',
      rainSnow: 'il pleut ou il neige plus d\'un jour sur deux', rainMostSnow: 'il pleut ou il neige la plupart des jours', rain: 'il pleut plus d\'un jour sur deux', rainMost: 'il pleut la plupart des jours', hot: 'la chaleur de midi rend les longues marches difficiles', cold: 'il fait froid pour les longues balades', coldHard: 'trop froid pour les longues balades',
    },
    parks: {
      ok: 'agréable pour les longues promenades et les pique-niques', okCool: 'agréable avec une couche légère',
      hot: 'les après-midi sont trop chauds pour s\'attarder dehors', hotHard: 'les après-midi sont bien trop chauds pour s\'asseoir dehors',
      cold: 'trop froid pour rester assis dehors longtemps', coldHard: 'bien trop froid pour s\'asseoir dehors', coldMild: 'un peu trop frais pour rester assis dehors longtemps',
      rain: 'la pluie perturbe les projets en plein air', rainMost: 'la pluie perturbe la plupart des projets en plein air',
    },
    beach: { ok: 'chaud et le plus souvent sec sur la côte', hot: 'chaleur en bord de mer', cold: 'l\'air marin est trop frais', coldHard: 'bien trop froid pour la plage', rain: 'trop de jours de pluie', rainMost: 'de la pluie presque tous les jours' },
    hiking: { ok: 'températures douces pour les sentiers', cold: 'les sentiers sont frais', coldHard: 'les sentiers sont froids, couvrez-vous bien', hot: 'trop chaud pour les longues randonnées', rain: 'sentiers mouillés', rainMost: 'les sentiers restent mouillés' },
    indoor: { rainSnow: 'avec de la pluie ou de la neige presque tous les jours, galeries et musées sont un choix facile', rain: 'avec de la pluie presque tous les jours, galeries et musées sont un choix facile', hot: 'une pause au frais aux heures les plus chaudes', cold: 'des endroits chauds pour les heures les plus froides' },
  },
  tips: {
    layers: {
      big: 'L\'après-midi et la nuit sont très éloignés en température : prévoyez des pièces à retirer à midi et à remettre au crépuscule.',
      cold: 'Le matin et le soir, il fait froid par rapport à midi : habillez-vous en couches.',
      mild: 'Les journées sont nettement plus chaudes que les nuits : prévoyez des couches à ajouter ou à retirer.',
    },
    rain: {
      showeryLight: 'Les averses sont souvent légères, un parapluie compact suffit.',
      showeryModerate: 'Gardez un petit parapluie dans votre sac pour les jours de pluie.',
      showeryHeavy: 'Quand il pleut, cela peut être fort : prenez une veste imperméable légère.',
      wetLight: 'La bruine est fréquente, une veste de pluie compacte a toute sa place.',
      wetModerate: 'La pluie est fréquente : une veste imperméable et des chaussures qui résistent aux flaques.',
      wetHeavy: 'La pluie est fréquente et forte : un vrai imperméable et des chaussures à séchage rapide.',
      wintry: 'Pluie ou neige sont fréquentes : une veste imperméable et des bottes qui accrochent bien.',
    },
    sun: {
      extreme: 'Chaleur extrême : chapeau, crème solaire, vêtements amples et beaucoup d\'eau.',
      humid: 'Des vêtements amples et respirants, avec crème solaire et chapeau à larges bords.',
      dry: 'Protégez-vous du soleil fort et de l\'air sec : chapeau, crème solaire et beaucoup d\'eau.',
      clear: 'Crème solaire, chapeau et lunettes de soleil ; vêtements légers et respirants.',
    },
    jacket: {
      cold: 'Une veste pour le froid du matin, facile à porter ensuite.',
      cool: 'Une veste légère ou un gilet suffit pour la plus grande partie de la journée.',
      mild: 'Prévoyez un pull ou un manteau léger pour les après-midi frais.',
    },
    warm: {
      freezing: 'Un vrai manteau d\'hiver, gants et bonnet, et des chaussures chaudes pour les trottoirs glacés.',
      cold: 'Un vrai manteau d\'hiver, avec gants et bonnet pour les départs matinaux.',
      frost: 'Une veste chaude, un bonnet et des gants pour les matins de gel.',
      chilly: 'Une veste chaude et un bonnet pour les matins et les soirs froids.',
    },
    shades: {
      clear: 'Le ciel dégagé est courant, lunettes de soleil et chapeau léger valent la peine.',
      bright: 'Les éclaircies sont courantes : prenez des lunettes de soleil et une casquette.',
      mixed: 'Le soleil va et vient, mais les lunettes de soleil méritent une place dans le sac.',
    },
    light: { any: 'Des vêtements confortables et une couche légère pour le soir.' },
    shoes: { any: 'Avec autant de jours humides, prévoyez des chaussures qui résistent aux flaques et sèchent vite.', heavy: 'Beaucoup de fortes pluies : des chaussures imperméables et une paire de chaussettes de rechange.', snow: 'Des bottes imperméables qui accrochent bien sur les trottoirs mouillés ou glacés.' },
  },
  a1: ({ hi, lo, feel, warmRank }) => <>Les après-midi tournent autour de {hi} et les nuits d&apos;environ {lo} : des journées {feel} pour la plupart{warmRank && <> ; c&apos;est {warmRank} de l&apos;année</>}.</>,
  a2: {
    never: ({ monthN, none }) => <>Presque jamais : {monthN} est quasiment sans pluie, {none ? 'sans aucun jour de pluie' : 'avec environ un jour de pluie'} une année typique.</>,
    dry: ({ daysTxt, mm }) => <>Non : seulement environ {daysTxt} et {h.n0(mm)} mm pour tout le mois.</>,
    yes: ({ mm, often, sizeK }) => <>Oui : il pleut {often} pour un total d&apos;environ {h.n0(mm)} mm{{ light: ', surtout de la pluie légère', moderate: ', un parapluie est donc utile', heavy: ', souvent fortement, prévoyez donc des activités en intérieur' }[sizeK]}.</>,
    some: ({ daysTxt, mm, light }) => <>Pas spécialement : environ {daysTxt} ({h.n0(mm)} mm), surtout une pluie {light ? 'légère' : 'modérée'}.</>,
  },
  a3: ({ list, eve, cold }) => ({
    cool: <>Prévoyez {list}, plus une couche pour les matins et les soirs {cold ? 'froids' : 'frais'}.</>,
    same: <>Prévoyez {list} ; les soirées ressemblent à la journée, la même tenue convient donc.</>,
    warm: <>Prévoyez {list} ; il fait encore chaud après la tombée de la nuit, inutile de prévoir une couche en plus.</>,
  }[eve]),
  a4: ({ win, ranks, labels, whyTxt, narrow }) => <>{cap(win)} obtient un score {narrow ? 'un peu' : 'nettement'} meilleur dans notre classement climatique ({ranks.a}<sup>e</sup> sur 12 contre {ranks.b}<sup>e</sup>){labels ? `, avec l'appréciation « ${labels[0]} » contre « ${labels[1]} »` : ''}.{whyTxt}</>,
  season: {
    equator: ({ cityN, monthN }) => [
      `${cityN} se trouve près de l'équateur : pas de véritable hiver ni d'été, il fait chaud toute l'année, et ${monthN} ne fait pas exception.`,
      `Si près de l'équateur, il n'y a pas quatre saisons : ${cityN} est chaude toute l'année, ${enM(monthN)} aussi.`,
    ],
    tropical: ({ cityN, monthN }) => [
      `${cityN} se situe sous les tropiques et reste chaude toute l'année, sans saisons bien marquées.`,
      `Ville tropicale, ${cityN} est chaude toute l'année ; ${monthN} n'appartient clairement ni à la saison sèche ni à la saison des pluies.`,
    ],
    wet: ({ cityN, monthN }) => `${cap(monthN)} tombe pendant la saison des pluies ${de(cityN)} : les précipitations dépassent nettement celles des mois secs.`,
    dry: ({ cityN, monthN }) => `${cap(monthN)} fait partie de la saison sèche ${de(cityN)}, lorsque la pluie est bien plus rare que pendant les mois humides.`,
    between: ({ cityN, monthN }) => `${cap(monthN)} se situe ${aC(cityN)} entre la saison sèche et la saison des pluies.`,
    south: ({ cityN }) => ` (${cityN} se trouve dans l'hémisphère sud : les saisons y sont inversées par rapport à l'Europe)`,
    peakSummer: ({ monthN, inCity, south }) => [`${cap(enM(monthN))}, c'est le plein été ${inCity} : le mois le plus chaud de l'année${south}.`, `L'été atteint son apogée ${enM(monthN)} : aucun mois n'est plus chaud ${inCity}${south}.`],
    troughWinter: ({ monthN, inCity, south }) => [`${cap(monthN)} est le moment le plus froid de l'hiver ${inCity}${south}.`, `L'hiver touche le fond ${enM(monthN)}, le mois le plus frais de l'année ${inCity}${south}.`],
    warmWinter: ({ monthN, inCity, season, stage, south, feel }) => `${cap(enM(monthN))}, c'est ${SEASON[season][stage]} ${inCity}${south}, mais ici l'hiver signifie des journées ${feel} plutôt que froides.`,
    normal: ({ monthN, inCity, season, stage, south }) => [
      `${cap(enM(monthN))}, c'est ${SEASON[season][stage]} ${inCity}${south}.`,
      `${cap(inCity)}, ${monthN} marque ${SEASON[season][stage]}${south}.`,
      `Au calendrier, ${monthN} correspond ${inCity} à ${SEASON[season][stage]}${south}.`,
    ],
  },
  feelWord: { freezing: 'glaciales', cold: 'froides', chilly: 'fraîches', cool: 'fraîches', mild: 'douces', warm: 'chaudes', hot: 'très chaudes', 'very-hot': 'caniculaires' },
  polar: {
    day: ({ monthN, inCity }) => `À la mi-${monthN}, le soleil ne se couche pas ${inCity}.`,
    night: ({ monthN, inCity }) => `À la mi-${monthN}, le soleil ne se lève pas au-dessus de l'horizon ${inCity}.`,
  },
  equatorDay: 'Près de l\'équateur, les heures de lever et de coucher du soleil varient très peu au fil de l\'année.',
  packPhrase: { shoes: 'des chaussures imperméables', layers: 'des vêtements à superposer', rain: 'de quoi vous protéger de la pluie', sun: 'une protection solaire', jacket: 'une veste légère', warm: 'des vêtements chauds', shades: 'des lunettes de soleil', light: 'des vêtements légers' },
  wear: {
    title: ({ monthN, cityN }) => `Que porter ${aC(cityN)} en ${monthN}`,
    basis: "Ce sont des estimations tirées de moyennes mensuelles : chaque température est donc approximative.",
    h3: { time: 'Selon le moment de la journée', pack: 'Valise pour 7 jours', year: { normal: 'Année froide ou chaude', winter: 'Année froide ou douce', cooler: 'Année plus fraîche ou plus chaude', hot: 'Année fraîche ou très chaude' } },
    at: { morning: (t) => <>Le matin, environ {t} :</>, afternoon: (t) => <>L&apos;après-midi, environ {t} :</>, evening: (t) => <>Le soir, environ {t} :</> },
    morning: { winter: 'un vrai manteau d\'hiver, des gants et un bonnet.', cold: 'une veste chaude et un bonnet, avec une couche en dessous.', mild: 'une veste légère ou un pull.', warm: 'des vêtements légers, avec une fine couche pour commencer.', hot: 'des vêtements légers et amples dès le début de la journée.' },
    afternoon: { winter: 'le manteau reste sur vous, même à midi.', cold: 'gardez la veste pour marcher ; la couche en plus peut s\'enlever.', mild: 'un haut léger suffit, avec la veste à portée de main.', warm: 'des vêtements légers et respirants suffisent.', warmSun: 'des vêtements légers, un chapeau et de la crème solaire.', hot: 'un chapeau, de la crème solaire et des vêtements amples, avec beaucoup d\'eau.' },
    evening: { ice: 'retour près de zéro : gardez toutes les couches et attention aux trottoirs glissants.', winter: 'gardez toutes les couches.', cold: 'remettez la couche.', mild: 'remettez la veste.', warm: 'remettez la fine couche.', warmNight: 'les mêmes vêtements légers ; aucune couche en plus n\'est nécessaire.', same: 'les mêmes vêtements conviennent, la température change à peine.' },
    year: {
      normal: ({ monthN, coldY, warmY, cold, warm }) => <>Une année froide comme {coldY}, les maximales {de(monthN)} n&apos;ont atteint en moyenne que {cold} : une couche chaude de plus est donc utile. Une année chaude comme {warmY}, elles ont atteint {warm}, et une couche plus légère suffit.</>,
      winter: ({ monthN, coldY, warmY, cold, warm }) => <>Une année froide comme {coldY}, les maximales {de(monthN)} n&apos;ont atteint en moyenne que {cold} : une couche chaude de plus est donc utile. Même une année douce comme {warmY}, elles n&apos;ont atteint que {warm} : le manteau d&apos;hiver reste indispensable.</>,
      cooler: ({ monthN, coldY, warmY, cold, warm }) => <>Une année plus fraîche comme {coldY}, les maximales {de(monthN)} ont atteint en moyenne {cold} : une fine couche de plus est donc utile. Une année plus chaude comme {warmY}, elles ont atteint {warm} : restez léger.</>,
      hot: ({ monthN, coldY, warmY, cold, warm, y1, y2 }) => <>Même le mois {de(monthN)} le plus frais de {y1}–{y2}, en {coldY}, affichait en moyenne {cold}, et le plus chaud, en {warmY}, {warm}. Dans tous les cas, rien de plus chaud à prévoir.</>,
    },
    wet: {
      none: 'Aucun jour humide à prévoir dans une semaine typique : laissez le matériel de pluie à la maison.',
      some: ({ n, wintry, size, per }) => {
        const tail = !per ? '' : wintry ? <>, sous forme de pluie ou de neige, avec {per} par jour</> : size === 'light' ? <>, surtout une pluie légère, avec {per} par jour</> : size === 'heavy' ? <>, souvent forte, avec {per} par jour</> : <>, avec {per} par jour</>;
        return <>Comptez environ {n} {n < 2 ? 'jour humide' : 'jours humides'} par semaine{tail}.</>;
      },
    },
    items: { coat: "Un manteau d'hiver", coatWet: "Un manteau d'hiver avec une couche extérieure imperméable", midThermal: '2 couches intermédiaires chaudes et une sous-couche thermique', glovesHat: 'Des gants et un bonnet', jacketHat: 'Une veste chaude et un bonnet', mid2: '2 couches intermédiaires chaudes', lightJacket: 'Une veste légère ou un pull', lightLayers: '2 ou 3 couches légères', lightClothes: 'Des vêtements légers et respirants', thinLayer: 'Une fine couche pour le matin et le soir', looseClothes: 'Des vêtements amples et respirants', rainJacket: 'Une veste de pluie compacte', sunKit: 'Un chapeau, de la crème solaire et des lunettes de soleil', shades: 'Des lunettes de soleil et un chapeau léger', bottle: "Une gourde d'eau", boots: 'Des bottes chaudes qui adhèrent bien', wpShoes: 'Des chaussures imperméables qui sèchent vite', lightShoes: 'Des chaussures légères et respirantes', walkShoes: 'Des chaussures de marche confortables' },
    trip: { lead: 'Vous voyagez à des dates précises ?', link: 'Vérifiez vos dates exactes dans le planificateur de voyage.' },
  },
  hist: {
    title: ({ monthN, cityN, n }) => `${cap(monthN)} ${aC(cityN)} : ce que montrent ${n} ans de données`,
    basis: ({ y1, y2 }) => `D'après les moyennes mensuelles ${y1}–${y2}, pas des records quotidiens.`,
    h3: { range: 'Fourchette habituelle', records: 'Records', odds: 'Fréquence selon les années' },
    to: 'à',
    range: ({ monthN, temps, rainLo, rainHi, wintry }) => <>La plupart des années, {monthN} affiche en moyenne {temps} l&apos;après-midi, avec {rainLo}–{rainHi} mm de {wintry ? 'pluie ou de neige' : 'pluie'}.</>,
    chance: ({ monthN, often, wintry, never }) => (never ? `Il ne pleut presque jamais pendant un mois ${de(monthN)} moyen.` : `Pendant un mois ${de(monthN)} moyen, ${wintry ? 'il pleut ou il neige' : 'il pleut'} ${often}.`),
    caption: ({ monthN, y1, y2 }) => `Records ${de(monthN)}, ${y1}–${y2} (moyennes mensuelles)`,
    th: { record: 'Record', year: 'Année', high: 'Max. moyenne', rain: 'Pluie', days: 'Jours de pluie' },
    record: {
      warm: ({ monthN }) => `${cap(monthN)} le plus chaud`, cold: ({ monthN }) => `${cap(monthN)} le plus froid`, cool: ({ monthN }) => `${cap(monthN)} le plus frais`,
      wet: ({ monthN }) => `${cap(monthN)} le plus pluvieux`, dry: ({ monthN }) => `${cap(monthN)} le plus sec`,
    },
    ties: ({ count, n }) => `${count} années sur ${n}`,
    odds: {
      rainy: ({ monthN, count, n, t, wintry }) => `${count} années sur ${n}, ${monthN} a compté ${t} jours ${wintry ? 'humides' : 'de pluie'} ou plus.`,
      anyrain: ({ monthN, count, n, wintry }) => `${count} années sur ${n}, ${monthN} a compté au moins un jour ${wintry ? 'humide' : 'de pluie'}.`,
      dry: ({ count, n, t, wintry }) => `${count} années sur ${n}, il est tombé moins de ${t} mm de ${wintry ? 'pluie ou de neige' : 'pluie'}.`,
      warm: ({ count, n, temp }) => <>{count} années sur {n}, la maximale moyenne a atteint {temp} ou plus.</>,
      cool: ({ count, n, temp }) => <>{count} années sur {n}, elle est restée sous {temp}.</>,
    },
    latest: ({ monthN, year, dir, rank, total, y1, high, mm, days, wintry }) => <>Sur les {total} années depuis {y1}, {monthN} {year} se classe {rank}<sup>e</sup> parmi les plus {dir === 'warm' ? 'chauds' : 'froids'} ({high}{mm ? `, ${mm}` : ''}{days != null ? `, ${days} ${days < 2 ? 'jour' : 'jours'} ${wintry ? (days < 2 ? 'humide' : 'humides') : 'de pluie'}` : ''}).</>,
    broke: {
      warm: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} a été plus chaud que tous les mois {de(monthN)} de {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} a égalé le mois {de(monthN)} le plus chaud de {y1}–{y2} ({value}).</> },
      cold: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} a été plus froid que tous les mois {de(monthN)} de {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} a égalé le mois {de(monthN)} le plus froid de {y1}–{y2} ({value}).</> },
      wet: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} a été plus pluvieux que tous les mois {de(monthN)} de {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} a égalé le mois {de(monthN)} le plus pluvieux de {y1}–{y2} ({value}).</> },
      dry: { beat: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} a été plus sec que tous les mois {de(monthN)} de {y1}–{y2} ({value}).</>, match: ({ monthN, year, y1, y2, value }) => <>{cap(monthN)} {year} a égalé le mois {de(monthN)} le plus sec de {y1}–{y2} ({value}).</> },
    },
  },
  q1: ({ monthN, inCity }) => `Quelle température fait-il ${inCity} ${enM(monthN)} ?`,
  q2: ({ monthN, inCity }) => `Pleut-il beaucoup ${inCity} ${enM(monthN)} ?`,
  q3: ({ monthN, cityN }) => `Que mettre dans sa valise pour ${cityN} ${enM(monthN)} ?`,
  q4: ({ monthN, nextN, cityN }) => `Vaut-il mieux visiter ${cityN} ${enM(monthN)} ou ${enM(nextN)} ?`,
  nextWhy: ({ nextN, why }) => {
    const parts = why.map((w) => ({ warmer: 'est plus chaud', cooler: 'est plus frais', fewerRain: 'compte moins de jours de pluie', moreRain: 'compte plus de jours de pluie' }[w]));
    return `${cap(nextN)} ${parts.join(' et ')}.`;
  },
};

const fr = {
  lang: 'fr',
  story: makeStory(P),
  locale: h.loc,
  place: (cityN, countryN) => (cityN === countryN ? cityN : `${cityN}, ${countryN}`),
  list: h.list,
  month: h.month,
  monthShort: h.monthShort,
  verdict: P.verdict,
  reasons: (v) => v.reasons.map(reasonText).filter(Boolean).join(', '),
  suitLabel: (s) => SUIT[s.key] || s.label,
  suitStatus: (s) => (s.key === 'indoor' ? 'un bon choix' : s.ok ? 'adapté' : 'moins adapté'),
  packTitle: P.packTitle,

  cityMeta: ({ cityN, city, x, best }) => {
    const inC = inCity('fr', city);
    return {
      title: fit(60, `Météo ${cityN} par mois : climat et quand partir`, `Météo ${cityN} : climat et quand partir`, `Météo ${cityN} par mois`),
      imageTitle: `Météo ${cityN} mois par mois`,
      description: fit(160,
        `Météo ${inC} mois par mois : le plus chaud est ${h.month(x.warmest?.month.num)}, le plus pluvieux ${h.month(x.wettest?.month.num)}. Quand partir : ${h.list(best)}. Moyennes sur 20 ans.`,
        `Météo ${inC} mois par mois. Quand partir : ${h.list(best)}. Moyennes sur 20 ans.`,
        `Météo ${cityN} mois par mois et meilleure période pour partir.`),
    };
  },
  cityDataset: ({ cityN, place, years }) => ({
    name: `Météo ${cityN} mois par mois : moyennes climatiques ${years.start}–${years.end}`,
    description: `Moyennes climatiques mensuelles pour ${place} : température maximale et minimale moyenne, précipitations totales, jours de pluie, heures d'ensoleillement par jour et humidité pour chaque mois, calculées sur ${years.start}–${years.end} à partir de données météo historiques.`,
  }),
  variables: ['Température maximale moyenne', 'Température minimale moyenne', 'Précipitations totales', 'Jours de pluie', 'Heures d\'ensoleillement', 'Humidité relative'],
  skylineAlt: (place) => `Panorama urbain de ${place}`,
  cityH1: (cityN) => `Météo ${cityN} mois par mois`,
  citySub: (place, years) => <>Douze mois de météo {aC(place)} : moyennes {years.start}–{years.end}.</>,
  CityIntro: ({ x, inCity: inC }) => (
    <>
      {x.warmest && <>{cap(inC)}, le mois le plus chaud est <S>{h.month(x.warmest.month.num)}</S> (maximale moyenne <UnitTemp c={x.warmest.row.avg_high} />)</>}
      {x.coolest && <> et le plus frais est <S>{h.month(x.coolest.month.num)}</S> (<UnitTemp c={x.coolest.row.avg_high} />)</>}.
      {x.wettest && <> La pluie est la plus abondante en <S>{h.month(x.wettest.month.num)}</S> (environ {h.n0(x.wettest.row.avg_rainfall)} mm)</>}
      {x.driest && <>, tandis que <S>{h.month(x.driest.month.num)}</S> est le mois le plus sec (environ {h.n0(x.driest.row.avg_rainfall)} mm)</>}.
      {x.sunniest && <> <S>{cap(h.month(x.sunniest.month.num))}</S> est le plus ensoleillé, avec environ {h.n1(x.sunniest.row.sunshine_hours)} heures de soleil par jour.</>}
    </>
  ),
  bestTitle: (cityN) => `Quand partir ${aC(cityN)} : les meilleurs mois`,
  bestNote: () => 'Classement au sein de l\'année de la ville selon des températures agréables, les jours de pluie et le soleil : moyennes historiques, pas une prévision.',
  monthByMonth: (cityN) => `${cityN} mois par mois`,
  high: 'Max',
  low: 'Min',
  srRainfall: 'Précipitations',
  srRainy: 'Jours de pluie',
  srSun: 'Soleil',
  rainMmIn: (mm) => `${h.n0(mm)} mm`,
  rainyDaysN: (n) => `${h.n1(n)} ${n < 2 ? 'jour' : 'jours'} de pluie`,
  sunPerDay: (v) => `${h.n1(v)} h de soleil / jour`,
  guideTitle: (cityN) => `Climat et météo ${aC(cityN)}`,
  guideSub: (years) => <>Températures, précipitations et soleil au fil de l'année : moyennes {years.start}–{years.end}.</>,
  tiles: { hottest: 'Max. moyenne du mois le plus chaud', coolest: 'Max. moyenne du mois le plus frais', wettest: 'Moyenne du mois le plus pluvieux', driest: 'Moyenne du mois le plus sec' },
  tempByMonth: 'Températures mois par mois',
  rainByMonth: 'Précipitations mois par mois',
  sunHours: 'Heures d\'ensoleillement',
  chartTemp: (cityN) => `${cityN} : température maximale et minimale moyenne par mois`,
  chartRain: (cityN) => `${cityN} : précipitations moyennes par mois`,
  chartSun: (cityN) => `${cityN} : heures d'ensoleillement quotidiennes moyennes par mois`,
  monthlyAverages: 'Moyennes mensuelles',
  whatToPack: 'Que mettre dans sa valise',
  packIntro: (cityN) => <>Conseils de valise d'après le climat {de(cityN)}.</>,
  cityPacking: {
    layers: { title: 'Superposer les couches', text: 'Des couches légères adaptées aux après-midi doux comme aux soirées plus fraîches.' },
    rain: { title: 'Protection contre la pluie', text: 'Un parapluie compact et une veste de pluie légère pour les mois les plus humides.' },
    sun: { title: 'Protection solaire', text: 'Crème solaire, chapeau à larges bords et lunettes de soleil pour les journées chaudes et ensoleillées.' },
    warm: { title: 'Vêtements chauds', text: 'Une veste chaude ou une polaire pour les matins et les soirées frais.' },
  },
  moreCities: (countryN, country) => `Autres villes ${inCountry('fr', country)} mois par mois`,
  weatherByMonth: 'Météo mois par mois',
  ctaCityTitle: (cityN) => `Vous préparez un voyage ${aC(cityN)} ?`,
  ctaCityText: 'Obtenez un plan météo jour par jour pour les dates exactes de votre voyage.',
  ctaCityButton: 'Utiliser le planificateur de voyage',
  cityDataNote: (years) => <>Basé sur {years.end - years.start + 1} ans de données météo historiques ({years.start}–{years.end}) d'Open-Meteo. Moyennes mensuelles, pas une prévision.</>,

  monthMeta: ({ cityN, countryN, monthN, row, verdict, city }) => {
    const t = (c) => (c == null ? '—' : `${h.n1(Math.round(c * 10) / 10)} °C`);
    const inC = inCity('fr', city);
    const base = `Météo ${inC} ${enM(monthN)} : maximales de ${t(row?.avg_high)}, minimales de ${t(row?.avg_low)}, ${h.n1(row?.rainy_days)} ${row?.rainy_days < 2 ? 'jour' : 'jours'} de pluie et ${h.n1(row?.sunshine_hours)} h de soleil par jour.`;
    return {
      title: fit(60, `Météo ${cityN} ${monthN} : températures, pluie et conseils`, `Météo ${cityN} ${monthN} : températures et pluie`, `Météo ${cityN} ${monthN}`),
      imageTitle: `Météo ${cityN} ${enM(monthN)}`,
      kicker: countryN,
      description: fit(160, `${base} Verdict : ${verdict ? VERDICT[verdict.label] : '—'}.`, base, `Météo ${cityN} ${enM(monthN)} : températures, jours de pluie et soleil.`),
    };
  },
  monthDataset: ({ cityN, place, monthN, years }) => ({
    name: `Météo ${cityN} ${enM(monthN)} : moyennes climatiques ${years.start}–${years.end}`,
    description: `Moyennes climatiques mensuelles pour ${place} ${enM(monthN)} : température maximale et minimale moyenne, précipitations totales, jours de pluie, heures d'ensoleillement par jour et humidité, calculées sur ${years.start}–${years.end} à partir de données météo historiques.`,
  }),
  monthH1: (cityN, monthN) => `Météo ${cityN} ${enM(monthN)}`,
  stat: { avgHigh: 'Max. moyenne', avgLow: 'Min. moyenne', rainfall: 'Précipitations', rainyDays: 'Jours de pluie', sunshine: 'Soleil', humidity: 'Humidité' },
  statDays: (n) => `${h.n1(n)} ${n < 2 ? 'jour' : 'jours'}`,
  statSun: (v) => `${h.n1(v)} h / jour`,
  Latest: ({ monthN, latest, row, years }) => (
    <>
      <span className="font-semibold text-gray-700">Dernière valeur réelle – {monthN} {latest.year} :</span>{' '}
      maximale <UnitTemp c={latest.avg_high} />, minimale <UnitTemp c={latest.avg_low} />
      {latest.avg_rainfall != null && <>, {h.n0(latest.avg_rainfall)} mm de pluie</>}
      {latest.rainy_days != null && <> sur {h.n1(latest.rainy_days)} {latest.rainy_days < 2 ? 'jour' : 'jours'}</>}
      {' '}(la moyenne {years.start}–{years.end} ci-dessus est {latest.avg_high != null && row?.avg_high != null
        ? (latest.avg_high > row.avg_high + 0.4 ? 'plus fraîche' : latest.avg_high < row.avg_high - 0.4 ? 'plus chaude' : 'à peu près identique')
        : 'donnée pour comparaison'}).
    </>
  ),
  vsYearTitle: (monthN) => `${cap(monthN)} par rapport au reste de l'année`,
  tableFallback: (monthN, cityN) => <>{cap(monthN)} comparé à tous les autres mois {de(cityN)}.</>,
  th: { month: 'Mois', avgHigh: 'Max. moyenne', vs: (monthN) => `vs ${monthN}`, rain: 'Pluie', rainyDays: 'Jours de pluie' },
  rainMm: (mm) => `${h.n0(mm)} mm`,
  chipsLabel: (cityN) => `Météo ${cityN} mois par mois`,
  chipAria: (cityN, mN) => `Météo ${cityN} ${enM(mN)}`,
  feelTitle: (monthN, cityN) => `À quoi ressemble ${monthN} ${aC(cityN)}`,
  rainTitle: (cityN, monthN) => `Pluie ${aC(cityN)} ${enM(monthN)}`,
  daylightTitle: (monthN) => `Durée du jour et soleil ${enM(monthN)}`,
  compareTitle: (monthN) => `${cap(monthN)} comparé au reste de l'année`,
  suitsTitle: (monthN) => `Pour qui ${monthN} est-il idéal ?`,
  tipsTitle: (cityN, monthN) => `Conseils pour visiter ${cityN} ${enM(monthN)}`,
  questionsTitle: 'Questions rapides',
  verdictTitle: (monthN, cityN) => `Faut-il partir ${aC(cityN)} ${enM(monthN)} ?`,
  VerdictText: ({ verdict, relRank, cityN, monthN, reasons }) => (
    <>
      <strong>{VERDICT[verdict.label]}</strong> – {reasons}.
      {relRank && (
        <> Sur l'année {de(cityN)}, {monthN} se classe <strong>{relRank}<sup>e</sup> sur 12</strong>
          {relRank <= 3 ? <> : l'un des 3 meilleurs mois pour partir.</> : relRank >= 10 ? <> : l'un des mois les moins agréables.</> : '.'}</>
      )}
    </>
  ),
  notesTitle: (cityN, monthN) => `Notes de voyage : ${cityN} ${enM(monthN)}`,
  othersTitle: (monthN, countryN, country) => `${cap(monthN)} dans d'autres villes ${inCountry('fr', country)}`,
  OtherHigh: ({ row }) => <>Max <UnitTempShort c={row.avg_high} /> · {h.n0(row.avg_rainfall ?? 0)} mm</>,
  otherGuide: (monthN) => `Guide ${de(monthN)}`,
  elsewhereTitle: (kind, monthN) => `Destinations ${kind === 'both' ? 'plus chaudes ou plus sèches' : kind === 'warmer' ? 'plus chaudes' : 'plus sèches'} ${enM(monthN)}`,
  ElsewhereHigh: ({ row }) => <>Max <UnitTempShort c={row.avg_high} /></>,
  elsewhereRainy: (n) => `${n == null ? '—' : h.n1(n)} jours de pluie`,
  warmer: 'Plus chaud',
  drier: 'Plus sec',
  ctaMonthTitle: (cityN) => `Préparez un voyage ${aC(cityN)}`,
  ctaMonthText: 'Obtenez un score météo jour par jour pour les dates exactes de votre voyage.',
  ctaMonthButton: 'Ouvrir le planificateur de voyage',
  MonthDataNote: ({ years, cityHref, cityN }) => (
    <>
      Moyennes mensuelles sur {years.end - years.start + 1} ans de données Open-Meteo ({years.start}–{years.end}), pas une prévision : les 12 mois dans{' '}
      <Link href={cityHref} className="text-[#0077b6] font-semibold hover:underline">Météo {cityN} mois par mois</Link>.
    </>
  ),

  countryMeta: ({ countryN, country, n }) => {
    const inK = inCountry('fr', country);
    return {
      absoluteTitle: fit(60, `Quand partir ${inK} ? Météo et climat mois par mois`, `Quand partir ${inK} ? Météo par mois`, `Quand partir ${inK} ?`),
      description: fit(160,
        `Quand partir ${inK} ? Climat mois par mois dans ${n} villes : températures, pluie et meilleure période, d'après 20 ans de données météo.`,
        `Quand partir ${inK} ? Climat mois par mois dans ${n} villes.`),
      kicker: 'Météo par mois et par ville',
    };
  },
  countryH1: (countryN, country) => <>Quand partir {inCountry('fr', country)} : météo par ville et par mois</>,
  countrySub: (n, countryN, country) => <>Moyennes mois par mois pour {n} {n === 1 ? 'ville' : 'villes'} {inCountry('fr', country)}, d'après 20 ans de données météo historiques.</>,
  climateAcross: (countryN, country) => `Le climat ${inCountry('fr', country)}`,
  CountryIntro: ({ single, warmest, coolest, wettest, loaded }) => (
    <>
      {single && (
        <><strong className="text-gray-800">{single.name}</strong> affiche une maximale diurne moyenne de <UnitTemp c={single.v} /> sur l'année</>
      )}
      {warmest && (
        <>Parmi les villes ci-dessous, <strong className="text-gray-800">{warmest.name}</strong> est la plus chaude, avec une maximale diurne moyenne de <UnitTemp c={warmest.v} /> sur l'année</>
      )}
      {coolest && (
        <>, tandis que <strong className="text-gray-800">{coolest.name}</strong> est la plus fraîche avec <UnitTemp c={coolest.v} /></>
      )}
      .{wettest && <> {loaded.length > 1 ? 'Dans ces villes' : `À ${loaded[0].name}`}, le mois le plus pluvieux est généralement <strong className="text-gray-800">{wettest.name}</strong> (environ {h.n0(wettest.v)} mm en moyenne).</>}
    </>
  ),
  preparing: 'Nous préparons les données climatiques de ces villes.',
  citiesByMonth: (countryN, country) => `Les villes ${inCountry('fr', country)} mois par mois`,
  avgHighByMonth: 'Température maximale moyenne mois par mois',
  tapValue: 'Touchez une valeur pour ouvrir le guide mensuel de la ville.',
  cityTh: 'Ville',
  cellAria: (cityN, mN) => `${cityN} ${enM(mN)}`,
  bestMonthsTitle: (countryN, country) => `Meilleure période pour partir ${inCountry('fr', country)}`,
  BestMonthsText: ({ across, best, worst }) => (
    <>
      Selon des températures agréables, les jours de pluie et le soleil {across ? `à ${across}` : 'dans ces villes'}, les mois les plus agréables sont généralement{' '}
      <strong className="text-gray-800">{best}</strong>
      {worst && <> ; le moins agréable est généralement <strong className="text-gray-800">{worst}</strong></>}.
      Ce sont des moyennes historiques, pas une prévision.
    </>
  ),
};

export default fr;
