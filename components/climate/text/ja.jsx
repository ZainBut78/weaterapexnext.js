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
    'snow-most': `ほぼ毎日雨か雪（約${n}日）`, 'snow-frequent': `雨や雪が多い（約${n}日）`, 'snow-some': `雨や雪の日がいくらかある（約${n}日）`,
    'rain-most': `ほぼ毎日雨（約${n}日）`, 'rain-frequent': `雨が多い（雨の日は約${n}日）`,
    'rain-some': `雨の日がいくらかある（約${n}日）`, dry: r.n < 0.5 ? '雨はほとんど降らない' : `ほとんど乾燥（雨の日は約${n}日）`,
    heavy: `降水量が多い（${n}mm）`, dull: `日照が少ない（1日${n}時間）`, sunny: `日照が多い（1日${n}時間）`,
  }[r.key || r.t] || '';
};
const SUIT = { sightseeing: '街歩き・観光', parks: '公園・屋外', beach: 'ビーチ', hiking: 'ハイキング', indoor: '美術館・屋内' };
const PACK = { shoes: '防水の靴', layers: '重ね着', rain: '雨具', sun: '日焼け対策', jacket: '薄手の上着', warm: '防寒着', shades: 'サングラス', light: '軽装' };

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

  hero: ({ monthN, place, y, feelK, rainK }) => {
    const feel = { freezing: '午後も凍えるように寒く', cold: '午後も寒く', chilly: '午後は肌寒く', cool: '午後は涼しく', mild: '午後は穏やかで', warm: '午後は暖かく', hot: '午後は暑く', 'very-hot': '午後は猛烈に暑く' }[feelK] || '午後は平年並みで';
    const rain = { dry: '雨は少なめ', occasional: 'ときどき雨', showery: 'にわか雨が定期的', wet: 'ほぼ毎日雨', wintry: '雨や雪の日が多め' }[rainK];
    return `${monthN}の${place}は${feel}、${rain}（${y}年の平均より）。`;
  },
  quick: ({ monthN, cityN, hi, lo, days, mm, sun, feelK, rainK, sunK }) => {
    const lead = { freezing: '凍えるような月', cold: '寒い月', chilly: '肌寒い月', cool: '涼しい月', mild: '穏やかな月', warm: '暖かい月', hot: '暑い月', 'very-hot': '猛烈に暑い月' }[feelK] || '平年並みの月';
    const rain = { dry: <>雨はごくわずか（{mm}）</>, some: <>雨の日は約{days}（{mm}）</>, wet: <>約{days}は雨（合計{mm}）</> }[rainK];
    const shine = { low: <>日照は1日{sun}だけ</>, mid: <>日照は1日{sun}</>, high: <>日照は1日{sun}とたっぷり</> }[sunK];
    return <>{monthN}の{cityN}は{lead}です。平均最高気温は{hi}、平均最低気温は{lo}で、{rain}、{shine}です。</>;
  },
  tableExtreme: ({ monthN, cityN, warmest, rainTxt }) => <>{monthN}は{cityN}で<strong>最も{warmest ? '暖かい' : '涼しい'}月</strong>です{rainTxt && <>。雨の面では{rainTxt}です</>}。</>,
  tableNormal: ({ monthN, cityN, warmer, k, rainTxt, band }) => ({
    high: <>{cityN}で{monthN}より暖かい月は{k}か月だけです{rainTxt && <>。雨の面では{rainTxt}です</>}。</>,
    mid: <>{monthN}は<strong>ほかの11か月のうち{warmer}か月</strong>より暖かく{rainTxt && <>、{cityN}では{rainTxt}です</>}{!rainTxt && 'なります'}。</>,
    low: <>気温で{monthN}が上回るのは<strong>ほかの11か月のうち{warmer}か月</strong>だけです{rainTxt && <>。年間では{rainTxt}です</>}。</>,
  }[band]),
  feelLine: ({ feelK, hi, pos, peakN, delta, wet }) => {
    const open = feelK === 'freezing' ? <>午後でも{hi}を超えるのがやっとで</> : ['hot', 'very-hot'].includes(feelK) ? <>午後は{hi}に達し</> : <>午後は約{hi}で</>;
    const where = {
      peak: '、年間で最も高い気温です。',
      trough: '、年間で最も低い気温です。',
      nearPeak: <>、{peakN}のピークに近い気温です。</>,
      nearTrough: '、年間で最も低い時期に近い気温です。',
      flat: '、ほかの月とほとんど変わりません。',
      middle: <>、{peakN}のピークより約{delta}低い気温です。</>,
    }[pos] || '。';
    const advice = {
      freezing: '昼間でも真冬の寒さを感じます',
      cold: '朝から晩までコートとマフラーが欠かせません',
      chilly: 'しっかりした上着があれば快適に歩けます',
      cool: '一枚羽織れば散策にちょうどよい気候です',
      mild: '軽めの服装で快適に過ごせます',
      warm: '半袖で過ごせる暖かさです',
      hot: '観光は朝か夕方がおすすめです',
      'very-hot': '長時間の屋外は体力を奪うので、午後を避けて計画しましょう',
    }[feelK];
    return <>{open}{where}{wet ? '雨の合間なら、' : ''}{advice}。</>;
  },
  nightLine: ({ night, swing, lo, delta }) => {
    const gap = {
      tiny: '午後との差はほとんどなく',
      small: <>午後より約{delta}低く</>,
      moderate: <>午後より{delta}低く</>,
      clear: <>午後よりはっきり{delta}低く</>,
      big: <>午後から{delta}も大きく下がり</>,
    }[swing];
    const tail = {
      'hard-frost': '、氷点下を大きく下回ります',
      frosty: '、霜がよく降ります',
      cold: '、朝は冷え込みます',
      cool: '、夕方からは羽織りものがあると安心です',
      mild: '、屋外でも快適です',
      warm: '、半袖のままでも過ごせます',
      sultry: '、暑さがほとんど和らぎません',
    }[night];
    return <>夜は約{lo}まで下がり、{gap}{tail}。</>;
  },
  humLine: ({ caseK, h: hum, rel }) => {
    const r = { above: 'で、この街としては湿度が高めです', below: 'で、この街としては乾燥しています' }[rel] || 'です';
    const t = {
      veryHumidHot: '蒸し暑く、気温以上に暑く感じます',
      dampCold: '湿った空気のせいで寒さがより厳しく感じられます',
      dampCool: '湿った空気のせいで、特に風のある日は涼しさが増します',
      humidHot: '暑い時間帯は少しべたつきます',
      humidMild: '空気は湿っていますが、この気温なら重苦しさはあまりありません',
      dryHot: '乾いた暑さなので、思っている以上に水分をとりましょう',
      dry: '肌や唇が乾燥しやすくなります',
      comfortCold: '湿りすぎず乾きすぎず、寒さはからりとしています',
      comfortMild: 'べたつきも乾燥も気になりません',
      comfortHot: '暑くてもべたつきはあまり気になりません',
    }[caseK];
    return `平均湿度は${h.n0(hum)}%${r}。${t}。`;
  },
  rainLine: ({ freq, never, days, n, cityN, top }) => {
    const base = never ? '雨はほとんど降りません' : {
      dry: `雨は少なく、${n}日のうち約${days}日です`,
      occasional: `${n}日のうち約${days}日は雨が降ります`,
      showery: `${n}日のうち約${days}日は雨で、合間に晴れ間もあります`,
      wet: `${n}日のうち約${days}日は雨が降ります`,
    }[freq];
    const t = !top ? '' : top.first ? `。${cityN}で最も${KIND[top.kind]}月です` : `。年間で最も${top.kind === 'wettest' ? '雨の多い' : '乾燥した'}3か月のひとつです`;
    return `${base}${t}`;
  },
  rainJoin: '。',
  stop: '。',
  rainSizeLine: ({ per, sizeK, vs, year }) => {
    const kind = {
      lightCool: '冷たい霧雨が中心です',
      lightWarm: '短いにわか雨が中心です',
      moderateCool: '通り雨というよりしっかり降る雨です',
      moderateWarm: '傘がないと濡れてしまう程度の量です',
      heavyCool: 'ずぶ濡れになるほどの雨です',
      heavyWarm: '強い雨になることが多いです',
    }[sizeK];
    const cmp = { heavier: `この街の平均${year}mmより多めです。`, lighter: `この街の平均${year}mmより少なめです。`, typical: `この街の平均${year}mmとほぼ同じです。` }[vs] || '';
    return `雨の日の降水量は${per}で、${kind}。${cmp}`;
  },
  snowNote: { snow: 'この気温なら、多くは雪として降ると考えられます。', mixed: '一部はみぞれや雪になることがあります。' },
  dayLine: ({ monthN, cityN, rise, set, len, band, dir, amt, pm }) => {
    const lead = { long: 'と長めです', short: 'と短めです', normal: 'です' }[band] || 'です';
    const chg = { barely: `${pm}中旬とほぼ同じです`, shorter: `${pm}中旬より${amt}短くなります`, longer: `${pm}中旬より${amt}長くなります` }[dir];
    return `${monthN}中旬の${cityN}の昼の長さは${len}${lead}。日の出は${rise}ごろ、日の入りは${set}ごろで、${chg}。`;
  },
  sunLine: ({ share, skyK, rel }) => {
    const r = { above: 'で、この街では日差しの多い時期です', below: 'で、この街では日差しの少ない時期です' }[rel] || 'です';
    const sky = { cloudy: '曇りがちです', mixed: '晴れと曇りが半々です', bright: '晴れ間が多くあります', clear: 'おおむね晴れています', showery: '雨の合間に晴れ間がのぞきます', clearDry: 'おおむね晴れていて、雨はまれです', clearSome: '雨の日以外はおおむね晴れています', brightSome: '雨の日の合間に晴れ間があります' }[skyK];
    return `モデルの推定では、日照は昼間の約${share}%${r}。${sky}。`;
  },
  cmpRain: (rain) => (rain === 0 ? '。雨の量はほぼ同じです' : `。雨は${h.n0(Math.abs(rain))}mm${rain > 0 ? '多くなります' : '少なくなります'}`),
  cmpLine: ({ monthN, rankTxt, prevN, delta, warmer, mag, same, rainTxt }) => {
    const first = rankTxt ? `${monthN}は年間で${rankTxt}です。` : '';
    const end = rainTxt ? `${rainTxt}。` : '。';
    if (same) return <>{first}{prevN}とほぼ同じ暖かさです{end}</>;
    const size = { slight: 'わずか', big: '大きく', plain: '' }[mag];
    return <>{first}午後は{prevN}より{size}{delta}{warmer ? '暖かくなります' : '涼しくなります'}{end}</>;
  },
  nextLine: ({ trendK, nextN, temp, rainDir }) => {
    const base = {
      peak: <>ここからは下り坂で、{nextN}はすでに涼しくなり最高気温は{temp}ほどです</>,
      trough: <>ここが底で、{nextN}には約{temp}まで上がります</>,
      warming: <>{nextN}にかけて気温はさらに上がり、約{temp}になります</>,
      cooling: <>{nextN}にかけて気温はさらに下がり、約{temp}になります</>,
      flat: <>{nextN}も気温はほとんど変わらず、{temp}前後です</>,
    }[trendK];
    const r = { wetter: '。雨も増えます', drier: '。雨は減ります' }[rainDir] || '';
    return <>{base}{r}。</>;
  },
  suitWhy: {
    sightseeing: {
      ok: '日中の気温は街歩きにちょうどよい', okCool: '上着があれば歩きやすい', okWarm: '暑めだが街歩きはできる',
      rainSnow: '半分以上の日に雨か雪が降る', rainMostSnow: 'ほとんどの日に雨か雪が降る', rain: '半分以上の日に雨が降る', rainMost: 'ほとんどの日に雨が降る', hot: '昼の暑さで長時間の散策はきつい', cold: '長い散策には寒い', coldHard: '長い散策には寒すぎる',
    },
    parks: {
      ok: '長い散歩やピクニックに快適', okCool: '薄手の羽織りがあれば快適',
      hot: '午後は暑くて屋外に長くいられない', hotHard: '午後は暑すぎて屋外で過ごせない',
      cold: '屋外で長く座るには寒い', coldHard: '屋外で座るには寒すぎる', coldMild: '屋外で長く座るには少し涼しい',
      rain: '雨で屋外の予定が崩れやすい', rainMost: '雨で屋外の予定がほとんど崩れる',
    },
    beach: { ok: '暖かく、海沿いはおおむね乾いている', hot: '海沿いも暑い', cold: '海風が涼しすぎる', coldHard: 'ビーチには寒すぎる', rain: '雨の日が多すぎる', rainMost: 'ほぼ毎日雨' },
    hiking: { ok: 'トレイルに穏やかな気温', cold: 'トレイルは涼しい', coldHard: 'トレイルは寒いので防寒が必要', hot: '長いハイキングには暑すぎる', rain: 'トレイルがぬかるむ', rainMost: 'トレイルが乾きにくい' },
    indoor: { rainSnow: 'ほぼ毎日雨か雪なので、美術館や博物館が手軽', rain: 'ほぼ毎日雨なので、美術館や博物館が手軽', hot: '暑い時間帯の涼しい休憩に', cold: '寒い時間帯を暖かく過ごせる' },
  },
  tips: {
    layers: {
      big: '午後と夜の気温差が大きいので、昼に脱いで夕方にまた着られる服を。',
      cold: '朝晩は昼間に比べて冷えるので、重ね着がおすすめです。',
      mild: '昼は夜よりはっきり暖かいので、脱ぎ着しやすい服を。',
    },
    rain: {
      showeryLight: 'にわか雨は弱いことが多く、折りたたみ傘で十分です。',
      showeryModerate: '雨の日に備えて、小さな傘をかばんに入れておきましょう。',
      showeryHeavy: '降ると強いことがあるので、薄手のレインジャケットを。',
      wetLight: '霧雨が多いので、たためるレインジャケットが役立ちます。',
      wetModerate: '雨が多いので、レインジャケットと水たまりに強い靴を。',
      wetHeavy: '雨が多く強いので、しっかりした雨具と乾きやすい靴を。',
      wintry: '雨や雪が多いので、防水の上着と滑りにくいブーツを。',
    },
    sun: {
      extreme: '猛暑です。帽子、日焼け止め、ゆったりした服、十分な水を。',
      humid: 'ゆったりした通気性のよい服に、日焼け止めとつばの広い帽子を。',
      dry: '強い日差しと乾燥に備えて、帽子、日焼け止め、十分な水を。',
      clear: '日焼け止め、帽子、サングラスに、軽くて通気性のよい服を。',
    },
    jacket: {
      cold: '朝の冷え込みに上着を。日中は持ち歩きやすいものが便利です。',
      cool: '一日の大半は薄手の上着やニットで十分です。',
      mild: '涼しい午後に備えて、セーターか薄手のコートを。',
    },
    warm: {
      freezing: '本格的な冬用コートに手袋と帽子、凍った道に備えて暖かい靴を。',
      cold: '本格的な冬用コートに、早朝用の手袋と帽子を。',
      frost: '霜の降りる朝に、暖かい上着と帽子、手袋を。',
      chilly: '冷える朝晩に、暖かい上着と帽子を。',
    },
    shades: {
      clear: '晴れることが多いので、サングラスと薄手の帽子があると便利です。',
      bright: '晴れ間が多いので、サングラスとキャップを。',
      mixed: '日差しは出たり隠れたりですが、サングラスはあると安心です。',
    },
    light: { any: '動きやすい服に、夜用の薄手の羽織りを。' },
    shoes: { any: '雨の日が多いので、水たまりに強く乾きやすい靴を。', heavy: '強い雨が多いので、防水の靴と替えの靴下を。', snow: 'ぬれた道や凍った道に備えて、滑りにくい防水ブーツを。' },
  },
  a1: ({ hi, lo, feel, warmRank }) => <>午後は平均{hi}、夜は約{lo}で、多くの人にとって{feel}気候です{warmRank && <>。年間で{warmRank}です</>}。</>,
  a2: {
    never: ({ monthN, none }) => <>ほとんど降りません。{monthN}は例年{none ? '雨の日がなく' : '雨の日が1日ほどで'}、ほぼ雨なしです。</>,
    dry: ({ daysTxt, mm }) => <>いいえ。雨の日は約{daysTxt}、月間で{h.n0(mm)}mmだけです。</>,
    yes: ({ mm, often, sizeK }) => <>はい。雨は{often}降り、合計で約{h.n0(mm)}mmです{{ light: '。弱い雨が中心です', moderate: '。傘があると安心です', heavy: '。強く降ることも多いので、屋内の予定も考えておきましょう' }[sizeK]}。</>,
    some: ({ daysTxt, mm, light }) => <>それほどでもありません。雨の日は約{daysTxt}（{h.n0(mm)}mm）で、{light ? '弱い' : '中程度の'}雨が中心です。</>,
  },
  a3: ({ list, eve, cold }) => ({
    cool: <>{list}を用意しましょう。{cold ? '冷え込む' : '涼しい'}朝晩のために、もう一枚あると安心です。</>,
    same: <>{list}を用意しましょう。夜も昼とあまり変わらないので、同じ服装で大丈夫です。</>,
    warm: <>{list}を用意しましょう。日が暮れても暖かいので、羽織りものはなくても過ごせます。</>,
  }[eve]),
  a4: ({ win, ranks, labels, whyTxt, narrow }) => <>当サイトの気候ランキングでは、{win}が{narrow ? 'わずかに' : 'はっきりと'}上です（12か月中{ranks.a}位、もう一方は{ranks.b}位{labels ? `。評価は「${labels[0]}」と「${labels[1]}」` : ''}）。{whyTxt}</>,
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
  polar: {
    day: ({ monthN, cityN }) => `${monthN}中旬の${cityN}では、太陽が沈みません（白夜）。`,
    night: ({ monthN, cityN }) => `${monthN}中旬の${cityN}では、太陽が地平線の上に昇りません（極夜）。`,
  },
  equatorDay: '赤道に近いため、日の出と日の入りの時刻は一年を通してほとんど変わりません。',
  packPhrase: { shoes: '防水の靴', layers: '重ね着できる服', rain: '雨具', sun: '日焼け対策グッズ', jacket: '薄手の上着', warm: '防寒着', shades: 'サングラス', light: '軽装' },
  wear: {
    title: ({ monthN, cityN }) => `${monthN}の${cityN}の服装`,
    basis: '月平均からの推定なので、気温はどれも目安です。',
    h3: { time: '時間帯別', pack: '7日間の持ち物', year: { normal: '寒い年と暖かい年', winter: '寒い年と穏やかな年', cooler: '涼しい年と暑い年', hot: '涼しめの年と猛暑の年' } },
    at: { morning: (t) => <>朝（{t}前後）：</>, afternoon: (t) => <>午後（{t}前後）：</>, evening: (t) => <>夕方（{t}前後）：</> },
    morning: { winter: 'しっかりした冬用コート、手袋、帽子を。', cold: '暖かい上着と帽子に、中にもう一枚。', mild: '薄手の上着かセーターを。', warm: '軽い服に、薄手の羽織りを一枚。', hot: '朝から軽くてゆったりした服を。' },
    afternoon: { winter: '昼間でもコートは脱がずに。', cold: '歩くときは上着のままで、中の一枚は脱いでも大丈夫です。', mild: '軽いトップスで十分で、上着は手元に。', warm: '軽くて通気性のよい服で十分です。', warmSun: '軽い服に、帽子と日焼け止めを。', hot: '帽子、日焼け止め、ゆったりした服に、水分もたっぷりと。' },
    evening: { ice: '再び氷点近くになるので、重ね着はそのままで、凍った歩道に注意を。', winter: '重ね着はそのままで。', cold: '脱いだ一枚をまた着ましょう。', mild: '上着をまた着ましょう。', warm: '薄手の羽織りをまた着ましょう。', warmNight: '同じ軽い服で大丈夫で、羽織りものはいりません。', same: '気温がほとんど変わらないので、同じ服で大丈夫です。' },
    year: {
      normal: ({ monthN, coldY, warmY, cold, warm }) => <>{coldY}年のような寒い年は、{monthN}の平均最高気温が{cold}にとどまるので、暖かい服を一枚多めに。{warmY}年のような暖かい年は{warm}まで上がるので、軽めの一枚で足ります。</>,
      winter: ({ monthN, coldY, warmY, cold, warm }) => <>{coldY}年のような寒い年は、{monthN}の平均最高気温が{cold}にとどまるので、暖かい服を一枚多めに。{warmY}年のような穏やかな年でも{warm}までなので、冬用コートは欠かせません。</>,
      cooler: ({ monthN, coldY, warmY, cold, warm }) => <>{coldY}年のような涼しい年は、{monthN}の平均最高気温が{cold}なので、薄手の一枚を多めに。{warmY}年のような暑い年は{warm}まで上がるので、服は軽めに。</>,
      hot: ({ monthN, coldY, warmY, cold, warm, y1, y2 }) => <>{y1}–{y2}年で最も涼しかった{coldY}年の{monthN}でも平均{cold}、最も暑かった{warmY}年は{warm}でした。どちらにしても、暖かい服はいりません。</>,
    },
    wet: {
      none: '普通の1週間なら雨の日はほぼなく、雨具は置いていけます。',
      some: ({ n, wintry, size, per }) => {
        const tail = !per ? '' : size === 'light' && !wintry ? <>。主に弱い雨で、1日{per}です</> : size === 'heavy' && !wintry ? <>。強く降ることも多く、1日あたり{per}です</> : <>。1日あたり{per}です</>;
        return <>1週間に約{n}日は{wintry ? '雨か雪の日' : '雨の日'}がありそうです{tail}。</>;
      },
    },
    items: { coat: '冬用コート', coatWet: '防水の表地がある冬用コート', midThermal: '暖かい中間着2枚と保温インナー', glovesHat: '手袋と帽子', jacketHat: '暖かい上着と帽子', mid2: '暖かい中間着2枚', lightJacket: '薄手の上着かセーター', lightLayers: '薄手の重ね着2〜3枚', lightClothes: '軽くて通気性のよい服', thinLayer: '朝晩用の薄手の羽織り', looseClothes: 'ゆったりして通気性のよい服', rainJacket: '持ち運びしやすいレインジャケット', sunKit: '帽子、日焼け止め、サングラス', shades: 'サングラスと軽い帽子', bottle: '水筒', boots: '滑りにくい暖かいブーツ', wpShoes: '防水で乾きやすい靴', lightShoes: '軽くて通気性のよい靴', walkShoes: '歩きやすい靴' },
    trip: { lead: '旅行の日程は決まっていますか？', link: '正確な日程は旅行プランナーで確認できます。' },
  },
  hist: {
    title: ({ monthN, cityN, n }) => `${cityN}の${monthN}：${n}年分のデータからわかること`,
    basis: ({ y1, y2 }) => `${y1}–${y2}年の月平均にもとづく数字で、日ごとの記録ではありません。`,
    h3: { range: '例年の範囲', records: '記録', odds: '年ごとの頻度' },
    to: '〜',
    range: ({ monthN, temps, rainLo, rainHi, wintry }) => <>多くの年で、{monthN}の午後の平均は{temps}、{wintry ? '雨や雪' : '雨'}の量は{rainLo}–{rainHi}mmです。</>,
    chance: ({ monthN, often, wintry, never }) => (never ? `平均的な${monthN}には、雨はほとんど降りません。` : `平均的な${monthN}には、${wintry ? '雨か雪が' : '雨が'}${often}降ります。`),
    caption: ({ monthN, y1, y2 }) => `${monthN}の記録、${y1}–${y2}年（月平均）`,
    th: { record: '記録', year: '年', high: '平均最高気温', rain: '降水量', days: '雨の日' },
    record: {
      warm: ({ monthN }) => `最も暖かい${monthN}`, cold: ({ monthN }) => `最も寒い${monthN}`, cool: ({ monthN }) => `最も涼しい${monthN}`,
      wet: ({ monthN }) => `最も雨の多い${monthN}`, dry: ({ monthN }) => `最も乾燥した${monthN}`,
    },
    ties: ({ count, n }) => `${n}年中${count}年`,
    odds: {
      rainy: ({ monthN, count, n, t, wintry }) => `${n}年中${count}年は、${monthN}の${wintry ? '雨や雪の日' : '雨の日'}が${t}日以上でした。`,
      anyrain: ({ monthN, count, n, wintry }) => `${n}年中${count}年は、${monthN}に${wintry ? '雨や雪の日' : '雨の日'}が1日以上ありました。`,
      dry: ({ count, n, t, wintry }) => `${n}年中${count}年は、${wintry ? '雨や雪' : '雨'}の量が${t}mm未満でした。`,
      warm: ({ count, n, temp }) => <>{n}年中{count}年は、平均最高気温が{temp}以上でした。</>,
      cool: ({ count, n, temp }) => <>{n}年中{count}年は、{temp}未満でした。</>,
    },
    latest: ({ monthN, year, dir, rank, total, y1, high, mm, days }) => <>{y1}年以降の{total}年間で、{year}年{monthN}は{dir === 'warm' ? '暖かい' : '寒い'}ほうから{rank}番目でした（{high}{mm ? `、${mm}` : ''}{days != null ? `、雨の日${days}日` : ''}）。</>,
    broke: {
      warm: { beat: ({ monthN, year, y1, y2, value }) => <>{year}年{monthN}は、{y1}–{y2}年のどの{monthN}よりも暖かくなりました（{value}）。</>, match: ({ monthN, year, y1, y2, value }) => <>{year}年{monthN}は、{y1}–{y2}年で最も暖かい{monthN}と並びました（{value}）。</> },
      cold: { beat: ({ monthN, year, y1, y2, value }) => <>{year}年{monthN}は、{y1}–{y2}年のどの{monthN}よりも寒くなりました（{value}）。</>, match: ({ monthN, year, y1, y2, value }) => <>{year}年{monthN}は、{y1}–{y2}年で最も寒い{monthN}と並びました（{value}）。</> },
      wet: { beat: ({ monthN, year, y1, y2, value }) => <>{year}年{monthN}は、{y1}–{y2}年のどの{monthN}よりも雨が多くなりました（{value}）。</>, match: ({ monthN, year, y1, y2, value }) => <>{year}年{monthN}は、{y1}–{y2}年で最も雨の多い{monthN}と並びました（{value}）。</> },
      dry: { beat: ({ monthN, year, y1, y2, value }) => <>{year}年{monthN}は、{y1}–{y2}年のどの{monthN}よりも乾燥しました（{value}）。</>, match: ({ monthN, year, y1, y2, value }) => <>{year}年{monthN}は、{y1}–{y2}年で最も乾燥した{monthN}と並びました（{value}）。</> },
    },
  },
  q1: ({ monthN, cityN }) => `${monthN}の${cityN}の気温はどのくらい？`,
  q2: ({ monthN, cityN }) => `${monthN}の${cityN}は雨が多い？`,
  q3: ({ monthN, cityN }) => `${monthN}の${cityN}旅行の服装・持ち物は？`,
  q4: ({ monthN, nextN, cityN }) => `${cityN}に行くなら${monthN}と${nextN}、どちらがいい？`,
  nextWhy: ({ nextN, why }) => {
    const parts = why.map((w) => ({ warmer: '暖かく', cooler: '涼しく', fewerRain: '雨の日が少なく', moreRain: '雨の日が多く' }[w]));
    return `${nextN}は${parts.join('、')}なります。`;
  },
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
