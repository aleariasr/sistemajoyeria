import axios from 'axios';

function getApiUrl() {
  // 1. Producción con Vite (Railway)
  if (import.meta?.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Producción con CRA
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 3. Local: usar automatic detection
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  // Local → backend está en puerto 3001
  return `${protocol}//${hostname}:3001/api`;
}

const API_URL = getApiUrl();
console.log("🌐 API_URL detectada:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("❌ Error respuesta backend:", error.response.data);
    } else if (error.request) {
      console.error("❌ No hay respuesta del backend");
    } else {
      console.error("❌ Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

// ------- JOYAS -------
export const obtenerJoyas = (filtros = {}) => api.get('/joyas', { params: filtros });
export const obtenerJoya = (id) => api.get(`/joyas/${id}`);
export const crearJoya = (joyaData) => api.post('/joyas', joyaData);
export const actualizarJoya = (id, joyaData) => api.put(`/joyas/${id}`, joyaData);
export const eliminarJoya = (id) => api.delete(`/joyas/${id}`);
export const obtenerCategorias = () => api.get('/joyas/categorias');
export const obtenerJoyasStockBajo = () => api.get('/joyas/stock-bajo');

// ------- MOVIMIENTOS -------
export const obtenerMovimientos = (filtros = {}) => api.get('/movimientos', { params: filtros });
export const crearMovimiento = (data) => api.post('/movimientos', data);

// ------- REPORTES -------
export const obtenerReporteInventario = () => api.get('/reportes/inventario');
export const obtenerReporteStockBajo = () => api.get('/reportes/stock-bajo');

// ------- CIERRE DE CAJA -------
export const obtenerVentasDia = () => api.get('/cierrecaja/ventas-dia');
export const obtenerResumenDia = () => api.get('/cierrecaja/resumen-dia');
export const cerrarCaja = () => api.post('/cierrecaja/cerrar-caja');

// ------- CLIENTES -------
export const obtenerClientes = (filtros = {}) => api.get('/clientes', { params: filtros });
export const obtenerCliente = (id) => api.get(`/clientes/${id}`);
export const buscarClientes = (termino) => api.get('/clientes/buscar', { params: { q: termino } });
export const crearCliente = (clienteData) => api.post('/clientes', clienteData);
export const actualizarCliente = (id, data) => api.put(`/clientes/${id}`, data);
export const eliminarCliente = (id) => api.delete(`/clientes/${id}`);

// ------- CUENTAS POR COBRAR -------
export const obtenerCuentasPorCobrar = (filtros = {}) => api.get('/cuentas-por-cobrar', { params: filtros });
export const obtenerCuentaPorCobrar = (id) => api.get(`/cuentas-por-cobrar/${id}`);
export const obtenerResumenCuentasPorCobrar = () => api.get('/cuentas-por-cobrar/resumen');
export const obtenerCuentasPorCliente = (id_cliente) => api.get(`/cuentas-por-cobrar/cliente/${id_cliente}`);
export const registrarAbono = (id_cuenta, data) => api.post(`/cuentas-por-cobrar/${id_cuenta}/abonos`, data);
