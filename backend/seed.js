const { db } = require('./database');

const joyasEjemplo = [
  {
    codigo: 'AN-0001',
    nombre: 'Anillo Solitario Oro 14k',
    descripcion: 'Elegante anillo solitario con circonia central de 1ct en oro amarillo 14k',
    categoria: 'Anillo',
    tipo_metal: 'Oro 14k',
    color_metal: 'dorado',
    piedras: 'circonia',
    peso_gramos: 3.5,
    talla: '7',
    coleccion: 'Colección Novias 2025',
    proveedor: 'Joyería El Dorado',
    costo: 125000,
    precio_venta: 185000,
    moneda: 'CRC',
    stock_actual: 5,
    stock_minimo: 3,
    ubicacion: 'Vitrina 1',
    estado: 'Activo'
  },
  {
    codigo: 'AR-0150',
    nombre: 'Aretes Perla Cultivada',
    descripcion: 'Par de aretes con perlas cultivadas de 7mm en plata 925',
    categoria: 'Aretes',
    tipo_metal: 'Plata 925',
    color_metal: 'plateado',
    piedras: 'perla',
    peso_gramos: 2.1,
    talla: 'Único',
    coleccion: 'Colección Elegancia',
    proveedor: 'Perlas del Pacífico',
    costo: 45000,
    precio_venta: 72000,
    moneda: 'CRC',
    stock_actual: 12,
    stock_minimo: 5,
    ubicacion: 'Vitrina 2',
    estado: 'Activo'
  },
  {
    codigo: 'CO-0075',
    nombre: 'Collar Cadena Oro 18k',
    descripcion: 'Collar cadena tipo cartier en oro amarillo 18k, 45cm',
    categoria: 'Collar',
    tipo_metal: 'Oro 18k',
    color_metal: 'dorado',
    piedras: 'sin piedra',
    peso_gramos: 5.2,
    talla: '45cm',
    coleccion: 'Colección Clásicos',
    proveedor: 'Joyería El Dorado',
    costo: 320000,
    precio_venta: 480000,
    moneda: 'CRC',
    stock_actual: 3,
    stock_minimo: 2,
    ubicacion: 'Caja Fuerte',
    estado: 'Activo'
  },
  {
    codigo: 'PU-0200',
    nombre: 'Pulsera Tenis Circonia',
    descripcion: 'Pulsera estilo tenis con circonias en plata 925 bañada en oro',
    categoria: 'Pulsera',
    tipo_metal: 'Baño de oro',
    color_metal: 'dorado',
    piedras: 'circonia',
    peso_gramos: 8.5,
    talla: '18cm',
    coleccion: 'Colección Brillante',
    proveedor: 'Importadora Joyas SA',
    costo: 55000,
    precio_venta: 89000,
    moneda: 'CRC',
    stock_actual: 2,
    stock_minimo: 4,
    ubicacion: 'Vitrina 3',
    estado: 'Activo'
  },
  {
    codigo: 'AN-0025',
    nombre: 'Anillo Compromiso Oro Blanco',
    descripcion: 'Anillo de compromiso con diamante central 0.5ct en oro blanco 18k',
    categoria: 'Anillo',
    tipo_metal: 'Oro 18k',
    color_metal: 'plateado',
    piedras: 'diamante',
    peso_gramos: 4.2,
    talla: '6',
    coleccion: 'Colección Novias 2025',
    proveedor: 'Diamantes Premium',
    costo: 850000,
    precio_venta: 1250000,
    moneda: 'CRC',
    stock_actual: 1,
    stock_minimo: 1,
    ubicacion: 'Caja Fuerte',
    estado: 'Activo'
  },
  {
    codigo: 'DJ-0100',
    nombre: 'Dije Cruz Plata',
    descripcion: 'Dije en forma de cruz con circonias en plata 925',
    categoria: 'Dije',
    tipo_metal: 'Plata 925',
    color_metal: 'plateado',
    piedras: 'circonia',
    peso_gramos: 1.8,
    talla: '2cm',
    coleccion: 'Colección Fe',
    proveedor: 'Joyería Religiosa',
    costo: 18000,
    precio_venta: 32000,
    moneda: 'CRC',
    stock_actual: 15,
    stock_minimo: 8,
    ubicacion: 'Vitrina 4',
    estado: 'Activo'
  },
  {
    codigo: 'AR-0088',
    nombre: 'Aretes Aro Grande Oro 10k',
    descripcion: 'Aretes tipo aro grande en oro amarillo 10k, diámetro 4cm',
    categoria: 'Aretes',
    tipo_metal: 'Oro 10k',
    color_metal: 'dorado',
    piedras: 'sin piedra',
    peso_gramos: 3.8,
    talla: '4cm',
    coleccion: 'Colección Urbana',
    proveedor: 'Joyería El Dorado',
    costo: 95000,
    precio_venta: 145000,
    moneda: 'CRC',
    stock_actual: 0,
    stock_minimo: 3,
    ubicacion: 'Agotado',
    estado: 'Activo'
  },
  {
    codigo: 'SET-0050',
    nombre: 'Set Collar y Aretes Perla',
    descripcion: 'Conjunto de collar y aretes con perlas cultivadas en plata 925',
    categoria: 'Set',
    tipo_metal: 'Plata 925',
    color_metal: 'plateado',
    piedras: 'perla',
    peso_gramos: 12.5,
    talla: 'Único',
    coleccion: 'Colección Elegancia',
    proveedor: 'Perlas del Pacífico',
    costo: 85000,
    precio_venta: 135000,
    moneda: 'CRC',
    stock_actual: 4,
    stock_minimo: 2,
    ubicacion: 'Vitrina 2',
    estado: 'Activo'
  },
  {
    codigo: 'AN-0110',
    nombre: 'Anillo Oro Rosa Circonia',
    descripcion: 'Anillo con múltiples circonias en oro rosa 14k',
    categoria: 'Anillo',
    tipo_metal: 'Oro 14k',
    color_metal: 'rosado',
    piedras: 'circonia',
    peso_gramos: 3.2,
    talla: '8',
    coleccion: 'Colección Moderna',
    proveedor: 'Joyería El Dorado',
    costo: 135000,
    precio_venta: 198000,
    moneda: 'CRC',
    stock_actual: 6,
    stock_minimo: 4,
    ubicacion: 'Vitrina 1',
    estado: 'Activo'
  },
  {
    codigo: 'RE-0001',
    nombre: 'Reloj Acero Inoxidable',
    descripcion: 'Reloj de pulsera para dama en acero inoxidable con cristales',
    categoria: 'Reloj',
    tipo_metal: 'Acero',
    color_metal: 'plateado',
    piedras: 'cristales',
    peso_gramos: 45.0,
    talla: 'Ajustable',
    coleccion: 'Colección Time',
    proveedor: 'Relojes Importados',
    costo: 75000,
    precio_venta: 125000,
    moneda: 'CRC',
    stock_actual: 8,
    stock_minimo: 5,
    ubicacion: 'Vitrina Relojes',
    estado: 'Activo'
  }
];

const insertarJoyasEjemplo = () => {
  return new Promise((resolve, reject) => {
    // Verificar si ya hay datos
    db.get('SELECT COUNT(*) as total FROM joyas', [], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.total > 0) {
        console.log('La base de datos ya contiene joyas. No se insertarán datos de ejemplo.');
        resolve();
        return;
      }

      console.log('Insertando joyas de ejemplo...');
      
      const stmt = db.prepare(`
        INSERT INTO joyas (
          codigo, nombre, descripcion, categoria, tipo_metal, color_metal,
          piedras, peso_gramos, talla, coleccion, proveedor, costo,
          precio_venta, moneda, stock_actual, stock_minimo, ubicacion, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      joyasEjemplo.forEach((joya) => {
        stmt.run([
          joya.codigo, joya.nombre, joya.descripcion, joya.categoria,
          joya.tipo_metal, joya.color_metal, joya.piedras, joya.peso_gramos,
          joya.talla, joya.coleccion, joya.proveedor, joya.costo,
          joya.precio_venta, joya.moneda, joya.stock_actual,
          joya.stock_minimo, joya.ubicacion, joya.estado
        ]);
      });

      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`${joyasEjemplo.length} joyas de ejemplo insertadas correctamente.`);
          
          // Insertar movimientos iniciales
          const stmtMov = db.prepare(`
            INSERT INTO movimientos_inventario (
              id_joya, tipo_movimiento, cantidad, motivo, usuario, stock_antes, stock_despues
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

          for (let i = 1; i <= joyasEjemplo.length; i++) {
            if (joyasEjemplo[i-1].stock_actual > 0) {
              stmtMov.run([
                i,
                'Entrada',
                joyasEjemplo[i-1].stock_actual,
                'Inventario inicial',
                'Sistema',
                0,
                joyasEjemplo[i-1].stock_actual
              ]);
            }
          }

          stmtMov.finalize((err) => {
            if (err) {
              reject(err);
            } else {
              console.log('Movimientos iniciales registrados.');
              resolve();
            }
          });
        }
      });
    });
  });
};

module.exports = { insertarJoyasEjemplo };
