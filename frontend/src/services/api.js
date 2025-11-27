import axios from 'axios';

// Detectar URL del backend correctamente en CRA + Railway
function getApiUrl() {
  // 1. Producción (Railway) usando variable REACT_APP_API_URL
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. Local: usar :3001/api siempre
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  return `${protocol}//${hostname}:3001/api`;
}

const API_URL = getApiUrl();

console.log("🌐 API_URL detectada:", API_URL);

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Manejo global de errores
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      console.error("❌ Error servidor:", err.response.data);
    } else if (err.request) {
      console.error("❌ No hay respuesta del backend");
    } else {
      console.error("❌ Error:", err.message);
    }
    return Promise.reject(err);
  }
);

export default api;

// ------- JOYAS -------
export const obtenerJoyas = (filtros = {}) => api.get('/joyas', { params: filtros });
export const obtenerJoya = (id) => api.get(`/joyas/${id}`);
export const crearJoya = (data) => api.post('/joyas', data);
export const actualizarJoya = (id, data) => api.put(`/joyas/${id}`, data);
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
export const obtenerCierresHistorico = (filtros = {}) => api.get('/cierrecaja/historico', { params: filtros });

// ------- CLIENTES -------
export const obtenerClientes = (filtros = {}) => api.get('/clientes', { params: filtros });
export const obtenerCliente = (id) => api.get(`/clientes/${id}`);
export const buscarClientes = (t) => api.get('/clientes/buscar', { params: { q: t } });
export const crearCliente = (data) => api.post('/clientes', data);
export const actualizarCliente = (id, data) => api.put(`/clientes/${id}`, data);
export const eliminarCliente = (id) => api.delete(`/clientes/${id}`);

// ------- CUENTAS POR COBRAR -------
export const obtenerCuentasPorCobrar = (filtros = {}) => api.get('/cuentas-por-cobrar', { params: filtros });
export const obtenerCuentaPorCobrar = (id) => api.get(`/cuentas-por-cobrar/${id}`);
export const obtenerResumenCuentasPorCobrar = () => api.get('/cuentas-por-cobrar/resumen');
export const obtenerCuentasPorCliente = (id_cliente) => api.get(`/cuentas-por-cobrar/cliente/${id_cliente}`);
export const registrarAbono = (id_cuenta, data) => api.post(`/cuentas-por-cobrar/${id_cuenta}/abonos`, data);

// ------- INGRESOS EXTRAS -------
export const obtenerIngresosExtras = (filtros = {}) => api.get('/ingresos-extras', { params: filtros });
export const obtenerIngresoExtra = (id) => api.get(`/ingresos-extras/${id}`);
export const crearIngresoExtra = (data) => api.post('/ingresos-extras', data);
export const obtenerResumenIngresosExtras = (filtros = {}) => api.get('/ingresos-extras/resumen', { params: filtros });

// ------- DEVOLUCIONES -------
export const obtenerDevoluciones = (filtros = {}) => api.get('/devoluciones', { params: filtros });
export const obtenerDevolucion = (id) => api.get(`/devoluciones/${id}`);
export const crearDevolucion = (data) => api.post('/devoluciones', data);
export const procesarDevolucion = (id, data) => api.post(`/devoluciones/${id}/procesar`, data);
export const obtenerDevolucionesPorVenta = (idVenta) => api.get(`/devoluciones/venta/${idVenta}`);
export const obtenerResumenDevoluciones = (filtros = {}) => api.get('/devoluciones/resumen', { params: filtros });
