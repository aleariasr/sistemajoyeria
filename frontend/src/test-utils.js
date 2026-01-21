import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Additional options
 * @param {Object} options.initialAuthState - Initial auth state for testing
 * @returns {Object} - Rendered component with utilities
 */
export function renderWithProviders(ui, { initialAuthState, ...renderOptions } = {}) {
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Wait for async operations to complete
 * @param {number} ms - Milliseconds to wait
 */
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock authenticated user
 */
export const mockAdminUser = {
  id: 1,
  username: 'admin',
  nombre: 'Administrador',
  role: 'administrador'
};

export const mockDependienteUser = {
  id: 2,
  username: 'dependiente',
  nombre: 'Dependiente Test',
  role: 'dependiente'
};

/**
 * Mock joyas (products) for testing
 */
export const mockJoyas = [
  {
    id: 1,
    codigo: 'ANL001',
    categoria: 'anillos',
    peso: 5.5,
    quilates: 18,
    precio_compra: 100,
    precio_venta: 150,
    stock: 10,
    descripcion: 'Anillo de oro 18k',
    imagen_url: 'https://example.com/anillo.jpg'
  },
  {
    id: 2,
    codigo: 'CLR001',
    categoria: 'collares',
    peso: 8.0,
    quilates: 14,
    precio_compra: 200,
    precio_venta: 300,
    stock: 5,
    descripcion: 'Collar de oro 14k',
    imagen_url: 'https://example.com/collar.jpg'
  },
  {
    id: 3,
    codigo: 'ART001',
    categoria: 'aretes',
    peso: 3.2,
    quilates: 18,
    precio_compra: 80,
    precio_venta: 120,
    stock: 15,
    descripcion: 'Aretes de oro 18k',
    imagen_url: 'https://example.com/aretes.jpg'
  }
];

/**
 * Mock clientes for testing
 */
export const mockClientes = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    telefono: '555-1234',
    email: 'juan@example.com',
    direccion: 'Calle 123'
  },
  {
    id: 2,
    nombre: 'María García',
    telefono: '555-5678',
    email: 'maria@example.com',
    direccion: 'Avenida 456'
  }
];

/**
 * Mock ventas for testing
 */
export const mockVentas = [
  {
    id: 1,
    fecha: new Date().toISOString(),
    total: 450,
    tipo_venta: 'contado',
    metodo_pago: 'efectivo',
    vendedor_nombre: 'Admin',
    items: [
      { joya_id: 1, cantidad: 2, precio_unitario: 150, subtotal: 300 },
      { joya_id: 2, cantidad: 1, precio_unitario: 150, subtotal: 150 }
    ]
  }
];

/**
 * Mock cuentas por cobrar for testing
 */
export const mockCuentasPorCobrar = [
  {
    id: 1,
    venta_id: 1,
    cliente_id: 1,
    cliente_nombre: 'Juan Pérez',
    monto_total: 1000,
    saldo_pendiente: 400,
    fecha_venta: new Date().toISOString(),
    estado: 'pendiente',
    abonos: [
      { id: 1, monto: 600, fecha: new Date().toISOString(), metodo_pago: 'efectivo' }
    ]
  }
];

// Re-export everything from React Testing Library
export * from '@testing-library/react';
