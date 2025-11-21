const { supabase } = require('../supabase-db');
const bcrypt = require('bcryptjs');

class Usuario {
  // Crear nuevo usuario
  static async crear(usuarioData) {
    const { username, password, role, full_name } = usuarioData;

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        username,
        password_hash: passwordHash,
        role: role || 'dependiente',
        full_name
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener usuario por username
  static async obtenerPorUsername(username) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  }

  // Obtener usuario por ID
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, username, role, full_name, fecha_creacion')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // Verificar contraseña
  static async verificarPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }

  // Obtener todos los usuarios (sin contraseñas)
  static async obtenerTodos() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, username, role, full_name, fecha_creacion')
      .order('fecha_creacion', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  // Actualizar usuario
  static async actualizar(id, usuarioData) {
    const { username, password, role, full_name } = usuarioData;

    let updateData = { username, role, full_name };

    if (password) {
      // Si se proporciona nueva contraseña, actualizarla
      const passwordHash = await bcrypt.hash(password, 10);
      updateData.password_hash = passwordHash;
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  // Eliminar usuario
  static async eliminar(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }
}

module.exports = Usuario;
