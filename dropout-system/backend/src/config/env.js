import 'dotenv/config';

const required = (name, fallback) => {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') throw new Error(`Missing required env var ${name}`);
  return v;
};

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/dropout_system'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mlUrl: (process.env.ML_API_URL || 'http://127.0.0.1:5001').replace(/\/$/, ''),
  mlKey: process.env.ML_API_KEY || '',
};

if (env.jwtSecret.length < 16) throw new Error('JWT_SECRET must be at least 16 characters');
