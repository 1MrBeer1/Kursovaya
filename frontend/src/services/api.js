import axios from "axios";

// Определяем базовый URL:
// 1) REACT_APP_API_URL из .env (например, https://your-tunnel.ngrok-free.app)
// 2) или тот же хост, но порт 8000 (если бекенд на том же сервере)
const apiBase =
  process.env.REACT_APP_API_URL ||
  // если локально — используем порт 8000
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    // иначе дергаем тот же хост/порт, на котором открыт фронт (ожидается, что туннель проксирует на бэкенд)
    : `${window.location.protocol}//${window.location.host}`);

const api = axios.create({
  baseURL: apiBase,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
