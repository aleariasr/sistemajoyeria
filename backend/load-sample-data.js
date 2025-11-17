/**
 * Script para cargar datos de ejemplo en la base de datos
 * Uso: node load-sample-data.js
 * 
 * Este script solo debe ejecutarse en entornos de desarrollo/prueba
 * NUNCA en producción
 */

const { db, initDatabase } = require('./database');
const { insertarJoyasEjemplo } = require('./seed');

async function loadSampleData() {
  try {
    console.log('Inicializando base de datos...');
    await initDatabase();
    
    console.log('Verificando si ya existen datos...');
    const count = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM joyas', [], (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });

    if (count > 0) {
      console.log(`\n⚠️  La base de datos ya contiene ${count} joya(s).`);
      console.log('No se cargarán datos de ejemplo para evitar duplicados.\n');
      console.log('Si deseas recargar los datos de ejemplo:');
      console.log('1. Elimina el archivo: backend/joyeria.db');
      console.log('2. Ejecuta nuevamente: node load-sample-data.js\n');
      process.exit(0);
    }

    console.log('Cargando datos de ejemplo...');
    await insertarJoyasEjemplo();
    
    console.log('\n✅ Datos de ejemplo cargados exitosamente!');
    console.log('La aplicación está lista para usar con datos de prueba.\n');
    
    db.close(() => {
      process.exit(0);
    });
  } catch (error) {
    console.error('\n❌ Error al cargar datos de ejemplo:', error.message);
    process.exit(1);
  }
}

loadSampleData();
