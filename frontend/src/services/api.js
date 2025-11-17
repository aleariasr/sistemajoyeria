import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Crear instancia de axios con la URL base
const api = axios.create({
  baseURL: API_URL,
});

// Configurar interceptor para manejo de errores global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error de respuesta:', error.response.data);
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      console.error('Error de conexión: No se pudo conectar con el servidor');
    } else {
      // Algo pasó al configurar la petición
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Exportar instancia como default para compatibilidad con imports existentes
export default api;

// Joyas
export const obtenerJoyas = (filtros = {}) => {
  return api.get('/joyas', { params: filtros });
};

export const obtenerJoya = (id) => {
  return api.get(`/joyas/${id}`);
};

export const crearJoya = (joyaData) => {
  return api.post('/joyas', joyaData);
};

export const actualizarJoya = (id, joyaData) => {
  return api.put(`/joyas/${id}`, joyaData);
};

export const eliminarJoya = (id) => {
  return api.delete(`/joyas/${id}`);
};

export const obtenerCategorias = () => {
  return api.get('/joyas/categorias');
};

export const obtenerTiposMetal = () => {
  return api.get('/joyas/tipos-metal');
};

export const obtenerJoyasStockBajo = () => {
  return api.get('/joyas/stock-bajo');
};

// Movimientos
export const obtenerMovimientos = (filtros = {}) => {
  return api.get('/movimientos', { params: filtros });
};

export const crearMovimiento = (movimientoData) => {
  return api.post('/movimientos', movimientoData);
};

// Reportes
export const obtenerReporteInventario = () => {
  return api.get('/reportes/inventario');
};

export const obtenerReporteStockBajo = () => {
  return api.get('/reportes/stock-bajo');
};

