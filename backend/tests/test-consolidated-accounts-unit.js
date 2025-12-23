/**
 * Unit tests for CuentaPorCobrar model logic
 * Tests the consolidation logic without requiring database connection
 */

// Mock the Supabase client
const mockSupabaseData = {
  cuentas: [],
  movimientos: [],
  nextId: 1
};

// Mock supabase client
const mockSupabase = {
  from: (table) => {
    const queryBuilder = {
      _table: table,
      _filters: {},
      _single: false,
      _select: '*',
      
      select(columns = '*', options = {}) {
        this._select = columns;
        this._count = options.count;
        return this;
      },
      
      eq(column, value) {
        this._filters[column] = value;
        return this;
      },
      
      single() {
        this._single = true;
        return this;
      },
      
      insert(data) {
        this._insertData = data;
        return this;
      },
      
      update(data) {
        this._updateData = data;
        return this;
      },
      
      order(column, options) {
        this._order = { column, ...options };
        return this;
      },
      
      range(from, to) {
        this._range = { from, to };
        return this;
      },
      
      async then(resolve) {
        let result;
        
        if (this._table === 'cuentas_por_cobrar') {
          if (this._insertData) {
            // Insert new cuenta
            const newCuenta = {
              id: mockSupabaseData.nextId++,
              ...this._insertData[0]
            };
            mockSupabaseData.cuentas.push(newCuenta);
            result = { data: newCuenta, error: null };
          } else if (this._updateData) {
            // Update cuenta
            const cuenta = mockSupabaseData.cuentas.find(
              c => c.id === this._filters.id
            );
            if (cuenta) {
              Object.assign(cuenta, this._updateData);
              result = { data: cuenta, error: null };
            } else {
              result = { data: null, error: { message: 'Not found' } };
            }
          } else {
            // Query cuentas
            let cuentas = mockSupabaseData.cuentas.filter(c => {
              for (let key in this._filters) {
                if (c[key] !== this._filters[key]) return false;
              }
              return true;
            });
            
            if (this._single) {
              result = { 
                data: cuentas[0] || null, 
                error: cuentas.length === 0 ? { code: 'PGRST116' } : null 
              };
            } else {
              result = { data: cuentas, error: null };
            }
          }
        } else if (this._table === 'movimientos_cuenta') {
          if (this._insertData) {
            const newMov = {
              id: mockSupabaseData.nextId++,
              ...this._insertData[0]
            };
            mockSupabaseData.movimientos.push(newMov);
            result = { data: newMov, error: null };
          } else {
            let movimientos = mockSupabaseData.movimientos.filter(m => {
              for (let key in this._filters) {
                if (m[key] !== this._filters[key]) return false;
              }
              return true;
            });
            result = { data: movimientos, error: null };
          }
        }
        
        return resolve(result);
      }
    };
    
    return queryBuilder;
  }
};

// Mock the modules
jest.mock('../supabase-db', () => ({
  supabase: mockSupabase
}));

jest.mock('../utils/timezone', () => ({
  formatearFechaSQL: () => new Date().toISOString()
}));

// Import after mocking
const CuentaPorCobrar = require('../models/CuentaPorCobrar');

describe('CuentaPorCobrar - Consolidated Accounts', () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockSupabaseData.cuentas = [];
    mockSupabaseData.movimientos = [];
    mockSupabaseData.nextId = 1;
  });

  test('should create new account when no active account exists', async () => {
    const cuentaData = {
      id_venta: 1,
      id_cliente: 100,
      monto_total: 500,
      saldo_pendiente: 500,
      estado: 'Pendiente'
    };

    const result = await CuentaPorCobrar.crear(cuentaData);

    expect(result).toHaveProperty('id');
    expect(result.actualizada).toBe(false);
    expect(mockSupabaseData.cuentas.length).toBe(1);
    expect(mockSupabaseData.cuentas[0].monto_total).toBe(500);
    expect(mockSupabaseData.movimientos.length).toBe(1);
  });

  test('should update existing account when active account exists', async () => {
    // First, create an account
    const firstCuentaData = {
      id_venta: 1,
      id_cliente: 100,
      monto_total: 500,
      saldo_pendiente: 500,
      estado: 'Pendiente'
    };
    
    await CuentaPorCobrar.crear(firstCuentaData);
    
    // Now create second sale for same client
    const secondCuentaData = {
      id_venta: 2,
      id_cliente: 100,
      monto_total: 300,
      saldo_pendiente: 300,
      estado: 'Pendiente'
    };
    
    const result = await CuentaPorCobrar.crear(secondCuentaData);

    expect(result).toHaveProperty('id');
    expect(result.actualizada).toBe(true);
    expect(mockSupabaseData.cuentas.length).toBe(1); // Still only one account
    expect(mockSupabaseData.cuentas[0].monto_total).toBe(800); // 500 + 300
    expect(mockSupabaseData.cuentas[0].saldo_pendiente).toBe(800);
    expect(mockSupabaseData.movimientos.length).toBe(2); // Two movimientos
  });

  test('should not update paid accounts', async () => {
    // Create a paid account
    mockSupabaseData.cuentas.push({
      id: 1,
      id_venta: 1,
      id_cliente: 100,
      monto_total: 500,
      monto_pagado: 500,
      saldo_pendiente: 0,
      estado: 'Pagada'
    });

    // Create new sale for same client
    const newCuentaData = {
      id_venta: 2,
      id_cliente: 100,
      monto_total: 300,
      saldo_pendiente: 300,
      estado: 'Pendiente'
    };
    
    const result = await CuentaPorCobrar.crear(newCuentaData);

    expect(mockSupabaseData.cuentas.length).toBe(2); // New account created
    expect(result.actualizada).toBe(false);
    expect(mockSupabaseData.cuentas[1].monto_total).toBe(300);
  });

  test('should track multiple sales in movimientos', async () => {
    const cliente = 100;
    
    // First sale
    await CuentaPorCobrar.crear({
      id_venta: 1,
      id_cliente: cliente,
      monto_total: 500,
      saldo_pendiente: 500,
      estado: 'Pendiente'
    });
    
    // Second sale
    await CuentaPorCobrar.crear({
      id_venta: 2,
      id_cliente: cliente,
      monto_total: 300,
      saldo_pendiente: 300,
      estado: 'Pendiente'
    });
    
    // Third sale
    await CuentaPorCobrar.crear({
      id_venta: 3,
      id_cliente: cliente,
      monto_total: 200,
      saldo_pendiente: 200,
      estado: 'Pendiente'
    });

    expect(mockSupabaseData.cuentas.length).toBe(1);
    expect(mockSupabaseData.cuentas[0].monto_total).toBe(1000); // 500+300+200
    expect(mockSupabaseData.movimientos.length).toBe(3);
    
    // Check movimientos
    const movimientos = mockSupabaseData.movimientos.filter(
      m => m.id_cuenta_por_cobrar === mockSupabaseData.cuentas[0].id
    );
    expect(movimientos.length).toBe(3);
    expect(movimientos.every(m => m.tipo === 'venta_credito')).toBe(true);
  });

  test('should create separate accounts for different clients', async () => {
    // Client 1
    await CuentaPorCobrar.crear({
      id_venta: 1,
      id_cliente: 100,
      monto_total: 500,
      saldo_pendiente: 500,
      estado: 'Pendiente'
    });
    
    // Client 2
    await CuentaPorCobrar.crear({
      id_venta: 2,
      id_cliente: 200,
      monto_total: 300,
      saldo_pendiente: 300,
      estado: 'Pendiente'
    });

    expect(mockSupabaseData.cuentas.length).toBe(2);
    expect(mockSupabaseData.cuentas[0].id_cliente).toBe(100);
    expect(mockSupabaseData.cuentas[1].id_cliente).toBe(200);
  });
});

// Run tests
console.log('🧪 Running Unit Tests for Consolidated Accounts\n');
console.log('=' .repeat(60));

// Simple test runner
async function runUnitTests() {
  const tests = [
    {
      name: 'Create new account when none exists',
      fn: async () => {
        mockSupabaseData.cuentas = [];
        mockSupabaseData.movimientos = [];
        mockSupabaseData.nextId = 1;
        
        const result = await CuentaPorCobrar.crear({
          id_venta: 1,
          id_cliente: 100,
          monto_total: 500,
          saldo_pendiente: 500,
          estado: 'Pendiente'
        });

        if (!result.id) throw new Error('No ID returned');
        if (result.actualizada !== false) throw new Error('Should not be updated');
        if (mockSupabaseData.cuentas.length !== 1) throw new Error('Wrong cuenta count');
        if (mockSupabaseData.movimientos.length !== 1) throw new Error('Wrong movimiento count');
      }
    },
    {
      name: 'Update existing account for same client',
      fn: async () => {
        mockSupabaseData.cuentas = [];
        mockSupabaseData.movimientos = [];
        mockSupabaseData.nextId = 1;
        
        await CuentaPorCobrar.crear({
          id_venta: 1,
          id_cliente: 100,
          monto_total: 500,
          saldo_pendiente: 500,
          estado: 'Pendiente'
        });
        
        const result = await CuentaPorCobrar.crear({
          id_venta: 2,
          id_cliente: 100,
          monto_total: 300,
          saldo_pendiente: 300,
          estado: 'Pendiente'
        });

        if (result.actualizada !== true) throw new Error('Should be updated');
        if (mockSupabaseData.cuentas.length !== 1) throw new Error('Should have only 1 account');
        if (mockSupabaseData.cuentas[0].monto_total !== 800) throw new Error('Wrong total');
        if (mockSupabaseData.movimientos.length !== 2) throw new Error('Should have 2 movimientos');
      }
    },
    {
      name: 'Create separate accounts for different clients',
      fn: async () => {
        mockSupabaseData.cuentas = [];
        mockSupabaseData.movimientos = [];
        mockSupabaseData.nextId = 1;
        
        await CuentaPorCobrar.crear({
          id_venta: 1,
          id_cliente: 100,
          monto_total: 500,
          saldo_pendiente: 500,
          estado: 'Pendiente'
        });
        
        await CuentaPorCobrar.crear({
          id_venta: 2,
          id_cliente: 200,
          monto_total: 300,
          saldo_pendiente: 300,
          estado: 'Pendiente'
        });

        if (mockSupabaseData.cuentas.length !== 2) throw new Error('Should have 2 accounts');
        if (mockSupabaseData.cuentas[0].id_cliente !== 100) throw new Error('Wrong client 1');
        if (mockSupabaseData.cuentas[1].id_cliente !== 200) throw new Error('Wrong client 2');
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.fn();
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 All unit tests passed!');
  }
}

runUnitTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
