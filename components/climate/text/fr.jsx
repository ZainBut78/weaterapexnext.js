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
    'rain-most': `pluie presque tous les jours (environ ${n})`, 'rain-frequent': `pluie fréquente (environ ${n} jours de pluie)`,
    'rain-some': `quelques jours de pluie (environ ${n})`, dry: `plutôt sec (environ ${n} jours de pluie)`,
    heavy: `fortes pluies (${n} mm)`, dull: `peu de soleil (${n} h par jour)`, sunny: `beaucoup de soleil (${n} h par jour)`,
  }[r.key || r.t] || '';
};
const SUIT = { sightseeing: 'Visites en ville', parks: 'Parcs et plein air', beach: 'Plage', hiking: 'Randonnée', indoor: 'Musées et activités en intérieur' };
const PACK = { layers: 'Superposer les couches', rain: 'Protection contre la pluie', sun: 'Protection solaire', jacket: 'Veste légère', warm: 'Vêtements chauds', shades: 'Lunettes de soleil', light: 'Vêtements légers' };

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

  hero: ({ monthN, place, y }) => [
    `À quoi ressemble ${monthN} ${aC(place)} : moyennes ${y}.`,
    `La météo typique ${de(monthN)} ${aC(place)}, d'après les moyennes climatiques ${y}.`,
    `${place} ${enM(monthN)} : comment se passe le mois en général, selon les moyennes ${y}.`,
  ],
  quick: ({ monthN, inCity, cityN, hi, lo, days, mm, sun }) => [
    <>{cap(enM(monthN))}, {inCity} connaît en moyenne des maximales de {hi} et des minimales de {lo}, avec environ {days} ({mm} de pluie) et {sun} par jour.</>,
    <>Une journée typique {de(monthN)} {inCity} monte à {hi} et descend à {lo} la nuit ; on compte environ {days} ({mm} au total) et {sun} par jour.</>,
    <>{cityN} {enM(monthN)} : maximales autour de {hi}, minimales autour de {lo}, environ {days} pour un total de {mm}, et {sun} par jour en moyenne.</>,
  ],
  tableExtreme: ({ monthN, inCity, warmest, rainTxt }) => [
    <>{cap(monthN)} est <strong>le mois le plus {warmest ? 'chaud' : 'frais'}</strong> {inCity}{rainTxt && <> ; côté pluie, c'est {rainTxt}</>}.</>,
    <>Aucun mois n'est plus {warmest ? 'chaud' : 'frais'} {que(monthN)} {inCity}{rainTxt && <> ; côté pluie, c'est {rainTxt}</>}.</>,
  ],
  tableNormal: ({ monthN, inCity, warmer, k, rainTxt }) => [
    <>{cap(monthN)} est plus chaud que <strong>{warmer} des 11 autres mois</strong>{rainTxt && <>, et côté pluie c'est {rainTxt} {inCity}</>}.</>,
    <>{k <= 3 ? `Seuls ${k} mois sont` : `${k} des 11 autres mois sont`} plus chauds {que(monthN)} {inCity}{rainTxt && <> ; côté pluie, c'est {rainTxt}</>}.</>,
    <>Voici comment chaque mois se situe par rapport à {monthN} {inCity}{rainTxt && <> : côté pluie, {monthN} est {rainTxt}</>}.</>,
  ],
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
  feel: {
    freezing: ['En journée, le thermomètre dépasse à peine zéro : même à midi, on se croirait en plein hiver.', 'Même au moment le plus chaud de la journée, on reste proche de zéro.'],
    cold: ['Les journées restent froides et un gros manteau s\'impose même en milieu de journée.', 'Il fait à peine plus doux à midi : manteau et écharpe du matin au soir.'],
    chilly: ['Les journées sont fraîches plutôt que glaciales, et avec une bonne veste on se promène sans problème.', 'L\'air est vif en journée, mais rarement mordant.'],
    cool: ['Les après-midi sont frais et agréables pour marcher, avec une couche en plus.', 'En journée, l\'air paraît frais plutôt que froid.', 'Des journées plutôt fraîches, idéales pour visiter d\'un bon pas.'],
    mild: ['Les après-midi sont doux et agréables pour la plupart des gens en tenue légère.', 'Les températures de la journée sont douces : ni froid ni chaud pour se promener.', 'Les après-midi doux invitent à passer de longues heures dehors.'],
    warm: ['Les journées sont assez chaudes pour les manches courtes, et rester dehors est facile.', 'Les après-midi sont chauds et agréables, parfaits pour de longues journées de visite.'],
    hot: ['Les après-midi sont très chauds : les visites se font mieux le matin ou en soirée.', 'Les heures centrales sont très chaudes ; pour les longues balades, l\'ombre et l\'eau comptent.'],
    'very-hot': ['La chaleur de midi est intense et la plupart des gens cherchent l\'ombre ou la climatisation l\'après-midi.', 'Les après-midi sont caniculaires : les sorties réussissent mieux tôt le matin ou après le coucher du soleil.'],
  },
  nightTxt: {
    'hard-frost': 'les nuits descendent bien sous zéro', frosty: 'les nuits tournent autour de zéro et les gelées sont fréquentes',
    cold: 'les nuits sont froides', cool: 'les nuits sont fraîches', mild: 'les nuits restent douces', warm: 'les nuits restent chaudes', sultry: 'les nuits sont étouffantes',
  },
  night: {
    sultry: () => ['Les nuits apportent peu de répit : même l\'heure la plus fraîche reste très chaude.', 'Même après le coucher du soleil, il fait chaud et lourd.'],
    small: ({ nightTxt }) => [`L'écart entre le jour et la nuit est faible : ${nightTxt}, et les soirées ressemblent presque à l'après-midi.`, `Peu de changement après le coucher du soleil : ${nightTxt}, à peine en dessous des valeurs de la journée.`],
    moderate: ({ nightTxt }) => [`Après le coucher du soleil, la température baisse nettement : ${nightTxt}.`, `Les soirées apportent une baisse sensible, et ${nightTxt}.`],
    big: ({ nightTxt, delta }) => [
      <>L'écart entre le jour et la nuit est important (environ {delta}) : {nightTxt}, donc le matin et le soir sont très différents de midi.</>,
      <>Après le coucher du soleil, la température chute d'environ {delta}, et {nightTxt}.</>,
    ],
  },
  humidity: {
    veryHumidHot: ['L\'air est moite, si bien que la chaleur paraît plus forte que ce qu\'indique le thermomètre.', 'L\'humidité élevée rend la chaleur lourde et collante, surtout les après-midi sans vent.'],
    dampCold: ['L\'air humide rend le froid plus pénétrant que ne le disent les chiffres.', 'L\'humidité donne au froid un côté mordant, surtout avec le vent.'],
    humidHot: ['L\'air est un peu humide, ce qui se sent quand le soleil tape.', 'L\'air est légèrement humide, et cela se ressent aux heures chaudes.'],
    humidMild: ['L\'air est assez humide, mais à ces températures il est rarement étouffant.', 'L\'humidité est élevée, mais les températures douces la rendent supportable.'],
    dryHot: ['L\'air sec fait sécher la transpiration très vite : on transpire moins, mais on se déshydrate rapidement.', 'La chaleur est sèche plutôt que moite : buvez plus que vous ne le pensez.'],
    dry: ['L\'air est sec, et la peau et les lèvres le ressentent souvent plus que la température.'],
    comfortable: ['L\'humidité est modérée : l\'air n\'est ni collant ni sec.', 'L\'air est agréable, ni moite ni sec.'],
  },
  rainFreq: {
    dry: ({ monthN, inCity, often, never }) => [`${cap(enM(monthN))}, la pluie est rare : la plupart des semaines passent sans jour de pluie.`, never ? `${cap(monthN)} est un mois sec ${inCity} ; il ne pleut presque jamais.` : `${cap(monthN)} est un mois sec ${inCity} ; il pleut ${often}.`, 'Le temps sec domine et le parapluie peut rester dans la valise.'],
    occasional: ({ often }) => [`La pluie tombe de temps en temps, ${often}.`, `Les jours de pluie sont occasionnels plutôt que réguliers : ${often}.`, `La plupart des jours restent secs ; il pleut ${often}.`],
    showery: ({ often }) => [`Les averses sont fréquentes et tombent ${often}.`, `C'est un mois changeant : il pleut ${often}, avec des pauses sèches entre les deux.`],
    wet: ({ monthN, often }) => [`Ce mois-ci, la pluie fait partie du quotidien et tombe ${often}.`, `Ici, ${monthN} est régulièrement pluvieux : il pleut ${often}.`, `Les jours secs sont l'exception : il pleut ${often}.`],
  },
  rainSize: {
    light: ({ per }) => [`La plupart des jours de pluie n'apportent qu'une pluie légère, ${per} lors d'un jour de pluie typique : bruine ou courtes averses qui gâchent rarement les projets.`, `Quand il pleut, c'est généralement peu : ${per} par jour de pluie, plus de la bruine qu'une averse.`],
    moderate: ({ per }) => [`Un jour de pluie apporte en moyenne ${per} : une pluie continue plutôt qu'une averse passagère.`, `Les jours de pluie apportent en moyenne ${per}, assez pour être mouillé sans parapluie.`],
    heavy: ({ per }) => [`La pluie tombe souvent en fortes averses : ${per} lors d'un jour de pluie moyen.`, `Les jours de pluie sont intenses, avec en moyenne ${per} : des averses plutôt que de la bruine.`],
  },
  rainVs: {
    heavier: ({ cityN, year }) => `C'est plus que la moyenne annuelle ${de(cityN)}, environ ${year} mm par jour de pluie.`,
    lighter: ({ year }) => `C'est moins que la moyenne annuelle de la ville, environ ${year} mm par jour de pluie.`,
    typical: ({ cityN, monthN, year }) => [`C'est conforme à la moyenne annuelle ${de(cityN)} (environ ${year} mm par jour de pluie).`, `Sur l'année, ${cityN} reçoit environ ${year} mm par jour de pluie : ${monthN} est donc dans la norme.`],
  },
  rainRank1: ({ monthN, inCity, kind }) => `${cap(monthN)} est le mois le plus ${KIND[kind]} de l'année ${inCity}.`,
  rainRankTop3: ({ kind }) => `C'est l'un des trois mois les plus ${kind === 'wettest' ? 'pluvieux' : 'secs'} de l'année.`,
  polar: {
    day: ({ monthN, inCity }) => `À la mi-${monthN}, le soleil ne se couche pas ${inCity}.`,
    night: ({ monthN, inCity }) => `À la mi-${monthN}, le soleil ne se lève pas au-dessus de l'horizon ${inCity}.`,
  },
  dayMain: ({ monthN, cityN, rise, set, len }) => [
    `Le 15 ${monthN}, le soleil se lève vers ${rise} et se couche vers ${set} (heure locale) : ${len} de jour.`,
    `À la mi-${monthN}, le lever du soleil a lieu vers ${rise} et le coucher vers ${set} (heure locale) : ${len} de jour.`,
    `En milieu de mois, ${cityN} profite de ${len} de jour, du lever vers ${rise} au coucher vers ${set}.`,
  ],
  dayChange: {
    same: ({ pm }) => `La durée du jour est pratiquement la même qu'à la mi-${pm}.`,
    barely: ({ pm, amt, longer }) => `La durée du jour change peu par rapport à la mi-${pm} (${amt} de ${longer ? 'plus' : 'moins'}).`,
    shorter: ({ pm, amt }) => [`Les jours raccourcissent : ${amt} de jour en moins qu'à la mi-${pm}.`, `Par rapport à la mi-${pm}, la journée a perdu ${amt}.`],
    longer: ({ pm, amt }) => [`Les jours rallongent : ${amt} de jour en plus qu'à la mi-${pm}.`, `Depuis la mi-${pm}, la journée a gagné ${amt}.`],
  },
  sky: { cloudy: 'le ciel est souvent couvert', mixed: 'soleil et nuages alternent', bright: 'les éclaircies sont nombreuses', clear: 'le ciel est surtout dégagé' },
  sunShare: ({ share, sky }) => [`Le soleil brille pendant environ ${share} % de ces heures de jour : ${sky}.`, `Environ ${share} % des heures de jour sont ensoleillées ; en bref, ${sky}.`],
  equatorDay: 'Près de l\'équateur, les heures de lever et de coucher du soleil varient très peu au fil de l\'année.',
  cmpFirst: ({ monthN, inCity, rankTxt }) => [`${cap(monthN)} est ${rankTxt} de l'année ${inCity}.`, `D'après la température maximale moyenne, ${monthN} est ${rankTxt} ${inCity}.`],
  cmpRain: (rain) => (rain === 0 ? ', avec à peu près autant de pluie' : `, avec ${h.n0(Math.abs(rain))} mm de pluie en ${rain > 0 ? 'plus' : 'moins'}`),
  cmpSame: ({ prevN, rainTxt }) => <>Il fait à peu près aussi chaud qu'en {prevN}{rainTxt}.</>,
  cmpPrev: ({ prevN, delta, warmer, rainTxt }) => [
    <>Par rapport à {prevN}, les après-midi sont plus {warmer ? 'chauds' : 'frais'} de {delta}{rainTxt}.</>,
    <>Par rapport à {prevN}, la maximale moyenne est {warmer ? 'supérieure' : 'inférieure'} de {delta}{rainTxt}.</>,
  ],
  trend: {
    peak: ({ nextN }) => [`À partir d'ici, l'année change de direction : ${nextN} est déjà plus frais.`, `Dès maintenant, les températures commencent à baisser, à commencer par ${nextN}.`],
    trough: ({ nextN }) => [`C'est le point le plus bas, et ${enM(nextN)} le réchauffement commence.`, `À partir d'ici, il ne fait que se réchauffer, à commencer par ${nextN}.`],
    warming: ({ nextN }) => [`Le réchauffement se poursuit ${enM(nextN)}.`, `La hausse des températures continue ${enM(nextN)}.`],
    cooling: ({ nextN }) => [`Les températures continuent de baisser ${enM(nextN)}.`, `Le rafraîchissement se poursuit ${enM(nextN)}.`],
    flat: () => 'Ici, les températures changent très peu d\'un mois à l\'autre.',
  },
  nextHi: ({ nextN, temp }) => [<> {cap(enM(nextN))}, la maximale moyenne est de {temp}.</>, <> {cap(nextN)} affiche en moyenne des maximales de {temp}.</>],
  suitWhy: {
    sightseeing: { ok: ['les températures de la journée se prêtent à la marche', 'assez agréable pour explorer à pied toute la journée'], rain: ['il pleut plus d\'un jour sur deux'], hot: ['la chaleur de midi rend les longues marches fatigantes'], cold: ['il fait froid pour de longues balades'] },
    parks: { ok: ['agréable pour de longues promenades et des pique-niques', 'de bonnes conditions pour s\'asseoir dehors'], hot: ['trop chaud l\'après-midi pour rester longtemps dehors'], cold: ['trop frais pour rester assis dehors longtemps'], rain: ['la pluie interrompt les projets en plein air'] },
    beach: { ok: ['chaud et plutôt sec sur la côte'], hot: ['climat côtier très chaud'], cold: ['l\'air marin est trop frais'], rain: ['trop de jours de pluie'] },
    hiking: { ok: ['températures douces pour les sentiers'], cold: ['il fait frais sur les sentiers'], hot: ['trop chaud pour de longues randonnées'], rain: ['sentiers détrempés'] },
    indoor: { rain: ['avec de la pluie presque tous les jours, galeries et musées sont un choix facile'], hot: ['une pause au frais aux heures les plus chaudes'], cold: ['des lieux chauds pour le moment le plus froid de la journée'] },
  },
  tips: {
    layers: ['Les journées sont bien plus chaudes que les nuits : prévoyez des couches faciles à ajouter ou retirer.', 'Le matin et le soir sont plus frais que midi, alors habillez-vous en couches.'],
    rain: ['Un parapluie compact et une veste imperméable légère.', 'Gardez un petit parapluie dans votre sac et des chaussures qui supportent les flaques.'],
    sun: ['Crème solaire, chapeau et lunettes de soleil ; des vêtements légers et respirants.', 'Protégez-vous du soleil fort : chapeau, écran solaire et beaucoup d\'eau.'],
    jacket: ['Journées fraîches : une veste légère ou un pull pour les visites.', 'Une veste légère ou un cardigan suffit pour la majeure partie de la journée.'],
    warm: ['Une veste chaude, un bonnet et des gants pour les matins et soirs froids.', 'Un vrai manteau d\'hiver, avec gants et bonnet pour les sorties matinales.'],
    shades: ['Soleil fréquent : lunettes de soleil et chapeau léger.', 'Journées lumineuses : les lunettes de soleil méritent une place dans la valise.'],
    light: ['Des vêtements confortables et une couche légère pour le soir.', 'Des vêtements de tous les jours et une couche légère pour le soir.'],
  },
  packPhrase: { layers: 'des vêtements à superposer', rain: 'de quoi vous protéger de la pluie', sun: 'une protection solaire', jacket: 'une veste légère', warm: 'des vêtements chauds', shades: 'des lunettes de soleil', light: 'des vêtements légers' },
  eveCool: ['Prévoyez une couche en plus pour les soirées plus fraîches.', 'Ajoutez une couche pour après le coucher du soleil.'],
  eveSame: ['Les soirées ressemblent à la journée : la même tenue convient du matin au soir.', 'Inutile de se changer pour le soir.'],
  q1: ({ monthN, inCity }) => `Quelle température fait-il ${inCity} ${enM(monthN)} ?`,
  a1: ({ hi, lo, feel, warmRank }) => [
    <>L'après-midi, la moyenne est de {hi} et la nuit d'environ {lo} : des journées que la plupart des gens trouvent {feel}.{warmRank && <> C'est {warmRank} de l'année.</>}</>,
    <>Comptez environ {hi} l'après-midi et {lo} la nuit : des journées {feel} pour la plupart des gens.</>,
  ],
  q2: ({ monthN, inCity }) => `Pleut-il beaucoup ${inCity} ${enM(monthN)} ?`,
  a2: {
    never: ({ monthN, none }) => <>Presque jamais : {monthN} est pratiquement sans pluie, avec {none ? 'aucun jour de pluie' : 'environ un jour de pluie'} lors d'une année typique.</>,
    dry: ({ monthN, days, mm }) => [<>Non : {monthN} est l'une des périodes les plus sèches, avec environ {h.n1(days)} jours de pluie et {h.n0(mm)} mm au total.</>, <>Peu : seulement environ {h.n1(days)} jours de pluie et {h.n0(mm)} mm sur tout le mois.</>],
    yes: ({ days, mm, often }) => [<>Oui, assez : il pleut {often} et le total atteint environ {h.n0(mm)} mm, donc le parapluie est utile.</>, <>Oui : environ {h.n1(days)} jours de pluie apportent environ {h.n0(mm)} mm, mieux vaut prévoir quelques activités en intérieur.</>],
    some: ({ days, mm, light }) => [<>Pas particulièrement. On compte environ {h.n1(days)} jours de pluie ({h.n0(mm)} mm), surtout une pluie {light ? 'légère' : 'modérée'}.</>, <>Modérément : environ {h.n1(days)} jours humides et {h.n0(mm)} mm, généralement {light ? 'de courtes averses' : 'une pluie modérée'}.</>],
  },
  q3: ({ monthN, cityN }) => `Que mettre dans sa valise pour ${cityN} ${enM(monthN)} ?`,
  a3: ({ list, eve }) => [<>D'après les moyennes : {list}. {eve}</>, <>Emportez {list}. {eve}</>],
  q4: ({ monthN, nextN, cityN }) => `Vaut-il mieux visiter ${cityN} ${enM(monthN)} ou ${enM(nextN)} ?`,
  nextWhy: ({ nextN, why }) => {
    const parts = why.map((w) => ({ warmer: 'est plus chaud', cooler: 'est plus frais', fewerRain: 'compte moins de jours de pluie', moreRain: 'compte plus de jours de pluie' }[w]));
    return `${cap(nextN)} ${parts.join(' et ')}.`;
  },
  a4: ({ win, ranks, labels, whyTxt, cityN, narrow }) => [
    <>{cap(win)} obtient un meilleur score dans notre classement climatique ({ranks.a}<sup>e</sup> sur 12 contre {ranks.b}<sup>e</sup>){labels ? `, avec l'appréciation « ${labels[0]} » contre « ${labels[1]} »` : ''}.{whyTxt}</>,
    <>{cap(win)}, {narrow ? 'de peu' : 'nettement'} : il est {ranks.a}<sup>e</sup> sur 12 parmi les mois {de(cityN)}, contre {ranks.b}<sup>e</sup> pour l'autre.{whyTxt}</>,
  ],
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
      {latest.rainy_days != null && <> sur {h.n1(latest.rainy_days)} jours</>}
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
