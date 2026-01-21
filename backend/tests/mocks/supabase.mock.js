/**
 * Supabase Mock for Testing
 * Provides in-memory mock of Supabase client with fixtures
 */

class MockSupabaseClient {
  constructor(fixtures = {}) {
    this.fixtures = {
      joyas: fixtures.joyas || [],
      usuarios: fixtures.usuarios || [],
      variantes_producto: fixtures.variantes_producto || [],
      productos_compuestos: fixtures.productos_compuestos || [],
      movimientos_inventario: fixtures.movimientos_inventario || [],
      ventas: fixtures.ventas || [],
      items_venta: fixtures.items_venta || [],
      clientes: fixtures.clientes || [],
      cuentas_por_cobrar: fixtures.cuentas_por_cobrar || [],
      abonos: fixtures.abonos || []
    };
    this.autoIncrementIds = {};
    this.queryBuilder = null;
  }

  /**
   * Initialize table with auto-increment IDs
   */
  _initTable(table) {
    if (!this.autoIncrementIds[table]) {
      const maxId = this.fixtures[table].reduce((max, item) => 
        Math.max(max, item.id || 0), 0);
      this.autoIncrementIds[table] = maxId + 1;
    }
  }

  /**
   * Get next auto-increment ID for table
   */
  _getNextId(table) {
    this._initTable(table);
    return this.autoIncrementIds[table]++;
  }

  /**
   * from() - Start a query builder chain
   */
  from(table) {
    this.queryBuilder = new MockQueryBuilder(this, table);
    return this.queryBuilder;
  }

  /**
   * Get fixture data for a table
   */
  getFixtures(table) {
    return this.fixtures[table] || [];
  }

  /**
   * Set fixture data for a table
   */
  setFixtures(table, data) {
    this.fixtures[table] = data;
  }

  /**
   * Reset all fixtures
   */
  resetFixtures() {
    Object.keys(this.fixtures).forEach(key => {
      this.fixtures[key] = [];
    });
    this.autoIncrementIds = {};
  }
}

class MockQueryBuilder {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this.filters = [];
    this.selectCols = '*';
    this.orderByCol = null;
    this.orderAsc = true;
    this.limitNum = null;
    this.rangeStart = null;
    this.rangeEnd = null;
    this.countOption = null;
    this.insertData = null;
    this.updateData = null;
    this.isSingle = false;
  }

  /**
   * select() - Specify columns to select
   */
  select(columns = '*', options = {}) {
    this.selectCols = columns;
    if (options.count) {
      this.countOption = options.count;
    }
    return this;
  }

  /**
   * insert() - Insert data
   */
  insert(data) {
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  /**
   * update() - Update data
   */
  update(data) {
    this.updateData = data;
    return this;
  }

  /**
   * delete() - Delete operation
   */
  delete() {
    this.isDelete = true;
    return this;
  }

  /**
   * eq() - Equal filter
   */
  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  /**
   * neq() - Not equal filter
   */
  neq(column, value) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  /**
   * gt() - Greater than filter
   */
  gt(column, value) {
    this.filters.push({ type: 'gt', column, value });
    return this;
  }

  /**
   * gte() - Greater than or equal filter
   */
  gte(column, value) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  /**
   * lt() - Less than filter
   */
  lt(column, value) {
    this.filters.push({ type: 'lt', column, value });
    return this;
  }

  /**
   * lte() - Less than or equal filter
   */
  lte(column, value) {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }

  /**
   * ilike() - Case-insensitive like filter
   */
  ilike(column, pattern) {
    this.filters.push({ type: 'ilike', column, pattern });
    return this;
  }

  /**
   * or() - OR filter
   */
  or(query) {
    this.filters.push({ type: 'or', query });
    return this;
  }

  /**
   * filter() - Custom filter
   */
  filter(column, operator, value) {
    this.filters.push({ type: 'filter', column, operator, value });
    return this;
  }

  /**
   * order() - Order results
   */
  order(column, options = {}) {
    this.orderByCol = column;
    this.orderAsc = options.ascending !== false;
    return this;
  }

  /**
   * limit() - Limit results
   */
  limit(num) {
    this.limitNum = num;
    return this;
  }

  /**
   * range() - Range pagination
   */
  range(start, end) {
    this.rangeStart = start;
    this.rangeEnd = end;
    return this;
  }

  /**
   * single() - Return single result
   */
  single() {
    this.isSingle = true;
    return this;
  }

  /**
   * Apply filters to data
   */
  _applyFilters(data) {
    return data.filter(item => {
      return this.filters.every(filter => {
        if (filter.type === 'eq') {
          return item[filter.column] === filter.value;
        }
        if (filter.type === 'neq') {
          return item[filter.column] !== filter.value;
        }
        if (filter.type === 'gt') {
          return item[filter.column] > filter.value;
        }
        if (filter.type === 'gte') {
          return item[filter.column] >= filter.value;
        }
        if (filter.type === 'lt') {
          return item[filter.column] < filter.value;
        }
        if (filter.type === 'lte') {
          return item[filter.column] <= filter.value;
        }
        if (filter.type === 'ilike') {
          const pattern = filter.pattern.toLowerCase().replace(/%/g, '.*');
          const regex = new RegExp(pattern);
          return regex.test(String(item[filter.column] || '').toLowerCase());
        }
        if (filter.type === 'or') {
          // Parse OR query like "codigo.ilike.%search%,nombre.ilike.%search%"
          const orConditions = filter.query.split(',');
          return orConditions.some(condition => {
            const parts = condition.split('.');
            const col = parts[0];
            const op = parts[1];
            const val = parts.slice(2).join('.');
            
            if (op === 'ilike') {
              const pattern = val.toLowerCase().replace(/%/g, '.*');
              const regex = new RegExp(pattern);
              return regex.test(String(item[col] || '').toLowerCase());
            }
            return false;
          });
        }
        if (filter.type === 'filter') {
          const itemValue = item[filter.column];
          const filterValue = filter.value;
          switch (filter.operator) {
            case 'lte':
              return itemValue <= filterValue;
            case 'gte':
              return itemValue >= filterValue;
            case 'eq':
              return itemValue === filterValue;
            default:
              return true;
          }
        }
        return true;
      });
    });
  }

  /**
   * Execute the query
   */
  async execute() {
    const fixtures = this.client.getFixtures(this.table);

    // INSERT operation
    if (this.insertData) {
      const newItems = this.insertData.map(item => ({
        ...item,
        id: item.id || this.client._getNextId(this.table),
        fecha_creacion: item.fecha_creacion || new Date().toISOString()
      }));

      this.client.setFixtures(this.table, [...fixtures, ...newItems]);

      if (this.isSingle) {
        return { data: newItems[0], error: null };
      }
      return { data: newItems, error: null };
    }

    // UPDATE operation
    if (this.updateData) {
      let filtered = this._applyFilters(fixtures);
      const updatedIds = new Set(filtered.map(item => item.id));

      const updated = fixtures.map(item => {
        if (updatedIds.has(item.id)) {
          return { ...item, ...this.updateData };
        }
        return item;
      });

      this.client.setFixtures(this.table, updated);

      const result = updated.filter(item => updatedIds.has(item.id));
      if (this.isSingle) {
        return { data: result[0] || null, error: null };
      }
      return { data: result, error: null };
    }

    // DELETE operation
    if (this.isDelete) {
      let filtered = this._applyFilters(fixtures);
      const deletedIds = new Set(filtered.map(item => item.id));

      const remaining = fixtures.filter(item => !deletedIds.has(item.id));
      this.client.setFixtures(this.table, remaining);

      return { data: null, error: null };
    }

    // SELECT operation
    let result = this._applyFilters(fixtures);

    // Apply ordering
    if (this.orderByCol) {
      result.sort((a, b) => {
        const aVal = a[this.orderByCol];
        const bVal = b[this.orderByCol];
        if (aVal < bVal) return this.orderAsc ? -1 : 1;
        if (aVal > bVal) return this.orderAsc ? 1 : -1;
        return 0;
      });
    }

    // Get count before pagination
    const count = result.length;

    // Apply range pagination
    if (this.rangeStart !== null && this.rangeEnd !== null) {
      result = result.slice(this.rangeStart, this.rangeEnd + 1);
    }

    // Apply limit
    if (this.limitNum !== null) {
      result = result.slice(0, this.limitNum);
    }

    // Return result
    if (this.isSingle) {
      if (result.length === 0) {
        // Supabase returns null data with a specific error code for no rows
        return { data: null, error: { code: 'PGRST116', message: 'No rows found' }, count: this.countOption ? count : undefined };
      }
      return { data: result[0], error: null, count: this.countOption ? count : undefined };
    }

    return { 
      data: result, 
      error: null, 
      count: this.countOption ? count : undefined 
    };
  }

  // Make the query builder thenable for async/await
  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

/**
 * Create mock Supabase client with fixtures
 */
function createMockSupabase(fixtures = {}) {
  return new MockSupabaseClient(fixtures);
}

module.exports = {
  createMockSupabase,
  MockSupabaseClient,
  MockQueryBuilder
};
