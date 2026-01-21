import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import CuentasPorCobrar from '../components/CuentasPorCobrar';
import { server } from '../mocks/server';
import { rest } from 'msw';

// Mock dependencies
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', role: 'administrador' },
    loading: false
  })
}));

describe('CuentasPorCobrar Component', () => {
  test('renders accounts receivable list', async () => {
    // Setup test data
    server.use(
      rest.get('http://localhost:3001/api/cuentas-por-cobrar', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: [
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
              },
              {
                id: 2,
                venta_id: 2,
                cliente_id: 2,
                cliente_nombre: 'María García',
                monto_total: 500,
                saldo_pendiente: 500,
                fecha_venta: new Date().toISOString(),
                estado: 'pendiente',
                abonos: []
              }
            ]
          })
        );
      })
    );

    renderWithProviders(<CuentasPorCobrar />);
    
    await waitFor(() => {
      expect(screen.getByText(/cuentas por cobrar/i)).toBeInTheDocument();
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
      expect(screen.getByText(/maría garcía/i)).toBeInTheDocument();
    });
  });

  test('displays account details with balance', async () => {
    server.use(
      rest.get('http://localhost:3001/api/cuentas-por-cobrar', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: [
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
            ]
          })
        );
      })
    );

    renderWithProviders(<CuentasPorCobrar />);
    
    await waitFor(() => {
      expect(screen.getByText(/monto total.*1000/i)).toBeInTheDocument();
      expect(screen.getByText(/saldo pendiente.*400/i)).toBeInTheDocument();
    });
  });

  test('makes partial payment (abono)', async () => {
    server.use(
      rest.get('http://localhost:3001/api/cuentas-por-cobrar', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: [
              {
                id: 1,
                venta_id: 1,
                cliente_id: 1,
                cliente_nombre: 'Juan Pérez',
                monto_total: 1000,
                saldo_pendiente: 400,
                fecha_venta: new Date().toISOString(),
                estado: 'pendiente',
                abonos: []
              }
            ]
          })
        );
      }),
      rest.post('http://localhost:3001/api/cuentas-por-cobrar/1/abonos', (req, res, ctx) => {
        return res(
          ctx.status(201),
          ctx.json({
            success: true,
            data: {
              id: 2,
              monto: 200,
              fecha: new Date().toISOString(),
              metodo_pago: 'efectivo'
            },
            saldo_pendiente: 200
          })
        );
      })
    );

    renderWithProviders(<CuentasPorCobrar />);
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
    });
    
    // Click on add payment button
    const abonarButton = screen.getByRole('button', { name: /abonar/i });
    await user.click(abonarButton);
    
    // Enter payment amount
    const montoInput = screen.getByLabelText(/monto/i);
    await user.type(montoInput, '200');
    
    // Select payment method
    const efectivoRadio = screen.getByLabelText(/efectivo/i);
    await user.click(efectivoRadio);
    
    // Submit payment
    const confirmarButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(confirmarButton);
    
    await waitFor(() => {
      expect(screen.getByText(/abono registrado exitosamente/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('completes full payment and marks account as paid', async () => {
    server.use(
      rest.get('http://localhost:3001/api/cuentas-por-cobrar', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: [
              {
                id: 1,
                venta_id: 1,
                cliente_id: 1,
                cliente_nombre: 'Juan Pérez',
                monto_total: 1000,
                saldo_pendiente: 400,
                fecha_venta: new Date().toISOString(),
                estado: 'pendiente',
                abonos: []
              }
            ]
          })
        );
      }),
      rest.post('http://localhost:3001/api/cuentas-por-cobrar/1/abonos', (req, res, ctx) => {
        return res(
          ctx.status(201),
          ctx.json({
            success: true,
            data: {
              id: 2,
              monto: 400,
              fecha: new Date().toISOString(),
              metodo_pago: 'efectivo'
            },
            saldo_pendiente: 0
          })
        );
      })
    );

    renderWithProviders(<CuentasPorCobrar />);
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
    });
    
    // Make full payment
    const abonarButton = screen.getByRole('button', { name: /abonar/i });
    await user.click(abonarButton);
    
    const montoInput = screen.getByLabelText(/monto/i);
    await user.type(montoInput, '400');
    
    const confirmarButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(confirmarButton);
    
    await waitFor(() => {
      expect(screen.getByText(/cuenta saldada/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('validates payment amount does not exceed balance', async () => {
    server.use(
      rest.get('http://localhost:3001/api/cuentas-por-cobrar', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: [
              {
                id: 1,
                venta_id: 1,
                cliente_id: 1,
                cliente_nombre: 'Juan Pérez',
                monto_total: 1000,
                saldo_pendiente: 400,
                fecha_venta: new Date().toISOString(),
                estado: 'pendiente',
                abonos: []
              }
            ]
          })
        );
      }),
      rest.post('http://localhost:3001/api/cuentas-por-cobrar/1/abonos', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            success: false,
            message: 'El monto excede el saldo pendiente'
          })
        );
      })
    );

    renderWithProviders(<CuentasPorCobrar />);
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
    });
    
    // Try to pay more than balance
    const abonarButton = screen.getByRole('button', { name: /abonar/i });
    await user.click(abonarButton);
    
    const montoInput = screen.getByLabelText(/monto/i);
    await user.type(montoInput, '500'); // More than 400 balance
    
    const confirmarButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(confirmarButton);
    
    await waitFor(() => {
      expect(screen.getByText(/excede el saldo pendiente/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('displays payment history', async () => {
    server.use(
      rest.get('http://localhost:3001/api/cuentas-por-cobrar', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: [
              {
                id: 1,
                venta_id: 1,
                cliente_id: 1,
                cliente_nombre: 'Juan Pérez',
                monto_total: 1000,
                saldo_pendiente: 200,
                fecha_venta: new Date().toISOString(),
                estado: 'pendiente',
                abonos: [
                  { id: 1, monto: 400, fecha: new Date('2024-01-10').toISOString(), metodo_pago: 'efectivo' },
                  { id: 2, monto: 400, fecha: new Date('2024-01-15').toISOString(), metodo_pago: 'tarjeta' }
                ]
              }
            ]
          })
        );
      })
    );

    renderWithProviders(<CuentasPorCobrar />);
    
    await waitFor(() => {
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
    });
    
    // Click on account to view details
    const verDetallesButton = screen.getByRole('button', { name: /ver detalles/i });
    await userEvent.setup().click(verDetallesButton);
    
    await waitFor(() => {
      expect(screen.getByText(/historial de abonos/i)).toBeInTheDocument();
      expect(screen.getByText(/400.*efectivo/i)).toBeInTheDocument();
      expect(screen.getByText(/400.*tarjeta/i)).toBeInTheDocument();
    });
  });

  test('filters accounts by status', async () => {
    server.use(
      rest.get('http://localhost:3001/api/cuentas-por-cobrar', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: [
              {
                id: 1,
                cliente_nombre: 'Juan Pérez',
                monto_total: 1000,
                saldo_pendiente: 400,
                estado: 'pendiente'
              },
              {
                id: 2,
                cliente_nombre: 'María García',
                monto_total: 500,
                saldo_pendiente: 0,
                estado: 'pagado'
              }
            ]
          })
        );
      })
    );

    renderWithProviders(<CuentasPorCobrar />);
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
      expect(screen.getByText(/maría garcía/i)).toBeInTheDocument();
    });
    
    // Filter by pending only
    const pendientesFilter = screen.getByLabelText(/pendientes/i);
    await user.click(pendientesFilter);
    
    await waitFor(() => {
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
      expect(screen.queryByText(/maría garcía/i)).not.toBeInTheDocument();
    });
  });

  test('calculates total receivables correctly', async () => {
    server.use(
      rest.get('http://localhost:3001/api/cuentas-por-cobrar', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: [
              {
                id: 1,
                cliente_nombre: 'Juan Pérez',
                monto_total: 1000,
                saldo_pendiente: 400,
                estado: 'pendiente'
              },
              {
                id: 2,
                cliente_nombre: 'María García',
                monto_total: 800,
                saldo_pendiente: 300,
                estado: 'pendiente'
              }
            ]
          })
        );
      })
    );

    renderWithProviders(<CuentasPorCobrar />);
    
    await waitFor(() => {
      // Total pending should be 400 + 300 = 700
      expect(screen.getByText(/total por cobrar.*700/i)).toBeInTheDocument();
    });
  });
});
