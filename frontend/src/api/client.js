import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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
