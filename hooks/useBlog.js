import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { ENDPOINTS } from '../config/endpoints';

// Blog content din mein kai baar nahi badalta — 10 minute stale time
// se page-to-page navigation par dobara call nahi jati.
const BLOG_STALE_MS = 10 * 60 * 1000;

export const useBlogList = (page = 1) =>
  useQuery({
    queryKey: ['blogList', page],
    queryFn: () => apiClient.get(ENDPOINTS.blog.list, { params: { page } }).then((r) => r.data),
    // `keepPreviousData: true` React Query v4 ka option tha. v5 mein woh
    // hata diya gaya, is liye yeh line chup-chaap bekaar padi thi —
    // page badalne par list blank ho jati thi. v5 ka tareeqa
    // placeholderData: keepPreviousData hai.
    placeholderData: keepPreviousData,
    staleTime: BLOG_STALE_MS,
  });

export const useBlogPost = (slug) =>
  useQuery({
    queryKey: ['blogPost', slug],
    queryFn: () => apiClient.get(ENDPOINTS.blog.detail(slug)).then((r) => r.data),
    enabled: !!slug,
    staleTime: BLOG_STALE_MS,
  });
