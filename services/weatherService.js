import apiClient from './apiClient';
import { ENDPOINTS } from '../config/endpoints';

export const fetchCurrentWeather = (city) =>
  apiClient.get(ENDPOINTS.weather.current, { params: { city } })
    .then(res => res.data);

export const fetchTripPlan = (city, start, end) =>
  apiClient.get(ENDPOINTS.trips.plan, { params: { city, start, end } })
    .then(res => res.data);

export const fetchCountryRecommend = (country, start, end) =>
  apiClient.get(ENDPOINTS.trips.recommend, { params: { country, start, end } })
    .then(res => res.data);

export const fetchCitySuggestions = (q) =>
  apiClient.get(ENDPOINTS.trips.citySearch, { params: { q } })
    .then(res => res.data);

export const fetchEventRisk = ({ city, date, type, time }) => {
  const params = { city, date, type };
  if (time) params.time = time;
  return apiClient.get(ENDPOINTS.events.risk, { params })
    .then(res => res.data);
};
