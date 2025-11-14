const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Inicializar base de datos
require('./config/database');

// Importar rutas
const jewelryRoutes = require('./src/routes/jewelry');
const categoryRoutes = require('./src/routes/categories');
const metalRoutes = require('./src/routes/metals');
const stoneRoutes = require('./src/routes/stones');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas API
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/metals', metalRoutes);
app.use('/api/stones', stoneRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sistema de Joyería API funcionando correctamente' });
});

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);
});

module.exports = app;
