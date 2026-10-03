import apiClient from './apiClient';
import { ENDPOINTS } from '../config/endpoints';

export const registerUser = (payload) =>
  apiClient.post(ENDPOINTS.auth.register, payload).then((res) => res.data);

export const verifyOtp = (payload) =>
  apiClient.post(ENDPOINTS.auth.verifyOtp, payload).then((res) => res.data);

export const loginUser = (payload) =>
  apiClient.post(ENDPOINTS.auth.login, payload).then((res) => res.data);

// Google ka id_token backend ko bhejte hain; backend use Google ke sath
// verify karta hai aur hamare apne JWT tokens wapas deta hai.
// Response: { access_token, refresh_token, username, email, plan, created }
export const googleLogin = (idToken) =>
  apiClient
    .post(ENDPOINTS.auth.googleLogin, { id_token: idToken })
    .then((res) => res.data);

export const generateApiKey = (payload) =>
  apiClient.post(ENDPOINTS.apiKeys.generate, payload).then((res) => res.data);

export const listApiKeys = () =>
  apiClient.get(ENDPOINTS.apiKeys.list).then((res) => res.data);
