import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerCuentaPorCobrar, registrarAbono } from '../services/api';
import '../styles/DetalleCuentaPorCobrar.css';

function DetalleCuentaPorCobrar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cuenta, setCuenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormAbono, setMostrarFormAbono] = useState(false);
  const [formAbono, setFormAbono] = useState({
    monto: '',
    metodo_pago: 'Efectivo',
    notas: ''
  });

  useEffect(() => {
    cargarCuenta();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarCuenta = async () => {
    try {
      setLoading(true);
      const response = await obtenerCuentaPorCobrar(id);
      setCuenta(response.data);
      setError('');
    } catch (error) {
      console.error('Error al cargar cuenta:', error);
      setError('Error al cargar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleAbonoChange = (e) => {
    const { name, value } = e.target;
    setFormAbono({
      ...formAbono,
      [name]: value
    });
  };

  const handleRegistrarAbono = async (e) => {
    e.preventDefault();

    if (!formAbono.monto || parseFloat(formAbono.monto) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (parseFloat(formAbono.monto) > parseFloat(cuenta.saldo_pendiente)) {
      setError(`El abono no puede ser mayor al saldo pendiente (${formatearMoneda(cuenta.saldo_pendiente)})`);
      return;
    }

    try {
      setLoading(true);
      await registrarAbono(id, formAbono);
      setMostrarFormAbono(false);
      setFormAbono({ monto: '', metodo_pago: 'Efectivo', notas: '' });
      await cargarCuenta();
    } catch (error) {
      console.error('Error al registrar abono:', error);
      setError(error.response?.data?.error || 'Error al registrar el abono');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0
    }).format(monto || 0);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CR');
  };

  const formatearFechaSolo = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CR');
  };

  if (loading && !cuenta) {
    return (
      <div className="detalle-cuenta-container">
        <div className="loading">Cargando cuenta...</div>
      </div>
    );
  }

  if (!cuenta) {
    return (
      <div className="detalle-cuenta-container">
        <div className="error-message">Cuenta no encontrada</div>
      </div>
    );
  }

  const porcentajePagado = (cuenta.monto_pagado / cuenta.monto_total) * 100;

  return (
    <div className="detalle-cuenta-container">
      <div className="detalle-header">
        <button className="btn-back" onClick={() => navigate('/cuentas-por-cobrar')}>
          ← Volver
        </button>
        <div className="title-section">
          <h2>📄 Detalle de Cuenta por Cobrar</h2>
          <span className={`badge-estado ${cuenta.estado === 'Pagada' ? 'estado-pagada' : 'estado-pendiente'}`}>
            {cuenta.estado}
          </span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="cuenta-info-grid">
        <div className="info-card">
          <h3>👤 Información del Cliente</h3>
          <div className="info-row">
            <span className="label">Nombre:</span>
            <span className="value">{cuenta.nombre_cliente}</span>
          </div>
          <div className="info-row">
            <span className="label">Cédula:</span>
            <span className="value">{cuenta.cedula_cliente}</span>
          </div>
          <div className="info-row">
            <span className="label">Teléfono:</span>
            <span className="value">{cuenta.telefono_cliente}</span>
          </div>
        </div>

        <div className="info-card">
          <h3>💰 Información de la Cuenta</h3>
          <div className="info-row">
            <span className="label">Fecha de Venta:</span>
            <span className="value">{formatearFechaSolo(cuenta.fecha_venta)}</span>
          </div>
          <div className="info-row">
            <span className="label">Fecha de Vencimiento:</span>
            <span className="value">
              {cuenta.fecha_vencimiento ? formatearFechaSolo(cuenta.fecha_vencimiento) : 'No definida'}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Método de Pago Original:</span>
            <span className="value">{cuenta.metodo_pago}</span>
          </div>
        </div>
      </div>

      <div className="resumen-pago">
        <div className="resumen-item total">
          <span className="label">Monto Total:</span>
          <span className="value">{formatearMoneda(cuenta.monto_total)}</span>
        </div>
        <div className="resumen-item pagado">
          <span className="label">Pagado:</span>
          <span className="value">{formatearMoneda(cuenta.monto_pagado)}</span>
        </div>
        <div className="resumen-item saldo">
          <span className="label">Saldo Pendiente:</span>
          <span className="value">{formatearMoneda(cuenta.saldo_pendiente)}</span>
        </div>
      </div>

      <div className="progreso-pago">
        <div className="progreso-bar">
          <div 
            className="progreso-fill" 
            style={{ width: `${porcentajePagado}%` }}
          ></div>
        </div>
        <span className="progreso-text">{porcentajePagado.toFixed(1)}% pagado</span>
      </div>

      {cuenta.estado === 'Pendiente' && (
        <div className="abono-section">
          {!mostrarFormAbono ? (
            <button 
              className="btn-registrar-abono"
              onClick={() => setMostrarFormAbono(true)}
            >
              💵 Registrar Abono
            </button>
          ) : (
            <div className="form-abono">
              <h3>Registrar Nuevo Abono</h3>
              <form onSubmit={handleRegistrarAbono}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="monto">Monto del Abono *</label>
                    <input
                      type="number"
                      id="monto"
                      name="monto"
                      value={formAbono.monto}
                      onChange={handleAbonoChange}
                      step="0.01"
                      min="0"
                      max={cuenta.saldo_pendiente}
                      required
                      placeholder="0.00"
                    />
                    <small>Saldo pendiente: {formatearMoneda(cuenta.saldo_pendiente)}</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="metodo_pago">Método de Pago *</label>
                    <select
                      id="metodo_pago"
                      name="metodo_pago"
                      value={formAbono.metodo_pago}
                      onChange={handleAbonoChange}
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notas">Notas</label>
                  <textarea
                    id="notas"
                    name="notas"
                    value={formAbono.notas}
                    onChange={handleAbonoChange}
                    rows="2"
                    placeholder="Notas sobre el abono (opcional)"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setMostrarFormAbono(false);
                      setFormAbono({ monto: '', metodo_pago: 'Efectivo', notas: '' });
                      setError('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Registrando...' : 'Registrar Abono'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      <div className="historial-abonos">
        <h3>📋 Historial de Abonos</h3>
        {cuenta.abonos && cuenta.abonos.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Método de Pago</th>
                <th>Usuario</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {cuenta.abonos.map((abono) => (
                <tr key={abono.id}>
                  <td>{formatearFecha(abono.fecha_abono)}</td>
                  <td className="monto">{formatearMoneda(abono.monto)}</td>
                  <td>{abono.metodo_pago}</td>
                  <td>{abono.usuario || '-'}</td>
                  <td>{abono.notas || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-abonos">No hay abonos registrados</p>
        )}
      </div>

      {cuenta.movimientos && cuenta.movimientos.length > 0 && (
        <div className="historial-movimientos">
          <h3>📦 Historial de Ventas a Crédito</h3>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Descripción</th>
                <th>Venta #</th>
              </tr>
            </thead>
            <tbody>
              {cuenta.movimientos.map((movimiento) => (
                <tr key={movimiento.id}>
                  <td>{formatearFecha(movimiento.fecha_movimiento)}</td>
                  <td>
                    <span className={`badge-tipo tipo-${movimiento.tipo}`}>
                      {movimiento.tipo === 'venta_credito' ? '🛍️ Venta' : 
                       movimiento.tipo === 'abono' ? '💰 Abono' : '⚙️ Ajuste'}
                    </span>
                  </td>
                  <td className="monto">{formatearMoneda(movimiento.monto)}</td>
                  <td>{movimiento.descripcion || '-'}</td>
                  <td>{movimiento.id_venta ? `#${movimiento.id_venta}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DetalleCuentaPorCobrar;
