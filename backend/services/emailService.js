/**
 * Email Service for Online Orders
 * 
 * Handles sending transactional emails using Gmail SMTP and Nodemailer
 * Includes professional HTML templates for all order-related notifications
 */

const nodemailer = require('nodemailer');

// Email configuration from environment variables
const EMAIL_CONFIG = {
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_APP_PASSWORD,
  fromName: process.env.EMAIL_FROM_NAME || 'Cuero&Perla',
  adminEmail: process.env.ADMIN_EMAIL,
  storeName: process.env.STORE_NAME || 'Cuero&Perla',
  storeUrl: process.env.STORE_URL || 'https://tudominio.com',
  storePhone: process.env.STORE_PHONE || '+506-1234-5678'
};

/**
 * Create nodemailer transporter with Gmail SMTP
 * Only creates if email credentials are configured
 */
function createTransporter() {
  if (!EMAIL_CONFIG.user || !EMAIL_CONFIG.password) {
    console.warn('⚠️ Email credentials not configured. Emails will not be sent.');
    return null;
  }

  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: EMAIL_CONFIG.user,
        pass: EMAIL_CONFIG.password
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Error creating email transporter:', error);
    return null;
  }
}

const transporter = createTransporter();

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
      <div class="logo">💎</div>
      <h1>${EMAIL_CONFIG.storeName}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>${EMAIL_CONFIG.storeName}</strong></p>
      <p>${EMAIL_CONFIG.storePhone}</p>
      <p><a href="${EMAIL_CONFIG.storeUrl}">${EMAIL_CONFIG.storeUrl}</a></p>
      <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
        Este es un correo automático, por favor no responder directamente.
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
        <div class="order-item-name">${item.nombre_producto || item.product_name || 'Producto'}</div>
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
  if (!transporter) {
    console.log('📧 Email service not configured - skipping confirmation email');
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
    const info = await transporter.sendMail({
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.user}>`,
      to: pedido.email,
      subject: `Confirmación de Pedido #${pedido.id} - ${EMAIL_CONFIG.storeName}`,
      html: getBaseTemplate(content)
    });

    console.log('✅ Confirmation email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
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
  if (!transporter || !EMAIL_CONFIG.adminEmail) {
    console.log('📧 Admin email not configured - skipping admin notification');
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
    const info = await transporter.sendMail({
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.user}>`,
      to: EMAIL_CONFIG.adminEmail,
      subject: `🔔 Nuevo Pedido #${pedido.id} - ${pedido.nombre_cliente}`,
      html: getBaseTemplate(content)
    });

    console.log('✅ Admin notification sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
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
  if (!transporter) {
    console.log('📧 Email service not configured - skipping payment confirmation');
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
    const info = await transporter.sendMail({
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.user}>`,
      to: pedido.email,
      subject: `✅ Pedido Confirmado #${pedido.id} - ${EMAIL_CONFIG.storeName}`,
      html: getBaseTemplate(content)
    });

    console.log('✅ Payment confirmation sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
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
  if (!transporter) {
    console.log('📧 Email service not configured - skipping shipping notification');
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
    const info = await transporter.sendMail({
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.user}>`,
      to: pedido.email,
      subject: `🚚 Tu Pedido #${pedido.id} está en Camino - ${EMAIL_CONFIG.storeName}`,
      html: getBaseTemplate(content)
    });

    console.log('✅ Shipping notification sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
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
  if (!transporter) {
    console.log('📧 Email service not configured - skipping cancellation email');
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
    const info = await transporter.sendMail({
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.user}>`,
      to: pedido.email,
      subject: `Pedido Cancelado #${pedido.id} - ${EMAIL_CONFIG.storeName}`,
      html: getBaseTemplate(content)
    });

    console.log('✅ Cancellation email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending cancellation email:', error);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  enviarConfirmacionPedido,
  notificarNuevoPedido,
  enviarConfirmacionPago,
  enviarNotificacionEnvio,
  enviarCancelacionPedido
};
