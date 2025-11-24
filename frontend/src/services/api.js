import axios from 'axios';

function getApiUrl() {
  // 1. Producción con Vite (Railway)
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Producción con CRA (Railway)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 3. Local con IP o localhost
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  // Local USES :3001/api
  return `${protocol}//${hostname}:3001/api`;
}

const API_URL = getApiUrl();

console.log("🌐 API_URL detectada:", API_URL);

const api = axios.create({
  baseURL: API_URL,       // SIEMPRE debe terminar en /api
  withCredentials: true   // NECESARIO para sesiones
});

// Interceptor de errores
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      console.error("❌ Error respuesta:", err.response.data);
    } else if (err.request) {
      console.error("❌ Error conexión: No hay respuesta del servidor");
    } else {
      console.error("❌ Error:", err.message);
    }
    return Promise.reject(err);
  }
);

export default api;
