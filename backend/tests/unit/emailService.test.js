/**
 * Unit Tests for Email Service
 * Tests email service functions with mocks (no real email sending)
 */

const {
  enviarConfirmacionPedido,
  notificarNuevoPedido,
  enviarConfirmacionPago,
  enviarNotificacionEnvio,
  enviarCancelacionPedido,
  enviarTicketVentaPOS
} = require('../../services/emailService');

// Mock Resend
const mockResendInstance = {
  sentEmails: [],
  emails: {
    send: jest.fn(async (emailData) => {
      const emailId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      mockResendInstance.sentEmails.push({
        id: emailId,
        ...emailData
      });
      return {
        data: { id: emailId },
        error: null
      };
    })
  },
  clearSentEmails: () => {
    mockResendInstance.sentEmails = [];
  }
};

jest.mock('resend', () => {
  return {
    Resend: jest.fn(() => mockResendInstance)
  };
});

describe('Email Service Unit Tests', () => {
  
  beforeEach(() => {
    // Clear sent emails before each test
    mockResendInstance.sentEmails = [];
    mockResendInstance.emails.send.mockClear();
    
    // Reset environment variables
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.EMAIL_FROM = 'test@example.com';
    process.env.EMAIL_FROM_NAME = 'Test Store';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.STORE_NAME = 'Test Jewelry Store';
  });

  describe('enviarConfirmacionPedido - Order Confirmation Email', () => {
    
    it('should send order confirmation email successfully', async () => {
      const pedido = {
        id: 1,
        nombre_cliente: 'Juan Pérez',
        email: 'juan@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 100000,
        notas: 'Entrega urgente'
      };

      const items = [
        {
          nombre_producto: 'Anillo de Oro',
          cantidad: 2,
          precio_unitario: 50000,
          subtotal: 100000
        }
      ];

      const result = await enviarConfirmacionPedido(pedido, items);

      expect(result.sent).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(1);
      
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.to).toBe('juan@example.com');
      expect(sentEmail.subject).toContain('Confirmación de Pedido');
      expect(sentEmail.html).toContain('Juan Pérez');
      expect(sentEmail.html).toContain('Anillo de Oro');
      expect(sentEmail.html).toContain('Entrega urgente');
    });

    it('should handle email without notes', async () => {
      const pedido = {
        id: 2,
        nombre_cliente: 'María González',
        email: 'maria@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 50000,
        notas: null
      };

      const items = [
        {
          nombre_producto: 'Collar de Plata',
          cantidad: 1,
          precio_unitario: 50000,
          subtotal: 50000
        }
      ];

      const result = await enviarConfirmacionPedido(pedido, items);

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).not.toContain('Tus comentarios');
    });

    it('should return not configured when API key is missing', async () => {
      delete process.env.RESEND_API_KEY;
      
      // Need to reload the module to pick up the env change
      jest.resetModules();
      const emailService = require('../../services/emailService');

      const pedido = {
        id: 3,
        nombre_cliente: 'Test User',
        email: 'test@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 10000
      };

      const result = await emailService.enviarConfirmacionPedido(pedido, []);

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('not_configured');
    });

    it('should format currency correctly in email', async () => {
      const pedido = {
        id: 4,
        nombre_cliente: 'Carlos Ruiz',
        email: 'carlos@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 155500
      };

      const items = [
        {
          nombre_producto: 'Pulsera Premium',
          cantidad: 1,
          precio_unitario: 155500,
          subtotal: 155500
        }
      ];

      const result = await enviarConfirmacionPedido(pedido, items);

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).toContain('155'); // Should contain formatted price
    });
  });

  describe('notificarNuevoPedido - Admin Notification Email', () => {
    
    it('should send admin notification email successfully', async () => {
      const pedido = {
        id: 5,
        nombre_cliente: 'Ana López',
        email: 'ana@example.com',
        telefono: '88887777',
        fecha_creacion: new Date().toISOString(),
        total: 200000,
        notas: 'Cliente frecuente'
      };

      const items = [
        {
          nombre_producto: 'Set de Joyas',
          cantidad: 1,
          precio_unitario: 200000,
          subtotal: 200000
        }
      ];

      const result = await notificarNuevoPedido(pedido, items);

      expect(result.sent).toBe(true);
      expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(1);
      
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.to).toBe('admin@example.com');
      expect(sentEmail.subject).toContain('Nuevo Pedido');
      expect(sentEmail.html).toContain('Ana López');
      expect(sentEmail.html).toContain('88887777');
      expect(sentEmail.html).toContain('Cliente frecuente');
    });

    it('should return not configured when admin email is missing', async () => {
      delete process.env.ADMIN_EMAIL;
      
      jest.resetModules();
      const emailService = require('../../services/emailService');

      const pedido = {
        id: 6,
        nombre_cliente: 'Test User',
        email: 'test@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 10000
      };

      const result = await emailService.notificarNuevoPedido(pedido, []);

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('not_configured');
    });

    it('should include all order items in notification', async () => {
      const pedido = {
        id: 7,
        nombre_cliente: 'Pedro Martínez',
        email: 'pedro@example.com',
        telefono: '77776666',
        fecha_creacion: new Date().toISOString(),
        total: 150000
      };

      const items = [
        {
          nombre_producto: 'Anillo',
          cantidad: 2,
          precio_unitario: 50000,
          subtotal: 100000
        },
        {
          nombre_producto: 'Collar',
          cantidad: 1,
          precio_unitario: 50000,
          subtotal: 50000
        }
      ];

      const result = await notificarNuevoPedido(pedido, items);

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).toContain('Anillo');
      expect(sentEmail.html).toContain('Collar');
    });
  });

  describe('enviarConfirmacionPago - Payment Confirmation Email', () => {
    
    it('should send payment confirmation email successfully', async () => {
      const pedido = {
        id: 8,
        nombre_cliente: 'Laura Castro',
        email: 'laura@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 80000
      };

      const items = [
        {
          nombre_producto: 'Aros de Plata',
          cantidad: 2,
          precio_unitario: 40000,
          subtotal: 80000
        }
      ];

      const result = await enviarConfirmacionPago(pedido, items);

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.to).toBe('laura@example.com');
      expect(sentEmail.subject).toContain('Confirmado');
      expect(sentEmail.html).toContain('confirmado');
      expect(sentEmail.html).toContain('Laura Castro');
    });

    it('should indicate order is in preparation', async () => {
      const pedido = {
        id: 9,
        nombre_cliente: 'Roberto Sánchez',
        email: 'roberto@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 120000
      };

      const items = [];

      const result = await enviarConfirmacionPago(pedido, items);

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).toContain('preparación');
    });
  });

  describe('enviarNotificacionEnvio - Shipping Notification Email', () => {
    
    it('should send shipping notification email successfully', async () => {
      const pedido = {
        id: 10,
        nombre_cliente: 'Diana Flores',
        email: 'diana@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 95000
      };

      const items = [
        {
          nombre_producto: 'Cadena de Oro',
          cantidad: 1,
          precio_unitario: 95000,
          subtotal: 95000
        }
      ];

      const result = await enviarNotificacionEnvio(pedido, items);

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.to).toBe('diana@example.com');
      expect(sentEmail.subject).toContain('en Camino');
      expect(sentEmail.html).toContain('enviado');
      expect(sentEmail.html).toContain('Diana Flores');
    });

    it('should include delivery information', async () => {
      const pedido = {
        id: 11,
        nombre_cliente: 'Felipe Vega',
        email: 'felipe@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 60000
      };

      const result = await enviarNotificacionEnvio(pedido, []);

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).toContain('entrega');
    });
  });

  describe('enviarCancelacionPedido - Order Cancellation Email', () => {
    
    it('should send cancellation email successfully', async () => {
      const pedido = {
        id: 12,
        nombre_cliente: 'Sofia Ramírez',
        email: 'sofia@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 45000
      };

      const motivo = 'Producto fuera de stock';

      const result = await enviarCancelacionPedido(pedido, motivo);

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.to).toBe('sofia@example.com');
      expect(sentEmail.subject).toContain('Cancelado');
      expect(sentEmail.html).toContain('cancelado');
      expect(sentEmail.html).toContain('Producto fuera de stock');
    });

    it('should handle cancellation without reason', async () => {
      const pedido = {
        id: 13,
        nombre_cliente: 'Andrés Torres',
        email: 'andres@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 30000
      };

      const result = await enviarCancelacionPedido(pedido, '');

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).toContain('cancelado');
    });
  });

  describe('enviarTicketVentaPOS - POS Receipt Email', () => {
    
    it('should send POS receipt email successfully', async () => {
      const venta = {
        id: 100,
        fecha_venta: new Date().toISOString(),
        metodo_pago: 'Efectivo',
        total: 75000,
        descuento: 5000,
        nombre_usuario: 'Admin User',
        nombre_cliente: 'Cliente Test'
      };

      const items = [
        {
          nombre: 'Anillo de Plata',
          cantidad: 1,
          precio_unitario: 80000,
          subtotal: 80000
        }
      ];

      const result = await enviarTicketVentaPOS(venta, items, 'cliente@example.com');

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.to).toBe('cliente@example.com');
      expect(sentEmail.subject).toContain('Comprobante de Venta');
      expect(sentEmail.html).toContain('Admin User');
      expect(sentEmail.html).toContain('Cliente Test');
      expect(sentEmail.html).toContain('Anillo de Plata');
    });

    it('should show cash payment details', async () => {
      const venta = {
        id: 101,
        fecha_venta: new Date().toISOString(),
        metodo_pago: 'Efectivo',
        total: 50000,
        efectivo_recibido: 60000,
        cambio: 10000,
        descuento: 0
      };

      const items = [];

      const result = await enviarTicketVentaPOS(venta, items, 'test@example.com');

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).toContain('Efectivo Recibido');
      expect(sentEmail.html).toContain('Cambio');
    });

    it('should show mixed payment details', async () => {
      const venta = {
        id: 102,
        fecha_venta: new Date().toISOString(),
        metodo_pago: 'Mixto',
        total: 100000,
        monto_efectivo: 50000,
        monto_tarjeta: 30000,
        monto_transferencia: 20000,
        descuento: 0
      };

      const items = [];

      const result = await enviarTicketVentaPOS(venta, items, 'test@example.com');

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).toContain('Pago Mixto');
      expect(sentEmail.html).toContain('Efectivo');
      expect(sentEmail.html).toContain('Tarjeta');
      expect(sentEmail.html).toContain('Transferencia');
    });

    it('should show discount when applicable', async () => {
      const venta = {
        id: 103,
        fecha_venta: new Date().toISOString(),
        metodo_pago: 'Tarjeta',
        total: 90000,
        descuento: 10000
      };

      const items = [
        {
          nombre: 'Producto Test',
          cantidad: 1,
          precio_unitario: 100000,
          subtotal: 100000
        }
      ];

      const result = await enviarTicketVentaPOS(venta, items, 'test@example.com');

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).toContain('Descuento');
    });

    it('should include notes if present', async () => {
      const venta = {
        id: 104,
        fecha_venta: new Date().toISOString(),
        metodo_pago: 'Transferencia',
        total: 65000,
        descuento: 0,
        notas: 'Cliente preferencial - descuento especial aplicado'
      };

      const items = [];

      const result = await enviarTicketVentaPOS(venta, items, 'test@example.com');

      expect(result.sent).toBe(true);
      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).toContain('Notas');
      expect(sentEmail.html).toContain('Cliente preferencial');
    });
  });

  describe('Email Template Structure', () => {
    
    it('should include store branding in all emails', async () => {
      const pedido = {
        id: 50,
        nombre_cliente: 'Test User',
        email: 'test@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 10000
      };

      await enviarConfirmacionPedido(pedido, []);

      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).toContain('Test Jewelry Store');
      expect(sentEmail.from).toContain('Test Store');
    });

    it('should include reply-to address', async () => {
      process.env.EMAIL_REPLY_TO = 'reply@example.com';
      
      jest.resetModules();
      const emailService = require('../../services/emailService');

      const pedido = {
        id: 51,
        nombre_cliente: 'Test User',
        email: 'test@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 10000
      };

      await emailService.enviarConfirmacionPedido(pedido, []);

      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.reply_to).toBe('reply@example.com');
    });

    it('should be valid HTML structure', async () => {
      const pedido = {
        id: 52,
        nombre_cliente: 'HTML Test',
        email: 'htmltest@example.com',
        fecha_creacion: new Date().toISOString(),
        total: 10000
      };

      await enviarConfirmacionPedido(pedido, []);

      const sentEmail = mockResendInstance.emails.send.mock.calls[0][0];
      expect(sentEmail.html).toContain('<!DOCTYPE html>');
      expect(sentEmail.html).toContain('<html');
      expect(sentEmail.html).toContain('</html>');
      expect(sentEmail.html).toContain('<body');
      expect(sentEmail.html).toContain('</body>');
    });
  });
});
