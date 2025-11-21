const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://mvujkbpbqyihixkbzthe.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dWprYnBicXlpaGl4a2J6dGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODMyMzEsImV4cCI6MjA3OTI1OTIzMX0.zWTIxdBl6ONJOO-6GcYLc2LQt_G0zpelsFppyne8OV0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para inicializar las tablas en Supabase
const initDatabase = async () => {
  try {
    console.log('Inicializando base de datos Supabase...');
    
    // Verificar conexión
    const { data, error } = await supabase.from('usuarios').select('count', { count: 'exact', head: true });
    if (error && error.code === '42P01') {
      // La tabla no existe, necesitamos crearla
      console.log('Las tablas no existen aún. Por favor, ejecuta las migraciones SQL en Supabase.');
      console.log('Ve a: https://mvujkbpbqyihixkbzthe.supabase.co/project/_/sql');
    }
    
    console.log('✅ Conexión a Supabase establecida');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con Supabase:', error.message);
    throw error;
  }
};

// Función para inicializar la base de datos temporal del día
const initDatabaseDia = async () => {
  try {
    console.log('Inicializando base de datos temporal del día (Supabase)...');
    
    // Verificar conexión a tablas del día
    const { data, error } = await supabase.from('ventas_dia').select('count', { count: 'exact', head: true });
    if (error && error.code === '42P01') {
      console.log('Las tablas del día no existen aún. Por favor, ejecuta las migraciones SQL en Supabase.');
    }
    
    console.log('✅ Conexión a tablas del día establecida');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con tablas del día:', error.message);
    throw error;
  }
};

module.exports = { supabase, initDatabase, initDatabaseDia };
