// Test script to verify credit sales functionality
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'joyeria.db');
const dbDiaPath = path.join(__dirname, 'ventas_dia.db');

const db = new sqlite3.Database(dbPath);
const dbDia = new sqlite3.Database(dbDiaPath);

console.log('🧪 Testing Credit Sales Synchronization\n');

// Test 1: Check ventas table structure
console.log('1️⃣ Checking ventas table structure...');
db.all("PRAGMA table_info(ventas)", [], (err, columns) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else {
    const columnNames = columns.map(col => col.name);
    const hasTipoVenta = columnNames.includes('tipo_venta');
    const hasIdCliente = columnNames.includes('id_cliente');
    
    console.log(`   - tipo_venta column: ${hasTipoVenta ? '✅' : '❌'}`);
    console.log(`   - id_cliente column: ${hasIdCliente ? '✅' : '❌'}`);
  }
});

// Test 2: Check ventas_dia table structure
console.log('\n2️⃣ Checking ventas_dia table structure...');
dbDia.all("PRAGMA table_info(ventas_dia)", [], (err, columns) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else {
    const columnNames = columns.map(col => col.name);
    const hasTipoVenta = columnNames.includes('tipo_venta');
    const hasIdCliente = columnNames.includes('id_cliente');
    
    console.log(`   - tipo_venta column: ${hasTipoVenta ? '✅' : '❌'}`);
    console.log(`   - id_cliente column: ${hasIdCliente ? '✅' : '❌'}`);
  }
});

// Test 3: Check ventas and ventas_dia counts
setTimeout(() => {
  console.log('\n3️⃣ Checking current data...');
  
  db.get("SELECT COUNT(*) as count FROM ventas", [], (err, row) => {
    if (err) {
      console.error('❌ Error:', err.message);
    } else {
      console.log(`   - Ventas in main DB: ${row.count}`);
    }
  });
  
  dbDia.get("SELECT COUNT(*) as count FROM ventas_dia", [], (err, row) => {
    if (err) {
      console.error('❌ Error:', err.message);
    } else {
      console.log(`   - Ventas in day DB: ${row.count}`);
    }
  });
  
  db.get("SELECT COUNT(*) as count FROM cuentas_por_cobrar", [], (err, row) => {
    if (err) {
      console.error('❌ Error:', err.message);
    } else {
      console.log(`   - Cuentas por cobrar: ${row.count}`);
    }
  });
  
  db.get("SELECT COUNT(*) as count FROM abonos", [], (err, row) => {
    if (err) {
      console.error('❌ Error:', err.message);
    } else {
      console.log(`   - Abonos registered: ${row.count}`);
      
      // Close databases
      setTimeout(() => {
        db.close();
        dbDia.close();
        console.log('\n✅ Test complete!');
      }, 100);
    }
  });
}, 100);
