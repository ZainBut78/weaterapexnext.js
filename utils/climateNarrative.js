const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// fmtTemp: °C value → text (default "21.9°C"). City page par browser
// isay user ki unit (°C/°F) mein banata hai — audit 3.2.
const defaultFmt = (c) => `${c}°C`;

export function generateClimateNarrative(cityName, monthlyData, fmtTemp = defaultFmt) {
  if (!monthlyData || monthlyData.length < 12) {
    return `${cityName} has a varied climate throughout the year, with monthly temperature and rainfall patterns best viewed in the charts below.`;
  }

  const withHighs = monthlyData.filter((m) => m && typeof m.avg_high === 'number');
  const withRain = monthlyData.filter((m) => m && typeof m.avg_rainfall === 'number');

  const hottest = withHighs.reduce((a, b) => (a.avg_high > b.avg_high ? a : b));
  const coldest = withHighs.reduce((a, b) => (a.avg_high < b.avg_high ? a : b));
  const wettest = withRain.reduce((a, b) => (a.avg_rainfall > b.avg_rainfall ? a : b));
  const driest = withRain.reduce((a, b) => (a.avg_rainfall < b.avg_rainfall ? a : b));

  return `${cityName} experiences its warmest weather in ${MONTH_NAMES[hottest.month - 1]}, with average highs reaching ${fmtTemp(hottest.avg_high)}. The coolest month is typically ${MONTH_NAMES[coldest.month - 1]}, averaging ${fmtTemp(coldest.avg_high)}. Rainfall is heaviest in ${MONTH_NAMES[wettest.month - 1]} (around ${wettest.avg_rainfall}mm), while ${MONTH_NAMES[driest.month - 1]} tends to be the driest month of the year with approximately ${driest.avg_rainfall}mm of precipitation.`;
}

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
