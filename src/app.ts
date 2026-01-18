import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(express.json());

// -------------------- ROUTES IMPORT -----------------
// Remove .js extensions - TypeScript will handle module resolution
import { userRoute } from './modules/users/user.route';
import { authRoute } from './modules/auth/auth.route';
import { vehicleRoutes } from './modules/vehicles/vehicle.route';
import { bookingRoutes } from './modules/bookings/booking.route';

// -------------------- HEALTH CHECK ------------------
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Vehicle Rental System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// -------------------- API ROUTES --------------------
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// -------------------- 404 HANDLER -------------------
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'POST /api/v1/auth/signUp',
      'POST /api/v1/auth/signIn',
      'GET /api/v1/users',
      'GET /api/v1/vehicles',
      'GET /api/v1/bookings'
    ]
  });
});

// -------------------- ERROR HANDLER -----------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export for Vercel serverless
export default app;