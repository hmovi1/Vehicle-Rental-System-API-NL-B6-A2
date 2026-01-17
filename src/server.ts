import './config';

import { pool } from './database/db';
export default pool;

import express from 'express';


import { initDB } from './database/db.js';
import { userRoute } from './modules/users/user.route.js';
import { authRoute } from './modules/auth/auth.route.js';
import { vehicleRoutes } from "./modules/vehicles/vehicle.route.js";
import { bookingRoutes } from "./modules/bookings/booking.route.js";

const PORT = process.env.PORT;
const app = express()

app.use(express.json());



initDB();



app.use("/api/v1/users", userRoute);

app.use("/api/v1/auth", authRoute);

app.use("/api/v1/bookings",bookingRoutes);

app.use('/api/v1/vehicles', vehicleRoutes);

app.use(express.json());



app.listen(PORT,()=>{
    console.log(`App is running on port ${PORT}`);
});




