require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];
for (const k of required) {
  if (!process.env[k]) {
    console.error(`[env] Missing required variable ${k}`);
    process.exit(1);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5055,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  otp: {
    mode: process.env.OTP_MODE || 'screen',
    provider: process.env.SMS_PROVIDER || 'msg91',
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || 'MSRSHD',
    templateId: process.env.SMS_TEMPLATE_ID || '',
    length: 6,
    ttlMinutes: 5,
    maxAttempts: 5,
    resendSeconds: 30,
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@meenashadirishtey.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};
