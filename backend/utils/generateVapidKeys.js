/**
 * Utility: Generate VAPID Keys for Push Notifications
 * 
 * Run this script to generate VAPID keys for production:
 * node backend/utils/generateVapidKeys.js
 * 
 * Then add the keys to your .env file:
 * VAPID_PUBLIC_KEY=<public key>
 * VAPID_PRIVATE_KEY=<private key>
 * VAPID_SUBJECT=mailto:admin@cueroyperla.com
 */

const webpush = require('web-push');

console.log('🔐 Generating VAPID keys for push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ Keys generated successfully!\n');
console.log('Add these to your .env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:admin@cueroyperla.com');
console.log('\n⚠️  Keep the private key secret and never commit it to version control!');
