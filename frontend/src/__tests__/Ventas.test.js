import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import Ventas from '../components/Ventas';
import { server } from '../mocks/server';
import { rest } from 'msw';

// Mock dependencies
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', role: 'administrador' },
    loading: false
  })
}));

// Mock print functionality
jest.mock('react-to-print', () => ({
  useReactToPrint: () => jest.fn()
}));

jest.mock('./TicketPrint', () => ({
  __esModule: true,
  default: () => <div>Mock Ticket</div>,
  useThermalPrint: () => ({ print: jest.fn() })
}));

describe('Ventas Component - Sales Flow', () => {
  beforeEach(() => {
    // Clear any console errors/warnings
    jest.clearAllMocks();
  });

  test('renders sales interface with search and cart', async () => {
    renderWithProviders(<Ventas />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar producto/i)).toBeInTheDocument();
    });
  });

  test('searches and displays products', async () => {
    renderWithProviders(<Ventas />);
    const user = userEvent.setup();
    
    const searchInput = await screen.findByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'ANL');
    
    await waitFor(() => {
      expect(screen.getByText(/anillo/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('adds item to cart', async () => {
    renderWithProviders(<Ventas />);
    const user = userEvent.setup();
    
    // Search for a product
    const searchInput = await screen.findByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'ANL001');
    
    await waitFor(() => {
      expect(screen.getByText(/anillo/i)).toBeInTheDocument();
    });
    
    // Add to cart (implementation depends on component structure)
    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    // Verify item in cart
    await waitFor(() => {
      expect(screen.getByText(/ANL001/i)).toBeInTheDocument();
    });
  });

  test('removes item from cart', async () => {
    renderWithProviders(<Ventas />);
    const user = userEvent.setup();
    
    // Add item first
    const searchInput = await screen.findByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'ANL001');
    
    await waitFor(() => {
      expect(screen.getByText(/anillo/i)).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    // Remove from cart
    const removeButton = await screen.findByRole('button', { name: /eliminar/i });
    await user.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/ANL001/i)).not.toBeInTheDocument();
    });
  });

  test('completes cash payment sale (contado)', async () => {
    renderWithProviders(<Ventas />);
    const user = userEvent.setup();
    
    // Add item to cart
    const searchInput = await screen.findByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'ANL001');
    
    await waitFor(() => {
      expect(screen.getByText(/anillo/i)).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    // Select payment method
    const efectivoRadio = screen.getByLabelText(/efectivo/i);
    await user.click(efectivoRadio);
    
    // Complete sale
    const ventaButton = screen.getByRole('button', { name: /registrar venta/i });
    await user.click(ventaButton);
    
    await waitFor(() => {
      expect(screen.getByText(/venta registrada exitosamente/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('completes card payment sale', async () => {
    renderWithProviders(<Ventas />);
    const user = userEvent.setup();
    
    // Add item to cart
    const searchInput = await screen.findByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'CLR001');
    
    await waitFor(() => {
      expect(screen.getByText(/collar/i)).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    // Select card payment
    const tarjetaRadio = screen.getByLabelText(/tarjeta/i);
    await user.click(tarjetaRadio);
    
    // Complete sale
    const ventaButton = screen.getByRole('button', { name: /registrar venta/i });
    await user.click(ventaButton);
    
    await waitFor(() => {
      expect(screen.getByText(/venta registrada exitosamente/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('completes mixed payment sale', async () => {
    renderWithProviders(<Ventas />);
    const user = userEvent.setup();
    
    // Add item to cart
    const searchInput = await screen.findByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'ANL001');
    
    await waitFor(() => {
      expect(screen.getByText(/anillo/i)).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    // Select mixed payment
    const mixtoRadio = screen.getByLabelText(/mixto/i);
    await user.click(mixtoRadio);
    
    // Enter amounts
    const efectivoInput = screen.getByLabelText(/monto efectivo/i);
    const tarjetaInput = screen.getByLabelText(/monto tarjeta/i);
    
    await user.type(efectivoInput, '100');
    await user.type(tarjetaInput, '50');
    
    // Complete sale
    const ventaButton = screen.getByRole('button', { name: /registrar venta/i });
    await user.click(ventaButton);
    
    await waitFor(() => {
      expect(screen.getByText(/venta registrada exitosamente/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('completes credit sale with client selection', async () => {
    renderWithProviders(<Ventas />);
    const user = userEvent.setup();
    
    // Add item to cart
    const searchInput = await screen.findByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'ART001');
    
    await waitFor(() => {
      expect(screen.getByText(/aretes/i)).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    // Select credit sale
    const creditoRadio = screen.getByLabelText(/crédito/i);
    await user.click(creditoRadio);
    
    // Search and select client
    const clientSearchInput = screen.getByPlaceholderText(/buscar cliente/i);
    await user.type(clientSearchInput, 'Juan');
    
    await waitFor(() => {
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
    });
    
    const selectClientButton = screen.getByRole('button', { name: /seleccionar/i });
    await user.click(selectClientButton);
    
    // Complete sale
    const ventaButton = screen.getByRole('button', { name: /registrar venta/i });
    await user.click(ventaButton);
    
    await waitFor(() => {
      expect(screen.getByText(/venta registrada exitosamente/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('validates stock before completing sale', async () => {
    // Mock insufficient stock error
    server.use(
      rest.post('http://localhost:3001/api/ventas', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({ 
            success: false, 
            message: 'Stock insuficiente para Anillo de oro 18k' 
          })
        );
      })
    );

    renderWithProviders(<Ventas />);
    const user = userEvent.setup();
    
    // Add item to cart
    const searchInput = await screen.findByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'ANL001');
    
    await waitFor(() => {
      expect(screen.getByText(/anillo/i)).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    // Try to complete sale
    const ventaButton = screen.getByRole('button', { name: /registrar venta/i });
    await user.click(ventaButton);
    
    await waitFor(() => {
      expect(screen.getByText(/stock insuficiente/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('calculates total correctly with multiple items', async () => {
    renderWithProviders(<Ventas />);
    const user = userEvent.setup();
    
    // Add first item
    const searchInput = await screen.findByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'ANL001');
    
    await waitFor(() => {
      expect(screen.getByText(/anillo/i)).toBeInTheDocument();
    });
    
    let addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    // Clear search and add second item
    await user.clear(searchInput);
    await user.type(searchInput, 'CLR001');
    
    await waitFor(() => {
      expect(screen.getByText(/collar/i)).toBeInTheDocument();
    });
    
    addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    // Verify total (150 + 300 = 450)
    await waitFor(() => {
      expect(screen.getByText(/total.*450/i)).toBeInTheDocument();
    });
  });

  test('clears cart after successful sale', async () => {
    renderWithProviders(<Ventas />);
    const user = userEvent.setup();
    
    // Add item and complete sale
    const searchInput = await screen.findByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'ANL001');
    
    await waitFor(() => {
      expect(screen.getByText(/anillo/i)).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    const ventaButton = screen.getByRole('button', { name: /registrar venta/i });
    await user.click(ventaButton);
    
    await waitFor(() => {
      expect(screen.getByText(/venta registrada exitosamente/i)).toBeInTheDocument();
    });
    
    // Verify cart is empty
    expect(screen.queryByText(/ANL001/i)).not.toBeInTheDocument();
  });
});
