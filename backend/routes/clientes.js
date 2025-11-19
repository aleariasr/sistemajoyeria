const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
};

// Crear nuevo cliente
router.post('/', requireAuth, async (req, res) => {
  try {
    const { nombre, telefono, cedula, direccion, email, notas } = req.body;

    // Validaciones
    if (!nombre || !telefono || !cedula) {
      return res.status(400).json({ error: 'Nombre, teléfono y cédula son requeridos' });
    }

    // Verificar si la cédula ya existe
    const clienteExistente = await Cliente.obtenerPorCedula(cedula);
    if (clienteExistente) {
      return res.status(400).json({ error: 'Ya existe un cliente con esta cédula' });
    }

    const resultado = await Cliente.crear({ nombre, telefono, cedula, direccion, email, notas });
    res.status(201).json({
      mensaje: 'Cliente creado exitosamente',
      id: resultado.id
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// Obtener todos los clientes con filtros y paginación
router.get('/', requireAuth, async (req, res) => {
  try {
    const filtros = {
      busqueda: req.query.busqueda,
      pagina: req.query.pagina,
      por_pagina: req.query.por_pagina
    };

    const resultado = await Cliente.obtenerTodos(filtros);
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// Buscar clientes (para autocompletado)
router.get('/buscar', requireAuth, async (req, res) => {
  try {
    const termino = req.query.q || '';
    if (termino.length < 2) {
      return res.json([]);
    }

    const clientes = await Cliente.buscar(termino);
    res.json(clientes);
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({ error: 'Error al buscar clientes' });
  }
});

// Obtener un cliente específico
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.obtenerPorId(id);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

// Actualizar cliente
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, cedula, direccion, email, notas } = req.body;

    // Validaciones
    if (!nombre || !telefono || !cedula) {
      return res.status(400).json({ error: 'Nombre, teléfono y cédula son requeridos' });
    }

    // Verificar si el cliente existe
    const clienteExistente = await Cliente.obtenerPorId(id);
    if (!clienteExistente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Si se cambió la cédula, verificar que no esté en uso
    if (cedula !== clienteExistente.cedula) {
      const clienteConCedula = await Cliente.obtenerPorCedula(cedula);
      if (clienteConCedula) {
        return res.status(400).json({ error: 'Ya existe un cliente con esta cédula' });
      }
    }

    await Cliente.actualizar(id, { nombre, telefono, cedula, direccion, email, notas });
    res.json({ mensaje: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// Eliminar cliente
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el cliente existe
    const cliente = await Cliente.obtenerPorId(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Nota: Podrías agregar validación para verificar si el cliente tiene cuentas pendientes
    await Cliente.eliminar(id);
    res.json({ mensaje: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

module.exports = router;
