import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';

/**
 * Componente individual de imagen sortable (drag and drop)
 */
function ImagenSortable({ imagen, onEliminar, onMarcarPrincipal }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="imagen-sortable"
    >
      <div className="imagen-container">
        <img
          src={imagen.imagen_url}
          alt="Producto"
          className="imagen-preview"
          {...attributes}
          {...listeners}
        />
        
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
    setCargando(true);
    try {
      const response = await axios.get(`/api/imagenes-joya/joya/${idJoya}`);
      setImagenes(response.data);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
      alert('Error al cargar imágenes');
    } finally {
      setCargando(false);
    }
  };

  const handleSubirImagen = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    // Validar tipo de archivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      alert('Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP');
      return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (archivo.size > maxSize) {
      alert('El archivo es muy grande. Tamaño máximo: 5MB');
      return;
    }

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
      alert('Error al subir imagen: ' + (error.response?.data?.error || error.message));
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
      alert('Error al eliminar imagen');
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
      alert('Error al marcar como principal');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = imagenes.findIndex((img) => img.id === active.id);
      const newIndex = imagenes.findIndex((img) => img.id === over.id);

      const nuevasImagenes = arrayMove(imagenes, oldIndex, newIndex);
      
      // Actualizar orden local inmediatamente
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
        alert('Error al reordenar imágenes');
        await cargarImagenes(); // Recargar en caso de error
      }
    }
  };

  if (cargando) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Cargando imágenes...</div>;
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
