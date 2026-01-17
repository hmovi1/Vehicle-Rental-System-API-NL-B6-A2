



import './config';

import express from 'express';
import dotenv from 'dotenv';

// Load env safely
dotenv.config();

const app = express();

app.use(express.json());


import { initDB } from './database/db.js';
import { userRoute } from './modules/users/user.route.js';
import { authRoute } from './modules/auth/auth.route.js';
import { vehicleRoutes } from "./modules/vehicles/vehicle.route.js";
import { bookingRoutes } from "./modules/bookings/booking.route.js";

const PORT = process.env.PORT||5000;


app.use(express.json());



initDB();

app.get("/", (req, res) => {
  res.send("Vehicle Rental System API is running");
});

app.use("/api/v1/users", userRoute);

app.use("/api/v1/auth", authRoute);

app.use("/api/v1/bookings",bookingRoutes);

app.use('/api/v1/vehicles', vehicleRoutes);

app.use(express.json());

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});


export default app;



