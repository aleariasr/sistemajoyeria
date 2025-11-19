import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerClientes, eliminarCliente } from '../services/api';
import '../styles/Clientes.css';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    cargarClientes();
  }, [paginaActual, busqueda]);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const response = await obtenerClientes({
        busqueda,
        pagina: paginaActual,
        por_pagina: 20
      });
      setClientes(response.data.clientes);
      setTotalPaginas(response.data.total_paginas);
      setError('');
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setError('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  const handleEliminar = async (id, nombre) => {
    if (window.confirm(`¿Está seguro de eliminar al cliente "${nombre}"?`)) {
      try {
        await eliminarCliente(id);
        cargarClientes();
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        setError('Error al eliminar el cliente');
      }
    }
  };

  const handleEditar = (id) => {
    navigate(`/editar-cliente/${id}`);
  };

  const handleNuevoCliente = () => {
    navigate('/nuevo-cliente');
  };

  const handleVerCuentas = (id) => {
    navigate(`/cuentas-por-cobrar?cliente=${id}`);
  };

  if (loading) {
    return (
      <div className="clientes-container">
        <div className="loading">Cargando clientes...</div>
      </div>
    );
  }

  return (
    <div className="clientes-container">
      <div className="clientes-header">
        <div className="title-section">
          <h2>👥 Clientes</h2>
          <p>Gestión de clientes para ventas a crédito</p>
        </div>
        <button className="btn-nuevo" onClick={handleNuevoCliente}>
          ➕ Nuevo Cliente
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, cédula o teléfono..."
          value={busqueda}
          onChange={handleBusquedaChange}
        />
      </div>

      {clientes.length === 0 ? (
        <div className="empty-state">
          <p>No hay clientes registrados</p>
          <button className="btn-primary" onClick={handleNuevoCliente}>
            Crear primer cliente
          </button>
        </div>
      ) : (
        <>
          <div className="clientes-table">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <strong>{cliente.nombre}</strong>
                    </td>
                    <td>{cliente.cedula}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.email || '-'}</td>
                    <td className="actions">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => handleVerCuentas(cliente.id)}
                        title="Ver cuentas"
                      >
                        💰
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditar(cliente.id)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleEliminar(cliente.id, cliente.nombre)}
                        title="Eliminar"
                      >
                        🗑️
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

export default Clientes;
