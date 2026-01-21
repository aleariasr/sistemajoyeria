import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import CierreCaja from '../components/CierreCaja';
import { server } from '../mocks/server';
import { rest } from 'msw';

// Mock dependencies
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', role: 'administrador', nombre: 'Admin' },
    loading: false,
    isAdmin: () => true
  })
}));

describe('CierreCaja Component', () => {
  test('renders cash closure interface', async () => {
    renderWithProviders(<CierreCaja />);
    
    await waitFor(() => {
      expect(screen.getByText(/cierre de caja/i)).toBeInTheDocument();
    });
  });

  test('displays daily summary with sales data', async () => {
    // Setup test data
    server.use(
      rest.get('http://localhost:3001/api/cierrecaja/resumen-dia', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: {
              resumen: {
                ventas_contado: 5,
                ventas_credito: 2,
                abonos: 3,
                ingresos_extras: 1,
                total_efectivo: 1500,
                total_tarjeta: 800
              },
              ventas: []
            }
          })
        );
      })
    );

    renderWithProviders(<CierreCaja />);
    
    await waitFor(() => {
      expect(screen.getByText(/ventas contado.*5/i)).toBeInTheDocument();
      expect(screen.getByText(/ventas crédito.*2/i)).toBeInTheDocument();
      expect(screen.getByText(/total efectivo.*1500/i)).toBeInTheDocument();
      expect(screen.getByText(/total tarjeta.*800/i)).toBeInTheDocument();
    });
  });

  test('admin can close cash register', async () => {
    renderWithProviders(<CierreCaja />);
    const user = userEvent.setup();
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/cierre de caja/i)).toBeInTheDocument();
    });
    
    // Enter declared amounts
    const efectivoInput = screen.getByLabelText(/efectivo declarado/i);
    const tarjetaInput = screen.getByLabelText(/tarjeta declarado/i);
    
    await user.type(efectivoInput, '1500');
    await user.type(tarjetaInput, '800');
    
    // Submit closure
    const cerrarButton = screen.getByRole('button', { name: /cerrar caja/i });
    await user.click(cerrarButton);
    
    await waitFor(() => {
      expect(screen.getByText(/caja cerrada exitosamente/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('shows discrepancies between expected and declared amounts', async () => {
    // Setup test data with expected amounts
    server.use(
      rest.get('http://localhost:3001/api/cierrecaja/resumen-dia', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: {
              resumen: {
                ventas_contado: 5,
                ventas_credito: 2,
                abonos: 3,
                ingresos_extras: 1,
                total_efectivo: 1500,
                total_tarjeta: 800
              },
              ventas: []
            }
          })
        );
      })
    );

    renderWithProviders(<CierreCaja />);
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText(/total efectivo.*1500/i)).toBeInTheDocument();
    });
    
    // Enter different amounts
    const efectivoInput = screen.getByLabelText(/efectivo declarado/i);
    await user.type(efectivoInput, '1400');
    
    // Should show discrepancy (difference of 100)
    await waitFor(() => {
      expect(screen.getByText(/diferencia.*100/i)).toBeInTheDocument();
    });
  });

  test('validates required fields before closing', async () => {
    renderWithProviders(<CierreCaja />);
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText(/cierre de caja/i)).toBeInTheDocument();
    });
    
    // Try to close without entering amounts
    const cerrarButton = screen.getByRole('button', { name: /cerrar caja/i });
    await user.click(cerrarButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/complete todos los campos/i)).toBeInTheDocument();
    });
  });

  test('filters sales by date', async () => {
    renderWithProviders(<CierreCaja />);
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText(/cierre de caja/i)).toBeInTheDocument();
    });
    
    // Change date filter
    const dateInput = screen.getByLabelText(/fecha/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2024-01-15');
    
    // Should trigger new data fetch
    await waitFor(() => {
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
    });
  });
});

describe('CierreCaja - Permission Tests', () => {
  test('only admin can close cash register', async () => {
    // Mock as dependiente user
    jest.mock('../context/AuthContext', () => ({
      useAuth: () => ({
        user: { id: 2, username: 'dependiente', role: 'dependiente' },
        loading: false,
        isAdmin: () => false
      })
    }));

    server.use(
      rest.post('http://localhost:3001/api/cierrecaja/cerrar-caja', (req, res, ctx) => {
        return res(
          ctx.status(403),
          ctx.json({
            success: false,
            message: 'Solo administradores pueden cerrar caja'
          })
        );
      })
    );

    renderWithProviders(<CierreCaja />);
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText(/cierre de caja/i)).toBeInTheDocument();
    });
    
    // Should not show close button or should be disabled
    const cerrarButton = screen.queryByRole('button', { name: /cerrar caja/i });
    
    if (cerrarButton) {
      await user.click(cerrarButton);
      
      await waitFor(() => {
        expect(screen.getByText(/solo administradores/i)).toBeInTheDocument();
      });
    } else {
      // Button should not exist for non-admin
      expect(cerrarButton).not.toBeInTheDocument();
    }
  });
});

describe('CierreCaja - Summary Calculations', () => {
  test('calculates total sales correctly', async () => {
    server.use(
      rest.get('http://localhost:3001/api/cierrecaja/resumen-dia', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: {
              resumen: {
                ventas_contado: 3,
                ventas_credito: 2,
                abonos: 1,
                ingresos_extras: 0,
                total_efectivo: 1000,
                total_tarjeta: 500
              },
              ventas: [
                { id: 1, total: 300, metodo_pago: 'efectivo' },
                { id: 2, total: 500, metodo_pago: 'efectivo' },
                { id: 3, total: 200, metodo_pago: 'efectivo' },
                { id: 4, total: 250, metodo_pago: 'tarjeta' },
                { id: 5, total: 250, metodo_pago: 'tarjeta' }
              ]
            }
          })
        );
      })
    );

    renderWithProviders(<CierreCaja />);
    
    await waitFor(() => {
      expect(screen.getByText(/total efectivo.*1000/i)).toBeInTheDocument();
      expect(screen.getByText(/total tarjeta.*500/i)).toBeInTheDocument();
    });
  });

  test('handles mixed payment methods in summary', async () => {
    server.use(
      rest.get('http://localhost:3001/api/cierrecaja/resumen-dia', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: {
              resumen: {
                ventas_contado: 2,
                ventas_credito: 0,
                abonos: 0,
                ingresos_extras: 0,
                total_efectivo: 600,
                total_tarjeta: 400
              },
              ventas: [
                { 
                  id: 1, 
                  total: 1000, 
                  metodo_pago: 'mixto',
                  monto_efectivo: 600,
                  monto_tarjeta: 400
                }
              ]
            }
          })
        );
      })
    );

    renderWithProviders(<CierreCaja />);
    
    await waitFor(() => {
      expect(screen.getByText(/total efectivo.*600/i)).toBeInTheDocument();
      expect(screen.getByText(/total tarjeta.*400/i)).toBeInTheDocument();
    });
  });
});
