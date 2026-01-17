import './config';

import { pool } from './database/db';
export default pool;

import express from 'express';


import { initDB } from './database/db';
import { userRoute } from './modules/users/user.route';
import { authRoute } from './modules/auth/auth.route';
import { vehicleRoutes } from "./modules/vehicles/vehicle.route";
import { bookingRoutes } from "./modules/bookings/booking.route";

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




