// config.ts
import dotenv from 'dotenv';

if (!process.env.CONNECTION_STRING) {
  throw new Error('connection string is not defined');
}

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
