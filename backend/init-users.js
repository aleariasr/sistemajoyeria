const { db } = require('./database');
const Usuario = require('./models/Usuario');

async function crearUsuariosIniciales() {
  try {
    // Verificar si ya existen usuarios
    const usuarios = await Usuario.obtenerTodos();
    
    if (usuarios.length === 0) {
      console.log('Creando usuarios iniciales...');

      // Crear usuario administrador
      await Usuario.crear({
        username: 'admin',
        password: 'admin123',
        role: 'administrador',
        full_name: 'Administrador del Sistema'
      });
      console.log('Usuario administrador creado: admin / admin123');

      // Crear usuario dependiente
      await Usuario.crear({
        username: 'dependiente',
        password: 'dependiente123',
        role: 'dependiente',
        full_name: 'Dependiente de Ventas'
      });
      console.log('Usuario dependiente creado: dependiente / dependiente123');

      console.log('Usuarios iniciales creados exitosamente');
    } else {
      console.log('Ya existen usuarios en la base de datos');
    }
  } catch (error) {
    console.error('Error al crear usuarios iniciales:', error);
  }
}

module.exports = { crearUsuariosIniciales };
