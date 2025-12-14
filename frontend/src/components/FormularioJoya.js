import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crearJoya, actualizarJoya, obtenerJoya, verificarCodigoJoya } from '../services/api';

const CATEGORIAS = ['Anillo', 'Aretes', 'Collar', 'Pulsera', 'Dije', 'Reloj', 'Set', 'Otro'];
const ESTADOS = ['Activo', 'Descontinuado', 'Agotado'];
const MONEDAS = ['CRC', 'USD'];

// Constantes para validación y tamaño de imagen
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB en bytes
const IMAGE_PREVIEW_MAX_SIZE = '300px';

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
    proveedor: '',
    costo: '',
    precio_venta: '',
    moneda: 'CRC',
    stock_actual: '',
    stock_minimo: '5',
    ubicacion: '',
    estado: 'Activo',
    mostrar_en_storefront: true
  });
  
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenActual, setImagenActual] = useState(null);
  const fileInputRef = useRef(null);

  // Estados para validación de código
  const [codigoValidacion, setCodigoValidacion] = useState({
    validando: false,
    existe: false,
    similares: []
  });
  const validacionTimeoutRef = useRef(null);

  const cargarJoya = useCallback(async () => {
    try {
      setLoading(true);
      const response = await obtenerJoya(id);
      const joya = response.data;
      setFormData({
        codigo: joya.codigo || '',
        nombre: joya.nombre || '',
        descripcion: joya.descripcion || '',
        categoria: joya.categoria || '',
        proveedor: joya.proveedor || '',
        costo: joya.costo || '',
        precio_venta: joya.precio_venta || '',
        moneda: joya.moneda || 'CRC',
        stock_actual: joya.stock_actual || '',
        stock_minimo: joya.stock_minimo || '5',
        ubicacion: joya.ubicacion || '',
        estado: joya.estado || 'Activo',
        mostrar_en_storefront: joya.mostrar_en_storefront ?? true
      });
      // Cargar imagen actual si existe
      if (joya.imagen_url) {
        setImagenActual(joya.imagen_url);
      }
    } catch (err) {
      setErrores(['Error al cargar la joya']);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (esEdicion) {
      cargarJoya();
    }
  }, [esEdicion, cargarJoya]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Si es el campo código, validar en tiempo real
    if (name === 'codigo') {
      validarCodigoEnTiempoReal(value);
    }
  };

  // Validar código en tiempo real mientras el usuario escribe
  const validarCodigoEnTiempoReal = useCallback((codigo) => {
    // Limpiar timeout anterior
    if (validacionTimeoutRef.current) {
      clearTimeout(validacionTimeoutRef.current);
    }

    // Si el código está vacío, limpiar validación
    if (!codigo || codigo.trim().length === 0) {
      setCodigoValidacion({
        validando: false,
        existe: false,
        similares: []
      });
      return;
    }

    // Indicar que se está validando
    setCodigoValidacion(prev => ({ ...prev, validando: true }));

    // Esperar 500ms después de que el usuario deje de escribir
    validacionTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await verificarCodigoJoya(codigo.trim(), id);
        setCodigoValidacion({
          validando: false,
          existe: response.data.existe,
          similares: response.data.similares || []
        });
      } catch (error) {
        console.error('Error al verificar código:', error);
        setCodigoValidacion({
          validando: false,
          existe: false,
          similares: []
        });
      }
    }, 500);
  }, [id]);

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (validacionTimeoutRef.current) {
        clearTimeout(validacionTimeoutRef.current);
      }
    };
  }, []);

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setErrores(['Por favor seleccione un archivo de imagen válido']);
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > MAX_FILE_SIZE) {
        setErrores(['La imagen no debe superar 5MB']);
        return;
      }
      
      setImagen(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEliminarImagen = () => {
    setImagen(null);
    setImagenPreview(null);
    // Limpiar el input file usando ref
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores([]);
    setMensaje(null);

    // Validar que no exista código duplicado antes de enviar
    if (codigoValidacion.existe) {
      setErrores(['El código ya existe en el inventario. Por favor usa un código diferente.']);
      return;
    }

    try {
      setLoading(true);
      
      // Crear FormData para enviar datos con archivo
      const formDataToSend = new FormData();
      
      // Agregar todos los campos del formulario
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Agregar imagen si existe
      if (imagen) {
        formDataToSend.append('imagen', imagen);
      }
      
      if (esEdicion) {
        await actualizarJoya(id, formDataToSend);
        setMensaje('Joya actualizada correctamente');
      } else {
        await crearJoya(formDataToSend);
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
        <form id="joya-form" onSubmit={handleSubmit}>
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
                style={{
                  borderColor: codigoValidacion.existe ? '#dc3545' : 
                               (codigoValidacion.similares.length > 0 && formData.codigo.length > 0) ? '#ffc107' : 
                               ''
                }}
              />
              {codigoValidacion.validando && (
                <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
                  🔍 Verificando código...
                </small>
              )}
              {codigoValidacion.existe && !codigoValidacion.validando && (
                <small style={{ color: '#dc3545', display: 'block', marginTop: '5px', fontWeight: '500' }}>
                  ⚠️ Este código ya existe en el inventario
                </small>
              )}
              {!codigoValidacion.existe && codigoValidacion.similares.length > 0 && !codigoValidacion.validando && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '10px', 
                  backgroundColor: '#fff3cd', 
                  border: '1px solid #ffc107',
                  borderRadius: '4px'
                }}>
                  <small style={{ color: '#856404', fontWeight: '500' }}>
                    💡 Códigos similares encontrados:
                  </small>
                  <ul style={{ 
                    margin: '5px 0 0 0', 
                    paddingLeft: '20px',
                    fontSize: '13px',
                    color: '#856404'
                  }}>
                    {codigoValidacion.similares.slice(0, 5).map(joya => (
                      <li key={joya.id}>
                        <strong>{joya.codigo}</strong> - {joya.nombre}
                      </li>
                    ))}
                  </ul>
                  {codigoValidacion.similares.length > 5 && (
                    <small style={{ color: '#856404', display: 'block', marginTop: '5px' }}>
                      ... y {codigoValidacion.similares.length - 5} más
                    </small>
                  )}
                </div>
              )}
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
                placeholder="Ej: Pulsera artesanal trenzada"
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

          {/* Visibilidad en Tienda Online */}
          <div className="form-group" style={{ marginTop: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="mostrar_en_storefront"
                checked={formData.mostrar_en_storefront}
                onChange={handleChange}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '15px', fontWeight: '500' }}>
                🌐 Mostrar en tienda online
              </span>
            </label>
            <small style={{ color: '#666', display: 'block', marginTop: '5px', marginLeft: '30px' }}>
              Si está activado, este producto aparecerá en la tienda online pública (storefront)
            </small>
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
        </form>
      </div>

      {/* Card separada para la imagen */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '20px', color: '#1a237e' }}>📸 Imagen del Producto</h3>
        
        <div className="form-group">
          <label>Imagen de la Joya</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImagenChange}
            ref={fileInputRef}
            style={{ marginBottom: '10px' }}
          />
          <small style={{ color: '#666', display: 'block', marginBottom: '10px' }}>
            Formatos permitidos: JPG, PNG, GIF, WebP. Tamaño máximo: 5MB
          </small>
          
          {imagenPreview && (
            <div style={{ marginTop: '15px' }}>
              <p style={{ marginBottom: '8px', fontWeight: '500' }}>Vista previa:</p>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src={imagenPreview} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: IMAGE_PREVIEW_MAX_SIZE, 
                    maxHeight: IMAGE_PREVIEW_MAX_SIZE, 
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }} 
                />
                <button
                  type="button"
                  onClick={handleEliminarImagen}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: 'rgba(220, 53, 69, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ✕ Eliminar
                </button>
              </div>
            </div>
          )}
          
          {!imagenPreview && imagenActual && esEdicion && (
            <div style={{ marginTop: '15px' }}>
              <p style={{ marginBottom: '8px', fontWeight: '500' }}>Imagen actual:</p>
              <img 
                src={imagenActual} 
                alt="Imagen actual" 
                style={{ 
                  maxWidth: IMAGE_PREVIEW_MAX_SIZE, 
                  maxHeight: IMAGE_PREVIEW_MAX_SIZE, 
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }} 
              />
              <p style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
                Selecciona una nueva imagen para reemplazarla
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="modal-footer" style={{ marginTop: '20px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/')}
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="joya-form"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Guardando...' : (esEdicion ? '💾 Guardar Cambios' : '➕ Agregar Joya')}
        </button>
      </div>
    </div>
  );
}

export default FormularioJoya;
