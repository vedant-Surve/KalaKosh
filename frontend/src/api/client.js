import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "https://kalakosh-2.onrender.com";

export function resolveAssetUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/static/")) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

const client = axios.create({
  baseURL: API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("kalakosh_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize backend error details into a plain message string for the UI.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((d) => d.msg).join(", ")
      : detail || error.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default client;
