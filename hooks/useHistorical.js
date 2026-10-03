import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ENDPOINTS } from '../config/endpoints';

export const useHistoricalData = (city) => {
  return useQuery({
    queryKey: ['historical', city],
    queryFn: () => apiClient.get(ENDPOINTS.weather.history, { params: { city } }).then((r) => r.data),
    enabled: !!city,
    staleTime: 1000 * 60 * 60 * 24,
  });
};
