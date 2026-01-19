import React, { useState, useEffect, useCallback } from 'react';
import {
  obtenerVariantesPorProducto,
  crearVariante,
  actualizarVariante,
  eliminarVariante,
  reordenarVariantes
} from '../services/api';
import './VariantesManager.css';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

function VariantesManager({ productoId, nombreProducto, onVariantesChange }) {
  const [variantes, setVariantes] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [varianteEditando, setVarianteEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre_variante: '',
    descripcion_variante: '',
    activo: true
  });
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(''); // Progress indicator
  const [saving, setSaving] = useState(false); // Separate saving state from loading

  const cargarVariantes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await obtenerVariantesPorProducto(productoId);
      setVariantes(response.data.data || []);
      if (onVariantesChange) {
        onVariantesChange(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando variantes:', error);
      setError('Error al cargar variantes');
    } finally {
      setLoading(false);
    }
  }, [productoId, onVariantesChange]);

  useEffect(() => {
    if (productoId) {
      cargarVariantes();
    }
  }, [productoId, cargarVariantes]);

  const abrirModal = (variante = null) => {
    if (variante) {
      setVarianteEditando(variante);
      setFormData({
        nombre_variante: variante.nombre_variante,
        descripcion_variante: variante.descripcion_variante || '',
        activo: variante.activo
      });
      setImagenPreview(variante.imagen_url);
    } else {
      setVarianteEditando(null);
      setFormData({
        nombre_variante: '',
        descripcion_variante: '',
        activo: true
      });
      setImagenPreview(null);
    }
    setImagen(null);
    setError(null);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setVarianteEditando(null);
    setFormData({ nombre_variante: '', descripcion_variante: '', activo: true });
    setImagen(null);
    setImagenPreview(null);
    setError(null);
    setUploadProgress('');
    setSaving(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Seleccione un archivo de imagen válido');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('La imagen no debe superar 15MB');
        return;
      }
      setImagen(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagenPreview(reader.result);
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUploadProgress('');

    if (!formData.nombre_variante.trim()) {
      setError('El nombre de la variante es requerido');
      return;
    }

    if (!varianteEditando && !imagen) {
      setError('La imagen es requerida para nuevas variantes');
      return;
    }

    try {
      setLoading(true);
      setSaving(true);

      const formDataToSend = new FormData();
      formDataToSend.append('id_producto_padre', productoId);
      formDataToSend.append('nombre_variante', formData.nombre_variante);
      formDataToSend.append('descripcion_variante', formData.descripcion_variante);
      formDataToSend.append('activo', formData.activo);

      if (imagen) {
        setUploadProgress('📤 Subiendo imagen de alta calidad...');
        formDataToSend.append('imagen', imagen);
      }

      if (varianteEditando) {
        setUploadProgress(imagen ? '📤 Subiendo imagen de alta calidad...' : '💾 Guardando cambios...');
        await actualizarVariante(varianteEditando.id, formDataToSend);
      } else {
        setUploadProgress('💾 Creando variante...');
        formDataToSend.append('orden_display', variantes.length);
        
        // Optimistic UI update: add placeholder immediately
        const tempVariante = {
          id: 'temp-' + Date.now(),
          nombre_variante: formData.nombre_variante,
          descripcion_variante: formData.descripcion_variante,
          imagen_url: imagenPreview,
          activo: formData.activo,
          orden_display: variantes.length,
          _isOptimistic: true
        };
        setVariantes(prev => [...prev, tempVariante]);
        
        await crearVariante(formDataToSend);
      }

      setUploadProgress('✅ Recargando lista...');
      await cargarVariantes();
      cerrarModal();
      alert(varianteEditando ? '✅ Variante actualizada exitosamente' : '✅ Variante creada exitosamente');
    } catch (error) {
      console.error('Error guardando variante:', error);
      setError(error.response?.data?.error || 'Error al guardar variante');
      setUploadProgress('');
      // Remove optimistic update on error
      if (!varianteEditando) {
        setVariantes(prev => prev.filter(v => !v._isOptimistic));
      }
    } finally {
      setLoading(false);
      setSaving(false);
      setUploadProgress('');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta variante?')) return;

    try {
      setLoading(true);
      await eliminarVariante(id);
      await cargarVariantes();
      alert('✅ Variante eliminada');
    } catch (error) {
      console.error('Error eliminando variante:', error);
      alert('❌ Error al eliminar variante');
    } finally {
      setLoading(false);
    }
  };

  const handleMoverArriba = async (index) => {
    if (index === 0) return;
    const nuevasVariantes = [...variantes];
    [nuevasVariantes[index - 1], nuevasVariantes[index]] = [nuevasVariantes[index], nuevasVariantes[index - 1]];
    await actualizarOrden(nuevasVariantes);
  };

  const handleMoverAbajo = async (index) => {
    if (index === variantes.length - 1) return;
    const nuevasVariantes = [...variantes];
    [nuevasVariantes[index], nuevasVariantes[index + 1]] = [nuevasVariantes[index + 1], nuevasVariantes[index]];
    await actualizarOrden(nuevasVariantes);
  };

  const actualizarOrden = async (nuevasVariantes) => {
    try {
      const ordenes = nuevasVariantes.map((v, idx) => ({ id: v.id, orden_display: idx }));
      await reordenarVariantes(ordenes);
      setVariantes(nuevasVariantes);
    } catch (error) {
      console.error('Error reordenando:', error);
      alert('❌ Error al reordenar');
    }
  };

  return (
    <div className="variantes-manager">
      <div className="variantes-header">
        <h4>🔀 Variantes del Producto</h4>
        <button type="button" onClick={() => abrirModal()} className="btn-agregar-variante">
          + Agregar Variante
        </button>
      </div>

      {variantes.length === 0 ? (
        <p className="sin-variantes">No hay variantes. Agrega diferentes diseños del producto.</p>
      ) : (
        <div className="variantes-lista">
          {variantes.map((variante, index) => (
            <div 
              key={variante.id} 
              className={`variante-item ${variante._isOptimistic ? 'optimistic' : ''}`}
              style={variante._isOptimistic ? { opacity: 0.6, pointerEvents: 'none' } : {}}
            >
              <div className="variante-orden">
                <button type="button" onClick={() => handleMoverArriba(index)} disabled={index === 0}>▲</button>
                <span>{index + 1}</span>
                <button type="button" onClick={() => handleMoverAbajo(index)} disabled={index === variantes.length - 1}>▼</button>
              </div>
              <img src={variante.imagen_url} alt={variante.nombre_variante} className="variante-thumbnail" />
              <div className="variante-info">
                <strong>{variante.nombre_variante}</strong>
                {variante._isOptimistic && <span className="saving-indicator"> (Guardando...)</span>}
                {variante.descripcion_variante && <p>{variante.descripcion_variante}</p>}
                <span className={`variante-estado ${variante.activo ? 'activo' : 'inactivo'}`}>{variante.activo ? '✓ Activo' : '✗ Inactivo'}</span>
              </div>
              <div className="variante-acciones">
                <button type="button" onClick={() => abrirModal(variante)}>✏️</button>
                <button type="button" onClick={() => handleEliminar(variante.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{varianteEditando ? 'Editar Variante' : 'Nueva Variante'}</h3>
              <button type="button" onClick={cerrarModal} className="modal-close">×</button>
            </div>

            {error && <div className="alert-error">{error}</div>}
            
            {uploadProgress && (
              <div className="upload-progress">
                <div className="progress-text">{uploadProgress}</div>
                <div className="progress-bar">
                  <div className="progress-bar-inner"></div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de la Variante *</label>
                <input
                  type="text"
                  name="nombre_variante"
                  value={formData.nombre_variante}
                  onChange={handleChange}
                  placeholder="Ej: Diseño Corazón"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion_variante"
                  value={formData.descripcion_variante}
                  onChange={handleChange}
                  placeholder="Descripción opcional"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Imagen * (Alta calidad, sin compresión)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  required={!varianteEditando}
                  disabled={saving}
                />
                <p className="image-hint">💡 Sube imágenes de alta calidad. No se reduce la calidad.</p>
                {imagenPreview && (
                  <img src={imagenPreview} alt="Preview" className="imagen-preview" />
                )}
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleChange}
                  />
                  {' '}Activo (visible en storefront)
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={cerrarModal} className="btn-cancelar" disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-guardar">
                  {saving ? (uploadProgress || 'Guardando...') : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VariantesManager;