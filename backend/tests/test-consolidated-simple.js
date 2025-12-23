/**
 * Simple unit tests for CuentaPorCobrar consolidated logic
 * Tests without requiring jest or database connection
 */

// Mock data storage
const mockData = {
  cuentas: [],
  movimientos: [],
  nextId: 1
};

// Mock Supabase client
const createMockSupabase = () => ({
  from: (table) => {
    const builder = {
      _table: table,
      _filters: {},
      _data: null,
      _single: false,
      
      select(cols) {
        return this;
      },
      
      eq(col, val) {
        this._filters[col] = val;
        return this;
      },
      
      single() {
        this._single = true;
        return this;
      },
      
      insert(data) {
        this._data = data;
        this._action = 'insert';
        return this;
      },
      
      update(data) {
        this._data = data;
        this._action = 'update';
        return this;
      },
      
      order() { return this; },
      range() { return this; },
      
      async then(resolve) {
        if (this._table === 'cuentas_por_cobrar') {
          if (this._action === 'insert') {
            const newItem = { id: mockData.nextId++, ...this._data[0] };
            mockData.cuentas.push(newItem);
            return resolve({ data: newItem, error: null });
          } else if (this._action === 'update') {
            const item = mockData.cuentas.find(c => c.id === this._filters.id);
            if (item) {
              Object.assign(item, this._data);
              return resolve({ data: item, error: null });
            }
          } else {
            // Query
            let items = mockData.cuentas.filter(c => {
              for (let key in this._filters) {
                if (c[key] !== this._filters[key]) return false;
              }
              return true;
            });
            
            if (this._single) {
              return resolve({ 
                data: items[0] || null, 
                error: items.length === 0 ? { code: 'PGRST116' } : null 
              });
            }
            return resolve({ data: items, error: null });
          }
        } else if (this._table === 'movimientos_cuenta') {
          if (this._action === 'insert') {
            const newItem = { id: mockData.nextId++, ...this._data[0] };
            mockData.movimientos.push(newItem);
            return resolve({ data: newItem, error: null });
          }
        }
        return resolve({ data: null, error: null });
      }
    };
    return builder;
  }
});

// Override require to inject mocks
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === '../supabase-db') {
    return { supabase: createMockSupabase() };
  }
  if (id === '../utils/timezone') {
    return { formatearFechaSQL: () => new Date().toISOString() };
  }
  return originalRequire.apply(this, arguments);
};

// Now load the model
const CuentaPorCobrar = require('../models/CuentaPorCobrar');

// Test runner
async function runTests() {
  console.log('🧪 Running Unit Tests for Consolidated Accounts Logic\n');
  console.log('='.repeat(60));
  
  const tests = [
    {
      name: 'Should create new account when no active account exists',
      async run() {
        mockData.cuentas = [];
        mockData.movimientos = [];
        mockData.nextId = 1;
        
        const result = await CuentaPorCobrar.crear({
          id_venta: 1,
          id_cliente: 100,
          monto_total: 500,
          saldo_pendiente: 500,
          estado: 'Pendiente'
        });
        
        if (!result.id) throw new Error('No ID returned');
        if (result.actualizada !== false) throw new Error('Should not be marked as updated');
        if (mockData.cuentas.length !== 1) throw new Error(`Expected 1 cuenta, got ${mockData.cuentas.length}`);
        if (mockData.cuentas[0].monto_total !== 500) throw new Error(`Expected monto_total 500, got ${mockData.cuentas[0].monto_total}`);
        if (mockData.movimientos.length !== 1) throw new Error(`Expected 1 movimiento, got ${mockData.movimientos.length}`);
        
        return 'New account created with initial movimiento';
      }
    },
    {
      name: 'Should update existing account when active account exists for same client',
      async run() {
        mockData.cuentas = [];
        mockData.movimientos = [];
        mockData.nextId = 1;
        
        // First sale
        await CuentaPorCobrar.crear({
          id_venta: 1,
          id_cliente: 100,
          monto_total: 500,
          saldo_pendiente: 500,
          estado: 'Pendiente'
        });
        
        const beforeCount = mockData.cuentas.length;
        
        // Second sale to same client
        const result = await CuentaPorCobrar.crear({
          id_venta: 2,
          id_cliente: 100,
          monto_total: 300,
          saldo_pendiente: 300,
          estado: 'Pendiente'
        });
        
        if (result.actualizada !== true) throw new Error('Should be marked as updated');
        if (mockData.cuentas.length !== beforeCount) throw new Error('Should not create new account');
        if (mockData.cuentas.length !== 1) throw new Error(`Expected 1 cuenta, got ${mockData.cuentas.length}`);
        if (mockData.cuentas[0].monto_total !== 800) throw new Error(`Expected total 800, got ${mockData.cuentas[0].monto_total}`);
        if (mockData.cuentas[0].saldo_pendiente !== 800) throw new Error(`Expected saldo 800, got ${mockData.cuentas[0].saldo_pendiente}`);
        if (mockData.movimientos.length !== 2) throw new Error(`Expected 2 movimientos, got ${mockData.movimientos.length}`);
        
        return 'Account updated: 500 + 300 = 800, with 2 movimientos';
      }
    },
    {
      name: 'Should create separate accounts for different clients',
      async run() {
        mockData.cuentas = [];
        mockData.movimientos = [];
        mockData.nextId = 1;
        
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
        
        if (mockData.cuentas.length !== 2) throw new Error(`Expected 2 cuentas, got ${mockData.cuentas.length}`);
        if (mockData.cuentas[0].id_cliente !== 100) throw new Error('Wrong client for account 1');
        if (mockData.cuentas[1].id_cliente !== 200) throw new Error('Wrong client for account 2');
        if (mockData.movimientos.length !== 2) throw new Error(`Expected 2 movimientos, got ${mockData.movimientos.length}`);
        
        return 'Two separate accounts created for two different clients';
      }
    },
    {
      name: 'Should handle multiple sales to same client correctly',
      async run() {
        mockData.cuentas = [];
        mockData.movimientos = [];
        mockData.nextId = 1;
        
        const cliente = 150;
        
        // Sale 1: 400
        await CuentaPorCobrar.crear({
          id_venta: 1,
          id_cliente: cliente,
          monto_total: 400,
          saldo_pendiente: 400,
          estado: 'Pendiente'
        });
        
        // Sale 2: 600
        await CuentaPorCobrar.crear({
          id_venta: 2,
          id_cliente: cliente,
          monto_total: 600,
          saldo_pendiente: 600,
          estado: 'Pendiente'
        });
        
        // Sale 3: 200
        await CuentaPorCobrar.crear({
          id_venta: 3,
          id_cliente: cliente,
          monto_total: 200,
          saldo_pendiente: 200,
          estado: 'Pendiente'
        });
        
        if (mockData.cuentas.length !== 1) throw new Error(`Expected 1 cuenta, got ${mockData.cuentas.length}`);
        if (mockData.cuentas[0].monto_total !== 1200) throw new Error(`Expected total 1200, got ${mockData.cuentas[0].monto_total}`);
        if (mockData.movimientos.length !== 3) throw new Error(`Expected 3 movimientos, got ${mockData.movimientos.length}`);
        
        // Verify all movimientos are venta_credito
        const allVentas = mockData.movimientos.every(m => m.tipo === 'venta_credito');
        if (!allVentas) throw new Error('Not all movimientos are venta_credito');
        
        return 'Three sales consolidated: 400 + 600 + 200 = 1200';
      }
    },
    {
      name: 'Should retrieve active account correctly',
      async run() {
        mockData.cuentas = [];
        mockData.movimientos = [];
        mockData.nextId = 1;
        
        // Create account
        await CuentaPorCobrar.crear({
          id_venta: 1,
          id_cliente: 999,
          monto_total: 1000,
          saldo_pendiente: 1000,
          estado: 'Pendiente'
        });
        
        // Try to get active account
        const cuenta = await CuentaPorCobrar.obtenerActivaPorCliente(999);
        
        if (!cuenta) throw new Error('Active account not found');
        if (cuenta.id_cliente !== 999) throw new Error('Wrong client ID');
        if (cuenta.estado !== 'Pendiente') throw new Error('Wrong status');
        if (cuenta.monto_total !== 1000) throw new Error('Wrong amount');
        
        return 'Active account retrieved successfully';
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.run();
      console.log(`✅ PASS: ${test.name}`);
      console.log(`   → ${result}`);
      passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Consolidated accounts logic is working correctly.');
    console.log('\n✅ Key features verified:');
    console.log('   • New accounts created when none exist');
    console.log('   • Existing accounts updated for same client');
    console.log('   • Separate accounts for different clients');
    console.log('   • Multiple sales consolidated correctly');
    console.log('   • Movimientos tracked for all operations');
  }
}

// Run the tests
runTests().catch(err => {
  console.error('\n💥 Test runner crashed:', err);
  process.exit(1);
});
