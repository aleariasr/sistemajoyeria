import React, { useEffect, useState, useCallback } from 'react';
import { obtenerCierresHistorico } from '../services/api';

function HistorialCierres() {
  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [fecha, setFecha] = useState('');
  const [usuario, setUsuario] = useState('');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { pagina, por_pagina: 20 };
      if (fecha) params.fecha = fecha;
      if (usuario) params.usuario = usuario;
      const res = await obtenerCierresHistorico(params);
      setCierres(res.data.cierres || []);
      setTotalPaginas(res.data.total_paginas || 1);
    } catch (e) {
      setError('Error al cargar histórico de cierres');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pagina, fecha, usuario]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div>
      <div className="page-header">
        <h2>Histórico de Cierres de Caja</h2>
        <p>Consulta cierres anteriores con totales y responsable</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-filters">
        <div className="filters-grid">
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => { setFecha(e.target.value); setPagina(1); }} />
          </div>
          <div className="form-group">
            <label>Usuario</label>
            <input type="text" value={usuario} onChange={(e) => { setUsuario(e.target.value); setPagina(1); }} placeholder="Nombre de usuario" />
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner"></div><p>Cargando cierres...</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Efectivo</th>
                  <th>Transferencia</th>
                  <th>Tarjeta</th>
                  <th>Ingresos Extras</th>
                  <th>Total Día</th>
                </tr>
              </thead>
              <tbody>
                {cierres.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.id}</strong></td>
                    <td>{new Date(c.fecha_cierre).toLocaleString('es-CR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{c.usuario}</td>
                    <td>₡{Number(c.total_efectivo_combinado || 0).toFixed(2)}</td>
                    <td>₡{Number(c.total_transferencia_combinado || 0).toFixed(2)}</td>
                    <td>₡{Number(c.total_tarjeta_combinado || 0).toFixed(2)}</td>
                    <td>₡{Number(c.monto_total_ingresos_extras || 0).toFixed(2)}</td>
                    <td><strong>₡{Number(c.total_ingresos_combinado || 0).toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPaginas > 1 && (
          <div className="pagination">
            <button onClick={() => setPagina(pagina - 1)} disabled={pagina === 1}>← Anterior</button>
            <span>Página {pagina} de {totalPaginas}</span>
            <button onClick={() => setPagina(pagina + 1)} disabled={pagina === totalPaginas}>Siguiente →</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistorialCierres;
