import axios from "axios";

const apiBase =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "/api/v1";

export const api = axios.create({
  baseURL: apiBase,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("yoga_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("yoga_token");
      localStorage.removeItem("yoga_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  }
);

export function apiError(err, fallback) {
  return err.response?.data?.message || fallback || "Something went wrong.";
}
