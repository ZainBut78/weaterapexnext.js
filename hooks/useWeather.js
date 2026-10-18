import { useQuery } from '@tanstack/react-query';
import { fetchCurrentWeather } from '../services/weatherService';

// Homepage ka default shehar — server HTML isi ka data le kar banta hai (perf,
// Oct 2026): pehli screen JS/API ka intezar nahi karti. Saved shehar koi aur
// ho to client par us ka data aata hai (layout.js ka chhota script tab tak
// London wala card chhupa rakhta hai — flash nahi).
export { DEFAULT_CITY } from '../config/defaults';
const FRESH_MS = 20 * 60 * 1000;

export const useCurrentWeather = (city) => {
  return useQuery({
    queryKey: ['currentWeather', city],
    queryFn: () => fetchCurrentWeather(city),
    enabled: !!city,
    staleTime: 1000 * 60 * 60 * 3,
    // Server HTML wala (ISR) data 20 min se purana ho to browser naya laaye
    refetchOnMount: (q) => Date.now() - q.state.dataUpdatedAt > FRESH_MS,
    // 4xx (shehar nahi mila / limit) dobara bhejne se nahi badalta — pehle
    // react-query 3 dafa retry karta tha: ghalat spelling par 4 geocoding
    // calls aur message ~7 second baad. Ab sirf network/5xx par 1 retry.
    retry: (count, err) => {
      const status = err?.response?.status;
      return (!status || status >= 500) && count < 1;
    },
  });
};
