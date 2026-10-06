import { useQuery } from '@tanstack/react-query';
import { fetchCurrentWeather } from '../services/weatherService';

export const useCurrentWeather = (city) => {
  return useQuery({
    queryKey: ['currentWeather', city],
    queryFn: () => fetchCurrentWeather(city),
    enabled: !!city,
    staleTime: 1000 * 60 * 60 * 3,
    // 4xx (shehar nahi mila / limit) dobara bhejne se nahi badalta — pehle
    // react-query 3 dafa retry karta tha: ghalat spelling par 4 geocoding
    // calls aur message ~7 second baad. Ab sirf network/5xx par 1 retry.
    retry: (count, err) => {
      const status = err?.response?.status;
      return (!status || status >= 500) && count < 1;
    },
  });
};
