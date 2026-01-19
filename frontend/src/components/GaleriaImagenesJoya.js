import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';

/**
 * Componente individual de imagen sortable (drag and drop)
 */
function ImagenSortable({ imagen, onEliminar, onMarcarPrincipal }) {
  const [imageError, setImageError] = React.useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: imagen.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const handleImageError = () => {
    console.error('Error al cargar imagen:', imagen.imagen_url);
    setImageError(true);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="imagen-sortable"
    >
      <div className="imagen-container">
        {imageError ? (
          <div className="imagen-placeholder">
            <span className="placeholder-icon">🖼️</span>
            <span className="placeholder-text">Error al cargar</span>
          </div>
        ) : (
          <img
            src={imagen.imagen_url}
            alt="Producto"
            className="imagen-preview"
            onError={handleImageError}
            {...attributes}
            {...listeners}
          />
        )}
        
        {imagen.es_principal && (
          <div className="badge-principal">
            PRINCIPAL
          </div>
        )}
        
        <div className="imagen-actions">
          {!imagen.es_principal && (
            <button
              onClick={() => onMarcarPrincipal(imagen.id)}
              className="btn-icon btn-primary"
              title="Marcar como principal"
              type="button"
            >
              ⭐
            </button>
          )}
          <button
            onClick={() => onEliminar(imagen.id)}
            className="btn-icon btn-danger"
            title="Eliminar"
            type="button"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="imagen-orden">
        Orden: {imagen.orden_display + 1}
      </div>
    </div>
  );
}

/**
 * Componente principal de galería de imágenes
 */
export default function GaleriaImagenesJoya({ idJoya, onCambio }) {
  const [imagenes, setImagenes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (idJoya) {
      cargarImagenes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idJoya]);

  const cargarImagenes = async () => {
    if (!idJoya) {
      console.warn('No se puede cargar imágenes: idJoya no está definido');
      return;
    }
    
    setCargando(true);
    try {
      const response = await axios.get(`/api/imagenes-joya/joya/${idJoya}`);
      
      // Validar que la respuesta sea válida
      if (!response.data) {
        // Empty response is valid - product has no additional images
        setImagenes([]);
        setCargando(false);
        return;
      }
      
      // Asegurarse que sea un array
      if (Array.isArray(response.data)) {
        // Valid array response (could be empty or have images)
        setImagenes(response.data);
      } else {
        // Check if it's an HTML response (error page)
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
          console.error('❌ API devolvió HTML en lugar de JSON. Verificar configuración del servidor.');
          alert('Error de configuración: La API devolvió HTML. Por favor contacte al administrador.');
          setImagenes([]);
        } else {
          // Unexpected response format - log but don't alert (not user's fault)
          console.warn('WARNING: Respuesta inesperada de la API de imágenes (se esperaba array):', response.data);
          setImagenes([]);
        }
      }
    } catch (error) {
      // Check for HTML response in error
      if (error.response?.data && typeof error.response.data === 'string' && 
          error.response.data.includes('<!doctype html>')) {
        console.error('❌ API devolvió HTML en lugar de JSON. Ruta /api/imagenes-joya/* no configurada correctamente.');
        alert('Error de configuración del servidor. Por favor contacte al administrador.');
        setImagenes([]);
        setCargando(false);
        return;
      }
      
      // 404 or successful status with no data is normal - product has no images yet
      if (error.response?.status === 404 || error.response?.status === 200) {
        // Not an error - just no images for this product
        setImagenes([]);
        setCargando(false);
        return;
      }
      
      // Show alert only for real errors (500, network errors, etc.)
      console.error('Error al cargar imágenes:', error);
      let errorMsg = 'Error al cargar imágenes';
      if (error.response?.status === 500) {
        errorMsg = 'Error del servidor al cargar imágenes. Intente de nuevo';
      } else if (error.message === 'Network Error') {
        errorMsg = 'Error de conexión. Verifique su conexión a internet';
      } else if (!error.response) {
        errorMsg = 'No se pudo conectar con el servidor. Verifique su conexión';
      }
      
      alert(errorMsg);
      setImagenes([]);
    } finally {
      setCargando(false);
    }
  };

  const handleSubirImagen = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    
    // Validar que idJoya existe
    if (!idJoya) {
      alert('Error: No se puede subir la imagen. El producto debe ser guardado primero.');
      e.target.value = '';
      return;
    }

    // Validar tipo de archivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      alert('Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP');
      e.target.value = '';
      return;
    }

    // Nota: Sin límite de tamaño para permitir imágenes de alta calidad de joyas

    setSubiendoImagen(true);
    try {
      // Crear FormData para subir la imagen
      const formData = new FormData();
      formData.append('imagen', archivo);

      // Subir imagen al servidor (el backend se encarga de Cloudinary)
      const uploadResponse = await axios.post('/api/joyas/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imagenUrl = uploadResponse.data.url;

      // Crear registro en BD
      const response = await axios.post('/api/imagenes-joya', {
        id_joya: idJoya,
        imagen_url: imagenUrl,
        orden_display: imagenes.length,
        es_principal: imagenes.length === 0, // Primera imagen es principal
      });

      if (response.status === 201) {
        await cargarImagenes();
        if (onCambio) onCambio();
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      
      // Proporcionar mensajes de error más específicos
      let errorMessage = 'Error al subir imagen';
      
      if (error.response?.data?.errorType) {
        const errorType = error.response.data.errorType;
        const errorText = error.response.data.error;
        
        switch (errorType) {
          case 'FILE_TOO_LARGE':
            errorMessage = 'El archivo es demasiado grande. Tamaño máximo: 50MB';
            break;
          case 'VALIDATION_ERROR':
            errorMessage = errorText || 'Formato de archivo no válido. Use JPG, PNG, GIF o WebP';
            break;
          case 'UPLOAD_ERROR':
            errorMessage = errorText || 'Error al subir la imagen a la nube. Por favor, intente de nuevo';
            break;
          case 'INVALID_URL':
          case 'DOMAIN_NOT_ALLOWED':
            errorMessage = errorText || 'URL de imagen no válida';
            break;
          default:
            errorMessage = errorText || errorMessage;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setSubiendoImagen(false);
      // Limpiar el input
      e.target.value = '';
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;

    try {
      const response = await axios.delete(`/api/imagenes-joya/${id}`);

      if (response.data.success) {
        await cargarImagenes();
        if (onCambio) onCambio();
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      
      let errorMsg = 'Error al eliminar imagen';
      if (error.response?.status === 404) {
        errorMsg = 'La imagen no existe o ya fue eliminada';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      
      alert(errorMsg);
    }
  };

  const handleMarcarPrincipal = async (id) => {
    try {
      const response = await axios.put(`/api/imagenes-joya/${id}/principal`);

      if (response.data.success) {
        await cargarImagenes();
        if (onCambio) onCambio();
      }
    } catch (error) {
      console.error('Error al marcar como principal:', error);
      
      let errorMsg = 'Error al marcar como principal';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      
      alert(errorMsg);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    // Validar que over existe (puede ser null si se suelta fuera del área)
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = imagenes.findIndex((img) => img.id === active.id);
    const newIndex = imagenes.findIndex((img) => img.id === over.id);
    
    // Validar que ambos índices son válidos
    if (oldIndex === -1 || newIndex === -1) {
      console.error('Error: No se encontraron los índices para el drag & drop');
      return;
    }

    const nuevasImagenes = arrayMove(imagenes, oldIndex, newIndex);
    
    // Actualizar orden local inmediatamente (optimistic update)
    setImagenes(nuevasImagenes);

    // Actualizar en servidor
    try {
      const actualizaciones = nuevasImagenes.map((img, index) => ({
        id: img.id,
        orden_display: index,
        es_principal: img.es_principal, // Preserve existing primary flag
      }));

      await axios.put('/api/imagenes-joya/reordenar', { imagenes: actualizaciones });

      if (onCambio) onCambio();
    } catch (error) {
      console.error('Error al reordenar:', error);
      
      let errorMsg = 'Error al reordenar imágenes';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      
      alert(errorMsg);
      // Recargar en caso de error para restaurar el orden correcto
      await cargarImagenes();
    }
  };

  if (cargando) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Cargando imágenes...</div>;
  }
  
  // Si no hay idJoya, mostrar mensaje
  if (!idJoya) {
    return (
      <div className="galeria-imagenes">
        <style>{`
          .galeria-warning {
            border: 2px solid #ff9800;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            background-color: #fff3e0;
            color: #e65100;
          }
          .galeria-warning-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
        `}</style>
        <div className="galeria-warning">
          <div className="galeria-warning-icon">⚠️</div>
          <p><strong>Guarda el producto primero</strong></p>
          <p>Para poder agregar imágenes, primero debes guardar el producto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="galeria-imagenes">
      <style>{`
        .galeria-imagenes {
          margin-top: 20px;
        }
        
        .galeria-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        
        .galeria-header h3 {
          margin: 0;
          color: #1a237e;
          font-size: 18px;
        }
        
        .btn-upload {
          background-color: #2196F3;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-upload:hover {
          background-color: #1976D2;
        }
        
        .btn-upload:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .btn-upload input {
          display: none;
        }
        
        .galeria-hint {
          color: #666;
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        .galeria-empty {
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          color: #999;
        }
        
        .galeria-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
        }
        
        .imagen-sortable {
          position: relative;
        }
        
        .imagen-container {
          position: relative;
          aspect-ratio: 1;
          background-color: #f5f5f5;
          border: 2px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          cursor: move;
          transition: border-color 0.2s;
        }
        
        .imagen-container:hover {
          border-color: #2196F3;
        }
        
        .imagen-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .imagen-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          color: #999;
        }
        
        .placeholder-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        
        .placeholder-text {
          font-size: 12px;
        }
        
        .badge-principal {
          position: absolute;
          top: 8px;
          left: 8px;
          background-color: #4CAF50;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        }
        
        .imagen-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .imagen-container:hover .imagen-actions {
          opacity: 1;
        }
        
        .btn-icon {
          background-color: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 4px;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .btn-icon.btn-primary {
          color: #2196F3;
        }
        
        .btn-icon.btn-danger {
          color: #f44336;
        }
        
        .btn-icon:hover {
          background-color: white;
        }
        
        .imagen-orden {
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
      `}</style>
      
      <div className="galeria-header">
        <h3>📸 Galería de Imágenes ({imagenes.length})</h3>
        <label className="btn-upload">
          {subiendoImagen ? (
            <>
              <span>⏳</span>
              Subiendo...
            </>
          ) : (
            <>
              <span>📷</span>
              Agregar Imagen
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleSubirImagen}
            disabled={subiendoImagen}
          />
        </label>
      </div>

      {imagenes.length === 0 ? (
        <div className="galeria-empty">
          No hay imágenes. Sube la primera imagen del producto.
        </div>
      ) : (
        <>
          <p className="galeria-hint">
            💡 Arrastra las imágenes para reordenar. Usa el botón ⭐ para cambiar la imagen principal.
          </p>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={imagenes.map(img => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="galeria-grid">
                {imagenes.map((imagen) => (
                  <ImagenSortable
                    key={imagen.id}
                    imagen={imagen}
                    onEliminar={handleEliminar}
                    onMarcarPrincipal={handleMarcarPrincipal}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}
