const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
const joyasRoutes = require('./routes/joyas');
const movimientosRoutes = require('./routes/movimientos');
const reportesRoutes = require('./routes/reportes');

app.use('/api/joyas', joyasRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/reportes', reportesRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: 'API del Sistema de Inventario de Joyería' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicializar base de datos y servidor
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log('Base de datos inicializada correctamente');
    });
  })
  .catch((err) => {
    console.error('Error al inicializar la base de datos:', err);
    process.exit(1);
  });
