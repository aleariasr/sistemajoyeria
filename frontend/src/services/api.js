import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Configurar axios para incluir credenciales
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

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
