#!/usr/bin/env node
/**
 * Quick Test Script for Resend Email Service
 * 
 * This script helps verify that the Resend email service is configured correctly
 * Run this after setting up your Resend API key to test the configuration
 * 
 * Usage:
 *   1. Set RESEND_API_KEY environment variable with your real key
 *   2. Run: node backend/tests/test-resend-quick.js
 */

require('dotenv').config();

const { Resend } = require('resend');

console.log('🧪 Quick Resend Configuration Test\n');

// Check if API key is configured
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set!');
  console.error('   Please set it in your .env file or environment variables');
  console.error('   Example: export RESEND_API_KEY=re_your_key_here\n');
  process.exit(1);
}

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Check configuration
console.log('Configuration:');
console.log('  API Key:', process.env.RESEND_API_KEY.substring(0, 10) + '...');
console.log('  Email FROM:', process.env.EMAIL_FROM || 'ventas@cueroyperla.com');
console.log('  Email FROM Name:', process.env.EMAIL_FROM_NAME || 'Cuero&Perla');
console.log('  Admin Email:', process.env.ADMIN_EMAIL || '(not set)');
console.log('');

// Try to send a test email
async function sendTestEmail() {
  const testEmail = process.env.TEST_EMAIL || process.env.ADMIN_EMAIL;
  
  if (!testEmail) {
    console.error('❌ No test email address configured!');
    console.error('   Please set TEST_EMAIL or ADMIN_EMAIL environment variable');
    console.error('   Example: export TEST_EMAIL=your-email@example.com\n');
    process.exit(1);
  }

  console.log(`📧 Attempting to send test email to: ${testEmail}\n`);

  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME || 'Cuero&Perla'} <${process.env.EMAIL_FROM || 'ventas@cueroyperla.com'}>`,
      to: testEmail,
      subject: 'Test Email - Resend Configuration',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 8px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; }
            h1 { color: #333; }
            .info { background: white; padding: 15px; border-radius: 4px; margin-top: 15px; }
            code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Resend Configuration Test</h1>
            <div class="success">
              <p><strong>Success!</strong> Your Resend email service is configured correctly.</p>
            </div>
            <div class="info">
              <p><strong>Configuration Details:</strong></p>
              <ul>
                <li>Email FROM: <code>${process.env.EMAIL_FROM || 'ventas@cueroyperla.com'}</code></li>
                <li>Store Name: <code>${process.env.STORE_NAME || 'Cuero&Perla'}</code></li>
                <li>Test Date: <code>${new Date().toLocaleString()}</code></li>
              </ul>
            </div>
            <div class="info">
              <p><strong>What this means:</strong></p>
              <ul>
                <li>✅ Resend API key is valid</li>
                <li>✅ Domain is verified</li>
                <li>✅ Email service is ready to send transactional emails</li>
                <li>✅ Your Railway deployment will work</li>
              </ul>
            </div>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              This is an automated test email from your Sistema de Joyería.
            </p>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Failed to send test email!');
      console.error('   Error:', error);
      console.error('');
      
      if (error.statusCode === 401) {
        console.error('   → API key is invalid. Please check your RESEND_API_KEY');
      } else if (error.statusCode === 403) {
        console.error('   → Domain not verified. Please verify your domain in Resend dashboard');
      } else if (error.message && error.message.includes('domain')) {
        console.error('   → Domain issue. Make sure EMAIL_FROM uses a verified domain');
      }
      
      process.exit(1);
    }

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', data.id);
    console.log('');
    console.log('🎉 Resend is configured correctly!');
    console.log('   Check your inbox at:', testEmail);
    console.log('   (Check spam folder if not in inbox)');
    console.log('');
    console.log('✅ Your email service is ready for production!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('');
    process.exit(1);
  }
}

sendTestEmail();
