import apiClient from './apiClient';
import { ENDPOINTS, SITE_API_BASE } from '../config/endpoints';

const baseURL = SITE_API_BASE;

export const fetchCurrentWeather = (city) =>
  apiClient.get(ENDPOINTS.weather.current, { baseURL, params: { city } })
    .then(res => res.data);

export const fetchTripPlan = (city, start, end) =>
  apiClient.get(ENDPOINTS.trips.plan, { baseURL, params: { city, start, end } })
    .then(res => res.data);

export const fetchCountryRecommend = (country, start, end) =>
  apiClient.get(ENDPOINTS.trips.recommend, { baseURL, params: { country, start, end } })
    .then(res => res.data);

// `signal` (AbortController) — purani, ab-bekaar request cancel ho jaye
export const fetchCitySuggestions = (q, { signal } = {}) =>
  apiClient.get(ENDPOINTS.trips.citySearch, { baseURL, params: { q }, signal })
    .then(res => res.data);

export const fetchEventRisk = ({ city, date, type, time }) => {
  const params = { city, date, type };
  if (time) params.time = time;
  return apiClient.get(ENDPOINTS.events.risk, { baseURL, params })
    .then(res => res.data);
};
