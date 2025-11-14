import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crearJoya, actualizarJoya, obtenerJoya } from '../services/api';

const CATEGORIAS = ['Anillo', 'Aretes', 'Collar', 'Pulsera', 'Dije', 'Reloj', 'Set', 'Otro'];
const TIPOS_METAL = ['Oro 10k', 'Oro 14k', 'Oro 18k', 'Plata 925', 'Acero', 'Platino', 'Baño de oro', 'Otro'];
const COLORES_METAL = ['dorado', 'plateado', 'rosado', 'blanco', 'negro'];
const PIEDRAS = ['circonia', 'diamante', 'perla', 'esmeralda', 'rubí', 'zafiro', 'sin piedra', 'otro'];
const ESTADOS = ['Activo', 'Descontinuado', 'Agotado'];
const MONEDAS = ['CRC', 'USD'];

function FormularioJoya() {
  const navigate = useNavigate();
  const { id } = useParams();
  const esEdicion = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    tipo_metal: '',
    color_metal: '',
    piedras: '',
    peso_gramos: '',
    talla: '',
    coleccion: '',
    proveedor: '',
    costo: '',
    precio_venta: '',
    moneda: 'CRC',
    stock_actual: '',
    stock_minimo: '5',
    ubicacion: '',
    estado: 'Activo'
  });

  useEffect(() => {
    if (esEdicion) {
      cargarJoya();
    }
  }, [id]);

  const cargarJoya = async () => {
    try {
      setLoading(true);
      const response = await obtenerJoya(id);
      const joya = response.data;
      setFormData({
        codigo: joya.codigo || '',
        nombre: joya.nombre || '',
        descripcion: joya.descripcion || '',
        categoria: joya.categoria || '',
        tipo_metal: joya.tipo_metal || '',
        color_metal: joya.color_metal || '',
        piedras: joya.piedras || '',
        peso_gramos: joya.peso_gramos || '',
        talla: joya.talla || '',
        coleccion: joya.coleccion || '',
        proveedor: joya.proveedor || '',
        costo: joya.costo || '',
        precio_venta: joya.precio_venta || '',
        moneda: joya.moneda || 'CRC',
        stock_actual: joya.stock_actual || '',
        stock_minimo: joya.stock_minimo || '5',
        ubicacion: joya.ubicacion || '',
        estado: joya.estado || 'Activo'
      });
    } catch (err) {
      setErrores(['Error al cargar la joya']);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores([]);
    setMensaje(null);

    try {
      setLoading(true);
      
      if (esEdicion) {
        await actualizarJoya(id, formData);
        setMensaje('Joya actualizada correctamente');
      } else {
        await crearJoya(formData);
        setMensaje('Joya creada correctamente');
      }

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errores) {
        setErrores(err.response.data.errores);
      } else {
        setErrores(['Error al guardar la joya']);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && esEdicion) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando joya...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>{esEdicion ? 'Editar Joya' : 'Nueva Joya'}</h2>
        <p>{esEdicion ? 'Actualiza la información de la joya' : 'Agrega una nueva joya al inventario'}</p>
      </div>

      {errores.length > 0 && (
        <div className="alert alert-error">
          <strong>Errores:</strong>
          <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
            {errores.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '20px', color: '#1a237e' }}>Información Básica</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label>
                Código <span className="required">*</span>
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="Ej: AN-0001"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Nombre <span className="required">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Anillo Solitario Oro 14k"
                required
              />
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select name="categoria" value={formData.categoria} onChange={handleChange}>
                <option value="">Seleccionar</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select name="estado" value={formData.estado} onChange={handleChange}>
                {ESTADOS.map((est) => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Descripción detallada de la joya..."
              rows="3"
            />
          </div>

          <h3 style={{ marginTop: '30px', marginBottom: '20px', color: '#1a237e' }}>Características</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Tipo de Metal</label>
              <select name="tipo_metal" value={formData.tipo_metal} onChange={handleChange}>
                <option value="">Seleccionar</option>
                {TIPOS_METAL.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Color del Metal</label>
              <select name="color_metal" value={formData.color_metal} onChange={handleChange}>
                <option value="">Seleccionar</option>
                {COLORES_METAL.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Piedras</label>
              <select name="piedras" value={formData.piedras} onChange={handleChange}>
                <option value="">Seleccionar</option>
                {PIEDRAS.map((piedra) => (
                  <option key={piedra} value={piedra}>{piedra}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Peso (gramos)</label>
              <input
                type="number"
                step="0.1"
                name="peso_gramos"
                value={formData.peso_gramos}
                onChange={handleChange}
                placeholder="Ej: 3.5"
              />
            </div>

            <div className="form-group">
              <label>Talla / Medida</label>
              <input
                type="text"
                name="talla"
                value={formData.talla}
                onChange={handleChange}
                placeholder="Ej: 7, 45cm, Único"
              />
            </div>

            <div className="form-group">
              <label>Colección</label>
              <input
                type="text"
                name="coleccion"
                value={formData.coleccion}
                onChange={handleChange}
                placeholder="Ej: Colección Novias 2025"
              />
            </div>
          </div>

          <h3 style={{ marginTop: '30px', marginBottom: '20px', color: '#1a237e' }}>Información Comercial</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Proveedor</label>
              <input
                type="text"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleChange}
                placeholder="Nombre del proveedor"
              />
            </div>

            <div className="form-group">
              <label>Ubicación</label>
              <input
                type="text"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                placeholder="Ej: Vitrina 1, Bodega"
              />
            </div>

            <div className="form-group">
              <label>Moneda</label>
              <select name="moneda" value={formData.moneda} onChange={handleChange}>
                {MONEDAS.map((mon) => (
                  <option key={mon} value={mon}>{mon}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Costo <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="costo"
                value={formData.costo}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Precio de Venta <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="precio_venta"
                value={formData.precio_venta}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <h3 style={{ marginTop: '30px', marginBottom: '20px', color: '#1a237e' }}>Inventario</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>
                Stock Actual <span className="required">*</span>
              </label>
              <input
                type="number"
                name="stock_actual"
                value={formData.stock_actual}
                onChange={handleChange}
                placeholder="0"
                required
              />
            </div>

            <div className="form-group">
              <label>
                Stock Mínimo
              </label>
              <input
                type="number"
                name="stock_minimo"
                value={formData.stock_minimo}
                onChange={handleChange}
                placeholder="5"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (esEdicion ? '💾 Guardar Cambios' : '➕ Agregar Joya')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormularioJoya;
