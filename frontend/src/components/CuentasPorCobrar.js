import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { obtenerCuentasPorCobrar, obtenerResumenCuentasPorCobrar } from '../services/api';
import '../styles/CuentasPorCobrar.css';

function CuentasPorCobrar() {
  const [cuentas, setCuentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Pendiente');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    cargarDatos();
  }, [paginaActual, filtroEstado, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const idCliente = searchParams.get('cliente');
      
      const [cuentasResponse, resumenResponse] = await Promise.all([
        obtenerCuentasPorCobrar({
          estado: filtroEstado,
          id_cliente: idCliente,
          pagina: paginaActual,
          por_pagina: 20
        }),
        obtenerResumenCuentasPorCobrar()
      ]);

      setCuentas(cuentasResponse.data.cuentas);
      setTotalPaginas(cuentasResponse.data.total_paginas);
      setResumen(resumenResponse.data);
      setError('');
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      setError('Error al cargar las cuentas por cobrar');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (id) => {
    navigate(`/cuenta-por-cobrar/${id}`);
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0
    }).format(monto || 0);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CR');
  };

  const getEstadoClass = (estado) => {
    return estado === 'Pagada' ? 'estado-pagada' : 'estado-pendiente';
  };

  const estaVencida = (fechaVencimiento, estado) => {
    if (estado === 'Pagada') return false;
    if (!fechaVencimiento) return false;
    return new Date(fechaVencimiento) < new Date();
  };

  if (loading) {
    return (
      <div className="cuentas-container">
        <div className="loading">Cargando cuentas por cobrar...</div>
      </div>
    );
  }

  return (
    <div className="cuentas-container">
      <div className="cuentas-header">
        <div className="title-section">
          <h2>💰 Cuentas por Cobrar</h2>
          <p>Gestión de créditos y abonos</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {resumen && (
        <div className="resumen-cards">
          <div className="resumen-card">
            <div className="resumen-icon">📊</div>
            <div className="resumen-info">
              <span className="resumen-label">Total Cuentas</span>
              <span className="resumen-value">{resumen.total_cuentas || 0}</span>
            </div>
          </div>
          <div className="resumen-card pendiente">
            <div className="resumen-icon">⏳</div>
            <div className="resumen-info">
              <span className="resumen-label">Pendientes</span>
              <span className="resumen-value">{resumen.cuentas_pendientes || 0}</span>
              <span className="resumen-monto">{formatearMoneda(resumen.saldo_pendiente_general)}</span>
            </div>
          </div>
          <div className="resumen-card pagada">
            <div className="resumen-icon">✅</div>
            <div className="resumen-info">
              <span className="resumen-label">Pagadas</span>
              <span className="resumen-value">{resumen.cuentas_pagadas || 0}</span>
              <span className="resumen-monto">{formatearMoneda(resumen.monto_pagado_general)}</span>
            </div>
          </div>
          {resumen.cuentas_vencidas > 0 && (
            <div className="resumen-card vencida">
              <div className="resumen-icon">⚠️</div>
              <div className="resumen-info">
                <span className="resumen-label">Vencidas</span>
                <span className="resumen-value">{resumen.cuentas_vencidas}</span>
                <span className="resumen-monto">{formatearMoneda(resumen.monto_vencido)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="filters-bar">
        <select
          value={filtroEstado}
          onChange={(e) => {
            setFiltroEstado(e.target.value);
            setPaginaActual(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Pagada">Pagada</option>
        </select>
      </div>

      {cuentas.length === 0 ? (
        <div className="empty-state">
          <p>No hay cuentas por cobrar</p>
        </div>
      ) : (
        <>
          <div className="cuentas-table">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Cédula</th>
                  <th>Fecha Venta</th>
                  <th>Monto Total</th>
                  <th>Pagado</th>
                  <th>Saldo</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuentas.map((cuenta) => (
                  <tr 
                    key={cuenta.id}
                    className={estaVencida(cuenta.fecha_vencimiento, cuenta.estado) ? 'vencida' : ''}
                  >
                    <td>
                      <strong>{cuenta.nombre_cliente}</strong>
                      {cuenta.telefono_cliente && (
                        <small>📞 {cuenta.telefono_cliente}</small>
                      )}
                    </td>
                    <td>{cuenta.cedula_cliente}</td>
                    <td>{formatearFecha(cuenta.fecha_venta)}</td>
                    <td className="monto">{formatearMoneda(cuenta.monto_total)}</td>
                    <td className="monto pagado">{formatearMoneda(cuenta.monto_pagado)}</td>
                    <td className="monto saldo">
                      <strong>{formatearMoneda(cuenta.saldo_pendiente)}</strong>
                    </td>
                    <td>
                      {cuenta.fecha_vencimiento ? (
                        <>
                          {formatearFecha(cuenta.fecha_vencimiento)}
                          {estaVencida(cuenta.fecha_vencimiento, cuenta.estado) && (
                            <span className="badge-vencida">Vencida</span>
                          )}
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className={`badge-estado ${getEstadoClass(cuenta.estado)}`}>
                        {cuenta.estado}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => handleVerDetalle(cuenta.id)}
                        title="Ver detalle y registrar abono"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
              >
                ← Anterior
              </button>
              <span>
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaActual(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CuentasPorCobrar;
