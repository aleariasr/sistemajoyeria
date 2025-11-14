import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Joyas
export const obtenerJoyas = (filtros = {}) => {
  return axios.get(`${API_URL}/joyas`, { params: filtros });
};

export const obtenerJoya = (id) => {
  return axios.get(`${API_URL}/joyas/${id}`);
};

export const crearJoya = (joyaData) => {
  return axios.post(`${API_URL}/joyas`, joyaData);
};

export const actualizarJoya = (id, joyaData) => {
  return axios.put(`${API_URL}/joyas/${id}`, joyaData);
};

export const eliminarJoya = (id) => {
  return axios.delete(`${API_URL}/joyas/${id}`);
};

export const obtenerCategorias = () => {
  return axios.get(`${API_URL}/joyas/categorias`);
};

export const obtenerTiposMetal = () => {
  return axios.get(`${API_URL}/joyas/tipos-metal`);
};

export const obtenerJoyasStockBajo = () => {
  return axios.get(`${API_URL}/joyas/stock-bajo`);
};

// Movimientos
export const obtenerMovimientos = (filtros = {}) => {
  return axios.get(`${API_URL}/movimientos`, { params: filtros });
};

export const crearMovimiento = (movimientoData) => {
  return axios.post(`${API_URL}/movimientos`, movimientoData);
};

// Reportes
export const obtenerReporteInventario = () => {
  return axios.get(`${API_URL}/reportes/inventario`);
};

export const obtenerReporteStockBajo = () => {
  return axios.get(`${API_URL}/reportes/stock-bajo`);
};
