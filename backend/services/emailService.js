/**
 * Email Service for Online Orders
 * 
 * Handles sending transactional emails using Resend API
 * Includes professional HTML templates for all order-related notifications
 * 
 * Resend Configuration:
 * - Sign up at https://resend.com
 * - Verify your domain
 * - Get your API key from the dashboard
 * - Add RESEND_API_KEY to your environment variables
 * 
 * Benefits over SMTP:
 * - No blocked ports (uses REST API)
 * - Better deliverability
 * - Built-in analytics
 * - No connection timeouts
 * - Works seamlessly on Railway and other platforms
 */

const { Resend } = require('resend');

// Email configuration from environment variables
const EMAIL_CONFIG = {
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM || 'ventas@cueroyperla.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Cuero&Perla',
  replyTo: process.env.EMAIL_REPLY_TO || 'contacto@cueroyperla.com',
  adminEmail: process.env.ADMIN_EMAIL,
  storeName: process.env.STORE_NAME || 'Cuero&Perla',
  storeUrl: process.env.STORE_URL || 'https://cueroyperla.com',
  storePhone: process.env.STORE_PHONE || '+506-1234-5678'
};

// Initialize Resend client
let resendClient = null;

/**
 * Get or create Resend client instance
 * Only creates if API key is configured
 */
function getResendClient() {
  if (!EMAIL_CONFIG.apiKey) {
    console.warn('⚠️ Resend API key not configured. Emails will not be sent.');
    return null;
  }

  if (!resendClient) {
    try {
      resendClient = new Resend(EMAIL_CONFIG.apiKey);
      console.log('✅ Resend Email Service initialized');
    } catch (error) {
      console.error('❌ Error initializing Resend client:', error);
      return null;
    }
  }

  return resendClient;
}

/**
 * Get base HTML template for emails
 * Professional, responsive design with brand colors
 */
function getBaseTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${EMAIL_CONFIG.storeName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header .logo {
      font-size: 36px;
      margin-bottom: 10px;
    }
    .content {
      padding: 30px 20px;
    }
    .content h2 {
      color: #1f2937;
      font-size: 22px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      color: #4b5563;
      font-size: 16px;
      margin: 10px 0;
    }
    .order-summary {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .order-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .order-item:last-child {
      border-bottom: none;
    }
    .order-item-name {
      font-weight: 500;
      color: #1f2937;
    }
    .order-item-details {
      color: #6b7280;
      font-size: 14px;
    }
    .order-item-price {
      font-weight: 600;
      color: #1f2937;
    }
    .order-total {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #6366f1;
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box.success {
      background-color: #f0fdf4;
      border-left-color: #10b981;
    }
    .info-box.warning {
      background-color: #fffbeb;
      border-left-color: #f59e0b;
    }
    .info-box p {
      margin: 5px 0;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .content {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo" style="text-align:center; margin-bottom:16px;">
        <img
          src="https://res.cloudinary.com/dekqptpft/image/upload/v1765846278/CYP_FB-1-removebg-preview_bxblwq.png"
          alt="Cuero & Perla"
          width="140"
          style="display:block; margin:0 auto; border:0; outline:none;"
        />
      </div>
      <h1>${EMAIL_CONFIG.storeName}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>${EMAIL_CONFIG.storeName}</strong></p>
      <p>${EMAIL_CONFIG.storePhone}</p>
      <p><a href="${EMAIL_CONFIG.storeUrl}">${EMAIL_CONFIG.storeUrl}</a></p>
      <p style="margin-top: 15px;">
        <strong>📧 Para consultas, responde a:</strong> 
        <a href="mailto:${EMAIL_CONFIG.replyTo}" style="color: #6366f1; text-decoration: none;">${EMAIL_CONFIG.replyTo}</a>
      </p>
      <p style="margin-top: 10px; font-size: 12px; color: #9ca3af;">
        Este email fue enviado desde ${EMAIL_CONFIG.from}.<br>
        Por favor responde a ${EMAIL_CONFIG.replyTo} para contactarnos.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Format currency for display in emails
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Generate order items HTML table
 */
function generateOrderItemsHTML(items) {
  return items.map(item => `
    <div class="order-item">
      <div>
        <div class="order-item-name">${item.nombre || item.nombre_producto || item.product_name || 'Producto'}</div>
        <div class="order-item-details">Cantidad: ${item.cantidad || item.quantity} × ${formatCurrency(item.precio_unitario || item.unit_price)}</div>
      </div>
      <div class="order-item-price">${formatCurrency(item.subtotal)}</div>
    </div>
  `).join('');
}

/**
 * Send order confirmation email to customer
 * Sent immediately when order is created
 */
async function enviarConfirmacionPedido(pedido, items) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 Email service not configured');
    return { sent: false, reason: 'not_configured' };
  }

  const content = `
    <h2>¡Gracias por tu pedido! 🎉</h2>
    <p>Hola <strong>${pedido.nombre_cliente}</strong>,</p>
    <p>Hemos recibido tu pedido correctamente. A continuación encontrarás los detalles:</p>
    
    <div class="info-box">
      <p><strong>Número de Pedido:</strong> #${pedido.id}</p>
      <p><strong>Fecha:</strong> ${new Date(pedido.fecha_creacion).toLocaleString('es-CR')}</p>
      <p><strong>Estado:</strong> Pendiente de confirmación</p>
    </div>

    <div class="order-summary">
      <h3 style="margin-top: 0;">Resumen del Pedido</h3>
      ${generateOrderItemsHTML(items)}
      <div class="order-total">
        <span>Total:</span>
        <span>${formatCurrency(pedido.total)}</span>
      </div>
    </div>

    ${pedido.notas ? `
    <div class="info-box">
      <p><strong>Tus comentarios:</strong></p>
      <p>${pedido.notas}</p>
    </div>
    ` : ''}

    <div class="info-box warning">
      <p><strong>⏳ Próximos pasos:</strong></p>
      <p>Nuestro equipo revisará tu pedido y te contactaremos pronto para confirmar la disponibilidad y coordinar la entrega.</p>
    </div>

    <p style="margin-top: 30px;">Si tienes alguna pregunta, no dudes en contactarnos al ${EMAIL_CONFIG.storePhone}</p>
    <p>¡Gracias por tu confianza!</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: pedido.email,
      reply_to: EMAIL_CONFIG.replyTo,
      subject: `Confirmación de Pedido #${pedido.id} - ${EMAIL_CONFIG.storeName}`,
      html: getBaseTemplate(content)
    });

    if (error) {
      console.error('❌ Error sending confirmation email:', error);
      return { sent: false, error: error.message };
    }

    console.log('✅ Confirmation email sent:', data.id);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send new order notification to admin
 * Alerts admin team of new orders requiring attention
 */
async function notificarNuevoPedido(pedido, items) {
  const resend = getResendClient();
  if (!resend || !EMAIL_CONFIG.adminEmail) {
    console.log('📧 Email service not configured');
    return { sent: false, reason: 'not_configured' };
  }

  const content = `
    <h2>🔔 Nuevo Pedido Recibido</h2>
    <p>Se ha recibido un nuevo pedido desde la tienda online.</p>
    
    <div class="info-box">
      <p><strong>Pedido:</strong> #${pedido.id}</p>
      <p><strong>Cliente:</strong> ${pedido.nombre_cliente}</p>
      <p><strong>Email:</strong> ${pedido.email}</p>
      <p><strong>Teléfono:</strong> ${pedido.telefono}</p>
      <p><strong>Fecha:</strong> ${new Date(pedido.fecha_creacion).toLocaleString('es-CR')}</p>
    </div>

    <div class="order-summary">
      <h3 style="margin-top: 0;">Productos</h3>
      ${generateOrderItemsHTML(items)}
      <div class="order-total">
        <span>Total:</span>
        <span>${formatCurrency(pedido.total)}</span>
      </div>
    </div>

    ${pedido.notas ? `
    <div class="info-box">
      <p><strong>Comentarios del cliente:</strong></p>
      <p>${pedido.notas}</p>
    </div>
    ` : ''}

    <div class="info-box warning">
      <p><strong>⚡ Acción requerida:</strong></p>
      <p>Ingresa al panel de administración para revisar el pedido, verificar disponibilidad y confirmar al cliente.</p>
    </div>

    <a href="${EMAIL_CONFIG.storeUrl}/admin/pedidos-online" class="button">Ver Pedido en el Panel</a>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: EMAIL_CONFIG.adminEmail,
      reply_to: EMAIL_CONFIG.replyTo,
      subject: `🔔 Nuevo Pedido #${pedido.id} - ${pedido.nombre_cliente}`,
      html: getBaseTemplate(content)
    });

    if (error) {
      console.error('❌ Error sending admin notification:', error);
      return { sent: false, error: error.message };
    }

    console.log('✅ Admin notification sent:', data.id);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send payment/order confirmation to customer
 * Sent when admin approves the order
 */
async function enviarConfirmacionPago(pedido, items) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 Email service not configured');
    return { sent: false, reason: 'not_configured' };
  }

  const content = `
    <h2>✅ ¡Tu pedido ha sido confirmado!</h2>
    <p>Hola <strong>${pedido.nombre_cliente}</strong>,</p>
    <p>Nos complace informarte que tu pedido ha sido confirmado y estamos preparando tu envío.</p>
    
    <div class="info-box success">
      <p><strong>✓ Pedido Confirmado:</strong> #${pedido.id}</p>
      <p><strong>Estado:</strong> En preparación</p>
    </div>

    <div class="order-summary">
      <h3 style="margin-top: 0;">Tu Pedido</h3>
      ${generateOrderItemsHTML(items)}
      <div class="order-total">
        <span>Total:</span>
        <span>${formatCurrency(pedido.total)}</span>
      </div>
    </div>

    <div class="info-box">
      <p><strong>📦 Próximos pasos:</strong></p>
      <p>Estamos preparando tu pedido con mucho cuidado. Te notificaremos cuando esté listo para envío.</p>
    </div>

    <p style="margin-top: 30px;">Cualquier duda, contáctanos al ${EMAIL_CONFIG.storePhone}</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: pedido.email,
      reply_to: EMAIL_CONFIG.replyTo,
      subject: `✅ Pedido Confirmado #${pedido.id} - ${EMAIL_CONFIG.storeName}`,
      html: getBaseTemplate(content)
    });

    if (error) {
      console.error('❌ Error sending payment confirmation:', error);
      return { sent: false, error: error.message };
    }

    console.log('✅ Payment confirmation sent:', data.id);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending payment confirmation:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send shipping notification to customer
 * Sent when order is marked as shipped
 */
async function enviarNotificacionEnvio(pedido, items) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 Email service not configured');
    return { sent: false, reason: 'not_configured' };
  }

  const content = `
    <h2>🚚 ¡Tu pedido está en camino!</h2>
    <p>Hola <strong>${pedido.nombre_cliente}</strong>,</p>
    <p>Tu pedido ha sido enviado y está en camino a tu dirección.</p>
    
    <div class="info-box success">
      <p><strong>📦 Pedido:</strong> #${pedido.id}</p>
      <p><strong>Estado:</strong> Enviado</p>
      <p><strong>Fecha de envío:</strong> ${new Date().toLocaleString('es-CR')}</p>
    </div>

    <div class="order-summary">
      <h3 style="margin-top: 0;">Contenido del Envío</h3>
      ${generateOrderItemsHTML(items)}
      <div class="order-total">
        <span>Total:</span>
        <span>${formatCurrency(pedido.total)}</span>
      </div>
    </div>

    <div class="info-box">
      <p><strong>📍 Información de entrega:</strong></p>
      <p>Recibirás tu pedido en los próximos días. Asegúrate de que alguien esté disponible para recibirlo.</p>
    </div>

    <p style="margin-top: 30px;">Para cualquier consulta sobre tu envío, llámanos al ${EMAIL_CONFIG.storePhone}</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: pedido.email,
      reply_to: EMAIL_CONFIG.replyTo,
      subject: `🚚 Tu Pedido #${pedido.id} está en Camino - ${EMAIL_CONFIG.storeName}`,
      html: getBaseTemplate(content)
    });

    if (error) {
      console.error('❌ Error sending shipping notification:', error);
      return { sent: false, error: error.message };
    }

    console.log('✅ Shipping notification sent:', data.id);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending shipping notification:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send cancellation notification to customer
 * Sent when order is cancelled
 */
async function enviarCancelacionPedido(pedido, motivo = '') {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 Email service not configured');
    return { sent: false, reason: 'not_configured' };
  }

  const content = `
    <h2>Pedido Cancelado</h2>
    <p>Hola <strong>${pedido.nombre_cliente}</strong>,</p>
    <p>Lamentamos informarte que tu pedido #${pedido.id} ha sido cancelado.</p>
    
    <div class="info-box warning">
      <p><strong>Pedido:</strong> #${pedido.id}</p>
      <p><strong>Estado:</strong> Cancelado</p>
      <p><strong>Total:</strong> ${formatCurrency(pedido.total)}</p>
    </div>

    ${motivo ? `
    <div class="info-box">
      <p><strong>Motivo:</strong></p>
      <p>${motivo}</p>
    </div>
    ` : ''}

    <p>Si tienes alguna pregunta o crees que esto es un error, por favor contáctanos.</p>
    <p style="margin-top: 30px;">Teléfono: ${EMAIL_CONFIG.storePhone}</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: pedido.email,
      reply_to: EMAIL_CONFIG.replyTo,
      subject: `Pedido Cancelado #${pedido.id} - ${EMAIL_CONFIG.storeName}`,
      html: getBaseTemplate(content)
    });

    if (error) {
      console.error('❌ Error sending cancellation email:', error);
      return { sent: false, error: error.message };
    }

    console.log('✅ Cancellation email sent:', data.id);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending cancellation email:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Send sales receipt from POS to customer email
 * Sent when user clicks "Send Email" from sale detail in POS
 */
async function enviarTicketVentaPOS(venta, items, emailDestino) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 Email service not configured');
    return { sent: false, reason: 'not_configured' };
  }

  // Format payment information
  let paymentInfo = '';
  if (venta.metodo_pago === 'Mixto') {
    paymentInfo = `
      <div class="info-box">
        <p><strong>💳 Pago Mixto:</strong></p>
        ${venta.monto_efectivo > 0 ? `<p>• Efectivo: ${formatCurrency(venta.monto_efectivo)}</p>` : ''}
        ${venta.monto_tarjeta > 0 ? `<p>• Tarjeta: ${formatCurrency(venta.monto_tarjeta)}</p>` : ''}
        ${venta.monto_transferencia > 0 ? `<p>• Transferencia: ${formatCurrency(venta.monto_transferencia)}</p>` : ''}
      </div>
    `;
  } else if (venta.metodo_pago === 'Efectivo' && venta.efectivo_recibido) {
    paymentInfo = `
      <div class="info-box">
        <p><strong>💵 Efectivo Recibido:</strong> ${formatCurrency(venta.efectivo_recibido)}</p>
        <p><strong>Cambio:</strong> ${formatCurrency(venta.cambio || 0)}</p>
      </div>
    `;
  }

  const content = `
    <h2>🧾 Comprobante de Venta</h2>
    <p>Gracias por su compra. A continuación encontrará los detalles de su transacción:</p>
    
    <div class="info-box">
      <p><strong>Ticket:</strong> #${venta.id}</p>
      <p><strong>Fecha:</strong> ${new Date(venta.fecha_venta).toLocaleString('es-CR')}</p>
      <p><strong>Vendedor:</strong> ${venta.nombre_usuario || venta.usuario || 'N/A'}</p>
      ${venta.nombre_cliente ? `<p><strong>Cliente:</strong> ${venta.nombre_cliente}</p>` : ''}
      <p><strong>Método de Pago:</strong> ${venta.metodo_pago}</p>
    </div>

    <div class="order-summary">
      <h3 style="margin-top: 0;">Detalle de Productos</h3>
      ${generateOrderItemsHTML(items)}
      ${(venta.descuento || 0) > 0 ? `
        <div class="order-item">
          <div class="order-item-name" style="color: #f59e0b;">Descuento</div>
          <div class="order-item-price" style="color: #f59e0b;">-${formatCurrency(venta.descuento)}</div>
        </div>
      ` : ''}
      <div class="order-total">
        <span>Total:</span>
        <span>${formatCurrency(venta.total)}</span>
      </div>
    </div>

    ${paymentInfo}

    ${venta.notas ? `
    <div class="info-box">
      <p><strong>Notas:</strong></p>
      <p>${venta.notas}</p>
    </div>
    ` : ''}

    <div class="info-box success">
      <p><strong>✓ Venta realizada exitosamente</strong></p>
      <p>Conserve este comprobante como respaldo de su compra.</p>
    </div>

    <p style="margin-top: 30px;">Cualquier consulta, contáctenos al ${EMAIL_CONFIG.storePhone}</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: emailDestino,
      reply_to: EMAIL_CONFIG.replyTo,
      subject: `Comprobante de Venta #${venta.id} - ${EMAIL_CONFIG.storeName}`,
      html: getBaseTemplate(content)
    });

    if (error) {
      console.error('❌ Error sending POS receipt email:', error);
      return { sent: false, error: error.message };
    }

    console.log('✅ POS receipt email sent:', data.id);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending POS receipt email:', error);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  enviarConfirmacionPedido,
  notificarNuevoPedido,
  enviarConfirmacionPago,
  enviarNotificacionEnvio,
  enviarCancelacionPedido,
  enviarTicketVentaPOS
};
