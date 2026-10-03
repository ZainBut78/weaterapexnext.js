import { useQuery } from '@tanstack/react-query';
import { fetchCurrentWeather } from '../services/weatherService';

export const useCurrentWeather = (city) => {
  return useQuery({
    queryKey: ['currentWeather', city],
    queryFn: () => fetchCurrentWeather(city),
    enabled: !!city,
    staleTime: 1000 * 60 * 60 * 3,
  });
};
