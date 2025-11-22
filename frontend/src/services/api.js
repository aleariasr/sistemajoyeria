import axios from 'axios';

// Detectar automáticamente la URL del backend basándose en el host actual
// Esto permite acceso desde múltiples dispositivos en la red local
const getApiUrl = () => {
  return "/api"; // Nginx manda esto al backend automáticamente
};

const API_URL = getApiUrl();

// Crear instancia de axios con la URL base
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
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
  // No configurar Content-Type manualmente para FormData
  // El navegador lo establece automáticamente con el boundary correcto
  return api.post('/joyas', joyaData);
};

export const actualizarJoya = (id, joyaData) => {
  // No configurar Content-Type manualmente para FormData
  // El navegador lo establece automáticamente con el boundary correcto
  return api.put(`/joyas/${id}`, joyaData);
};

export const eliminarJoya = (id) => {
  return api.delete(`/joyas/${id}`);
};

export const obtenerCategorias = () => {
  return api.get('/joyas/categorias');
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

// Cierre de Caja
export const obtenerVentasDia = () => {
  return api.get('/cierrecaja/ventas-dia');
};

export const obtenerResumenDia = () => {
  return api.get('/cierrecaja/resumen-dia');
};

export const cerrarCaja = () => {
  return api.post('/cierrecaja/cerrar-caja');
};

// Clientes
export const obtenerClientes = (filtros = {}) => {
  return api.get('/clientes', { params: filtros });
};

export const obtenerCliente = (id) => {
  return api.get(`/clientes/${id}`);
};

export const buscarClientes = (termino) => {
  return api.get('/clientes/buscar', { params: { q: termino } });
};

export const crearCliente = (clienteData) => {
  return api.post('/clientes', clienteData);
};

export const actualizarCliente = (id, clienteData) => {
  return api.put(`/clientes/${id}`, clienteData);
};

export const eliminarCliente = (id) => {
  return api.delete(`/clientes/${id}`);
};

// Cuentas por Cobrar
export const obtenerCuentasPorCobrar = (filtros = {}) => {
  return api.get('/cuentas-por-cobrar', { params: filtros });
};

export const obtenerCuentaPorCobrar = (id) => {
  return api.get(`/cuentas-por-cobrar/${id}`);
};

export const obtenerResumenCuentasPorCobrar = () => {
  return api.get('/cuentas-por-cobrar/resumen');
};

export const obtenerCuentasPorCliente = (id_cliente) => {
  return api.get(`/cuentas-por-cobrar/cliente/${id_cliente}`);
};

export const registrarAbono = (id_cuenta, abonoData) => {
  return api.post(`/cuentas-por-cobrar/${id_cuenta}/abonos`, abonoData);
};
