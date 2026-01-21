/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables on server startup
 * to provide clear error messages and prevent runtime failures.
 */

const { z } = require('zod');

/**
 * Environment variable schema
 * Defines all required and optional environment variables
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('3001'),
  HOST: z.string().default('0.0.0.0'),
  TZ: z.string().default('America/Costa_Rica'),

  // Session Configuration
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET debe tener al menos 16 caracteres'),

  // Supabase (Required)
  SUPABASE_URL: z.string().url('SUPABASE_URL debe ser una URL válida'),
  SUPABASE_KEY: z.string().min(1, 'SUPABASE_KEY es requerido'),

  // Cloudinary (Required for image uploads)
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME es requerido'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY es requerido'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET es requerido'),

  // Frontend URLs (Required in production)
  FRONTEND_URL: z.string().optional(),

  // Email Configuration (Optional - for order notifications)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),
  ADMIN_EMAIL: z.string().email().optional(),

  // Store Configuration (Optional - for emails)
  STORE_NAME: z.string().optional(),
  STORE_URL: z.string().url().optional(),
  STORE_PHONE: z.string().optional(),

  // Push Notifications (Optional)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // Redis (Optional - for session storage in production)
  REDIS_URL: z.string().url().optional(),
});

/**
 * Validates environment variables
 * @param {boolean} strict - If true, enforces production requirements
 * @returns {Object} Validated environment variables
 * @throws {Error} If validation fails
 */
function validateEnv(strict = false) {
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    // Parse and validate
    const env = envSchema.parse(process.env);

    // Additional production-specific validations
    if (isProduction || strict) {
      const productionErrors = [];

      if (!env.FRONTEND_URL) {
        productionErrors.push('FRONTEND_URL es requerido en producción para configurar CORS');
      }

      if (env.SESSION_SECRET === 'your-secure-secret-key-change-in-production') {
        productionErrors.push('SESSION_SECRET debe ser cambiado del valor por defecto en producción');
      }

      if (productionErrors.length > 0) {
        throw new Error(
          '❌ Validación de producción falló:\n' +
          productionErrors.map(err => `   - ${err}`).join('\n')
        );
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => {
        const path = err.path.join('.');
        return `   - ${path}: ${err.message}`;
      });

      console.error('❌ Variables de entorno inválidas:');
      console.error(errorMessages.join('\n'));
      console.error('\n💡 Asegúrese de configurar todas las variables requeridas en el archivo .env');
      console.error('   Ver backend/.env.example para referencia');
      
      throw new Error('Validación de variables de entorno falló');
    }
    throw error;
  }
}

/**
 * Logs validated environment configuration (safe for production)
 * @param {Object} env - Validated environment variables
 */
function logEnvStatus(env) {
  console.log('✅ Variables de entorno validadas correctamente');
  console.log(`   Ambiente: ${env.NODE_ENV}`);
  console.log(`   Puerto: ${env.PORT}`);
  console.log(`   Host: ${env.HOST}`);
  console.log(`   Zona horaria: ${env.TZ}`);
  console.log(`   Supabase: ${env.SUPABASE_URL ? '✓ Configurado' : '✗ No configurado'}`);
  console.log(`   Cloudinary: ${env.CLOUDINARY_CLOUD_NAME ? '✓ Configurado' : '✗ No configurado'}`);
  console.log(`   Email (Resend): ${env.RESEND_API_KEY ? '✓ Configurado' : '✗ No configurado'}`);
  console.log(`   Push Notifications: ${env.VAPID_PUBLIC_KEY ? '✓ Configurado' : '✗ No configurado'}`);
  
  if (env.NODE_ENV === 'production') {
    console.log(`   CORS (FRONTEND_URL): ${env.FRONTEND_URL || 'No configurado'}`);
  }
}

module.exports = {
  validateEnv,
  logEnvStatus,
};
