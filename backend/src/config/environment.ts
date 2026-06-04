import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'akpbf_erp_jwt_secret_key_2026_uemoa',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/akpbf_erp?schema=public',
  
  // Zoho SMTP Settings
  ZOHO_SMTP_HOST: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
  ZOHO_SMTP_PORT: parseInt(process.env.ZOHO_SMTP_PORT || '465', 10),
  ZOHO_SMTP_USER: process.env.ZOHO_SMTP_USER || 'noreply@akpbf.com',
  ZOHO_SMTP_PASS: process.env.ZOHO_SMTP_PASS || '',
  ZOHO_SMTP_SECURE: process.env.ZOHO_SMTP_SECURE === 'false' ? false : true,
  ZOHO_FROM_NAME: process.env.ZOHO_FROM_NAME || 'AKPBF ERP Assainissement',

  // Twilio Operational Credentials
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
};
