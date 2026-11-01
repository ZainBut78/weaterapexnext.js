// ─────────────────────────────────────────────────────────────
//  Climate pages — 日本語 (i18n Phase 3). Same API as ./en.jsx.
//  Keywords (Semrush): 「{場所} ベストシーズン」「{場所} {月} 気温」
//  Style: です・ます.
// ─────────────────────────────────────────────────────────────
import Link from '@/components/LocaleLink';
import { UnitTemp } from '../UnitText';
import UnitTempShort from '../UnitTempShort';
import { intlHelpers } from './common';
import { makeStory } from './story';

const h = intlHelpers('ja');
const fit = (max, ...opts) => opts.find((o) => o.length <= max) || opts[opts.length - 1];
const S = ({ children }) => <strong className="text-gray-900">{children}</strong>;

const VERDICT = { Great: 'とても良い', Good: '良い', Fair: '普通', Poor: '不向き' };
const KIND = { warmest: '暖かい', coolest: '涼しい', wettest: '雨の多い', driest: '乾燥した' };
const SEASON = {
  winter: { early: '初冬', mid: '真冬', late: '晩冬' },
  spring: { early: '早春', mid: '春本番', late: '晩春' },
  summer: { early: '初夏', mid: '真夏', late: '晩夏' },
  autumn: { early: '初秋', mid: '秋本番', late: '晩秋' },
};
const hm = (mins) => {
  const m = Math.round(Math.abs(mins));
  const H = Math.floor(m / 60);
  const r = m % 60;
  return H ? (r ? `${H}時間${r}分` : `${H}時間`) : `${r}分`;
};
const reasonText = (r) => {
  const n = h.n1(r.n);
  return {
    cold: '寒い日が多い', chilly: '肌寒い日が多い', 'mild-cool': '穏やかだがやや涼しい', comfortable: '過ごしやすい気温',
    warm: '暖かい〜暑い日が多い', hot: '暑い日が多い', 'very-hot': '猛暑の日が多い', frost: '夜は氷点下になる',
    'rain-most': `ほぼ毎日雨（約${n}日）`, 'rain-frequent': `雨が多い（雨の日は約${n}日）`,
    'rain-some': `雨の日がいくらかある（約${n}日）`, dry: `ほとんど乾燥（雨の日は約${n}日）`,
    heavy: `降水量が多い（${n}mm）`, dull: `日照が少ない（1日${n}時間）`, sunny: `日照が多い（1日${n}時間）`,
  }[r.key || r.t] || '';
};
const SUIT = { sightseeing: '街歩き・観光', parks: '公園・屋外', beach: 'ビーチ', hiking: 'ハイキング', indoor: '美術館・屋内' };
const PACK = { layers: '重ね着', rain: '雨具', sun: '日焼け対策', jacket: '薄手の上着', warm: '防寒着', shades: 'サングラス', light: '軽装' };

const P = {
  month: h.month,
  list: h.list,
  n1: h.n1,
  hm,
  verdict: (l) => VERDICT[l] || l,
  packTitle: (p) => PACK[p.key] || p.title,
  inCity: (city) => city.name,
  rank: (kind, r) => (r > 1 ? `${r}番目に${KIND[kind]}月` : `最も${KIND[kind]}月`),
  rainyDays: (n) => `${h.n1(n)}日`,
  sunHours: (n) => `${h.n1(n)}時間`,
  mm: (n) => `${h.n0(n)}mm`,
  perDay: (v) => `約${h.n1(v)}mm`,
  often: (o) => ({ most: 'ほぼ毎日', everyOther: '2日に1日ほど', never: 'ほとんどありません', oneIn: `${o.k}日に1日ほど` }[o.key]),

  hero: ({ monthN, place, y }) => [
    `${place}の${monthN}の典型的な天気（${y}年の平均値）。`,
    `${y}年の気候平均にもとづく、${place}のいつもの${monthN}の天気です。`,
    `${place}の${monthN}はどんな天気？${y}年の平均から見ていきます。`,
  ],
  quick: ({ monthN, cityN, hi, lo, days, mm, sun }) => [
    <>{cityN}の{monthN}は平均最高気温が{hi}、最低気温が{lo}。雨の日は約{days}（降水量{mm}）で、日照時間は1日約{sun}です。</>,
    <>{monthN}の{cityN}は、日中は{hi}前後まで上がり、夜は{lo}前後まで下がります。雨の日は約{days}（合計{mm}）、日照は1日約{sun}です。</>,
    <>{cityN}・{monthN}の目安：最高気温{hi}、最低気温{lo}、雨の日 約{days}（{mm}）、日照 1日約{sun}。</>,
  ],
  tableExtreme: ({ monthN, cityN, warmest, rainTxt }) => [
    <>{monthN}は{cityN}で<strong>{warmest ? '最も暖かい月' : '最も涼しい月'}</strong>です{rainTxt && <>。雨については{rainTxt}です</>}。</>,
    <>{cityN}では{monthN}より{warmest ? '暖かい' : '涼しい'}月はありません{rainTxt && <>。雨については{rainTxt}です</>}。</>,
  ],
  tableNormal: ({ monthN, cityN, warmer, k, rainTxt }) => [
    <>{monthN}は<strong>ほかの11か月のうち{warmer}か月</strong>より暖かい月です{rainTxt && <>。雨については{cityN}で{rainTxt}です</>}。</>,
    <>{cityN}で{monthN}より暖かいのは{k <= 3 ? `わずか${k}か月` : `ほかの11か月のうち${k}か月`}です{rainTxt && <>。雨については{rainTxt}です</>}。</>,
    <>{cityN}の各月を{monthN}と比べると次のとおりです{rainTxt && <>。雨については、{monthN}は{rainTxt}です</>}。</>,
  ],
  season: {
    equator: ({ cityN, monthN }) => [
      `${cityN}は赤道に近いため、はっきりした冬や夏はなく一年中暑く、${monthN}も例外ではありません。`,
      `赤道付近の${cityN}には四季がなく、${monthN}も一年を通じて変わらず暑い時期です。`,
    ],
    tropical: ({ cityN, monthN }) => [
      `${cityN}は熱帯に位置し、季節の区別があまりなく一年中暖かい気候です。`,
      `熱帯の都市である${cityN}は一年中暖かく、${monthN}は乾季とも雨季ともはっきり言えない時期です。`,
    ],
    wet: ({ cityN, monthN }) => `${monthN}は${cityN}の雨季にあたり、降水量は乾季の月を大きく上回ります。`,
    dry: ({ cityN, monthN }) => `${monthN}は${cityN}の乾季にあたり、雨は雨季の月よりずっと少なくなります。`,
    between: ({ cityN, monthN }) => `${cityN}の${monthN}は、乾季と雨季の間の時期です。`,
    south: ({ cityN }) => `（${cityN}は南半球にあるため、季節は日本と逆になります）`,
    peakSummer: ({ monthN, cityN, south }) => [`${cityN}の${monthN}は真夏で、一年で最も暖かい月です${south}。`, `${monthN}は夏のピークで、${cityN}でこれより暖かい月はありません${south}。`],
    troughWinter: ({ monthN, cityN, south }) => [`${monthN}は${cityN}の冬で最も寒い時期です${south}。`, `${monthN}は冬の底にあたり、${cityN}で一年で最も涼しい月です${south}。`],
    warmWinter: ({ monthN, cityN, season, stage, south, feel }) => `${cityN}の${monthN}は${SEASON[season][stage]}にあたります${south}。ただし、ここでの冬は寒いというより${feel}日が続きます。`,
    normal: ({ monthN, cityN, season, stage, south }) => [
      `${cityN}の${monthN}は${SEASON[season][stage]}です${south}。`,
      `${cityN}では、${monthN}になると${SEASON[season][stage]}を迎えます${south}。`,
      `暦の上では、${cityN}の${monthN}は${SEASON[season][stage]}にあたります${south}。`,
    ],
  },
  feelWord: { freezing: '凍えるような', cold: '寒い', chilly: '肌寒い', cool: '涼しい', mild: '穏やかな', warm: '暖かい', hot: '暑い', 'very-hot': '猛烈に暑い' },
  feel: {
    freezing: ['日中の気温も氷点をわずかに上回る程度で、昼間でも真冬の寒さです。', '一日で最も暖かい時間帯でも、気温は0℃前後にとどまります。'],
    cold: ['日中も寒く、昼間でも厚手のコートが必要です。', '昼になってもあまり暖かくならず、朝から晩までコートとマフラーが欠かせません。'],
    chilly: ['日中は凍えるほどではなく肌寒い程度で、しっかりした上着があれば快適に歩けます。', '日中の空気はひんやりしていますが、厳しい寒さになることはまれです。'],
    cool: ['午後は涼しく、上着を一枚羽織れば散策にちょうどよい気候です。', '日中は寒いというより涼しく感じられます。', '日中は涼しめで、きびきびと観光するのに向いています。'],
    mild: ['午後は穏やかで、ほとんどの人が軽装で快適に過ごせます。', '日中の気温は穏やかで、歩いて回るのに寒すぎず暑すぎません。', '穏やかな午後は、屋外で長く過ごすのにぴったりです。'],
    warm: ['日中は半袖で過ごせる暖かさで、屋外で快適に過ごせます。', '暖かく気持ちのよい午後が続き、一日中出歩くのに最適です。'],
    hot: ['午後はかなり暑く、観光は朝か夕方がおすすめです。', '日中はかなり暑く、長時間歩くなら日陰と水分補給が大切です。'],
    'very-hot': ['昼間の暑さは厳しく、午後は多くの人が日陰や冷房のある場所に避難します。', '午後は猛暑となり、屋外の予定は早朝か日没後が向いています。'],
  },
  nightTxt: {
    'hard-frost': '夜は氷点下を大きく下回ります', frosty: '夜は0℃前後まで下がり、霜がよく降ります',
    cold: '夜は冷え込みます', cool: '夜は涼しくなります', mild: '夜も穏やかです', warm: '夜も暖かいままです', sultry: '夜は蒸し暑くなります',
  },
  night: {
    sultry: () => ['夜になってもほとんど涼しくならず、最も気温が下がる時間帯でも暑いままです。', '日が沈んでも暑く、蒸し暑さが続きます。'],
    small: ({ nightTxt }) => [`昼と夜の気温差は小さく、${nightTxt}。夕方も午後とあまり変わりません。`, `日没後もほとんど変わらず、${nightTxt}。日中よりわずかに低い程度です。`],
    moderate: ({ nightTxt }) => [`日が沈むと気温ははっきり下がり、${nightTxt}。`, `夕方になると気温が目に見えて下がり、${nightTxt}。`],
    big: ({ nightTxt, delta }) => [
      <>昼夜の寒暖差は大きく（約{delta}）、{nightTxt}。朝晩と昼間ではかなり体感が違います。</>,
      <>日没後は約{delta}も気温が下がり、{nightTxt}。</>,
    ],
  },
  humidity: {
    veryHumidHot: ['湿度が高く蒸し暑いため、実際の気温以上に暑く感じます。', '高い湿度のため、特に風のない午後は暑さが重くまとわりつくように感じます。'],
    dampCold: ['湿った空気のため、数字以上に寒さが身にしみます。', '湿気があるため、特に風があると寒さが骨身にしみます。'],
    humidHot: ['空気にはやや湿り気があり、日差しが強いときに感じられます。', 'やや湿度が高く、暑い時間帯にはそれが感じられます。'],
    humidMild: ['湿度はやや高めですが、この気温ではあまり不快に感じることはありません。', '湿度は高めですが、穏やかな気温のおかげで過ごしやすく感じます。'],
    dryHot: ['空気が乾燥していて汗がすぐ乾くため、気づかないうちに脱水になりがちです。', '蒸し暑さではなく乾いた暑さです。思っている以上に水分をとりましょう。'],
    dry: ['空気が乾燥しており、気温よりも肌や唇の乾燥が気になりやすい時期です。'],
    comfortable: ['湿度はほどよく、べたつきも乾燥も気になりません。', '空気は快適で、蒸し暑くも乾燥しすぎてもいません。'],
  },
  rainFreq: {
    dry: ({ monthN, cityN, often, never }) => [`${monthN}は雨が少なく、ほとんどの週は雨の日なしで過ぎていきます。`, never ? `${cityN}の${monthN}は乾燥した月で、雨はほとんど降りません。` : `${cityN}の${monthN}は乾燥した月で、雨は${often}です。`, '晴れて乾いた日が多く、傘はスーツケースに入れたままでも大丈夫でしょう。'],
    occasional: ({ often }) => [`雨はときどき降る程度で、${often}です。`, `雨の日は定期的というよりたまにある程度で、${often}です。`, `ほとんどの日は雨が降らず、雨は${often}です。`],
    showery: ({ often }) => [`にわか雨が多く、${often}は降ります。`, `変わりやすい天気の月で、${often}は雨が降り、その合間に晴れ間があります。`],
    wet: ({ monthN, often }) => [`この月は雨が当たり前で、${often}降ります。`, `ここの${monthN}は雨がちな月で、${often}雨が降ります。`, `雨が降らない日のほうが珍しく、${often}降ります。`],
  },
  rainSize: {
    light: ({ per }) => [`雨の日の多くは小雨程度で、典型的な雨の日の降水量は${per}です。霧雨や短いにわか雨が中心で、予定が台無しになることはまれです。`, `雨が降っても量は少なく、1日あたり${per}程度。本降りというより霧雨です。`],
    moderate: ({ per }) => [`雨の日の降水量は平均${per}で、通り雨というよりしっかり降る雨です。`, `雨の日は平均${per}降り、傘がないと濡れてしまう程度の量です。`],
    heavy: ({ per }) => [`雨は激しく降ることが多く、平均的な雨の日で${per}に達します。`, `雨の日は強い降り方で平均${per}。霧雨というより土砂降りです。`],
  },
  rainVs: {
    heavier: ({ cityN, year }) => `これは${cityN}の年間平均（雨の日1日あたり約${year}mm）より多い量です。`,
    lighter: ({ year }) => `これは年間平均（雨の日1日あたり約${year}mm）より少ない量です。`,
    typical: ({ cityN, monthN, year }) => [`${cityN}の年間平均（雨の日1日あたり約${year}mm）とほぼ同じです。`, `${cityN}の雨の日は年間を通じて1日あたり約${year}mmなので、${monthN}は平均的です。`],
  },
  rainRank1: ({ monthN, cityN, kind }) => `${monthN}は${cityN}で一年のうち最も${KIND[kind]}月です。`,
  rainRankTop3: ({ kind }) => `一年のうち${kind === 'wettest' ? '雨の多い' : '乾燥した'}上位3か月に入ります。`,
  polar: {
    day: ({ monthN, cityN }) => `${monthN}中旬の${cityN}では、太陽が沈みません（白夜）。`,
    night: ({ monthN, cityN }) => `${monthN}中旬の${cityN}では、太陽が地平線の上に昇りません（極夜）。`,
  },
  dayMain: ({ monthN, cityN, rise, set, len }) => [
    `${monthN}15日の日の出は${rise}ごろ、日の入りは${set}ごろ（現地時間）で、日照可能時間は${len}です。`,
    `${monthN}中旬は${rise}ごろに日が昇り、${set}ごろに沈みます（現地時間）。昼の長さは${len}です。`,
    `月の半ば、${cityN}の昼の長さは${len}。日の出は${rise}ごろ、日の入りは${set}ごろです。`,
  ],
  dayChange: {
    same: ({ pm }) => `昼の長さは${pm}中旬とほとんど変わりません。`,
    barely: ({ pm, amt, longer }) => `昼の長さは${pm}中旬とほとんど変わりません（${amt}${longer ? '長い' : '短い'}）。`,
    shorter: ({ pm, amt }) => [`日が短くなり、${pm}中旬より昼が${amt}短くなります。`, `${pm}中旬と比べて、昼の長さは${amt}短くなっています。`],
    longer: ({ pm, amt }) => [`日が長くなり、${pm}中旬より昼が${amt}長くなります。`, `${pm}中旬から、昼の長さは${amt}長くなっています。`],
  },
  sky: { cloudy: '曇りの日が多めです', mixed: '晴れと曇りが入り混じります', bright: '晴れ間が多くあります', clear: 'ほとんど晴天です' },
  sunShare: ({ share, sky }) => [`このうち約${share}%の時間は日が差し、${sky}。`, `日中の約${share}%が晴れ。つまり、${sky}。`],
  equatorDay: '赤道に近いため、日の出と日の入りの時刻は一年を通してほとんど変わりません。',
  cmpFirst: ({ monthN, cityN, rankTxt }) => [`${monthN}は${cityN}で一年のうち${rankTxt}です。`, `平均最高気温で見ると、${monthN}は${cityN}で${rankTxt}です。`],
  cmpRain: (rain) => (rain === 0 ? '雨量もほぼ同じです' : `雨は${h.n0(Math.abs(rain))}mm${rain > 0 ? '多くなります' : '少なくなります'}`),
  cmpSame: ({ prevN, rainTxt }) => <>気温は{prevN}とほぼ同じ{rainTxt ? <>で、{rainTxt}</> : 'です'}。</>,
  cmpPrev: ({ prevN, delta, warmer, rainTxt }) => [
    <>{prevN}と比べて午後は{delta}{warmer ? '暖かく' : '涼しく'}{rainTxt ? <>なり、{rainTxt}</> : 'なります'}。</>,
    <>{prevN}と比べると平均最高気温は{delta}{warmer ? '高く' : '低く'}{rainTxt ? <>なり、{rainTxt}</> : 'なります'}。</>,
  ],
  trend: {
    peak: ({ nextN }) => [`ここから一年の流れは折り返し、${nextN}にはもう涼しくなります。`, `この時期を境に気温は下がり始め、${nextN}から涼しくなります。`],
    trough: ({ nextN }) => [`ここが最も寒い時期で、${nextN}から暖かくなり始めます。`, `ここから先は暖かくなる一方で、${nextN}から気温が上がります。`],
    warming: ({ nextN }) => [`${nextN}にかけても気温の上昇が続きます。`, `${nextN}に向けて気温はさらに上がっていきます。`],
    cooling: ({ nextN }) => [`${nextN}にかけても気温は下がり続けます。`, `${nextN}に向けてさらに涼しくなっていきます。`],
    flat: () => 'ここでは月ごとの気温の変化がごくわずかです。',
  },
  nextHi: ({ nextN, temp }) => [<>{nextN}の平均最高気温は{temp}です。</>, <>{nextN}は平均して最高{temp}になります。</>],
  suitWhy: {
    sightseeing: { ok: ['日中の気温が街歩きに向いています', '一日中歩いて観光するのに快適です'], rain: ['半分以上の日に雨が降ります'], hot: ['昼間の暑さで長い散策は疲れます'], cold: ['長時間歩くには寒すぎます'] },
    parks: { ok: ['長い散歩やピクニックに快適です', '屋外でくつろぐのに良い条件です'], hot: ['午後は暑すぎて長く外にいられません'], cold: ['外で長く座っているには涼しすぎます'], rain: ['雨で屋外の予定が中断されがちです'] },
    beach: { ok: ['海辺は暖かくほとんど雨が降りません'], hot: ['海辺はとても暑くなります'], cold: ['海風が涼しすぎます'], rain: ['雨の日が多すぎます'] },
    hiking: { ok: ['トレイルに快適な気温です'], cold: ['山道は寒くなります'], hot: ['長いハイキングには暑すぎます'], rain: ['道がぬかるみます'] },
    indoor: { rain: ['ほぼ毎日雨なので、美術館や博物館が手軽な選択肢です'], hot: ['一番暑い時間帯の涼しい避難場所に'], cold: ['寒い時間帯を暖かく過ごせる場所に'] },
  },
  tips: {
    layers: ['昼は夜よりずっと暖かいので、脱ぎ着しやすい重ね着を。', '朝晩は昼より涼しいので、重ね着がおすすめです。'],
    rain: ['折りたたみ傘と薄手のレインジャケットを。', 'バッグに小さな傘を入れ、水たまりに強い靴を選びましょう。'],
    sun: ['日焼け止め、帽子、サングラスと、通気性のよい軽い服を。', '強い日差し対策に、帽子・日焼け止め・十分な水を。'],
    jacket: ['涼しい日が多いので、観光には薄手の上着かセーターを。', '一日の大半は薄手のジャケットやカーディガンで十分です。'],
    warm: ['寒い朝晩に備えて、厚手の上着・帽子・手袋を。', '早朝の外出には本格的な冬のコートと手袋・帽子を。'],
    shades: ['晴れの日が多いので、サングラスと軽い帽子を。', '明るい日が続くので、サングラスは荷物に入れておきましょう。'],
    light: ['動きやすい服と、夜用の薄い羽織りものを。', '普段着に、夜用の薄い上着を一枚。'],
  },
  packPhrase: { layers: '重ね着できる服', rain: '雨具', sun: '日焼け対策グッズ', jacket: '薄手の上着', warm: '防寒着', shades: 'サングラス', light: '軽装' },
  eveCool: ['涼しい夜に備えて、もう一枚持っていきましょう。', '日没後のために羽織りものを一枚追加しましょう。'],
  eveSame: ['夜も昼とあまり変わらないので、朝から晩まで同じ服装で大丈夫です。', '夜に着替える必要はほとんどありません。'],
  q1: ({ monthN, cityN }) => `${monthN}の${cityN}の気温はどのくらい？`,
  a1: ({ hi, lo, feel, warmRank }) => [
    <>午後の平均は{hi}、夜は約{lo}で、多くの人にとって{feel}気候です。{warmRank && <>一年のうち{warmRank}です。</>}</>,
    <>午後は約{hi}、夜は約{lo}が目安で、ほとんどの人にとって{feel}気候です。</>,
  ],
  q2: ({ monthN, cityN }) => `${monthN}の${cityN}は雨が多い？`,
  a2: {
    never: ({ monthN, none }) => <>ほとんど降りません。{monthN}はほぼ雨のない月で、平年では{none ? '雨の日はありません' : '雨の日は1日程度です'}。</>,
    dry: ({ monthN, days, mm }) => [<>いいえ。{monthN}は一年で最も乾燥した時期のひとつで、雨の日は約{h.n1(days)}日、降水量は合計{h.n0(mm)}mmです。</>, <>少なめです。月全体で雨の日は約{h.n1(days)}日、降水量は{h.n0(mm)}mmほどです。</>],
    yes: ({ days, mm, often }) => [<>はい、かなり降ります。雨は{often}降り、合計約{h.n0(mm)}mmになるので、傘があると安心です。</>, <>はい。約{h.n1(days)}日の雨の日で約{h.n0(mm)}mm降るので、屋内の予定もいくつか用意しておきましょう。</>],
    some: ({ days, mm, light }) => [<>それほどではありません。雨の日は約{h.n1(days)}日（{h.n0(mm)}mm）で、多くは{light ? '小雨' : '普通の雨'}です。</>, <>ほどほどです。雨の日は約{h.n1(days)}日、{h.n0(mm)}mmで、たいていは{light ? '短いにわか雨' : '普通の雨'}です。</>],
  },
  q3: ({ monthN, cityN }) => `${monthN}の${cityN}旅行の服装・持ち物は？`,
  a3: ({ list, eve }) => [<>平均値から考えると、{list}がおすすめです。{eve}</>, <>{list}を持っていきましょう。{eve}</>],
  q4: ({ monthN, nextN, cityN }) => `${cityN}に行くなら${monthN}と${nextN}、どちらがいい？`,
  nextWhy: ({ nextN, why }) => {
    const parts = why.map((w) => ({ warmer: '暖かく', cooler: '涼しく', fewerRain: '雨の日が少なく', moreRain: '雨の日が多く' }[w]));
    return `${nextN}は${parts.join('、')}なります。`;
  },
  a4: ({ win, ranks, labels, whyTxt, cityN, narrow }) => [
    <>当サイトの気候ランキングでは{win}のほうが高評価です（12か月中{ranks.a}位、もう一方は{ranks.b}位）{labels ? `。評価は「${labels[0]}」と「${labels[1]}」` : ''}。{whyTxt}</>,
    <>{narrow ? 'わずかな差で' : 'はっきりと'}{win}です。{cityN}の12か月中{ranks.a}位で、もう一方は{ranks.b}位です。{whyTxt}</>,
  ],
};

const ja = {
  lang: 'ja',
  story: makeStory(P),
  locale: h.loc,
  place: (cityN, countryN) => (cityN === countryN ? cityN : `${cityN}（${countryN}）`),
  list: h.list,
  month: h.month,
  monthShort: h.monthShort,
  verdict: P.verdict,
  reasons: (v) => v.reasons.map(reasonText).filter(Boolean).join('、'),
  suitLabel: (s) => SUIT[s.key] || s.label,
  suitStatus: (s) => (s.key === 'indoor' ? 'おすすめ' : s.ok ? '向いている' : 'あまり向かない'),
  packTitle: P.packTitle,
  SuitLine: ({ label, status, why }) => <><strong className="text-gray-900">{label}</strong>：{status}（{why}）</>,

  cityMeta: ({ cityN, x, best }) => ({
    title: fit(60, `${cityN}の天気と気温（月別）｜ベストシーズンはいつ？`, `${cityN}の月別の天気とベストシーズン`),
    imageTitle: `${cityN}の月別の天気`,
    description: fit(160,
      `${cityN}の月別の天気と気温。最も暑いのは${h.month(x.warmest?.month.num)}、雨が最も多いのは${h.month(x.wettest?.month.num)}。ベストシーズンは${h.list(best)}。20年間の平均データにもとづく気候ガイドです。`,
      `${cityN}の月別の天気と気温。ベストシーズンは${h.list(best)}。20年間の平均データ。`),
  }),
  cityDataset: ({ cityN, place, years }) => ({
    name: `${cityN}の月別の天気：気候平均値 ${years.start}–${years.end}年`,
    description: `${place}の月別の気候平均値：各月の平均最高・最低気温、降水量、雨の日数、1日の日照時間、湿度。${years.start}–${years.end}年の過去の気象データから算出。`,
  }),
  variables: ['平均最高気温', '平均最低気温', '降水量', '雨の日数', '日照時間', '相対湿度'],
  skylineAlt: (place) => `${place}の街並み`,
  cityH1: (cityN) => `${cityN}の月別の天気と気温`,
  citySub: (place, years) => <>{place}の12か月の天気：{years.start}–{years.end}年の平均値。</>,
  CityIntro: ({ x, cityN }) => (
    <>
      {x.warmest && <>{cityN}で最も暖かい月は<S>{h.month(x.warmest.month.num)}</S>（平均最高気温<UnitTemp c={x.warmest.row.avg_high} />）</>}
      {x.coolest && <>、最も涼しい月は<S>{h.month(x.coolest.month.num)}</S>（<UnitTemp c={x.coolest.row.avg_high} />）</>}です。
      {x.wettest && <>雨が最も多いのは<S>{h.month(x.wettest.month.num)}</S>（約{h.n0(x.wettest.row.avg_rainfall)}mm）</>}
      {x.driest && <>、最も乾燥しているのは<S>{h.month(x.driest.month.num)}</S>（約{h.n0(x.driest.row.avg_rainfall)}mm）</>}です。
      {x.sunniest && <><S>{h.month(x.sunniest.month.num)}</S>は最も日照が多く、1日約{h.n1(x.sunniest.row.sunshine_hours)}時間です。</>}
    </>
  ),
  bestTitle: (cityN) => `${cityN}のベストシーズン：おすすめの月`,
  bestNote: () => '快適な気温、雨の日数、日照時間をもとに、この都市の一年の中で順位付けしています。過去の平均値であり、予報ではありません。',
  monthByMonth: (cityN) => `${cityN}の月別の天気`,
  high: '最高',
  low: '最低',
  srRainfall: '降水量',
  srRainy: '雨の日数',
  srSun: '日照',
  rainMmIn: (mm) => `${h.n0(mm)}mm`,
  rainyDaysN: (n) => `雨の日 ${h.n1(n)}日`,
  sunPerDay: (v) => `日照 1日${h.n1(v)}時間`,
  guideTitle: (cityN) => `${cityN}の気候と天気`,
  guideSub: (years) => <>一年を通じた気温・降水量・日照：{years.start}–{years.end}年の平均値。</>,
  tiles: { hottest: '最も暑い月の平均最高気温', coolest: '最も涼しい月の平均最高気温', wettest: '最も雨の多い月の平均', driest: '最も乾燥した月の平均' },
  tempByMonth: '月別の気温',
  rainByMonth: '月別の降水量',
  sunHours: '日照時間',
  chartTemp: (cityN) => `${cityN}の月別の平均最高・最低気温`,
  chartRain: (cityN) => `${cityN}の月別の平均降水量`,
  chartSun: (cityN) => `${cityN}の月別の平均日照時間（1日あたり）`,
  monthlyAverages: '月別の平均値',
  whatToPack: '持ち物・服装',
  packIntro: (cityN) => <>{cityN}の気候にもとづく持ち物のヒントです。</>,
  cityPacking: {
    layers: { title: '重ね着', text: '穏やかな午後にも涼しい夜にも対応できる、薄手の重ね着を。' },
    rain: { title: '雨具', text: '雨の多い月には、折りたたみ傘と薄手のレインジャケットを。' },
    sun: { title: '日焼け対策', text: '暑く晴れた日には、日焼け止め・つばの広い帽子・サングラスを。' },
    warm: { title: '防寒着', text: '涼しい朝晩には、暖かいジャケットやフリースを。' },
  },
  moreCities: (countryN) => `${countryN}のほかの都市の月別の天気`,
  weatherByMonth: '月別の天気',
  ctaCityTitle: (cityN) => `${cityN}への旅行を計画中ですか？`,
  ctaCityText: '旅行の日程に合わせた、1日ごとの天気プランをチェックできます。',
  ctaCityButton: '旅行プランナーを使う',
  cityDataNote: (years) => <>Open-Meteoの過去{years.end - years.start + 1}年分（{years.start}–{years.end}年）の気象データにもとづく月別の平均値です。予報ではありません。</>,

  monthMeta: ({ cityN, countryN, monthN, row, verdict }) => {
    const t = (c) => (c == null ? '—' : `${h.n1(Math.round(c * 10) / 10)}℃`);
    const base = `${cityN}の${monthN}の天気と気温：平均最高気温${t(row?.avg_high)}、最低気温${t(row?.avg_low)}、雨の日${h.n1(row?.rainy_days)}日、日照は1日${h.n1(row?.sunshine_hours)}時間。`;
    return {
      title: fit(60, `${cityN} ${monthN}の天気と気温：雨・服装・旅行のヒント`, `${cityN} ${monthN}の天気と気温`),
      imageTitle: `${cityN} ${monthN}の天気と気温`,
      kicker: countryN,
      description: fit(160, `${base}評価：${verdict ? VERDICT[verdict.label] : '—'}。`, base),
    };
  },
  monthDataset: ({ cityN, place, monthN, years }) => ({
    name: `${cityN} ${monthN}の天気：気候平均値 ${years.start}–${years.end}年`,
    description: `${place}の${monthN}の気候平均値：平均最高・最低気温、降水量、雨の日数、1日の日照時間、湿度。${years.start}–${years.end}年の過去の気象データから算出。`,
  }),
  monthH1: (cityN, monthN) => `${cityN} ${monthN}の天気と気温`,
  stat: { avgHigh: '平均最高気温', avgLow: '平均最低気温', rainfall: '降水量', rainyDays: '雨の日数', sunshine: '日照', humidity: '湿度' },
  statDays: (n) => `${h.n1(n)}日`,
  statSun: (v) => `1日${h.n1(v)}時間`,
  Latest: ({ monthN, latest, row, years }) => (
    <>
      <span className="font-semibold text-gray-700">最新の実測値（{latest.year}年{monthN}）：</span>
      最高<UnitTemp c={latest.avg_high} />、最低<UnitTemp c={latest.avg_low} />
      {latest.avg_rainfall != null && <>、降水量{h.n0(latest.avg_rainfall)}mm</>}
      {latest.rainy_days != null && <>（雨の日{h.n1(latest.rainy_days)}日）</>}
      。上の{years.start}–{years.end}年の平均は{latest.avg_high != null && row?.avg_high != null
        ? (latest.avg_high > row.avg_high + 0.4 ? 'これより涼しめです' : latest.avg_high < row.avg_high - 0.4 ? 'これより暖かめです' : 'ほぼ同じです')
        : '比較用です'}。
    </>
  ),
  vsYearTitle: (monthN) => `${monthN}と一年のほかの月の比較`,
  tableFallback: (monthN, cityN) => <>{cityN}の{monthN}をほかのすべての月と比べています。</>,
  th: { month: '月', avgHigh: '平均最高気温', vs: (monthN) => `${monthN}との差`, rain: '降水量', rainyDays: '雨の日数' },
  rainMm: (mm) => `${h.n0(mm)}mm`,
  chipsLabel: (cityN) => `${cityN}の月別の天気`,
  chipAria: (cityN, mN) => `${cityN} ${mN}の天気`,
  feelTitle: (monthN, cityN) => `${cityN}の${monthN}はどんな感じ？`,
  rainTitle: (cityN, monthN) => `${cityN}の${monthN}の雨`,
  daylightTitle: (monthN) => `${monthN}の日の長さと日照`,
  compareTitle: (monthN) => `${monthN}と一年のほかの月の比較`,
  suitsTitle: (monthN) => `${monthN}に向いていること`,
  tipsTitle: (cityN, monthN) => `${monthN}に${cityN}を訪れるためのヒント`,
  questionsTitle: 'よくある質問',
  verdictTitle: (monthN, cityN) => `${monthN}は${cityN}旅行に良い時期？`,
  VerdictText: ({ verdict, relRank, cityN, monthN, reasons }) => (
    <>
      <strong>{VERDICT[verdict.label]}</strong>：{reasons}。
      {relRank && (
        <>{cityN}の一年の中で、{monthN}は<strong>12か月中{relRank}位</strong>
          {relRank <= 3 ? <>。訪れるのに最も良い3か月のひとつです。</> : relRank >= 10 ? <>。あまり快適ではない月のひとつです。</> : 'です。'}</>
      )}
    </>
  ),
  notesTitle: (cityN, monthN) => `旅行メモ：${monthN}の${cityN}`,
  othersTitle: (monthN, countryN) => `${countryN}のほかの都市の${monthN}`,
  OtherHigh: ({ row }) => <>最高<UnitTempShort c={row.avg_high} /> · {h.n0(row.avg_rainfall ?? 0)}mm</>,
  otherGuide: (monthN) => `${monthN}のガイド`,
  elsewhereTitle: (kind, monthN) => `${monthN}に${kind === 'both' ? 'より暖かい・乾燥した' : kind === 'warmer' ? 'より暖かい' : 'より乾燥した'}旅行先`,
  ElsewhereHigh: ({ row }) => <>最高<UnitTempShort c={row.avg_high} /></>,
  elsewhereRainy: (n) => `雨の日 ${n == null ? '—' : h.n1(n)}日`,
  warmer: 'より暖かい',
  drier: 'より乾燥',
  ctaMonthTitle: (cityN) => `${cityN}への旅行を計画する`,
  ctaMonthText: '旅行の日程に合わせて、1日ごとの天気スコアをチェックできます。',
  ctaMonthButton: '旅行プランナーを開く',
  MonthDataNote: ({ years, cityHref, cityN }) => (
    <>
      Open-Meteoの{years.end - years.start + 1}年分（{years.start}–{years.end}年）のデータにもとづく月別の平均値で、予報ではありません。12か月すべては{' '}
      <Link href={cityHref} className="text-[#0077b6] font-semibold hover:underline">{cityN}の月別の天気</Link>でご覧いただけます。
    </>
  ),

  countryMeta: ({ countryN, n }) => ({
    absoluteTitle: fit(60, `${countryN}のベストシーズン：月別の天気と気候`, `${countryN}のベストシーズン`),
    description: fit(160,
      `${countryN}のベストシーズンはいつ？${n}都市の月別の気候（気温・雨・日照）と旅行におすすめの時期を、20年分の気象データから紹介します。`,
      `${countryN}のベストシーズンと、${n}都市の月別の気候。`),
    kicker: '月別・都市別の天気',
  }),
  countryH1: (countryN) => <>{countryN}のベストシーズン：都市別・月別の天気</>,
  countrySub: (n, countryN) => <>{countryN}の{n}都市の月別の平均値。20年分の過去の気象データにもとづいています。</>,
  climateAcross: (countryN) => `${countryN}の気候`,
  CountryIntro: ({ single, warmest, coolest, wettest, loaded }) => (
    <>
      {single && (
        <><strong className="text-gray-800">{single.name}</strong>の年間の平均最高気温は<UnitTemp c={single.v} />です</>
      )}
      {warmest && (
        <>以下の都市のうち、最も暖かいのは<strong className="text-gray-800">{warmest.name}</strong>で、年間の平均最高気温は<UnitTemp c={warmest.v} /></>
      )}
      {coolest && (
        <>、最も涼しいのは<strong className="text-gray-800">{coolest.name}</strong>で<UnitTemp c={coolest.v} />です</>
      )}
      。{wettest && <>{loaded.length > 1 ? 'これらの都市' : loaded[0].name}で雨が最も多いのはたいてい<strong className="text-gray-800">{wettest.name}</strong>です（平均約{h.n0(wettest.v)}mm）。</>}
    </>
  ),
  preparing: 'これらの都市の気候データを準備中です。',
  citiesByMonth: (countryN) => `${countryN}の都市別・月別の天気`,
  avgHighByMonth: '月別の平均最高気温',
  tapValue: '数値をタップすると、その都市の月別ガイドが開きます。',
  cityTh: '都市',
  cellAria: (cityN, mN) => `${cityN} ${mN}`,
  bestMonthsTitle: (countryN) => `${countryN}のベストシーズン`,
  BestMonthsText: ({ across, best, worst }) => (
    <>
      {across ? `${across}の` : 'これらの都市の'}快適な気温、雨の日数、日照をもとにすると、最も過ごしやすい月はたいてい
      <strong className="text-gray-800">{best}</strong>です
      {worst && <>。最も過ごしにくいのはたいてい<strong className="text-gray-800">{worst}</strong>です</>}。
      過去の平均値であり、予報ではありません。
    </>
  ),
};

export default ja;
