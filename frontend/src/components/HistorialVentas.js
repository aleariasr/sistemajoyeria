import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/HistorialVentas.css';

function HistorialVentas() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    metodo_pago: ''
  });
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    total_paginas: 1
  });

  const cargarVentas = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filtros,
        pagina: paginacion.pagina,
        por_pagina: 20
      };

      const response = await api.get('/ventas', { params });
      setVentas(response.data.ventas || []);
      setPaginacion({
        pagina: response.data.pagina,
        total_paginas: response.data.total_paginas
      });
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoading(false);
    }
  }, [filtros, paginacion.pagina]);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  const verDetalleVenta = (id) => {
    navigate(`/venta/${id}`);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMetodoPago = (metodo) => {
    const iconos = {
      'Efectivo': '💵',
      'Tarjeta': '💳',
      'Transferencia': '🏦',
      'Mixto': '💰'
    };
    return `${iconos[metodo] || ''} ${metodo}`;
  };

  const formatearTipoVenta = (tipo) => {
    if (tipo === 'Credito') {
      return '📝 Crédito';
    }
    return '💰 Contado';
  };

  return (
    <div className="historial-container">
      <div className="page-header">
        <h1>📊 Historial de Ventas</h1>
        <p>Consulta el historial completo de ventas realizadas</p>
      </div>

      <div className="filtros-section">
        <div className="filtro-grupo">
          <label>Desde:</label>
          <input
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
          />
        </div>
        <div className="filtro-grupo">
          <label>Hasta:</label>
          <input
            type="date"
            value={filtros.fecha_hasta}
            onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
          />
        </div>
        <div className="filtro-grupo">
          <label>Método de Pago:</label>
          <select
            value={filtros.metodo_pago}
            onChange={(e) => setFiltros({ ...filtros, metodo_pago: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Mixto">Mixto</option>
          </select>
        </div>
        <button 
          onClick={() => setFiltros({ fecha_desde: '', fecha_hasta: '', metodo_pago: '' })}
          className="btn-limpiar"
        >
          Limpiar
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando ventas...</div>
      ) : ventas.length === 0 ? (
        <div className="no-resultados">
          <p>No se encontraron ventas con los filtros seleccionados</p>
        </div>
      ) : (
        <>
          <div className="tabla-ventas">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  {isAdmin() && <th>Usuario</th>}
                  <th>Tipo</th>
                  <th>Método de Pago</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map(venta => (
                  <tr key={venta.id} style={venta.es_venta_dia ? { backgroundColor: '#e8f5e9' } : {}}>
                    <td>
                      {venta.id}
                      {venta.es_venta_dia && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          fontSize: '0.75em',
                          fontWeight: 'bold'
                        }}>
                          📋 Del Día
                        </span>
                      )}
                    </td>
                    <td>{formatearFecha(venta.fecha_venta)}</td>
                    {isAdmin() && <td>{venta.nombre_usuario || venta.usuario}</td>}
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: venta.tipo_venta === 'Credito' ? '#fff3cd' : '#d4edda',
                        color: '#000',
                        fontSize: '0.85em'
                      }}>
                        {formatearTipoVenta(venta.tipo_venta)}
                      </span>
                    </td>
                    <td>{formatearMetodoPago(venta.metodo_pago)}</td>
                    <td className="precio">₡{venta.total.toFixed(2)}</td>
                    <td>
                      <button 
                        onClick={() => verDetalleVenta(venta.id)}
                        className="btn-ver"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginacion.total_paginas > 1 && (
            <div className="paginacion">
              <button
                onClick={() => setPaginacion({ ...paginacion, pagina: paginacion.pagina - 1 })}
                disabled={paginacion.pagina === 1}
                className="btn-paginacion"
              >
                Anterior
              </button>
              <span>Página {paginacion.pagina} de {paginacion.total_paginas}</span>
              <button
                onClick={() => setPaginacion({ ...paginacion, pagina: paginacion.pagina + 1 })}
                disabled={paginacion.pagina === paginacion.total_paginas}
                className="btn-paginacion"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HistorialVentas;
