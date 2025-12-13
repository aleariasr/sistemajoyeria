const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Buscar usuario
    const usuario = await Usuario.obtenerPorUsername(username);
    
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const passwordValido = await Usuario.verificarPassword(password, usuario.password_hash);
    
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Guardar sesión
    // IMPORTANTE: Reasignar completamente req.session en lugar de solo modificar propiedades
    // Esto garantiza que cookie-session detecte el cambio y envíe Set-Cookie header
    // (Necesario para Safari y Railway proxy)
    
    // Primero leer la sesión para activarla
    const sessionId = req.session.id || Date.now().toString();
    
    // Luego asignar TODOS los valores incluyendo una marca temporal
    req.session = {
      userId: usuario.id,
      username: usuario.username,
      role: usuario.role,
      fullName: usuario.full_name,
      id: sessionId,
      lastActivity: Date.now()  // Forzar cambio detectable
    };
    
    // Marcar explícitamente como modificada (para cookie-session)
    req.session.isNew = true;

    // cookie-session guarda automáticamente al finalizar la petición
    // No necesita llamar explícitamente a session.save()
    console.log('✅ Sesión configurada correctamente:', {
      userId: req.session.userId,
      username: req.session.username
    });
    
    res.json({
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario.id,
        username: usuario.username,
        role: usuario.role,
        full_name: usuario.full_name
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // cookie-session usa req.session = null para limpiar la sesión
  req.session = null;
  res.json({ mensaje: 'Sesión cerrada exitosamente' });
});

// Verificar sesión
router.get('/session', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      loggedIn: true,
      usuario: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role,
        full_name: req.session.fullName
      }
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// Obtener todos los usuarios (solo administrador)
router.get('/', async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado y sea administrador
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (req.session.role !== 'administrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const usuarios = await Usuario.obtenerTodos();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Crear usuario (solo administrador)
router.post('/', async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado y sea administrador
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (req.session.role !== 'administrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { username, password, role, full_name } = req.body;

    if (!username || !password || !role || !full_name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar que el rol sea válido
    if (role !== 'administrador' && role !== 'dependiente') {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const resultado = await Usuario.crear({ username, password, role, full_name });
    res.status(201).json({ mensaje: 'Usuario creado exitosamente', id: resultado.id });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'El nombre de usuario ya existe' });
    } else {
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  }
});

// Actualizar usuario (solo administrador)
router.put('/:id', async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado y sea administrador
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (req.session.role !== 'administrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { id } = req.params;
    const { username, password, role, full_name } = req.body;

    if (!username || !role || !full_name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar que el rol sea válido
    if (role !== 'administrador' && role !== 'dependiente') {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const resultado = await Usuario.actualizar(id, { username, password, role, full_name });
    
    if (resultado.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'El nombre de usuario ya existe' });
    } else {
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }
});

// Eliminar usuario (solo administrador)
router.delete('/:id', async (req, res) => {
  try {
    // Verificar que el usuario esté autenticado y sea administrador
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (req.session.role !== 'administrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { id } = req.params;

    // No permitir eliminar el propio usuario
    if (parseInt(id) === req.session.userId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    const resultado = await Usuario.eliminar(id);
    
    if (resultado.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
