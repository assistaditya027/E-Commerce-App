import nodemailer from 'nodemailer';

/**
 * Email Service - Centralized email sending for all application needs
 * Supports: Password reset, Order confirmation, Order status updates, Newsletter
 */

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[emailService] SMTP not configured - email sending disabled');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const isEmailConfigured = () => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

/**
 * Send a generic email
 */
export const sendEmail = async (to, subject, html, text = '') => {
  if (!isEmailConfigured()) {
    console.warn(`[sendEmail] Email not configured - skipping email to ${to}`);
    return false;
  }

  const transporter = createTransporter();
  if (!transporter) return false;

  try {
    const from = process.env.SMTP_FROM || 'noreply@example.com';
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`[sendEmail] Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`[sendEmail] Failed to send to ${to}:`, error.message);
    return false;
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmation = async (to, orderDetails) => {
  const { orderId, customerName, items, subtotal, deliveryCharge, tax, total, paymentMethod } =
    orderDetails;

  const itemsHtml = items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px; text-align: left;">${item.name}</td>
      <td style="padding: 12px; text-align: center;">${item.size}</td>
      <td style="padding: 12px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right;">₹${item.price.toFixed(2)}</td>
    </tr>
  `,
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #111; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Order Confirmed</h1>
      </div>
      
      <div style="padding: 30px;">
        <p style="margin: 0 0 20px;">Hello ${customerName},</p>
        <p style="margin: 0 0 20px; color: #555;">Thank you for your order! We're processing it now.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px; font-weight: bold;">Order ID: <span style="color: #111;">#${orderId}</span></p>
          <p style="margin: 0;">Date: ${new Date().toLocaleDateString()}</p>
        </div>

        <h3 style="margin: 20px 0 15px; font-size: 16px;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 12px; text-align: left;">Product</th>
              <th style="padding: 12px; text-align: center;">Size</th>
              <th style="padding: 12px; text-align: center;">Qty</th>
              <th style="padding: 12px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right; border-top: 2px solid #eee; padding-top: 15px;">
          <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
          ${tax > 0 ? `<p style="margin: 5px 0;"><strong>Tax:</strong> ₹${tax.toFixed(2)}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Delivery:</strong> ₹${deliveryCharge.toFixed(2)}</p>
          <p style="margin: 10px 0 0; font-size: 18px; color: #111;"><strong>Total: ₹${total.toFixed(2)}</strong></p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">Payment: ${paymentMethod}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">You can track your order in your account dashboard.</p>
        </div>
      </div>

      <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0;">Questions? Contact us at support@example.com</p>
      </div>
    </div>
  `;

  const text = `Order Confirmed\n\nOrder ID: #${orderId}\nTotal: ₹${total.toFixed(2)}\n\nThank you for your order!`;

  return sendEmail(to, `Order Confirmed - #${orderId}`, html, text);
};

/**
 * Send order status update email
 */
export const sendOrderStatusUpdate = async (to, customerName, orderId, newStatus, message = '') => {
  const statusMessages = {
    processing: "We're preparing your order for shipment.",
    shipped: 'Your order has been shipped! Check the tracking details.',
    delivered: 'Your order has been delivered. Thank you for shopping with us!',
    cancelled: 'Your order has been cancelled.',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #111; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Order Status Update</h1>
      </div>
      
      <div style="padding: 30px;">
        <p style="margin: 0 0 20px;">Hello ${customerName},</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #111;">
          <p style="margin: 0 0 10px; font-weight: bold;">Order ID: #${orderId}</p>
          <p style="margin: 0; font-size: 18px; color: #111;"><strong>Status: ${newStatus.toUpperCase()}</strong></p>
        </div>

        <p style="margin: 20px 0; color: #555;">${statusMessages[newStatus] || message}</p>

        ${message ? `<p style="margin: 15px 0; background: #fffbea; padding: 12px; border-radius: 5px; border-left: 3px solid #ffa500;">${message}</p>` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">Track your order in your account dashboard or reply to this email with any questions.</p>
        </div>
      </div>

      <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0;">Questions? Contact us at support@example.com</p>
      </div>
    </div>
  `;

  const text = `Order Status Update\n\nOrder ID: #${orderId}\nNew Status: ${newStatus.toUpperCase()}\n\n${statusMessages[newStatus] || message}`;

  return sendEmail(to, `Order Status Update - #${orderId}`, html, text);
};

/**
 * Send newsletter confirmation
 */
export const sendNewsletterConfirmation = async (to) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #111; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Welcome to Our Newsletter</h1>
      </div>
      
      <div style="padding: 30px;">
        <p style="margin: 0 0 20px;">Thank you for subscribing to our newsletter!</p>
        <p style="margin: 0 0 20px; color: #555;">You'll now receive updates about new products, special offers, and more.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #666;">To manage your preferences, visit your account settings.</p>
        </div>
      </div>

      <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0;">Questions? Contact us at support@example.com</p>
      </div>
    </div>
  `;

  return sendEmail(to, 'Welcome to Our Newsletter', html);
};

export default {
  sendEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendNewsletterConfirmation,
  isEmailConfigured,
};
