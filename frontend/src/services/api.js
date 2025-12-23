import axios from 'axios';

/**
 * Detectar URL del backend automáticamente
 * 
 * Orden de prioridad:
 * 1. Variable de entorno REACT_APP_API_URL (para producción)
 * 2. Detección automática basada en el hostname actual
 *    - Si accede desde localhost: usa localhost:3001
 *    - Si accede desde IP local (192.168.x.x, 10.x.x.x, etc): usa la misma IP con puerto 3001
 *    - Si está en Vercel: requiere REACT_APP_API_URL configurada
 */
function getApiUrl() {
  // 1. Variable de entorno tiene prioridad máxima
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. Detectar entorno de producción (Vercel)
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.warn('⚠️ REACT_APP_API_URL no configurada. Configure esta variable para el deploy en producción.');
    // En producción sin configurar, las llamadas fallarán
    return '/api'; // Fallback que causará error 404, pero es mejor que hardcodear URLs
  }

  // 3. Desarrollo local - detectar automáticamente basado en cómo se accede
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Si es localhost o 127.0.0.1, usar el mismo para el backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3001/api`;
    }
    
    // Si es una IP local (192.168.x.x, 10.x.x.x, 172.16-31.x.x), usar la misma IP
    // Esto permite que dispositivos móviles en la red local se conecten
    // Note: \d{1,3} technically allows 0-999 but invalid IPs won't resolve
    const localIpPattern = /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})$/;
    if (localIpPattern.test(hostname)) {
      return `${protocol}//${hostname}:3001/api`;
    }
    
    // Fallback: usar el hostname actual con puerto 3001
    return `${protocol}//${hostname}:3001/api`;
  }

  // Fallback para SSR o contextos sin window
  return 'http://localhost:3001/api';
}

const API_URL = getApiUrl();

console.log("🌐 API_URL detectada:", API_URL);
console.log("📱 Hostname actual:", typeof window !== 'undefined' ? window.location.hostname : 'N/A');
console.log("🔗 Protocolo:", typeof window !== 'undefined' ? window.location.protocol : 'N/A');

// Guardar la URL para referencia en caso de errores
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    localStorage.setItem('lastApiUrl', API_URL);
  } catch (e) {
    console.warn('No se pudo guardar API URL en localStorage:', e);
  }
}

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Variable para evitar múltiples llamadas de logout simultáneas
let isLoggingOut = false;

// Handler para sesión expirada - será configurado por AuthContext
// Usando una función en lugar de window.onSessionExpired para evitar conflictos globales
let sessionExpiredHandler = null;

export const setSessionExpiredHandler = (handler) => {
  sessionExpiredHandler = handler;
};

// Manejo global de errores con detección de 401 (sesión expirada)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response) {
      console.error("❌ Error servidor:", err.response.status, err.response.data);
      
      // Detectar 401 Unauthorized - sesión expirada
      if (err.response.status === 401 && !isLoggingOut) {
        console.warn("⚠️ Sesión expirada detectada (401), cerrando sesión automáticamente...");
        
        // Evitar loops de logout
        isLoggingOut = true;
        
        // Llamar al handler de sesión expirada si está configurado
        if (sessionExpiredHandler && typeof sessionExpiredHandler === 'function') {
          try {
            await sessionExpiredHandler();
          } catch (logoutError) {
            console.error("Error al cerrar sesión automáticamente:", logoutError);
          }
        } else {
          console.warn("⚠️ Handler de sesión expirada no configurado");
        }
        
        // Reset flag después de un tiempo
        setTimeout(() => {
          isLoggingOut = false;
        }, 2000);
      }
    } else if (err.request) {
      console.error("❌ No hay respuesta del backend. URL intentada:", API_URL);
      console.error("❌ Verifique que el backend esté ejecutándose y sea accesible desde este dispositivo");
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
export const verificarCodigoJoya = (codigo, excluirId = null) => {
  const params = { codigo };
  if (excluirId) params.excluir_id = excluirId;
  return api.get('/joyas/verificar-codigo', { params });
};

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

// ------- PEDIDOS ONLINE -------
export const obtenerPedidosOnline = (filtros = {}) => api.get('/pedidos-online', { params: filtros });
export const obtenerPedidoOnline = (id) => api.get(`/pedidos-online/${id}`);
export const actualizarEstadoPedido = (id, data) => api.patch(`/pedidos-online/${id}/estado`, data);
export const actualizarNotasPedido = (id, data) => api.patch(`/pedidos-online/${id}`, data);
export const obtenerResumenPedidos = () => api.get('/pedidos-online/resumen/stats');

// ------- VARIANTES DE PRODUCTO -------
export const crearVariante = (data) => api.post('/variantes', data);
export const obtenerVariante = (id) => api.get(`/variantes/${id}`);
export const actualizarVariante = (id, data) => api.put(`/variantes/${id}`, data);
export const eliminarVariante = (id) => api.delete(`/variantes/${id}`);
export const obtenerVariantesPorProducto = (idProducto, soloActivas = false) => 
  api.get(`/variantes/producto/${idProducto}`, { params: { activas: soloActivas } });
export const reordenarVariantes = (ordenes) => api.post('/variantes/reordenar', { ordenes });

// ------- PRODUCTOS COMPUESTOS (SETS) -------
export const agregarComponente = (data) => api.post('/productos-compuestos', data);
export const obtenerComponentesSet = (idSet) => api.get(`/productos-compuestos/set/${idSet}`);
export const eliminarComponente = (id) => api.delete(`/productos-compuestos/${id}`);
export const actualizarCantidadComponente = (id, cantidad) => 
  api.put(`/productos-compuestos/${id}/cantidad`, { cantidad });
export const validarStockSet = (idSet, cantidad = 1) => 
  api.get(`/productos-compuestos/validar-stock/${idSet}`, { params: { cantidad } });

// ------- NOTIFICACIONES PUSH -------
export const obtenerVapidPublicKey = () => api.get('/notifications/vapid-public');
export const suscribirseNotificaciones = (subscription) => api.post('/notifications/subscribe', subscription);
export const desuscribirseNotificaciones = (endpoint) => api.delete('/notifications/unsubscribe', { data: { endpoint } });
export const enviarNotificacionPrueba = (data = {}) => api.post('/notifications/test', data);

// ------- GESTIÓN DE SESIÓN -------
export const refreshSession = () => api.post('/auth/refresh-session', {}, { withCredentials: true });
