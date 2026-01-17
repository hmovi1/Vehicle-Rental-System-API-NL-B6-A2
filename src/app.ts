import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(express.json());

// -------------------- ROUTES IMPORT -----------------
import { userRoute } from './modules/users/user.route.js';
import { authRoute } from './modules/auth/auth.route.js';
import { vehicleRoutes } from './modules/vehicles/vehicle.route.js';
import { bookingRoutes } from './modules/bookings/booking.route.js';

// -------------------- HEALTH CHECK ------------------
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Vehicle Rental System API is running'
  });
});

// -------------------- API ROUTES --------------------
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// -------------------- 404 HANDLER -------------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

export default app;
