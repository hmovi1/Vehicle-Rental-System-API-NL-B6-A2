// config.ts
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.CONNECTION_STRING) {
  throw new Error('connection string is not defined');
}
