import dotenv from 'dotenv';

dotenv.config();

// Remove trailing slash from CORS_ORIGIN if present
const corsOrigin = (process.env.CORS_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: corsOrigin,
};
